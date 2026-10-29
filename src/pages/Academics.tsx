import { BookOpen, CalendarDays, ClipboardList, Download, FileText, LibraryBig } from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { AcademicsPayload } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { DemoBadge, EmptyState, ErrorState, LoadingBlock, PendingBadge, StatusBadge } from '../components/ui/Feedback'
import { PageHeader, SectionHeading } from '../components/ui/Navigation'
import { ButtonLink } from '../components/ui/Button'
import { dayLabels, formatDate, formatBytes } from '../lib/format'

const calendarTypeLabels: Record<string, { bn: string; en: string }> = {
  admission: { bn: 'ভর্তি', en: 'Admission' },
  academic: { bn: 'একাডেমিক', en: 'Academic' },
  examination: { bn: 'পরীক্ষা', en: 'Examination' },
  holiday: { bn: 'ছুটি', en: 'Holiday' },
  result: { bn: 'ফলাফল', en: 'Result' },
  other: { bn: 'অন্যান্য', en: 'Other' },
}

const calendarTones: Record<string, string> = {
  admission: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100',
  academic: 'border-pine-200 bg-pine-50 text-pine-900 dark:border-pine-900 dark:bg-pine-950/30 dark:text-pine-100',
  examination: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100',
  holiday: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100',
  result: 'border-purple-200 bg-purple-50 text-purple-950 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-100',
  other: 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100',
}

