import express from 'express'
import crypto from 'node:crypto'
import path from 'node:path'
import multer from 'multer'
import { z } from 'zod'
import {
  audit,
  createBackup,
  getBackupContent,
  getDb,
  getUpload,
  listBackups,
  publicUser,
  saveDb,
  storeUpload,
} from '../db.mjs'
import {
  createPasswordReset,
  hashPassword,
  passwordProblem,
  rateLimit,
  requireRole,
} from '../auth.mjs'
import { asyncHandler, attachmentDisposition, HttpError, parseBody } from '../http.mjs'
import {
  documentStatuses,
  entities,
  gradeForMarks,
  normalizeResult,
  resultStatuses,
  userSchema,
} from '../schemas.mjs'
import { config } from '../env.mjs'

const router = express.Router()
router.use(requireRole('admin'))

const str = (max = 500) => z.string().trim().max(max)
const dateish = z
  .string()
  .trim()
  .max(40)
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'সঠিক তারিখ প্রদান করুন।')
const emailish = z.union([z.literal(''), z.string().trim().email('সঠিক ইমেইল প্রদান করুন।')])

const settingsSchema = z.object({
  institution: z.object({
    nameBn: str(200).min(2),
    nameEn: str(200).min(2),
    eiin: str(30).min(1),
    establishedDate: dateish,
    establishedVerified: z.boolean(),
    addressBn: str(500),
    addressEn: str(500),
    upazila: str(100),
    district: str(100),
    division: str(100),
    postCode: str(20),
    typeBn: str(300),
    typeEn: str(300),
    educationLevels: z
      .array(z.object({ nameBn: str(200), nameEn: str(200), verified: z.boolean() }))
      .max(20),
    groups: z.array(z.object({ nameBn: str(100), nameEn: str(100), verified: z.boolean() })).max(20),
    affiliationBn: str(300),
    recognitionBn: str(300),
    phone: str(50),
    email: emailish,
    website: str(300),
    officeHoursBn: str(300),
    officeHoursEn: str(300),
    mapVerified: z.boolean(),
  }),
  content: z.object({
    taglineBn: str(300),
    taglineEn: str(300),
    welcomeTitleBn: str(300),
    welcomeTitleEn: str(300),
    welcomeBn: str(10000),
    welcomeEn: str(10000),
    aboutIntroBn: str(10000),
    aboutIntroEn: str(10000),
    historyBn: str(20000),
    historyEn: str(20000),
    missionBn: str(10000),
    missionEn: str(10000),
    visionBn: str(10000),
    visionEn: str(10000),
    principalNameBn: str(200),
    principalNameEn: str(200),
    principalDesignationBn: str(200),
    principalDesignationEn: str(200),
    principalMessageBn: str(10000),
    principalMessageEn: str(10000),
    objectives: z
      .array(z.object({ bn: str(1000), en: str(1000) }))
      .max(30),
    facilities: z
      .array(
        z.object({
          id: str(80).optional(),
          key: str(80).optional(),
          nameBn: str(200),
          nameEn: str(200),
          detailBn: str(2000),
          detailEn: str(2000),
          verified: z.boolean(),
        }),
      )
      .max(40),
    achievements: z
      .array(
        z.object({
          id: str(80).optional(),
          titleBn: str(300),
          titleEn: str(300),
          detailBn: str(3000),
          detailEn: str(3000),
          year: str(20),
          verified: z.boolean(),
        }),
      )
      .max(60),
  }),
  admission: z.object({
    introBn: str(10000),
    introEn: str(10000),
    eligibilityBn: str(5000),
    eligibilityEn: str(5000),
    documentsBn: str(5000),
    documentsEn: str(5000),
    stepsBn: str(10000),
    stepsEn: str(10000),
    feesBn: str(5000),
    feesEn: str(5000),
    deadlineBn: str(200),
    applyUrl: str(500),
    faqs: z
      .array(
        z.object({
          id: str(80).optional(),
          qBn: str(500),
          aBn: str(5000),
          qEn: str(500),
          aEn: str(5000),
        }),
      )
      .max(50),
  }),
})

