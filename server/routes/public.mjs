import express from 'express'
import crypto from 'node:crypto'
import { z } from 'zod'
import { getDb, saveDb, getUpload, audit } from '../db.mjs'
import { rateLimit } from '../auth.mjs'
import {
  asyncHandler,
  attachmentDisposition,
  HttpError,
  parseBody,
  parsePagination,
} from '../http.mjs'
import { contactSchema } from '../schemas.mjs'

const router = express.Router()

const nowIso = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10)

function sessionName(id) {
  return getDb().academicSessions.find((session) => session.id === id)?.name || ''
}

function programName(id) {
  return getDb().programs.find((program) => program.id === id)?.nameBn || ''
}

function publicDocument(doc) {
  return {
    id: doc.id,
    title: doc.title,
    category: doc.category,
    filename: doc.filename,
    mimeType: doc.mimeType,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
    isDemo: Boolean(doc.isDemo),
  }
}

function examWithNames(exam) {
  return {
    ...exam,
    sessionName: sessionName(exam.sessionId),
    programName: programName(exam.programId),
  }
}

function publicNotice(notice) {
  return {
    id: notice.id,
    title: notice.title,
    category: notice.category,
    summary: notice.summary,
    body: notice.body,
    publishedAt: notice.publishedAt,
    deadline: notice.deadline,
    pinned: Boolean(notice.pinned),
    attachmentUrl: notice.attachmentUrl || '',
    sessionId: notice.sessionId || '',
    sessionName: notice.sessionId ? sessionName(notice.sessionId) : '',
    audience: notice.audience || 'all',
    isDemo: Boolean(notice.isDemo),
  }
}

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    res.json({ settings: database.settings, meta: { demoContentNotice: database.meta.demoContentNotice } })
  }),
)

router.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    const notices = database.notices
      .filter((notice) => notice.status === 'published')
      .sort((a, b) => {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
        return String(b.publishedAt).localeCompare(String(a.publishedAt))
      })
      .slice(0, 4)
      .map(publicNotice)

    const events = database.events
      .filter((event) => event.status === 'published')
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
      .slice(0, 4)

    res.json({
      settings: database.settings,
      meta: { demoContentNotice: database.meta.demoContentNotice },
      notices,
      events,
      counts: {
        activeTeachers: database.teachers.filter((teacher) => teacher.status === 'active').length,
        publishedNotices: database.notices.filter((notice) => notice.status === 'published').length,
      },
    })
  }),
)

router.get(
  '/notices',
  asyncHandler(async (req, res) => {
    const database = getDb()
    const { page, pageSize, offset } = parsePagination(req.query, 8, 50)
    const q = String(req.query.q || '').trim().toLowerCase()
    const category = String(req.query.category || '').trim()
    const from = String(req.query.from || '').trim()
    const to = String(req.query.to || '').trim()

    const published = database.notices.filter((notice) => notice.status === 'published')
    const categories = [...new Set(published.map((notice) => notice.category).filter(Boolean))].sort()

    const filtered = published.filter((notice) => {
      if (category && notice.category !== category) return false
      if (from && String(notice.publishedAt).slice(0, 10) < from) return false
      if (to && String(notice.publishedAt).slice(0, 10) > to) return false
      if (q) {
        const haystack = `${notice.title} ${notice.summary} ${notice.body} ${notice.category}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    filtered.sort((a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
      return String(b.publishedAt).localeCompare(String(a.publishedAt))
    })

    // Summaries are enough for lists; the detail endpoint returns the full body.
    const items = filtered.slice(offset, offset + pageSize).map((notice) => {
      const item = publicNotice(notice)
      return { ...item, body: undefined }
    })

    res.json({
      items,
      total: filtered.length,
      page,
      pageSize,
      categories,
      allCategories: categories,
    })
  }),
)

router.get(
  '/notices/:id',
  asyncHandler(async (req, res) => {
    const notice = getDb().notices.find(
      (item) => item.id === req.params.id && item.status === 'published',
    )
    if (!notice) throw new HttpError(404, 'নোটিশটি পাওয়া যায়নি বা প্রকাশিত হয়নি।', 'NOT_FOUND')
    res.json({ notice: publicNotice(notice) })
  }),
)

router.get(
  '/events',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    const current = today()
    const events = database.events
      .filter((event) => event.status === 'published')
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
      .map((event) => ({ ...event, isPast: String(event.startDate) < current }))
    res.json({ events })
  }),
)

router.get(
  '/teachers',
  asyncHandler(async (req, res) => {
    const database = getDb()
    const { page, pageSize, offset } = parsePagination(req.query, 9, 48)
    const q = String(req.query.q || '').trim().toLowerCase()
    const designation = String(req.query.designation || '').trim()
    const department = String(req.query.department || '').trim()
    const sort = String(req.query.sort || 'name')

    const active = database.teachers.filter((teacher) => teacher.status === 'active')
    const designations = [...new Set(active.map((teacher) => teacher.designation).filter(Boolean))].sort()
    const departments = [...new Set(active.map((teacher) => teacher.department).filter(Boolean))].sort()

    let filtered = active.filter((teacher) => {
      if (designation && teacher.designation !== designation) return false
      if (department && teacher.department !== department) return false
      if (q) {
        const haystack =
          `${teacher.name} ${teacher.designation} ${teacher.department} ${teacher.qualification}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    filtered = filtered.slice().sort((a, b) => {
      if (sort === 'designation') {
        return `${a.designation}${a.name}`.localeCompare(`${b.designation}${b.name}`, 'bn')
      }
      return String(a.name).localeCompare(String(b.name), 'bn')
    })

    const items = filtered.slice(offset, offset + pageSize).map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      designation: teacher.designation,
      department: teacher.department,
      qualification: teacher.qualification,
      employmentType: teacher.employmentType,
      email: teacher.email,
      officeHours: teacher.officeHours,
      category: teacher.category,
    }))

    res.json({ items, total: filtered.length, page, pageSize, designations, departments })
  }),
)