export default function Academics() {
  usePageMeta({
    title: 'একাডেমিক তথ্য',
    description: 'কোলা আদর্শ ডিগ্রি কলেজের শিক্ষাবর্ষ, প্রোগ্রাম, বিষয়, একাডেমিক ক্যালেন্ডার, রুটিন, পরীক্ষা ও ডকুমেন্ট।',
  })
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<AcademicsPayload>('/api/public/academics')
  const isBn = lang === 'bn'

  if (loading && !data) {
    return (
      <div className="container-page py-12">
        <LoadingBlock />
      </div>
    )
  }
  if (error && !data) {
    return (
      <div className="container-page py-12">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }
  if (!data) return null

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.academics')}
        title={t('academics.title')}
        description={isBn ? 'শিক্ষাবর্ষ, প্রোগ্রাম, বিষয়, সময়সূচি ও ডাউনলোডযোগ্য ডকুমেন্ট।' : 'Sessions, programmes, subjects, schedules and downloadable documents.'}
        breadcrumbs={[{ label: t('academics.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="card p-6 sm:p-8" aria-labelledby="academic-programs">
            <SectionHeading title={t('academics.levels')} className="mb-4" />
            {data.programs.length ? (
              <div className="space-y-4">
                {data.programs.map((program) => {
                  const programSubjects = data.subjects.filter((subject) => subject.programId === program.id)
                  return (
                    <article key={program.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-extrabold">{isBn ? program.nameBn : program.nameEn || program.nameBn}</h3>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{program.level}</p>
                        </div>
                        {program.verified ? <StatusBadge status="active" /> : <PendingBadge />}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(program.groups || []).map((group) => (
                          <span key={group} className="rounded-full border border-slate-200 px-2.5 py-1 text-[0.68rem] font-medium dark:border-slate-700">
                            {group}
                          </span>
                        ))}
                      </div>
                      {programSubjects.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {programSubjects.map((subject) => (
                            <span key={subject.id} className="rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {isBn ? subject.nameBn : subject.nameEn || subject.nameBn}
                              {subject.code ? ` · ${subject.code}` : ''}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            ) : (
              <EmptyState compact title={t('academics.emptySubjects')} />
            )}
          </section>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-base font-extrabold">
                <CalendarDays className="h-4.5 w-4.5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {t('results.session')}
              </h2>
              <ul className="mt-3 space-y-3">
                {data.sessions.map((session) => (
                  <li key={session.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <p className="text-sm font-bold">{session.name}</p>
                    <p className="mt-0.5 text-[0.68rem] text-slate-500 dark:text-slate-400">
                      {formatDate(session.startDate, lang)} — {formatDate(session.endDate, lang)}
                    </p>
                    <div className="mt-1.5"><StatusBadge status={session.status} /></div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-navy-950 p-5 text-white">
              <LibraryBig className="h-6 w-6 text-pine-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-white">{t('academics.resources')}</p>
              <p className="mt-1 text-xs leading-6 text-slate-300">
                {isBn ? 'প্রকাশিত সিলেবাস ও অফিসিয়াল ফাইল এই পেজ থেকে ডাউনলোড করুন।' : 'Download published syllabus and official files from this page.'}
              </p>
              <a href="#documents" className="mt-3 inline-flex text-xs font-bold text-pine-300 hover:underline">
                {t('academics.resources')} →
              </a>
            </div>
          </aside>
        </div>

        <section id="calendar" className="mt-10 scroll-mt-24" aria-labelledby="calendar-heading">
          <SectionHeading
            title={t('academics.calendar')}
            description={isBn ? 'অস্থায়ী হিসেবে চিহ্নিত তারিখগুলো কর্তৃপক্ষের অনুমোদনের অপেক্ষায়।' : 'Dates marked provisional are awaiting authority approval.'}
          />
          {data.calendar.length ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.calendar.map((item) => (
                <article key={item.id} className={`rounded-xl border p-4 ${calendarTones[item.type] || calendarTones.other}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-70">
                      {calendarTypeLabels[item.type]?.[lang] || item.type}
                    </p>
                    <div className="flex gap-1">
                      {item.provisional ? <PendingBadge /> : null}
                      {item.isDemo ? <DemoBadge /> : null}
                    </div>
                  </div>
                  <h3 className="mt-2 text-sm font-extrabold leading-6">{item.title}</h3>
                  <p className="mt-1 text-xs font-semibold opacity-80">{formatDate(item.date, lang)}</p>
                  {item.endDate ? <p className="text-[0.68rem] opacity-70">— {formatDate(item.endDate, lang)}</p> : null}
                  {item.note ? <p className="mt-2 text-xs leading-6 opacity-80">{item.note}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={t('academics.emptyCalendar')} />
          )}
        </section>

        <section id="routines" className="mt-10 scroll-mt-24" aria-labelledby="routines-heading">
          <SectionHeading title={t('academics.routines')} />
          {data.routines.length ? (
            <div className="card overflow-x-auto">
              <table className="table-base min-w-[48rem]">
                <thead>
                  <tr>
                    <th scope="col">{t('common.date')}</th>
                    <th scope="col">{t('common.time')}</th>
                    <th scope="col">{t('results.program')}</th>
                    <th scope="col">{t('dashboard.group')}</th>
                    <th scope="col">বিষয়</th>
                    <th scope="col">{t('teachers.designation')}</th>
                    <th scope="col">{t('common.venue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.routines.map((routine) => (
                    <tr key={routine.id}>
                      <td className="font-semibold">{dayLabels[routine.day]?.[lang] || routine.day}</td>
                      <td className="font-latin">{routine.startTime}–{routine.endTime}</td>
                      <td>{routine.programName}</td>
                      <td>{routine.group || '—'}</td>
                      <td>{routine.subject}</td>
                      <td>{routine.teacherName || '—'}</td>
                      <td>{routine.room || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title={t('academics.emptyRoutines')} />
          )}
        </section>

        <section id="exams" className="mt-10 scroll-mt-24" aria-labelledby="exams-heading">
          <SectionHeading title={t('academics.exams')} />
          {data.examinations.length ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.examinations.map((exam) => (
                <article key={exam.id} className="card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <ClipboardList className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    <StatusBadge status={exam.status} />
                  </div>
                  <h3 className="mt-2 text-base font-extrabold">{exam.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{exam.programName} · {exam.sessionName}</p>
                  <p className="mt-2 text-xs font-semibold">{formatDate(exam.startDate, lang)} — {formatDate(exam.endDate, lang)}</p>
                  <ButtonLink to="/results" variant="outline" size="sm" className="mt-3 w-full">
                    {t('nav.results')}
                  </ButtonLink>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={t('academics.emptyExams')} />
          )}
        </section>

        <section id="documents" className="mt-10 scroll-mt-24" aria-labelledby="documents-heading">
          <SectionHeading title={t('academics.resources')} />
          {data.documents.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.documents.map((doc) => (
                <article key={doc.id} className="card flex items-start gap-3 p-4">
                  <span className="rounded-lg bg-pine-50 p-2 text-pine-700 dark:bg-pine-950 dark:text-pine-300">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-6">{doc.title}</h3>
                    <p className="mt-0.5 text-[0.68rem] text-slate-500 dark:text-slate-400">
                      {doc.category} · {formatBytes(doc.size, lang)} · {formatDate(doc.uploadedAt, lang)}
                    </p>
                    <a
                      href={`/api/public/documents/${doc.id}/download`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-pine-700 hover:underline dark:text-pine-300"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('action.download')}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title={t('academics.emptyDocuments')} />
          )}
        </section>

        <section className="mt-10 card p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="section-eyebrow">{t('nav.admission')}</p>
              <h2 className="mt-1 text-xl font-extrabold">{t('academics.admission')}</h2>
              <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-400">{t('admission.verifyNote')}</p>
            </div>
            <ButtonLink to="/admission" variant="secondary" size="sm">{t('nav.admission')}</ButtonLink>
          </div>
        </section>

        <p className="mt-3 text-center text-[0.68rem] text-slate-400">
          <BookOpen className="mr-1 inline h-3 w-3" aria-hidden="true" />
          {isBn ? 'সব ডকুমেন্ট অনুমোদিত ব্যবহারকারীর মাধ্যমে নিয়ন্ত্রিতভাবে পরিবেশন করা হয়।' : 'All documents are served in a controlled manner through authorised access.'}
        </p>
      </div>
    </div>
  )
}