function withIds(items) {
  return (items || []).map((item) => ({ ...item, id: item.id || crypto.randomUUID() }))
}

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json({ settings: getDb().settings })
  }),
)

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const database = getDb()
    const body = req.body || {}
    const current = database.settings
    const merged = {
      institution: { ...current.institution, ...(body.institution || {}) },
      content: { ...current.content, ...(body.content || {}) },
      admission: { ...current.admission, ...(body.admission || {}) },
    }
    const parsed = parseBody(settingsSchema, merged)
    parsed.content.facilities = withIds(parsed.content.facilities)
    parsed.content.achievements = withIds(parsed.content.achievements)
    parsed.admission.faqs = withIds(parsed.admission.faqs)
    database.settings = { ...parsed, updatedAt: new Date().toISOString() }
    audit(req.user, 'settings.update', 'settings', 'institution', 'Institution, content and admission settings updated.')
    saveDb()
    res.json({ settings: database.settings, message: 'সেটিংস সংরক্ষণ করা হয়েছে।' })
  }),
)

// ---- Documents (multipart upload) ----

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
})

const allowedFiles = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'text/plain': '.txt',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
}

router.get(
  '/documents',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    res.json({
      items: database.documents
        .slice()
        .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)))
        .map((doc) => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          filename: doc.filename,
          mimeType: doc.mimeType,
          size: doc.size,
          status: doc.status,
          uploadedAt: doc.uploadedAt,
          isDemo: Boolean(doc.isDemo),
        })),
    })
  }),
)

router.post(
  '/documents',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const metadataSchema = z.object({
      title: str(220).min(2),
      category: str(100).min(1),
      status: z.enum(documentStatuses),
    })
    const metadata = parseBody(metadataSchema, req.body)
    if (!req.file) throw new HttpError(400, 'একটি ফাইল নির্বাচন করুন।', 'FILE_REQUIRED')
    const ext = allowedFiles[req.file.mimetype]
    if (!ext) {
      throw new HttpError(
        400,
        'শুধু PDF, JPG, PNG, TXT, DOC/DOCX অথবা XLS/XLSX ফাইল আপলোড করা যাবে।',
        'FILE_TYPE',
      )
    }
    const originalExt = path.extname(req.file.originalname || '').toLowerCase()
    const safeName = String(req.file.originalname || 'document')
      .replace(/[\r\n"]/g, '')
      .slice(0, 200)
    if (originalExt && originalExt !== ext && !(ext === '.jpg' && originalExt === '.jpeg')) {
      throw new HttpError(400, 'ফাইলের ধরন ও এক্সটেনশন মিলছে না।', 'FILE_TYPE')
    }
    const storedName = `${crypto.randomUUID()}${ext}`
    await storeUpload(storedName, req.file.buffer, req.file.mimetype)
    const database = getDb()
    const doc = {
      id: crypto.randomUUID(),
      title: metadata.title,
      category: metadata.category,
      status: metadata.status,
      filename: safeName,
      storedName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user.id,
      isDemo: false,
    }
    database.documents.unshift(doc)
    audit(req.user, 'document.upload', 'documents', doc.id, `${doc.title} (${doc.filename})`)
    saveDb()
    res.status(201).json({ item: doc, message: 'ডকুমেন্ট আপলোড হয়েছে।' })
  }),
)

router.put(
  '/documents/:id',
  asyncHandler(async (req, res) => {
    const database = getDb()
    const doc = database.documents.find((item) => item.id === req.params.id)
    if (!doc) throw new HttpError(404, 'ডকুমেন্ট পাওয়া যায়নি।', 'NOT_FOUND')
    const schema = z.object({
      title: str(220).min(2),
      category: str(100).min(1),
      status: z.enum(documentStatuses),
    })
    const parsed = parseBody(schema, req.body)
    Object.assign(doc, parsed, { updatedAt: new Date().toISOString() })
    audit(req.user, 'document.update', 'documents', doc.id, doc.title)
    saveDb()
    res.json({ item: doc, message: 'ডকুমেন্ট হালনাগাদ হয়েছে।' })
  }),
)

router.get(
  '/documents/:id/download',
  asyncHandler(async (req, res) => {
    const doc = getDb().documents.find((item) => item.id === req.params.id)
    if (!doc) throw new HttpError(404, 'ডকুমেন্ট পাওয়া যায়নি।', 'NOT_FOUND')
    const stored = await getUpload(doc.storedName)
    if (!stored) throw new HttpError(404, 'ফাইলটি পাওয়া যায়নি।')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
    res.setHeader('Content-Type', doc.mimeType || stored.mimeType || 'application/octet-stream')
    res.setHeader('Content-Disposition', attachmentDisposition(doc.filename || 'document'))
    res.send(stored.data)
  }),
)

