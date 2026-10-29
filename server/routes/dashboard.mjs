import express from 'express'
import { getDb } from '../db.mjs'
import { requireRole } from '../auth.mjs'
import { asyncHandler, HttpError } from '../http.mjs'
import { listBackups } from '../db.mjs'

const router = express.Router()

function names(database, sessionId, programId) {
  return {
    sessionName: database.academicSessions.find((item) => item.id === sessionId)?.name || '',
    programName: database.programs.find((item) => item.id === programId)?.nameBn || '',
  }
}

function examView(database, exam) {
  return {
    ...exam,
    ...names(database, exam.sessionId, exam.programId),
  }
}

function publicNotice(notice, database) {
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
    sessionName: database.academicSessions.find((item) => item.id === notice.sessionId)?.name || '',
    isDemo: Boolean(notice.isDemo),
  }
}

function documentView(doc) {
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

router.get(
  '/student',
  requireRole('student'),
  asyncHandler(async (req, res) => {
    const database = getDb()
    const student = database.students.find(
      (item) => item.id === req.user.linkedId && item.status !== 'archived',
    )
    if (!student) {
      throw new HttpError(
        409,
        'আপনার অ্যাকাউন্টের সাথে কোনো শিক্ষার্থী রেকর্ড সংযুক্ত নয়। কলেজ প্রশাসনের সাথে যোগাযোগ করুন।',
        'PROFILE_NOT_LINKED',
      )
    }
    const { sessionName, programName } = names(database, student.sessionId, student.programId)

    const exams = database.examinations
      .filter(
        (exam) =>
          exam.status === 'published' &&
          (!student.sessionId || exam.sessionId === student.sessionId) &&
          (!student.programId || exam.programId === student.programId),
      )
      .map((exam) => examView(database, exam))

    const examMap = new Map(database.examinations.map((exam) => [exam.id, exam]))
    const results = database.results
      .filter((result) => {
        if (result.status !== 'published') return false
        if (result.studentId && result.studentId === student.id) return true
        const exam = examMap.get(result.examinationId)
        return (
          exam &&
          String(result.roll).trim().toUpperCase() === String(student.roll).trim().toUpperCase() &&
          (!student.sessionId || exam.sessionId === student.sessionId)
        )
      })
      .map((result) => ({
        ...result,
        examination: examMap.has(result.examinationId)
          ? examView(database, examMap.get(result.examinationId))
          : null,
      }))
      .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))

    const notices = database.notices
      .filter(
        (notice) =>
          notice.status === 'published' &&
          ['all', 'student'].includes(notice.audience || 'all') &&
          (!notice.sessionId || notice.sessionId === student.sessionId),
      )
      .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
      .slice(0, 8)
      .map((notice) => publicNotice(notice, database))

    const routines = database.routines
      .filter(
        (item) =>
          item.status === 'published' &&
          (!student.sessionId || item.sessionId === student.sessionId) &&
          (!student.programId || item.programId === student.programId) &&
          (!item.group || item.group === student.group),
      )
      .map((item) => ({
        ...item,
        teacherName: database.teachers.find((teacher) => teacher.id === item.teacherId)?.name || '',
        ...names(database, item.sessionId, item.programId),
      }))

    const calendar = database.calendar
      .filter((item) => item.status === 'published')
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))

    const today = new Date().toISOString().slice(0, 10)
    res.json({
      profile: {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        roll: student.roll,
        registration: student.registration,
        sessionId: student.sessionId,
        sessionName,
        programId: student.programId,
        programName,
        group: student.group,
        subjects: student.subjects || [],
        status: student.status,
        phone: student.phone,
        guardianPhone: student.guardianPhone,
        dob: student.dob,
        address: student.address,
        email: req.user.email,
      },
      notices,
      results,
      exams,
      routines,
      documents: database.documents
        .filter((doc) => doc.status === 'published')
        .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)))
        .map(documentView),
      calendar: calendar.filter((item) => String(item.date) >= today).slice(0, 8),
    })
  }),
)

