import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import pg from 'pg'
import { rootDir, config } from './env.mjs'
import { createSeedData } from './seed.mjs'

/**
 * Two storage drivers share one API:
 *  - file: the original single-process JSON file store (local development, Node host).
 *  - postgres: used when DATABASE_URL is set (Vercel + Neon/any Postgres), so the
 *    app survives read-only serverless filesystems and multiple instances.
 */
const usePostgres = Boolean(config.databaseUrl)

const dataDir = process.env.DATA_DIR
  ? path.resolve(rootDir, process.env.DATA_DIR)
  : config.isServerless
    ? path.join('/tmp', 'kadc-data')
    : path.join(rootDir, 'server', 'data')
const backupsDir = path.join(dataDir, 'backups')
const uploadsDir = path.join(dataDir, 'uploads')
const dbFile = path.join(dataDir, 'db.json')

if (!usePostgres) {
  if (config.isServerless) {
    console.warn(
      '[db] DATABASE_URL is not set. Falling back to the ephemeral /tmp file store: ' +
        'data written on this deployment will be lost when the function instance is recycled.',
    )
  }
  for (const dir of [dataDir, backupsDir, uploadsDir]) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

let db = null
let pool = null
let dirty = false
let writeChain = Promise.resolve()
let jobs = []
let initPromise = null

const SCHEMA_SQL = [
  `create table if not exists app_state (
     id integer primary key,
     doc jsonb not null,
     version bigint not null default 1,
     updated_at timestamptz not null default now()
   )`,
  `create table if not exists app_backups (
     name text primary key,
     reason text not null default '',
     size integer not null default 0,
     doc jsonb not null,
     created_at timestamptz not null default now()
   )`,
  `create table if not exists app_uploads (
     name text primary key,
     mime_type text not null default 'application/octet-stream',
     size integer not null default 0,
     data bytea not null,
     created_at timestamptz not null default now()
   )`,
]

function normalize(loaded) {
  const seed = createSeedData()
  const merged = {
    ...seed,
    ...loaded,
    settings: {
      ...seed.settings,
      ...(loaded.settings || {}),
      institution: { ...seed.settings.institution, ...(loaded.settings?.institution || {}) },
      content: { ...seed.settings.content, ...(loaded.settings?.content || {}) },
      admission: { ...seed.settings.admission, ...(loaded.settings?.admission || {}) },
    },
  }
  for (const key of [
    'users',
    'sessions',
    'resetTokens',
    'teachers',
    'students',
    'academicSessions',
    'programs',
    'subjects',
    'routines',
    'examinations',
    'results',
    'notices',
    'events',
    'calendar',
    'documents',
    'contactMessages',
    'auditLogs',
  ]) {
    if (!Array.isArray(merged[key])) merged[key] = []
  }
  return merged
}

function readFileDb() {
  if (fs.existsSync(dbFile)) {
    try {
      return normalize(JSON.parse(fs.readFileSync(dbFile, 'utf8')))
    } catch (error) {
      throw new Error(`The data store could not be read: ${error.message}`)
    }
  }
  db = createSeedData()
  writeDb()
  return db
}

/** Must be awaited once before any request is handled. */
export function initDb() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    if (!usePostgres) {
      if (!db) db = readFileDb()
      return db
    }
    pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: 2,
      idleTimeoutMillis: 10000,
      ssl: /localhost|127\.0\.0\.1|host=\/var\/run/.test(config.databaseUrl)
        ? undefined
        : { rejectUnauthorized: false },
    })
    for (const statement of SCHEMA_SQL) {
      await pool.query(statement)
    }
    const result = await pool.query('select doc from app_state where id = 1')
    if (result.rows.length) {
      db = normalize(result.rows[0].doc)
    } else {
      db = createSeedData()
      await writePostgres()
    }
    return db
  })()
  return initPromise
}

export function getDb() {
  if (db) return db
  if (usePostgres) {
    throw new Error('The PostgreSQL data store has not been initialised (call initDb() first).')
  }
  db = readFileDb()
  return db
}

/** Reloads the shared document so every request sees the latest committed state. */
export async function refreshDb() {
  if (!usePostgres) return
  await flushDb()
  const result = await pool.query('select doc from app_state where id = 1')
  if (result.rows.length) db = normalize(result.rows[0].doc)
}

function writeDb() {
  const temp = `${dbFile}.tmp-${process.pid}`
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(temp, dbFile)
}

async function writePostgres() {
  const json = JSON.stringify(db)
  await pool.query(
    `insert into app_state (id, doc, version, updated_at)
     values (1, $1::jsonb, 1, now())
     on conflict (id) do update
       set doc = excluded.doc,
           version = app_state.version + 1,
           updated_at = now()`,
    [json],
  )
}

async function drainWrites() {
  while (dirty) {
    dirty = false
    try {
      await writePostgres()
    } catch (error) {
      dirty = true
      console.error('[db] Failed to persist the data store:', error)
      throw error
    }
  }
}