// ---- Users and roles ----

function linkedName(database, user) {
  if (user.role === 'student') {
    return database.students.find((student) => student.id === user.linkedId)?.name || ''
  }
  if (user.role === 'teacher') {
    return database.teachers.find((teacher) => teacher.id === user.linkedId)?.name || ''
  }
  return ''
}

function userView(database, user) {
  return {
    ...publicUser(user),
    linkedName: linkedName(database, user),
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || '',
  }
}

function validateLinkedRecord(database, role, linkedId) {
  if (role === 'admin') return ''
  const collection = role === 'student' ? database.students : database.teachers
  if (!linkedId) {
    throw new HttpError(400, 'এই ভূমিকার জন্য একটি রেকর্ড নির্বাচন করুন।', 'LINK_REQUIRED')
  }
  const record = collection.find((item) => item.id === linkedId && item.status !== 'archived')
  if (!record) throw new HttpError(400, 'নির্বাচিত রেকর্ড পাওয়া যায়নি।', 'LINK_NOT_FOUND')
  return linkedId
}

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    res.json({
      items: database.users
        .slice()
        .sort((a, b) => String(a.displayName).localeCompare(String(b.displayName), 'bn'))
        .map((user) => userView(database, user)),
      students: database.students
        .filter((student) => student.status !== 'archived')
        .map((student) => ({ id: student.id, name: student.name, studentId: student.studentId })),
      teachers: database.teachers
        .filter((teacher) => teacher.status !== 'archived')
        .map((teacher) => ({ id: teacher.id, name: teacher.name, designation: teacher.designation })),
    })
  }),
)

router.post(
  '/users',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 40, keyPrefix: 'admin-create-user' }),
  asyncHandler(async (req, res) => {
    const database = getDb()
    const input = parseBody(userSchema, req.body)
    if (!input.password) throw new HttpError(400, 'নতুন অ্যাকাউন্টের জন্য পাসওয়ার্ড দিন।', 'PASSWORD_REQUIRED')
    const problem = passwordProblem(input.password)
    if (problem) throw new HttpError(400, problem, 'WEAK_PASSWORD')
    if (database.users.some((user) => user.email === input.email)) {
      throw new HttpError(409, 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।', 'EMAIL_TAKEN')
    }
    const linkedId = validateLinkedRecord(database, input.role, input.linkedId || '')
    const user = {
      id: crypto.randomUUID(),
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      status: input.status,
      linkedId,
      passwordHash: hashPassword(input.password),
      mustChangePassword: Boolean(input.mustChangePassword),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: '',
    }
    database.users.push(user)
    audit(req.user, 'user.create', 'users', user.id, `${user.email} (${user.role})`)
    saveDb()
    res.status(201).json({ item: userView(database, user), message: 'অ্যাকাউন্ট তৈরি হয়েছে।' })
  }),
)

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const database = getDb()
    const user = database.users.find((item) => item.id === req.params.id)
    if (!user) throw new HttpError(404, 'অ্যাকাউন্ট পাওয়া যায়নি।', 'NOT_FOUND')
    const input = parseBody(userSchema, req.body)
    const isSelf = user.id === req.user.id
    if (isSelf && input.role !== user.role) {
      throw new HttpError(403, 'নিজের ভূমিকা নিজে পরিবর্তন করা যাবে না।', 'SELF_ROLE')
    }
    if (isSelf && input.status !== 'active') {
      throw new HttpError(403, 'নিজের অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না।', 'SELF_STATUS')
    }
    if (
      database.users.some((other) => other.id !== user.id && other.email === input.email)
    ) {
      throw new HttpError(409, 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে।', 'EMAIL_TAKEN')
    }
    if (user.role === 'admin' && (input.role !== 'admin' || input.status !== 'active')) {
      const otherAdmins = database.users.filter(
        (other) => other.id !== user.id && other.role === 'admin' && other.status === 'active',
      )
      if (!otherAdmins.length) {
        throw new HttpError(409, 'অন্তত একজন সক্রিয় অ্যাডমিন থাকতে হবে।', 'LAST_ADMIN')
      }
    }
    const linkedId = validateLinkedRecord(database, input.role, input.linkedId || '')
    user.displayName = input.displayName
    user.email = input.email
    user.role = input.role
    user.status = input.status
    user.linkedId = linkedId
    user.mustChangePassword = Boolean(input.mustChangePassword)
    user.updatedAt = new Date().toISOString()
    if (input.password) {
      const problem = passwordProblem(input.password)
      if (problem) throw new HttpError(400, problem, 'WEAK_PASSWORD')
      user.passwordHash = hashPassword(input.password)
      database.sessions = database.sessions.filter((session) => session.userId !== user.id)
    }
    if (input.status === 'inactive') {
      database.sessions = database.sessions.filter((session) => session.userId !== user.id)
    }
    audit(req.user, 'user.update', 'users', user.id, `${user.email} (${user.role}, ${user.status})`)
    saveDb()
    res.json({ item: userView(database, user), message: 'অ্যাকাউন্ট হালনাগাদ হয়েছে।' })
  }),
)

