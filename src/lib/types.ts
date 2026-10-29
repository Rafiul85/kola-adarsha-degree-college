export type Role = 'admin' | 'teacher' | 'student'
export type Language = 'bn' | 'en'
export type Theme = 'light' | 'dark'

export interface User {
  id: string
  email: string
  displayName: string
  role: Role
  status: 'active' | 'inactive'
  linkedId: string
  mustChangePassword: boolean
  createdAt: string
  lastLoginAt: string
}

export interface NamedVerified {
  id?: string
  nameBn: string
  nameEn: string
  verified: boolean
}

export interface Institution {
  nameBn: string
  nameEn: string
  eiin: string
  establishedDate: string
  establishedVerified: boolean
  addressBn: string
  addressEn: string
  upazila: string
  district: string
  division: string
  postCode: string
  typeBn: string
  typeEn: string
  educationLevels: NamedVerified[]
  groups: NamedVerified[]
  affiliationBn: string
  recognitionBn: string
  phone: string
  email: string
  website: string
  officeHoursBn: string
  officeHoursEn: string
  mapVerified: boolean
}

export interface Objective {
  bn: string
  en: string
}

export interface Facility {
  id?: string
  key?: string
  nameBn: string
  nameEn: string
  detailBn: string
  detailEn: string
  verified: boolean
}

export interface Achievement {
  id?: string
  titleBn: string
  titleEn: string
  detailBn: string
  detailEn: string
  year: string
  verified: boolean
}

export interface ContentSettings {
  taglineBn: string
  taglineEn: string
  welcomeTitleBn: string
  welcomeTitleEn: string
  welcomeBn: string
  welcomeEn: string
  aboutIntroBn: string
  aboutIntroEn: string
  historyBn: string
  historyEn: string
  missionBn: string
  missionEn: string
  visionBn: string
  visionEn: string
  principalNameBn: string
  principalNameEn: string
  principalDesignationBn: string
  principalDesignationEn: string
  principalMessageBn: string
  principalMessageEn: string
  objectives: Objective[]
  facilities: Facility[]
  achievements: Achievement[]
}

export interface Faq {
  id?: string
  qBn: string
  aBn: string
  qEn: string
  aEn: string
}

export interface AdmissionSettings {
  introBn: string
  introEn: string
  eligibilityBn: string
  eligibilityEn: string
  documentsBn: string
  documentsEn: string
  stepsBn: string
  stepsEn: string
  feesBn: string
  feesEn: string
  deadlineBn: string
  applyUrl: string
  faqs: Faq[]
}

export interface Settings {
  institution: Institution
  content: ContentSettings
  admission: AdmissionSettings
  updatedAt: string
}

export interface Meta {
  demoContentNotice: string
}