router.get(
  '/teachers/:id',
  asyncHandler(async (req, res) => {
    const teacher = getDb().teachers.find(
      (item) => item.id === req.params.id && item.status === 'active',
    )
    if (!teacher) throw new HttpError(404, 'শিক্ষকের তথ্য পাওয়া যায়নি।', 'NOT_FOUND')
    res.json({
      teacher: {
        id: teacher.id,
        name: teacher.name,
        designation: teacher.designation,
        department: teacher.department,
        qualification: teacher.qualification,
        employmentType: teacher.employmentType,
        email: teacher.email,
        officeHours: teacher.officeHours,
        bio: teacher.bio,
        category: teacher.category,
      },
    })
  }),
)

router.get(
  '/academics',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    const sessions = database.academicSessions.filter((session) => session.status === 'active')
    const programs = database.programs.filter((program) => program.status === 'active')
    const subjects = database.subjects.filter((subject) => subject.status === 'active')
    const calendar = database.calendar
      .filter((item) => item.status === 'published')
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    const routines = database.routines
      .filter((item) => item.status === 'published')
      .sort((a, b) => `${a.day}${a.startTime}`.localeCompare(`${b.day}${b.startTime}`))
      .map((item) => ({
        ...item,
        sessionName: sessionName(item.sessionId),
        programName: programName(item.programId),
        teacherName: database.teachers.find((teacher) => teacher.id === item.teacherId)?.name || '',
      }))
    const examinations = database.examinations
      .filter((exam) => exam.status === 'published')
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
      .map(examWithNames)
    const documents = database.documents
      .filter((doc) => doc.status === 'published')
      .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)))
      .map(publicDocument)

    res.json({
      sessions,
      programs,
      subjects,
      calendar,
      routines,
      examinations,
      documents,
      updatedAt: database.settings.updatedAt,
    })
  }),
)

router.get(
  '/documents',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    res.json({
      documents: database.documents
        .filter((doc) => doc.status === 'published')
        .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)))
        .map(publicDocument),
    })
  }),
)

async function sendDocument(res, doc) {
  const stored = await getUpload(doc.storedName)
  if (!stored) {
    throw new HttpError(404, 'ফাইলটি সার্ভারে পাওয়া যায়নি।', 'FILE_MISSING')
  }
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
  res.setHeader('Content-Type', doc.mimeType || stored.mimeType || 'application/octet-stream')
  res.setHeader('Content-Disposition', attachmentDisposition(doc.filename || 'document'))
  return res.send(stored.data)
}