export function saveDb() {
  if (!db) return
  if (!usePostgres) {
    writeDb()
    return
  }
  dirty = true
  writeChain = writeChain.then(drainWrites, drainWrites)
}

/** Awaits every queued write, backup and upload so a response is never sent before it is durable. */
export async function flushDb() {
  await writeChain
  const pending = jobs
  jobs = []
  if (pending.length) await Promise.all(pending)
  await writeChain
}

function enqueue(job) {
  const tracked = Promise.resolve()
    .then(job)
    .catch((error) => console.error('[db] Background storage job failed:', error))
  jobs.push(tracked)
}

export function createBackup(reason = 'manual') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const safeReason = String(reason).replace(/[^a-z0-9-]/gi, '-').slice(0, 40)
  const name = `db-${stamp}-${safeReason}.json`
  if (usePostgres) {
    if (!db) return null
    const snapshot = JSON.stringify(db)
    enqueue(async () => {
      await pool.query(
        `insert into app_backups (name, reason, size, doc)
         values ($1, $2, $3, $4::jsonb)
         on conflict (name) do nothing`,
        [name, safeReason, Buffer.byteLength(snapshot), snapshot],
      )
      await pool.query(
        `delete from app_backups
          where name not in (select name from app_backups order by created_at desc limit 25)`,
      )
    })
    return name
  }
  if (!fs.existsSync(dbFile)) return null
  const target = path.join(backupsDir, name)
  fs.copyFileSync(dbFile, target)
  const files = fs
    .readdirSync(backupsDir)
    .filter((file) => file.startsWith('db-') && file.endsWith('.json'))
    .sort()
  while (files.length > 25) {
    const oldest = files.shift()
    try {
      fs.unlinkSync(path.join(backupsDir, oldest))
    } catch {
      // Ignore a backup that cannot be removed.
    }
  }
  return target
}

export async function listBackups() {
  if (usePostgres) {
    const result = await pool.query(
      'select name, size, created_at from app_backups order by created_at desc',
    )
    return result.rows.map((row) => ({
      file: row.name,
      size: Number(row.size),
      createdAt: new Date(row.created_at).toISOString(),
    }))
  }
  return fs
    .readdirSync(backupsDir)
    .filter((name) => name.startsWith('db-') && name.endsWith('.json'))
    .sort()
    .reverse()
    .map((name) => {
      const full = path.join(backupsDir, name)
      const stat = fs.statSync(full)
      return { file: name, size: stat.size, createdAt: stat.mtime.toISOString() }
    })
}

/** Returns the backup JSON text, or null when it does not exist. */
export async function getBackupContent(file) {
  const safe = path.basename(String(file || ''))
  if (!/^db-[\w.-]+\.json$/.test(safe)) return null
  if (usePostgres) {
    const result = await pool.query('select doc from app_backups where name = $1', [safe])
    return result.rows.length ? JSON.stringify(result.rows[0].doc) : null
  }
  const full = path.join(backupsDir, safe)
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null
}

export function uploadsPath(filename) {
  const safe = path.basename(String(filename || ''))
  if (!safe || safe !== filename) return null
  return path.join(uploadsDir, safe)
}

export async function storeUpload(filename, buffer, mimeType) {
  const safe = path.basename(String(filename || ''))
  if (!safe || safe !== filename) throw new Error('Invalid upload name.')
  if (usePostgres) {
    await pool.query(
      `insert into app_uploads (name, mime_type, size, data)
       values ($1, $2, $3, $4)
       on conflict (name) do update
         set mime_type = excluded.mime_type, size = excluded.size, data = excluded.data`,
      [safe, mimeType || 'application/octet-stream', buffer.length, buffer],
    )
    return
  }
  fs.writeFileSync(path.join(uploadsDir, safe), buffer)
}

/** Returns the stored file bytes, or null when the file is missing. */
export async function getUpload(filename) {
  const safe = path.basename(String(filename || ''))
  if (!safe || safe !== filename) return null
  if (usePostgres) {
    const result = await pool.query('select data, mime_type from app_uploads where name = $1', [safe])
    if (!result.rows.length) return null
    const row = result.rows[0]
    return { data: Buffer.from(row.data), mimeType: row.mime_type }
  }
  const full = path.join(uploadsDir, safe)
  return fs.existsSync(full) ? { data: fs.readFileSync(full), mimeType: '' } : null
}

export function audit(actor, action, entity, entityId = '', details = '') {
  const database = getDb()
  database.auditLogs.unshift({
    id: crypto.randomUUID(),
    actorId: actor?.id || '',
    actorName: actor?.displayName || actor?.email || 'System',
    actorRole: actor?.role || 'system',
    action,
    entity,
    entityId,
    details,
    createdAt: new Date().toISOString(),
  })
  if (database.auditLogs.length > 2000) database.auditLogs.length = 2000
}

export function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    linkedId: user.linkedId || '',
    mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || '',
  }
}

export { dbFile, backupsDir, uploadsDir, usePostgres }