router.get(
  '/teacher',
  requireRole('teacher'),
  asyncHandler(async (req, res) => {
    const database = getDb()
    const teacher = database.teachers.find(
      (item) => item.id === req.user.linkedId && item.status !== 'archived',
    )
    if (!teacher) {
      throw new HttpError(
        409,
        'আপনার অ্যাকাউন্টের সাথে কোনো শিক্ষক রেকর্ড সংযুক্ত নয়। কলেজ প্রশাসনের সাথে যোগাযোগ করুন।',
        'PROFILE_NOT_LINKED',
      )
    }
    const assigned = Array.isArray(teacher.assignedSessions) ? teacher.assignedSessions : []

    const notices = database.notices
      .filter(
        (notice) =>
          notice.status === 'published' && ['all', 'teacher'].includes(notice.audience || 'all'),
      )
      .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
      .slice(0, 10)
      .map((notice) => publicNotice(notice, database))

    const routines = database.routines
      .filter((item) => item.status === 'published' && item.teacherId === teacher.id)
      .map((item) => ({
        ...item,
        ...names(database, item.sessionId, item.programId),
      }))

    // Deliberately limited fields: no phone, date of birth or home address.
    const students = database.students
      .filter((student) => student.status === 'active' && assigned.includes(student.sessionId))
      .map((student) => ({
        name: student.name,
        studentId: student.studentId,
        roll: student.roll,
        sessionId: student.sessionId,
        sessionName: names(database, student.sessionId, student.programId).sessionName,
        programName: names(database, student.sessionId, student.programId).programName,
        group: student.group,
      }))
      .sort((a, b) => String(a.studentId).localeCompare(String(b.studentId)))

    const exams = database.examinations
      .filter((exam) => exam.status === 'published' && assigned.includes(exam.sessionId))
      .map((exam) => examView(database, exam))

    res.json({
      profile: {
        id: teacher.id,
        name: teacher.name,
        designation: teacher.designation,
        department: teacher.department,
        qualification: teacher.qualification,
        employmentType: teacher.employmentType,
        email: teacher.email || req.user.email,
        officeHours: teacher.officeHours,
        bio: teacher.bio,
        category: teacher.category,
        assignedSessions: assigned.map((id) => ({
          id,
          name: names(database, id, '').sessionName,
        })),
      },
      notices,
      routines,
      students,
      exams,
      documents: database.documents
        .filter((doc) => doc.status === 'published')
        .sort((a, b) => String(a.uploadedAt).localeCompare(String(b.uploadedAt)))
        .map(documentView),
    })
  }),
)

router.get(
  '/admin',
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const database = getDb()
    const today = new Date().toISOString().slice(0, 10)
    res.json({
      stats: {
        teachers: {
          active: database.teachers.filter((teacher) => teacher.status === 'active').length,
          total: database.teachers.length,
        },
        students: {
          active: database.students.filter((student) => student.status === 'active').length,
          total: database.students.length,
        },
        notices: {
          published: database.notices.filter((notice) => notice.status === 'published').length,
          draft: database.notices.filter((notice) => notice.status === 'draft').length,
        },
        events: {
          upcoming: database.events.filter(
            (event) => event.status === 'published' && String(event.startDate) >= today,
          ).length,
        },
        results: {
          published: database.results.filter((result) => result.status === 'published').length,
          draft: database.results.filter((result) => ['draft', 'review'].includes(result.status)).length,
        },
        documents: database.documents.filter((doc) => doc.status === 'published').length,
        messages: {
          new: database.contactMessages.filter((message) => message.status === 'new').length,
        },
        users: {
          total: database.users.length,
          admins: database.users.filter((user) => user.role === 'admin' && user.status === 'active').length,
        },
        demo: {
          notices: database.notices.filter((notice) => notice.isDemo).length,
          events: database.events.filter((event) => event.isDemo).length,
          calendar: database.calendar.filter((item) => item.isDemo).length,
        },
        backups: (await listBackups()).length,
      },
      recentAudit: database.auditLogs.slice(0, 8),
      upcomingEvents: database.events
        .filter((event) => event.status === 'published' && String(event.startDate) >= today)
        .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
        .slice(0, 4),
      recentMessages: database.contactMessages.slice(0, 4).map((message) => ({
        id: message.id,
        name: message.name,
        subject: message.subject,
        status: message.status,
        createdAt: message.createdAt,
      })),
    })
  }),
)

export default router