router.get(
  '/documents/:id/download',
  asyncHandler(async (req, res) => {
    const doc = getDb().documents.find(
      (item) => item.id === req.params.id && item.status === 'published',
    )
    if (!doc) throw new HttpError(404, 'ডকুমেন্টটি পাওয়া যায়নি বা প্রকাশিত হয়নি।', 'NOT_FOUND')
    await sendDocument(res, doc)
  }),
)

router.get(
  '/results-meta',
  asyncHandler(async (_req, res) => {
    const database = getDb()
    const exams = database.examinations
      .filter((exam) => exam.status === 'published')
      .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
      .map(examWithNames)
    const latest = database.results
      .filter((result) => result.status === 'published')
      .map((result) => result.publishedAt)
      .sort()
      .at(-1)
    res.json({
      examinations: exams,
      sessions: database.academicSessions.filter((session) => session.status === 'active'),
      programs: database.programs.filter((program) => program.status === 'active'),
      latestPublishedAt: latest || '',
      totalPublishedResults: database.results.filter((result) => result.status === 'published').length,
    })
  }),
)

const resultSearchSchema = z.object({
  examinationId: z.string().trim().min(1, 'পরীক্ষা নির্বাচন করুন।'),
  roll: z.string().trim().min(1, 'রোল নম্বর দিন।').max(40),
  registration: z.string().trim().min(1, 'রেজিস্ট্রেশন নম্বর দিন।').max(60),
  sessionId: z.string().trim().optional(),
  programId: z.string().trim().optional(),
})

router.post(
  '/results/search',
  rateLimit({ windowMs: 60 * 1000, max: 20, keyPrefix: 'result-search' }),
  asyncHandler(async (req, res) => {
    const input = parseBody(resultSearchSchema, req.body)
    const database = getDb()
    const exam = database.examinations.find(
      (item) => item.id === input.examinationId && item.status === 'published',
    )
    const notFound = () =>
      new HttpError(
        404,
        'প্রদত্ত তথ্যের সাথে মিলে এমন কোনো প্রকাশিত ফলাফল পাওয়া যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।',
        'RESULT_NOT_FOUND',
      )
    if (!exam) throw notFound()
    if (input.sessionId && input.sessionId !== exam.sessionId) throw notFound()
    if (input.programId && input.programId !== exam.programId) throw notFound()

    const roll = input.roll.toUpperCase()
    const registration = input.registration.toUpperCase()
    const result = database.results.find(
      (item) =>
        item.examinationId === exam.id &&
        item.status === 'published' &&
        String(item.roll).trim().toUpperCase() === roll &&
        String(item.registration || '').trim().toUpperCase() === registration,
    )
    if (!result) throw notFound()

    const student = result.studentId
      ? database.students.find((item) => item.id === result.studentId)
      : null

    res.json({
      result: {
        id: result.id,
        studentName: result.studentName,
        roll: result.roll,
        registration: result.registration,
        gpa: result.gpa,
        outcome: result.outcome,
        subjects: result.subjects || [],
        publishedAt: result.publishedAt,
        sessionName: sessionName(exam.sessionId),
        programName: programName(exam.programId),
        group: student?.group || '',
        examination: examWithNames(exam),
        generatedAt: nowIso(),
        unofficial: true,
      },
    })
  }),
)

router.post(
  '/contact',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'contact' }),
  asyncHandler(async (req, res) => {
    const input = parseBody(contactSchema, req.body)
    if (input.website) {
      // Honeypot: return a normal response without storing anything.
      return res.json({ message: 'আপনার বার্তা গ্রহণ করা হয়েছে। কলেজ প্রশাসন প্রয়োজনে যোগাযোগ করবে।' })
    }
    const database = getDb()
    const message = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      phone: input.phone || '',
      subject: input.subject,
      message: input.message,
      status: 'new',
      ip: req.ip || '',
      createdAt: nowIso(),
    }
    database.contactMessages.unshift(message)
    saveDb()
    audit(null, 'contact.received', 'contactMessages', message.id, `Message from ${input.email}`)
    saveDb()
    res.status(201).json({
      message: 'আপনার বার্তা সফলভাবে জমা হয়েছে। কলেজ প্রশাসন প্রয়োজন অনুসারে যোগাযোগ করবে।',
    })
  }),
)

export default router
