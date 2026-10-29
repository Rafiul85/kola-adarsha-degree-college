import { z } from 'zod'

const text = (max = 300) => z.string().trim().max(max)
const optionalText = (max = 5000) => z.string().trim().max(max).optional()
const dateish = z
  .string()
  .trim()
  .max(40)
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), 'সঠিক তারিখ প্রদান করুন।')
const status = (...values) => z.enum(values)

export const noticeStatuses = ['draft', 'published', 'archived']
export const eventStatuses = ['draft', 'published', 'archived']
export const teacherStatuses = ['active', 'inactive', 'archived']
export const studentStatuses = ['active', 'inactive', 'graduated', 'archived']
export const resultStatuses = ['draft', 'review', 'published', 'archived']
export const documentStatuses = ['draft', 'published', 'archived']
export const calendarStatuses = ['draft', 'published']
export const routineStatuses = ['draft', 'published']
export const examinationStatuses = ['draft', 'published', 'archived']

export const noticeSchema = z.object({
  title: text(220).min(3),
  category: text(60).min(1),
  summary: optionalText(800),
  body: optionalText(30000),
  publishedAt: dateish.optional(),
  deadline: dateish.optional(),
  pinned: z.boolean().optional(),
  status: status(...noticeStatuses).optional(),
  audience: z.enum(['all', 'student', 'teacher']).optional(),
  sessionId: text(80).optional(),
  attachmentUrl: text(500).optional(),
})

export const eventSchema = z.object({
  title: text(220).min(3),
  description: optionalText(10000),
  startDate: dateish.min(1),
  endDate: dateish.optional(),
  startTime: text(10).optional(),
  endTime: text(10).optional(),
  venue: text(200).optional(),
  registrationInfo: optionalText(2000),
  status: status(...eventStatuses).optional(),
})

export const teacherSchema = z.object({
  name: text(160).min(2),
  designation: text(120).optional(),
  department: text(120).optional(),
  qualification: text(300).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'guest', 'other']).optional(),
  email: z.union([z.literal(''), z.string().trim().email('সঠিক ইমেইল প্রদান করুন।')]).optional(),
  officeHours: text(160).optional(),
  bio: optionalText(5000),
  category: z
    .enum(['principal', 'vice_principal', 'lecturer', 'administrative', 'support'])
    .optional(),
  assignedSessions: z.array(text(80)).max(20).optional(),
  status: status(...teacherStatuses).optional(),
})

export const studentSchema = z.object({
  name: text(160).min(2),
  studentId: text(80).min(1),
  roll: text(40).min(1),
  registration: text(60).optional(),
  sessionId: text(80).optional(),
  programId: text(80).optional(),
  group: text(80).optional(),
  subjects: z.array(text(160)).max(40).optional(),
  guardianPhone: text(30).optional(),
  phone: text(30).optional(),
  dob: dateish.optional(),
  address: text(500).optional(),
  status: status(...studentStatuses).optional(),
})