router.post(
  '/users/:id/reset-link',
  asyncHandler(async (req, res) => {
    const database = getDb()
    const user = database.users.find((item) => item.id === req.params.id)
    if (!user) throw new HttpError(404, 'অ্যাকাউন্ট পাওয়া যায়নি।', 'NOT_FOUND')
    const token = createPasswordReset(user.id)
    const resetUrl = `${config.appOrigin || `http://localhost:${config.port}`}/reset-password?token=${token}`
    audit(req.user, 'user.reset_link', 'users', user.id, 'One-time password reset link generated.')
    saveDb()
    res.json({
      resetUrl,
      expiresInMinutes: config.resetMinutes,
      message: 'একবার ব্যবহারযোগ্য পাসওয়ার্ড রিসেট লিংক তৈরি হয়েছে। এটি নিরাপদ মাধ্যমে ব্যবহারকারীকে দিন।',
    })
  }),
)

// ---- Results import and preview ----

const importSubject = z.object({
  name: z.string().trim().min(1).max(160),
  marks: z.number().min(0).max(100),
})

const importRowSchema = z.object({
  roll: z.string().trim().min(1).max(40),
  registration: z.string().trim().min(1).max(60),
  studentName: z.string().trim().min(2).max(160),
  gpa: z.number().min(0).max(5).nullable().optional(),
  outcome: z.enum(['pass', 'fail', 'withheld', 'absent']),
  subjects: z.array(importSubject).max(30).optional(),
})

function resultKey(roll) {
  return String(roll).trim().toUpperCase()
}

