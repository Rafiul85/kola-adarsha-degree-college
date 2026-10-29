import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardList,
  Database,
  Download,
  FileText,
  GraduationCap,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { api, useApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../context/ToastContext'
import { usePageMeta } from '../../components/SEO'
import type { AdminDashboard, StudentDashboard, TeacherDashboard } from '../../lib/types'
import { Alert, Badge, DemoBadge, EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/ui/Feedback'
import { Button, ButtonLink } from '../../components/ui/Button'
import { formatDate, formatDateTime, formatNumber } from '../../lib/format'

function StatCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon: React.ReactNode }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-pine-700 dark:bg-pine-950 dark:text-pine-300">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold leading-tight">{value}</p>
        {hint ? <p className="mt-0.5 text-[0.68rem] text-slate-500 dark:text-slate-400">{hint}</p> : null}
      </div>
    </div>
  )
}

function AdminHome() {
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const { data, loading, error, reload } = useApi<AdminDashboard>('/api/dashboard/admin')
  const [busy, setBusy] = useState('')

  async function removeDemo() {
    if (!window.confirm(t('dashboard.removeDemo') + '?')) return
    setBusy('demo')
    try {
      await api('/api/admin/demo-content', { method: 'DELETE' })
      toast(t('dashboard.demoRemoved'))
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy('')
    }
  }

  async function createBackup() {
    setBusy('backup')
    try {
      await api('/api/admin/backups', { method: 'POST' })
      toast(lang === 'bn' ? 'ব্যাকআপ তৈরি হয়েছে।' : 'Backup created.')
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy('')
    }
  }

  if (loading && !data) return <LoadingBlock />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  const { stats } = data
  const demoTotal = stats.demo.notices + stats.demo.events + stats.demo.calendar

  const actions = [
    { to: '/dashboard/notices', label: t('dashboard.newNotice'), icon: Bell },
    { to: '/dashboard/events', label: t('dashboard.newEvent'), icon: CalendarDays },
    { to: '/dashboard/teachers', label: t('dashboard.newTeacher'), icon: Users },
    { to: '/dashboard/students', label: t('dashboard.newStudent'), icon: GraduationCap },
    { to: '/dashboard/results', label: t('dashboard.importResults'), icon: ClipboardList },
    { to: '/dashboard/settings', label: t('dashboard.settings'), icon: ShieldCheck },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-eyebrow">{t('dashboard.admin')}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t('dashboard.overview')}</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('common.updated')}: {formatDateTime(new Date().toISOString(), lang)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboard.teachers')} value={formatNumber(stats.teachers.total, lang)} hint={`${t('status.active')}: ${formatNumber(stats.teachers.active, lang)}`} icon={<Users className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label={t('dashboard.students')} value={formatNumber(stats.students.total, lang)} hint={`${t('status.active')}: ${formatNumber(stats.students.active, lang)}`} icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label={t('dashboard.notices')} value={formatNumber(stats.notices.published, lang)} hint={`${t('status.draft')}: ${formatNumber(stats.notices.draft, lang)}`} icon={<Bell className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label={t('dashboard.results')} value={formatNumber(stats.results.published, lang)} hint={`${t('status.draft')}: ${formatNumber(stats.results.draft, lang)}`} icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label={t('dashboard.documents')} value={formatNumber(stats.documents, lang)} icon={<FileText className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label={t('dashboard.messagesNew')} value={formatNumber(stats.messages.new, lang)} icon={<Mail className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label={t('dashboard.users')} value={formatNumber(stats.users.total, lang)} hint={`${t('role.admin')}: ${formatNumber(stats.users.admins, lang)}`} icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />} />
        <StatCard label={t('dashboard.backups')} value={formatNumber(stats.backups, lang)} icon={<Database className="h-5 w-5" aria-hidden="true" />} />
      </div>

      {demoTotal > 0 ? (
        <Alert kind="warning" title={t('dashboard.demoContent')}>
          <p>{t('dashboard.demoWarning')}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="amber">{lang === 'bn' ? `নোটিশ ${stats.demo.notices}` : `Notices ${stats.demo.notices}`}</Badge>
            <Badge tone="amber">{lang === 'bn' ? `ইভেন্ট ${stats.demo.events}` : `Events ${stats.demo.events}`}</Badge>
            <Badge tone="amber">{lang === 'bn' ? `ক্যালেন্ডার ${stats.demo.calendar}` : `Calendar ${stats.demo.calendar}`}</Badge>
            <Button variant="outline" size="sm" onClick={removeDemo} loading={busy === 'demo'}>
              {t('dashboard.removeDemo')}
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold">{t('dashboard.quickActions')}</h2>
            <Button variant="outline" size="sm" onClick={createBackup} loading={busy === 'backup'}>
              <Database className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.createBackup')}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {actions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-semibold transition-colors hover:border-pine-300 hover:bg-pine-50/60 dark:border-slate-700 dark:hover:border-pine-700 dark:hover:bg-pine-950/30"
                >
                  <Icon className="h-4 w-4 text-pine-700 dark:text-pine-300" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                  <ArrowRight className="h-4 w-4 opacity-40" aria-hidden="true" />
                </Link>
              )
            })}
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold">{t('dashboard.upcomingEvents')}</h2>
            <Link to="/dashboard/events" className="text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">{t('action.viewAll')}</Link>
          </div>
          {data.upcomingEvents.length ? (
            <ul className="space-y-2">
              {data.upcomingEvents.map((event) => (
                <li key={event.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{event.title}</p>
                    {event.isDemo ? <DemoBadge /> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(event.startDate, lang)} {event.startTime ? `· ${event.startTime}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact title={t('common.noData')} />
          )}
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-extrabold">{t('dashboard.recentActivity')}</h2>
            <Link to="/dashboard/audit" className="text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">{t('action.viewAll')}</Link>
          </div>
          {data.recentAudit.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentAudit.map((entry) => (
                <li key={entry.id} className="px-5 py-3">
                  <p className="text-sm font-semibold">{entry.actorName} <span className="font-normal text-slate-500">{entry.action}</span></p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{entry.details || entry.entity}</p>
                  <p className="mt-0.5 text-[0.65rem] text-slate-400">{formatDateTime(entry.createdAt, lang)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5"><EmptyState compact title={t('common.noData')} /></div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-extrabold">{t('dashboard.messagesNew')}</h2>
            <Link to="/dashboard/messages" className="text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">{t('action.viewAll')}</Link>
          </div>
          {data.recentMessages.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentMessages.map((message) => (
                <li key={message.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{message.subject}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{message.name} · {formatDate(message.createdAt, lang)}</p>
                  </div>
                  <StatusBadge status={message.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5"><EmptyState compact title={t('dashboard.noMessages')} /></div>
          )}
        </section>
      </div>
    </div>
  )
}

function TeacherHome() {
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<TeacherDashboard>('/api/dashboard/teacher')

  if (loading && !data) return <LoadingBlock />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  return (
    <div className="space-y-6">
      <div>
        <p className="section-eyebrow">{t('dashboard.teacher')}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t('dashboard.welcome')}, {data.profile.name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {data.profile.designation} {data.profile.department ? `· ${data.profile.department}` : ''}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <section className="card p-5">
          <h2 className="text-base font-extrabold">{t('dashboard.profile')}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-xs text-slate-500">{t('dashboard.email')}</dt><dd className="font-semibold">{data.profile.email || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">{t('dashboard.qualification') || 'যোগ্যতা'}</dt><dd>{data.profile.qualification || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">{t('dashboard.assignedSessions')}</dt><dd>{data.profile.assignedSessions.length ? data.profile.assignedSessions.map((session) => session.name).join(', ') : '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">{t('common.officeHours') || 'অফিস সময়'}</dt><dd>{data.profile.officeHours || '—'}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink to="/dashboard/account" variant="outline" size="sm">{t('dashboard.account')}</ButtonLink>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-extrabold">{t('dashboard.teacherStudents')}</h2>
            <Badge tone="green">{formatNumber(data.students.length, lang)}</Badge>
          </div>
          {data.students.length ? (
            <div className="overflow-x-auto">
              <table className="table-base min-w-[34rem]">
                <thead>
                  <tr>
                    <th scope="col">{t('dashboard.profile')}</th>
                    <th scope="col">{t('dashboard.studentId')}</th>
                    <th scope="col">{t('dashboard.roll') || 'রোল'}</th>
                    <th scope="col">{t('dashboard.session')}</th>
                    <th scope="col">{t('dashboard.program')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((student) => (
                    <tr key={`${student.studentId}-${student.roll}`}>
                      <td className="font-semibold">{student.name}</td>
                      <td>{student.studentId}</td>
                      <td>{student.roll}</td>
                      <td>{student.sessionName || '—'}</td>
                      <td>{student.programName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5"><EmptyState compact title={t('dashboard.noAssignedStudents')} /></div>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-base font-extrabold">{t('dashboard.classRoutine')}</h2>
          {data.routines.length ? (
            <ul className="mt-3 space-y-2">
              {data.routines.map((routine) => (
                <li key={routine.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <p className="font-semibold">{routine.subject}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{routine.day} · {routine.startTime}–{routine.endTime} {routine.room ? `· ${routine.room}` : ''}</p>
                </li>
              ))}
            </ul>
          ) : <div className="mt-3"><EmptyState compact title={t('dashboard.noRoutine')} /></div>}
        </section>

        <section className="card p-5">
          <h2 className="text-base font-extrabold">{t('dashboard.studentNotices')}</h2>
          {data.notices.length ? (
            <ul className="mt-3 space-y-2">
              {data.notices.map((notice) => (
                <li key={notice.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{notice.title}</p>
                    {notice.isDemo ? <DemoBadge /> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(notice.publishedAt, lang)}</p>
                </li>
              ))}
            </ul>
          ) : <div className="mt-3"><EmptyState compact title={t('common.noData')} /></div>}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('dashboard.examSchedule')}</h2>
        {data.exams.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.exams.map((exam) => (
              <li key={exam.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="font-semibold">{exam.name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(exam.startDate, lang)} – {formatDate(exam.endDate, lang)}</p>
              </li>
            ))}
          </ul>
        ) : <div className="mt-3"><EmptyState compact title={t('common.noData')} /></div>}
      </section>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('dashboard.documentsShort')}</h2>
        {data.documents.length ? (
          <ul className="mt-3 space-y-2">
            {data.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.category} · {formatDate(doc.uploadedAt, lang)}</p>
                </div>
                <a href={`/api/public/documents/${doc.id}/download`} className="inline-flex items-center gap-1 text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />{t('action.download')}
                </a>
              </li>
            ))}
          </ul>
        ) : <div className="mt-3"><EmptyState compact title={t('dashboard.noDocuments')} /></div>}
      </section>
    </div>
  )
}

function StudentHome() {
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<StudentDashboard>('/api/dashboard/student')

  if (loading && !data) return <LoadingBlock />
  if (error && !data) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  return (
    <div className="space-y-6">
      <div>
        <p className="section-eyebrow">{t('dashboard.student')}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t('dashboard.welcome')}, {data.profile.name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {data.profile.programName || ''} {data.profile.sessionName ? `· ${data.profile.sessionName}` : ''}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <section className="card p-5">
          <h2 className="text-base font-extrabold">{t('dashboard.profile')}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-xs text-slate-500">{t('dashboard.studentId')}</dt><dd className="font-latin font-semibold">{data.profile.studentId}</dd></div>
            <div><dt className="text-xs text-slate-500">{t('dashboard.roll') || 'রোল'}</dt><dd className="font-latin">{data.profile.roll}</dd></div>
            <div><dt className="text-xs text-slate-500">{t('dashboard.registration')}</dt><dd className="font-latin">{data.profile.registration || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">{t('dashboard.group')}</dt><dd>{data.profile.group || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">{t('dashboard.session')}</dt><dd>{data.profile.sessionName || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">{t('dashboard.email')}</dt><dd className="break-all">{data.profile.email}</dd></div>
          </dl>
          <div className="mt-4"><ButtonLink to="/dashboard/account" variant="outline" size="sm">{t('dashboard.account')}</ButtonLink></div>
        </section>

        <section className="card p-5">
          <h2 className="text-base font-extrabold">{t('dashboard.subjectList')}</h2>
          {data.profile.subjects.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {data.profile.subjects.map((subject) => <Badge key={subject} tone="navy">{subject}</Badge>)}
            </div>
          ) : <p className="mt-2 text-sm text-slate-500">{t('common.notAvailable')}</p>}

          <h3 className="mt-6 text-base font-extrabold">{t('dashboard.studentResults')}</h3>
          {data.results.length ? (
            <div className="mt-3 space-y-3">
              {data.results.map((result) => (
                <div key={result.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">{result.examination?.name || result.examinationId}</p>
                    <div className="flex items-center gap-2">
                      <Badge tone="green">GPA {result.gpa === null ? '—' : result.gpa}</Badge>
                      <StatusBadge status={result.outcome} />
                    </div>
                  </div>
                  {result.subjects.length ? (
                    <div className="mt-2 overflow-x-auto">
                      <table className="table-base min-w-[20rem]">
                        <thead><tr><th scope="col">{t('dashboard.subjectList')}</th><th scope="col" className="text-right">নম্বর</th><th scope="col" className="text-right">গ্রেড</th></tr></thead>
                        <tbody>
                          {result.subjects.map((subject, index) => (
                            <tr key={`${subject.name}-${index}`}>
                              <td>{subject.name}</td>
                              <td className="text-right">{subject.marks}</td>
                              <td className="text-right font-bold">{subject.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <div className="mt-3"><EmptyState compact title={t('dashboard.noResults')} /></div>}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-base font-extrabold">{t('dashboard.studentNotices')}</h2>
          {data.notices.length ? (
            <ul className="mt-3 space-y-2">
              {data.notices.map((notice) => (
                <li key={notice.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{notice.title}</p>
                    {notice.isDemo ? <DemoBadge /> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(notice.publishedAt, lang)}</p>
                </li>
              ))}
            </ul>
          ) : <div className="mt-3"><EmptyState compact title={t('common.noData')} /></div>}
        </section>

        <section className="card p-5">
          <h2 className="text-base font-extrabold">{t('dashboard.classRoutine')}</h2>
          {data.routines.length ? (
            <ul className="mt-3 space-y-2">
              {data.routines.map((routine) => (
                <li key={routine.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <p className="font-semibold">{routine.subject}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{routine.day} · {routine.startTime}–{routine.endTime} {routine.room ? `· ${routine.room}` : ''}</p>
                </li>
              ))}
            </ul>
          ) : <div className="mt-3"><EmptyState compact title={t('dashboard.noRoutine')} /></div>}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('dashboard.examSchedule')}</h2>
        {data.exams.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.exams.map((exam) => (
              <li key={exam.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="font-semibold">{exam.name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(exam.startDate, lang)} – {formatDate(exam.endDate, lang)}</p>
              </li>
            ))}
          </ul>
        ) : <div className="mt-3"><EmptyState compact title={t('common.noData')} /></div>}
      </section>

      <section className="card p-5">
        <h2 className="text-base font-extrabold">{t('dashboard.documentsShort')}</h2>
        {data.documents.length ? (
          <ul className="mt-3 space-y-2">
            {data.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.category} · {formatDate(doc.uploadedAt, lang)}</p>
                </div>
                <a href={`/api/public/documents/${doc.id}/download`} className="inline-flex items-center gap-1 text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />{t('action.download')}
                </a>
              </li>
            ))}
          </ul>
        ) : <div className="mt-3"><EmptyState compact title={t('dashboard.noDocuments')} /></div>}
      </section>
    </div>
  )
}

export default function DashboardHome() {
  usePageMeta({ title: 'ড্যাশবোর্ড', noindex: true })
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'admin') return <AdminHome />
  if (user.role === 'teacher') return <TeacherHome />
  return <StudentHome />
}