export const academicSessionSchema = z.object({
  name: text(80).min(2),
  startDate: dateish.optional(),
  endDate: dateish.optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export const programSchema = z.object({
  nameBn: text(160).min(2),
  nameEn: text(160).optional(),
  level: z.enum(['HSC', 'DEGREE', 'OTHER']),
  groups: z.array(text(80)).max(20).optional(),
  verified: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export const subjectSchema = z.object({
  code: text(30).optional(),
  nameBn: text(160).min(1),
  nameEn: text(160).optional(),
  programId: text(80).optional(),
  group: text(80).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export const routineSchema = z.object({
  sessionId: text(80).optional(),
  programId: text(80).optional(),
  group: text(80).optional(),
  day: z.enum(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
  startTime: text(10).min(1),
  endTime: text(10).min(1),
  subject: text(160).min(1),
  room: text(80).optional(),
  teacherId: text(80).optional(),
  status: status(...routineStatuses).optional(),
})

export const examinationSchema = z.object({
  name: text(180).min(2),
  sessionId: text(80).optional(),
  programId: text(80).optional(),
  startDate: dateish.optional(),
  endDate: dateish.optional(),
  status: status(...examinationStatuses).optional(),
})

export const calendarSchema = z.object({
  title: text(200).min(2),
  date: dateish.min(1),
  endDate: dateish.optional(),
  type: z.enum(['admission', 'academic', 'examination', 'holiday', 'result', 'other']),
  note: optionalText(1000),
  provisional: z.boolean().optional(),
  status: status(...calendarStatuses).optional(),
})

const resultSubjectSchema = z.object({
  name: text(160).min(1),
  marks: z.number().min(0).max(100),
})

export const resultSchema = z.object({
  examinationId: text(80).min(1),
  roll: text(40).min(1),
  registration: text(60).optional(),
  studentName: text(160).min(2),
  gpa: z.number().min(0).max(5).nullable().optional(),
  outcome: z.enum(['pass', 'fail', 'withheld', 'absent']),
  subjects: z.array(resultSubjectSchema).max(30).optional(),
  status: status(...resultStatuses).optional(),
  publishedAt: dateish.optional(),
  studentId: text(80).optional(),
})

export const userSchema = z.object({
  displayName: text(160).min(2),
  email: z.string().trim().toLowerCase().email('সঠিক ইমেইল প্রদান করুন।'),
  role: z.enum(['admin', 'teacher', 'student']),
  status: z.enum(['active', 'inactive']),
  linkedId: text(80).optional(),
  mustChangePassword: z.boolean().optional(),
  password: z.string().max(200).optional(),
})

export const contactSchema = z.object({
  name: text(120).min(2),
  email: z.string().trim().toLowerCase().email('সঠিক ইমেইল প্রদান করুন।'),
  phone: text(30).optional(),
  subject: text(160).min(3),
  message: text(5000).min(10),
  website: text(200).optional(),
})

export const entities = {
  notices: {
    collection: 'notices',
    label: 'নোটিশ',
    schema: noticeSchema,
    searchFields: ['title', 'summary', 'category'],
    statuses: noticeStatuses,
    defaults: {
      title: '',
      category: 'সাধারণ',
      summary: '',
      body: '',
      publishedAt: '',
      deadline: '',
      pinned: false,
      status: 'draft',
      audience: 'all',
      sessionId: '',
      attachmentUrl: '',
    },
    sort: (a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) return Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
      return String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt))
    },
    hardDelete: false,
  },
  events: {
    collection: 'events',
    label: 'ইভেন্ট',
    schema: eventSchema,
    searchFields: ['title', 'description', 'venue'],
    statuses: eventStatuses,
    defaults: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      venue: '',
      registrationInfo: '',
      status: 'draft',
    },
    sort: (a, b) => String(a.startDate).localeCompare(String(b.startDate)),
    hardDelete: false,
  },
  teachers: {
    collection: 'teachers',
    label: 'শিক্ষক',
    schema: teacherSchema,
    searchFields: ['name', 'designation', 'department', 'qualification'],
    statuses: teacherStatuses,
    defaults: {
      name: '',
      designation: '',
      department: '',
      qualification: '',
      employmentType: 'full_time',
      email: '',
      officeHours: '',
      bio: '',
      category: 'lecturer',
      assignedSessions: [],
      status: 'active',
    },
    sort: (a, b) => String(a.name).localeCompare(String(b.name), 'bn'),
    hardDelete: false,
  },
  students: {
    collection: 'students',
    label: 'শিক্ষার্থী',
    schema: studentSchema,
    searchFields: ['name', 'studentId', 'roll', 'registration'],
    statuses: studentStatuses,
    defaults: {
      name: '',
      studentId: '',
      roll: '',
      registration: '',
      sessionId: '',
      programId: '',
      group: '',
      subjects: [],
      guardianPhone: '',
      phone: '',
      dob: '',
      address: '',
      status: 'active',
    },
    sort: (a, b) => String(a.studentId).localeCompare(String(b.studentId)),
    hardDelete: false,
  },
  'academic-sessions': {
    collection: 'academicSessions',
    label: 'শিক্ষাবর্ষ',
    schema: academicSessionSchema,
    searchFields: ['name'],
    statuses: ['active', 'inactive'],
    defaults: { name: '', startDate: '', endDate: '', status: 'active' },
    sort: (a, b) => String(b.startDate).localeCompare(String(a.startDate)),
    hardDelete: true,
    references: [
      { collection: 'students', field: 'sessionId', label: 'শিক্ষার্থী' },
      { collection: 'examinations', field: 'sessionId', label: 'পরীক্ষা' },
      { collection: 'routines', field: 'sessionId', label: 'রুটিন' },
    ],
  },
  programs: {
    collection: 'programs',
    label: 'প্রোগ্রাম',
    schema: programSchema,
    searchFields: ['nameBn', 'nameEn', 'level'],
    statuses: ['active', 'inactive'],
    defaults: {
      nameBn: '',
      nameEn: '',
      level: 'HSC',
      groups: [],
      verified: false,
      status: 'active',
    },
    sort: (a, b) => String(a.nameBn).localeCompare(String(b.nameBn), 'bn'),
    hardDelete: true,
    references: [
      { collection: 'students', field: 'programId', label: 'শিক্ষার্থী' },
      { collection: 'examinations', field: 'programId', label: 'পরীক্ষা' },
      { collection: 'routines', field: 'programId', label: 'রুটিন' },
    ],
  },
  subjects: {
    collection: 'subjects',
    label: 'বিষয়',
    schema: subjectSchema,
    searchFields: ['nameBn', 'nameEn', 'code', 'group'],
    statuses: ['active', 'inactive'],
    defaults: { code: '', nameBn: '', nameEn: '', programId: '', group: '', status: 'active' },
    sort: (a, b) => String(a.nameBn).localeCompare(String(b.nameBn), 'bn'),
    hardDelete: true,
  },
  routines: {
    collection: 'routines',
    label: 'ক্লাস রুটিন',
    schema: routineSchema,
    searchFields: ['subject', 'room', 'group'],
    statuses: routineStatuses,
    defaults: {
      sessionId: '',
      programId: '',
      group: '',
      day: 'saturday',
      startTime: '',
      endTime: '',
      subject: '',
      room: '',
      teacherId: '',
      status: 'draft',
    },
    sort: (a, b) => `${a.day}${a.startTime}`.localeCompare(`${b.day}${b.startTime}`),
    hardDelete: true,
  },
  examinations: {
    collection: 'examinations',
    label: 'পরীক্ষা',
    schema: examinationSchema,
    searchFields: ['name'],
    statuses: examinationStatuses,
    defaults: { name: '', sessionId: '', programId: '', startDate: '', endDate: '', status: 'draft' },
    sort: (a, b) => String(b.startDate).localeCompare(String(a.startDate)),
    hardDelete: true,
    references: [{ collection: 'results', field: 'examinationId', label: 'ফলাফল' }],
  },
  calendar: {
    collection: 'calendar',
    label: 'একাডেমিক ক্যালেন্ডার',
    schema: calendarSchema,
    searchFields: ['title', 'note'],
    statuses: calendarStatuses,
    defaults: {
      title: '',
      date: '',
      endDate: '',
      type: 'academic',
      note: '',
      provisional: true,
      status: 'draft',
    },
    sort: (a, b) => String(a.date).localeCompare(String(b.date)),
    hardDelete: true,
  },
  results: {
    collection: 'results',
    label: 'ফলাফল',
    schema: resultSchema,
    searchFields: ['roll', 'registration', 'studentName'],
    statuses: resultStatuses,
    defaults: {
      examinationId: '',
      roll: '',
      registration: '',
      studentName: '',
      gpa: null,
      outcome: 'pass',
      subjects: [],
      status: 'draft',
      publishedAt: '',
      studentId: '',
    },
    sort: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
    hardDelete: true,
    references: [],
  },
}

export function gradeForMarks(marks) {
  const value = Number(marks)
  if (!Number.isFinite(value)) return ''
  if (value >= 80) return 'A+'
  if (value >= 70) return 'A'
  if (value >= 60) return 'A-'
  if (value >= 50) return 'B'
  if (value >= 40) return 'C'
  if (value >= 33) return 'D'
  return 'F'
}

export function normalizeResult(input) {
  const subjects = (input.subjects || []).map((subject) => ({
    name: subject.name,
    marks: Number(subject.marks),
    grade: gradeForMarks(subject.marks),
  }))
  return { ...input, subjects }
}