function validateImport(database, examinationId, rawRecords) {
  const exam = database.examinations.find((item) => item.id === examinationId)
  if (!exam) throw new HttpError(404, 'নির্বাচিত পরীক্ষা পাওয়া যায়নি।', 'EXAM_NOT_FOUND')
  if (!Array.isArray(rawRecords) || !rawRecords.length) {
    throw new HttpError(400, 'আয়াতনের জন্য অন্তত একটি রেকর্ড প্রয়োজন।', 'EMPTY_IMPORT')
  }
  if (rawRecords.length > 1000) {
    throw new HttpError(400, 'একবারে সর্বোচ্চ ১০০০টি রেকর্ড আমদানি করা যাবে।', 'TOO_MANY')
  }
  const rows = []
  const seen = new Map()
  for (let index = 0; index < rawRecords.length; index += 1) {
    const raw = rawRecords[index]
    const parsed = importRowSchema.safeParse(raw)
    const errors = []
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${issue.path.join('.') || 'রেকর্ড'}: ${issue.message}`)
      }
      rows.push({ row: index + 1, data: raw, errors, duplicate: false, existingId: null })
      continue
    }
    const data = parsed.data
    data.roll = data.roll.toUpperCase()
    data.registration = data.registration.toUpperCase()
    const rollKey = resultKey(data.roll)
    if (seen.has(rollKey)) {
      errors.push(`একই ফাইলে রোল ${data.roll} একাধিকবার আছে (আগের সারি ${seen.get(rollKey)})।`)
    } else {
      seen.set(rollKey, index + 1)
    }
    const existing = database.results.find(
      (result) =>
        result.examinationId === examinationId &&
        (resultKey(result.roll) === rollKey ||
          (data.registration &&
            String(result.registration || '').trim().toUpperCase() === data.registration)),
    )
    rows.push({
      row: index + 1,
      data,
      errors,
      duplicate: Boolean(existing),
      existingId: existing?.id || null,
    })
  }
  return { exam, rows }
}

router.post(
  '/results/validate',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      examinationId: z.string().trim().min(1),
      records: z.array(z.unknown()).max(1000),
    })
    const input = parseBody(schema, req.body)
    const database = getDb()
    const { exam, rows } = validateImport(database, input.examinationId, input.records)
    res.json({
      examination: exam,
      rows,
      validCount: rows.filter((row) => !row.errors.length && !row.duplicate).length,
      duplicateCount: rows.filter((row) => row.duplicate).length,
      errorCount: rows.filter((row) => row.errors.length).length,
    })
  }),
)

router.post(
  '/results/import',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      examinationId: z.string().trim().min(1),
      records: z.array(z.unknown()).min(1).max(1000),
      mode: z.enum(['skip', 'overwrite']),
      publish: z.boolean().optional(),
      confirmOverwrite: z.boolean().optional(),
    })
    const input = parseBody(schema, req.body)
    const database = getDb()
    const { exam, rows } = validateImport(database, input.examinationId, input.records)
    if (input.publish && exam.status !== 'published') {
      throw new HttpError(
        409,
        'প্রকাশিত ফলাফল আমদানির আগে সংশ্লিষ্ট পরীক্ষা প্রকাশ করতে হবে। খসড়া হিসেবে আমদানি করে পরে প্রকাশ করুন।',
        'EXAM_NOT_PUBLISHED',
      )
    }
    const errorRows = rows.filter((row) => row.errors.length)
    if (errorRows.length) {
      throw new HttpError(
        422,
        `${errorRows.length}টি সারিতে সমস্যা আছে। আমদানির আগে সেগুলো সংশোধন করুন।`,
        'IMPORT_ERRORS',
        errorRows,
      )
    }
    const duplicateRows = rows.filter((row) => row.duplicate)
    if (duplicateRows.length && input.mode === 'skip' && rows.every((row) => row.duplicate)) {
      audit(
        req.user,
        'results.import',
        'results',
        exam.id,
        `Created 0, updated 0, skipped ${rows.length}; mode=skip; publish=${Boolean(input.publish)}.`,
      )
      saveDb()
      return res.json({
        created: 0,
        updated: 0,
        skipped: rows.length,
        backup: '',
        message: 'সব রেকর্ড আগে থেকেই আছে; কোনো পরিবর্তন করা হয়নি।',
      })
    }
    if (duplicateRows.length && input.mode === 'overwrite' && !input.confirmOverwrite) {
      throw new HttpError(
        409,
        'বিদ্যমান ফলাফল প্রতিস্থাপন করতে নিশ্চিতকরণ প্রয়োজন। প্রতিস্থাপনের আগে স্বয়ংক্রিয় ব্যাকআপ তৈরি হবে।',
        'OVERWRITE_CONFIRMATION',
        duplicateRows,
      )
    }
    let backup = ''
    if (input.mode === 'overwrite' && duplicateRows.length) {
      backup = createBackup('results-import') || ''
    }
    const publish = Boolean(input.publish)
    const publishedAt = publish ? new Date().toISOString() : ''
    let created = 0
    let updated = 0
    let skipped = 0
    for (const row of rows) {
      if (row.duplicate && input.mode === 'skip') {
        skipped += 1
        continue
      }
      const matchedStudent = database.students.find(
        (student) =>
          resultKey(student.roll) === row.data.roll &&
          (!exam.sessionId || student.sessionId === exam.sessionId),
      )
      const resultData = normalizeResult({
        examinationId: exam.id,
        roll: row.data.roll,
        registration: row.data.registration,
        studentName: row.data.studentName,
        gpa: row.data.gpa ?? null,
        outcome: row.data.outcome,
        subjects: row.data.subjects || [],
        status: publish ? 'published' : 'draft',
        publishedAt,
        studentId: matchedStudent?.id || '',
      })
      if (row.duplicate) {
        const existing = database.results.find((item) => item.id === row.existingId)
        if (!existing) continue
        Object.assign(existing, resultData, { updatedAt: new Date().toISOString() })
        updated += 1
      } else {
        const now = new Date().toISOString()
        database.results.push({
          id: crypto.randomUUID(),
          ...resultData,
          source: 'csv',
          createdAt: now,
          updatedAt: now,
          isDemo: false,
        })
        created += 1
      }
    }
    audit(
      req.user,
      'results.import',
      'results',
      exam.id,
      `Created ${created}, updated ${updated}, skipped ${skipped}; mode=${input.mode}; publish=${publish}.`,
    )
    saveDb()
    res.json({
      created,
      updated,
      skipped,
      backup,
      message: `আমদানি সম্পন্ন: নতুন ${created}, হালনাগাদ ${updated}, বাদ ${skipped}।`,
    })
  }),
)

// ---- Contact messages ----

router.get(
  '/messages',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    res.json({
      items: database.contactMessages
        .slice()
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    })
  }),
)

router.patch(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const schema = z.object({ status: z.enum(['new', 'read', 'archived']) })
    const input = parseBody(schema, req.body)
    const message = getDb().contactMessages.find((item) => item.id === req.params.id)
    if (!message) throw new HttpError(404, 'বার্তাটি পাওয়া যায়নি।', 'NOT_FOUND')
    message.status = input.status
    message.updatedAt = new Date().toISOString()
    audit(req.user, 'message.status', 'contactMessages', message.id, input.status)
    saveDb()
    res.json({ message: 'বার্তার অবস্থা হালনাগাদ হয়েছে।' })
  }),
)

router.delete(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    const database = getDb()
    const message = database.contactMessages.find((item) => item.id === req.params.id)
    if (!message) throw new HttpError(404, 'বার্তাটি পাওয়া যায়নি।', 'NOT_FOUND')
    createBackup('message-delete')
    database.contactMessages = database.contactMessages.filter((item) => item.id !== message.id)
    audit(req.user, 'message.delete', 'contactMessages', message.id, message.subject)
    saveDb()
    res.json({ message: 'বার্তাটি মুছে ফেলা হয়েছে।' })
  }),
)

// ---- Backups and demo content ----

router.get(
  '/backups',
  asyncHandler(async (_req, res) => {
    res.json({ items: await listBackups() })
  }),
)

router.post(
  '/backups',
  asyncHandler(async (req, res) => {
    const file = createBackup('manual-admin')
    audit(req.user, 'backup.create', 'system', file || '', 'Manual backup created.')
    saveDb()
    res.status(201).json({ backup: file, items: await listBackups(), message: 'ব্যাকআপ তৈরি হয়েছে।' })
  }),
)

router.get(
  '/backups/:file',
  asyncHandler(async (req, res) => {
    const content = await getBackupContent(req.params.file)
    if (content === null) throw new HttpError(404, 'ব্যাকআপ ফাইল পাওয়া যায়নি।', 'NOT_FOUND')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Disposition', attachmentDisposition(req.params.file))
    res.send(content)
  }),
)

router.delete(
  '/demo-content',
  asyncHandler(async (req, res) => {
    const database = getDb()
    const collections = ['notices', 'events', 'calendar', 'documents', 'routines']
    const counts = {}
    let total = 0
    for (const collection of collections) {
      const before = database[collection].length
      database[collection] = database[collection].filter((item) => !item.isDemo)
      counts[collection] = before - database[collection].length
      total += counts[collection]
    }
    if (!total) return res.json({ counts, message: 'মুছে ফেলার মতো নমুনা কনটেন্ট পাওয়া যায়নি।' })
    createBackup('demo-content-delete')
    audit(req.user, 'demo.delete', 'system', '', JSON.stringify(counts))
    saveDb()
    res.json({ counts, message: 'নমুনা কনটেন্ট মুছে ফেলা হয়েছে।' })
  }),
)

router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const limit = Math.min(500, Math.max(1, Number.parseInt(String(req.query.limit || '200'), 10) || 200))
    const q = String(req.query.q || '').trim().toLowerCase()
    let items = getDb().auditLogs
    if (q) {
      items = items.filter((item) =>
        `${item.actorName} ${item.action} ${item.entity} ${item.details}`.toLowerCase().includes(q),
      )
    }
    res.json({ items: items.slice(0, limit), total: items.length })
  }),
)

// ---- Generic admin CRUD for configured entities ----

function getEntity(key) {
  const entity = entities[key]
  if (!entity) throw new HttpError(404, 'এই ধরনের তথ্য পাওয়া যায়নি।', 'UNKNOWN_ENTITY')
  return entity
}

function sortItems(entity, items) {
  return items.slice().sort(entity.sort || ((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))))
}

function checkUnique(database, key, data, currentId = '') {
  if (key === 'students') {
    if (
      database.students.some(
        (student) =>
          student.id !== currentId &&
          String(student.studentId).trim().toLowerCase() === String(data.studentId).trim().toLowerCase(),
      )
    ) {
      throw new HttpError(409, 'এই শিক্ষার্থী আইডি ইতিমধ্যে ব্যবহৃত হচ্ছে।', 'DUPLICATE_STUDENT_ID')
    }
    if (
      database.students.some(
        (student) =>
          student.id !== currentId &&
          String(student.roll).trim().toUpperCase() === String(data.roll).trim().toUpperCase() &&
          (student.sessionId || '') === (data.sessionId || ''),
      )
    ) {
      throw new HttpError(409, 'এই শিক্ষাবর্ষে একই রোল নম্বর ইতিমধ্যে আছে।', 'DUPLICATE_ROLL')
    }
  }
  if (key === 'results') {
    const roll = String(data.roll || '').trim().toUpperCase()
    const registration = String(data.registration || '').trim().toUpperCase()
    const duplicate = database.results.find(
      (result) =>
        result.id !== currentId &&
        result.examinationId === data.examinationId &&
        (String(result.roll).trim().toUpperCase() === roll ||
          (registration && String(result.registration || '').trim().toUpperCase() === registration)),
    )
    if (duplicate) {
      throw new HttpError(409, 'এই পরীক্ষায় একই রোল বা রেজিস্ট্রেশন নম্বরের ফলাফল ইতিমধ্যে আছে।', 'DUPLICATE_RESULT')
    }
  }
}

function prepareData(key, data) {
  if (key === 'results') {
    const normalized = normalizeResult(data)
    if (normalized.status === 'published' && !normalized.publishedAt) {
      normalized.publishedAt = new Date().toISOString()
    }
    return normalized
  }
  if (key === 'notices' && data.status === 'published' && !data.publishedAt) {
    return { ...data, publishedAt: new Date().toISOString() }
  }
  return data
}

router.get(
  '/:entity',
  asyncHandler(async (req, res) => {
    const entity = getEntity(req.params.entity)
    const database = getDb()
    const q = String(req.query.q || '').trim().toLowerCase()
    const statusFilter = String(req.query.status || '').trim()
    let items = database[entity.collection]
    if (statusFilter) items = items.filter((item) => item.status === statusFilter)
    if (q) {
      items = items.filter((item) =>
        entity.searchFields.some((field) =>
          String(item[field] || '').toLowerCase().includes(q),
        ),
      )
    }
    res.json({
      items: sortItems(entity, items),
      total: items.length,
      statuses: entity.statuses,
      label: entity.label,
    })
  }),
)

router.post(
  '/:entity',
  asyncHandler(async (req, res) => {
    const entity = getEntity(req.params.entity)
    const database = getDb()
    const parsed = parseBody(entity.schema, req.body)
    const data = prepareData(req.params.entity, { ...entity.defaults, ...parsed })
    checkUnique(database, req.params.entity, data)
    const now = new Date().toISOString()
    const record = {
      id: crypto.randomUUID(),
      ...data,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    }
    if (req.params.entity === 'results') {
      const exam = database.examinations.find((item) => item.id === record.examinationId)
      if (!exam) throw new HttpError(400, 'নির্বাচিত পরীক্ষা পাওয়া যায়নি।', 'EXAM_NOT_FOUND')
      if (record.status === 'published' && exam.status !== 'published') {
        throw new HttpError(409, 'ফলাফল প্রকাশের আগে সংশ্লিষ্ট পরীক্ষা প্রকাশ করতে হবে।', 'EXAM_NOT_PUBLISHED')
      }
      if (!record.studentId) {
        const student = database.students.find(
          (item) =>
            String(item.roll).trim().toUpperCase() === String(record.roll).trim().toUpperCase() &&
            (!exam.sessionId || item.sessionId === exam.sessionId),
        )
        record.studentId = student?.id || ''
      }
    }
    database[entity.collection].push(record)
    audit(req.user, `${req.params.entity}.create`, req.params.entity, record.id, record.title || record.name || record.studentName || record.roll || '')
    saveDb()
    res.status(201).json({ item: record, message: 'রেকর্ড তৈরি হয়েছে।' })
  }),
)

router.put(
  '/:entity/:id',
  asyncHandler(async (req, res) => {
    const entity = getEntity(req.params.entity)
    const database = getDb()
    const existing = database[entity.collection].find((item) => item.id === req.params.id)
    if (!existing) throw new HttpError(404, 'রেকর্ডটি পাওয়া যায়নি।', 'NOT_FOUND')
    const parsed = parseBody(entity.schema.partial(), req.body)
    const data = prepareData(req.params.entity, { ...existing, ...parsed })
    checkUnique(database, req.params.entity, data, existing.id)
    if (req.params.entity === 'results' && data.status === 'published') {
      const exam = database.examinations.find((item) => item.id === data.examinationId)
      if (!exam || exam.status !== 'published') {
        throw new HttpError(409, 'ফলাফল প্রকাশের আগে সংশ্লিষ্ট পরীক্ষা প্রকাশ করতে হবে।', 'EXAM_NOT_PUBLISHED')
      }
    }
    if (req.params.entity === 'students' && data.status === 'archived') {
      const linked = database.users.find((user) => user.linkedId === existing.id)
      if (linked) database.sessions = database.sessions.filter((session) => session.userId !== linked.id)
    }
    Object.assign(existing, data, { updatedAt: new Date().toISOString() })
    audit(req.user, `${req.params.entity}.update`, req.params.entity, existing.id, Object.keys(parsed).join(', '))
    saveDb()
    res.json({ item: existing, message: 'রেকর্ড হালনাগাদ হয়েছে।' })
  }),
)

router.patch(
  '/:entity/:id/status',
  asyncHandler(async (req, res) => {
    const entity = getEntity(req.params.entity)
    const database = getDb()
    const status = String(req.body?.status || '')
    if (!entity.statuses.includes(status)) {
      throw new HttpError(400, 'অবস্থা সঠিক নয়।', 'INVALID_STATUS')
    }
    const record = database[entity.collection].find((item) => item.id === req.params.id)
    if (!record) throw new HttpError(404, 'রেকর্ডটি পাওয়া যায়নি।', 'NOT_FOUND')
    if (req.params.entity === 'results' && status === 'published') {
      const exam = database.examinations.find((item) => item.id === record.examinationId)
      if (!exam || exam.status !== 'published') {
        throw new HttpError(409, 'ফলাফল প্রকাশের আগে সংশ্লিষ্ট পরীক্ষা প্রকাশ করতে হবে।', 'EXAM_NOT_PUBLISHED')
      }
      if (!record.publishedAt) record.publishedAt = new Date().toISOString()
    }
    if (req.params.entity === 'notices' && status === 'published' && !record.publishedAt) {
      record.publishedAt = new Date().toISOString()
    }
    const previous = record.status
    record.status = status
    record.updatedAt = new Date().toISOString()
    audit(req.user, `${req.params.entity}.status`, req.params.entity, record.id, `${previous} → ${status}`)
    saveDb()
    res.json({ item: record, message: 'অবস্থা হালনাগাদ হয়েছে।' })
  }),
)

router.delete(
  '/:entity/:id',
  asyncHandler(async (req, res) => {
    const entity = getEntity(req.params.entity)
    if (!entity.hardDelete) {
      throw new HttpError(
        405,
        'গুরুত্বপূর্ণ রেকর্ড স্থায়ীভাবে মুছে ফেলা হয় না। অনুগ্রহ করে আর্কাইভ করুন।',
        'USE_ARCHIVE',
      )
    }
    const database = getDb()
    const record = database[entity.collection].find((item) => item.id === req.params.id)
    if (!record) throw new HttpError(404, 'রেকর্ডটি পাওয়া যায়নি।', 'NOT_FOUND')
    for (const reference of entity.references || []) {
      const count = database[reference.collection].filter(
        (item) => item[reference.field] === record.id,
      ).length
      if (count) {
        throw new HttpError(
          409,
          `এই রেকর্ডটি ${reference.label}-এ ব্যবহৃত হচ্ছে (${count}টি)। আগে সেগুলো হালনাগাদ করুন।`,
          'IN_USE',
        )
      }
    }
    createBackup('record-delete')
    database[entity.collection] = database[entity.collection].filter((item) => item.id !== record.id)
    audit(req.user, `${req.params.entity}.delete`, req.params.entity, record.id, record.title || record.name || '')
    saveDb()
    res.json({ message: 'রেকর্ডটি মুছে ফেলা হয়েছে।' })
  }),
)

export default router