export interface Notice {
  id: string
  title: string
  category: string
  summary: string
  body?: string
  publishedAt: string
  deadline: string
  pinned: boolean
  attachmentUrl: string
  audience: 'all' | 'student' | 'teacher'
  sessionId: string
  sessionName: string
  status: 'draft' | 'published' | 'archived'
  isDemo: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EventItem {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  venue: string
  registrationInfo: string
  status: 'draft' | 'published' | 'archived'
  isDemo: boolean
  isPast?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Teacher {
  id: string
  name: string
  designation: string
  department: string
  qualification: string
  employmentType: 'full_time' | 'part_time' | 'guest' | 'other'
  email: string
  officeHours: string
  bio?: string
  category: 'principal' | 'vice_principal' | 'lecturer' | 'administrative' | 'support'
  assignedSessions?: string[]
  status: 'active' | 'inactive' | 'archived'
  createdAt?: string
  updatedAt?: string
}

export interface Student {
  id: string
  name: string
  studentId: string
  roll: string
  registration: string
  sessionId: string
  programId: string
  group: string
  subjects: string[]
  guardianPhone: string
  phone: string
  dob: string
  address: string
  status: 'active' | 'inactive' | 'graduated' | 'archived'
  createdAt?: string
  updatedAt?: string
}

export interface AcademicSession {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'active' | 'inactive'
}

export interface Program {
  id: string
  nameBn: string
  nameEn: string
  level: 'HSC' | 'DEGREE' | 'OTHER'
  groups: string[]
  verified: boolean
  status: 'active' | 'inactive'
}

export interface Subject {
  id: string
  code: string
  nameBn: string
  nameEn: string
  programId: string
  group: string
  status: 'active' | 'inactive'
}

export interface Routine {
  id: string
  sessionId: string
  programId: string
  group: string
  day: string
  startTime: string
  endTime: string
  subject: string
  room: string
  teacherId: string
  teacherName?: string
  sessionName?: string
  programName?: string
  status: 'draft' | 'published'
}

export interface Examination {
  id: string
  name: string
  sessionId: string
  programId: string
  startDate: string
  endDate: string
  status: 'draft' | 'published' | 'archived'
  sessionName?: string
  programName?: string
}

export interface ResultSubject {
  name: string
  marks: number
  grade: string
}

export interface ResultRecord {
  id: string
  examinationId: string
  roll: string
  registration: string
  studentName: string
  gpa: number | null
  outcome: 'pass' | 'fail' | 'withheld' | 'absent'
  subjects: ResultSubject[]
  status: 'draft' | 'review' | 'published' | 'archived'
  publishedAt: string
  studentId: string
  source?: string
  createdAt?: string
  updatedAt?: string
  examination?: Examination | null
}

export interface CalendarItem {
  id: string
  title: string
  date: string
  endDate: string
  type: 'admission' | 'academic' | 'examination' | 'holiday' | 'result' | 'other'
  note: string
  provisional: boolean
  status: 'draft' | 'published'
  isDemo: boolean
}

export interface DocumentItem {
  id: string
  title: string
  category: string
  filename: string
  mimeType: string
  size: number
  uploadedAt: string
  status: 'draft' | 'published' | 'archived'
  isDemo: boolean
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: 'new' | 'read' | 'archived'
  ip: string
  createdAt: string
}

export interface AuditLog {
  id: string
  actorId: string
  actorName: string
  actorRole: string
  action: string
  entity: string
  entityId: string
  details: string
  createdAt: string
}

export interface AdminUser extends User {
  linkedName: string
  updatedAt: string
}

export interface HomePayload {
  settings: Settings
  meta: Meta
  notices: Notice[]
  events: EventItem[]
  counts: { activeTeachers: number; publishedNotices: number }
}

export interface StudentsPagePayload {
  settings: Settings
  meta: Meta
}

export interface AcademicsPayload {
  sessions: AcademicSession[]
  programs: Program[]
  subjects: Subject[]
  calendar: CalendarItem[]
  routines: Routine[]
  examinations: Examination[]
  documents: DocumentItem[]
  updatedAt: string
}

export interface ResultMeta {
  examinations: Examination[]
  sessions: AcademicSession[]
  programs: Program[]
  latestPublishedAt: string
  totalPublishedResults: number
}

export interface PublicResult {
  id: string
  studentName: string
  roll: string
  registration: string
  gpa: number | null
  outcome: 'pass' | 'fail' | 'withheld' | 'absent'
  subjects: ResultSubject[]
  publishedAt: string
  sessionName: string
  programName: string
  group: string
  examination: Examination
  generatedAt: string
  unofficial: boolean
}

export interface StudentDashboard {
  profile: {
    id: string
    name: string
    studentId: string
    roll: string
    registration: string
    sessionId: string
    sessionName: string
    programId: string
    programName: string
    group: string
    subjects: string[]
    status: string
    phone: string
    guardianPhone: string
    dob: string
    address: string
    email: string
  }
  notices: Notice[]
  results: ResultRecord[]
  exams: Examination[]
  routines: Routine[]
  documents: DocumentItem[]
  calendar: CalendarItem[]
}

export interface TeacherDashboard {
  profile: {
    id: string
    name: string
    designation: string
    department: string
    qualification: string
    employmentType: string
    email: string
    officeHours: string
    bio: string
    category: string
    assignedSessions: { id: string; name: string }[]
  }
  notices: Notice[]
  routines: Routine[]
  students: {
    name: string
    studentId: string
    roll: string
    sessionId: string
    sessionName: string
    programName: string
    group: string
  }[]
  exams: Examination[]
  documents: DocumentItem[]
}

export interface AdminDashboard {
  stats: {
    teachers: { active: number; total: number }
    students: { active: number; total: number }
    notices: { published: number; draft: number }
    events: { upcoming: number }
    results: { published: number; draft: number }
    documents: number
    messages: { new: number }
    users: { total: number; admins: number }
    demo: { notices: number; events: number; calendar: number }
    backups: number
  }
  recentAudit: AuditLog[]
  upcomingEvents: EventItem[]
  recentMessages: { id: string; name: string; subject: string; status: string; createdAt: string }[]
}

export interface ImportRow {
  row: number
  data: Record<string, unknown>
  errors: string[]
  duplicate: boolean
  existingId: string | null
}

export interface ImportPreview {
  examination: Examination
  rows: ImportRow[]
  validCount: number
  duplicateCount: number
  errorCount: number
}

export interface BackupItem {
  file: string
  size: number
  createdAt: string
}

export interface AdminList<T> {
  items: T[]
  total: number
  statuses: string[]
  label: string
}
