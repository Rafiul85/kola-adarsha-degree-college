import crypto from 'node:crypto'
import { config } from './env.mjs'
import { getDb, saveDb, audit } from './db.mjs'

const COOKIE_NAME = 'kadc_session'
const SCRYPT_KEYLEN = 64

export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN, { N: 16384, r: 8, p: 1 })
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, saltHex, hashHex] = String(stored || '').split('$')
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const actual = crypto.scryptSync(String(password), salt, expected.length, { N: 16384, r: 8, p: 1 })
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < 10) {
    return 'পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।'
  }
  if (password.length > 200) return 'পাসওয়ার্ড অতিরিক্ত দীর্ঘ।'
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'পাসওয়ার্ডে কমপক্ষে একটি অক্ষর ও একটি সংখ্যা থাকতে হবে।'
  }
  return ''
}

export function ensureInitialAdmin() {
  const database = getDb()
  const existingAdmin = database.users.find((user) => user.role === 'admin')
  if (existingAdmin) return
  if (!config.adminEmail || !config.adminPassword) {
    console.warn(
      '[setup] No administrator exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env and restart to provision the first administrator.',
    )
    return
  }
  const problem = passwordProblem(config.adminPassword)
  if (problem) {
    console.error(`[setup] ADMIN_PASSWORD is not acceptable: ${problem}`)
    return
  }
  database.users.push({
    id: crypto.randomUUID(),
    email: config.adminEmail.toLowerCase(),
    displayName: config.adminName,
    role: 'admin',
    status: 'active',
    linkedId: '',
    passwordHash: hashPassword(config.adminPassword),
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: '',
  })
  saveDb()
  console.log(`[setup] Initial administrator provisioned for ${config.adminEmail}. Change the password after signing in.`)
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function parseCookies(header = '') {
  const result = {}
  for (const part of String(header).split(';')) {
    const index = part.indexOf('=')
    if (index < 0) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (!key) continue
    try {
      result[key] = decodeURIComponent(value)
    } catch {
      result[key] = value
    }
  }
  return result
}

export function getSessionToken(req) {
  return parseCookies(req.headers.cookie || '')[COOKIE_NAME] || ''
}

export function createSession(req, res, user) {
  const database = getDb()
  const token = crypto.randomBytes(32).toString('base64url')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + config.sessionHours * 3600 * 1000)
  const session = {
    id: crypto.randomUUID(),
    tokenHash: sha256(token),
    userId: user.id,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    ip: req.ip || '',
    userAgent: String(req.get('user-agent') || '').slice(0, 300),
  }
  database.sessions.unshift(session)
  database.sessions = database.sessions.filter(
    (item) => new Date(item.expiresAt).getTime() > Date.now() - 86400000,
  )
  user.lastLoginAt = now.toISOString()
  saveDb()
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(config.cookieSecure || req.secure),
    maxAge: config.sessionHours * 3600 * 1000,
    path: '/',
  })
  return session
}

export function destroySession(req, res) {
  const token = getSessionToken(req)
  if (token) {
    const database = getDb()
    const hash = sha256(token)
    const before = database.sessions.length
    database.sessions = database.sessions.filter((session) => session.tokenHash !== hash)
    if (database.sessions.length !== before) saveDb()
  }
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export function destroyAllUserSessions(userId) {
  const database = getDb()
  const before = database.sessions.length
  database.sessions = database.sessions.filter((session) => session.userId !== userId)
  if (database.sessions.length !== before) saveDb()
}

export function attachUser(req, res, next) {
  const token = getSessionToken(req)
  if (!token) return next()
  const database = getDb()
  const hash = sha256(token)
  const session = database.sessions.find((item) => item.tokenHash === hash)
  if (!session) {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    return next()
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    database.sessions = database.sessions.filter((item) => item.id !== session.id)
    saveDb()
    res.clearCookie(COOKIE_NAME, { path: '/' })
    return next()
  }
  const user = database.users.find(
    (item) => item.id === session.userId && item.status === 'active',
  )
  if (!user) {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    return next()
  }
  req.user = user
  req.sessionId = session.id
  const lastSeen = new Date(session.lastSeenAt).getTime()
  if (Date.now() - lastSeen > 5 * 60 * 1000) {
    session.lastSeenAt = new Date().toISOString()
    session.expiresAt = new Date(Date.now() + config.sessionHours * 3600 * 1000).toISOString()
    if (user.role === 'admin' || user.role === 'teacher' || user.role === 'student') {
      // Persist only the periodic sliding refresh; this is a small data store.
      saveDb()
    }
  }
  next()
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'এই কাজটি করতে অনুগ্রহ করে সাইন ইন করুন।', code: 'AUTH_REQUIRED' })
  }
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'এই কাজটি করতে অনুগ্রহ করে সাইন ইন করুন।', code: 'AUTH_REQUIRED' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'এই কাজটি করার অনুমতি আপনার নেই।', code: 'FORBIDDEN' })
    }
    next()
  }
}

const buckets = new Map()

export function rateLimit({ windowMs, max, keyPrefix = '', message = 'অনেক বেশি অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' }) {
  return (req, res, next) => {
    const now = Date.now()
    const key = `${keyPrefix}:${req.ip || 'unknown'}`
    let bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }
    bucket.count += 1
    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)))
      return res.status(429).json({ error: message, code: 'RATE_LIMITED' })
    }
    if (buckets.size > 5000) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey)
      }
    }
    next()
  }
}

export function originGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  if (!origin) return next()
  const allowed = new Set()
  if (config.appOrigin) allowed.add(config.appOrigin.replace(/\/$/, ''))
  const host = req.get('host')
  if (host) {
    allowed.add(`${req.protocol}://${host}`)
    allowed.add(`http://${host}`)
    allowed.add(`https://${host}`)
  }
  if (allowed.has(origin.replace(/\/$/, ''))) return next()
  return res.status(403).json({ error: 'অনুরোধের উৎস যাচাই করা যায়নি।', code: 'ORIGIN_REJECTED' })
}

export function createPasswordReset(userId) {
  const database = getDb()
  const raw = crypto.randomBytes(32).toString('base64url')
  const now = new Date()
  database.resetTokens = database.resetTokens.filter(
    (token) => new Date(token.expiresAt).getTime() > Date.now() && !token.usedAt,
  )
  database.resetTokens.unshift({
    id: crypto.randomUUID(),
    userId,
    tokenHash: sha256(raw),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + config.resetMinutes * 60000).toISOString(),
    usedAt: '',
  })
  saveDb()
  return raw
}

export function consumePasswordReset(rawToken) {
  const database = getDb()
  const hash = sha256(String(rawToken || ''))
  const token = database.resetTokens.find((item) => item.tokenHash === hash)
  if (!token) return null
  if (token.usedAt || new Date(token.expiresAt).getTime() <= Date.now()) return null
  const user = database.users.find((item) => item.id === token.userId && item.status === 'active')
  if (!user) return null
  token.usedAt = new Date().toISOString()
  return user
}

export { COOKIE_NAME, sha256 }
