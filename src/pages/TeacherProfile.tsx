import { useParams } from 'react-router-dom'
import { ArrowLeft, BriefcaseBusiness, GraduationCap, Mail, UserRound } from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Teacher } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { ErrorState, LoadingBlock, PendingBadge } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/Navigation'
import { ButtonLink } from '../components/ui/Button'

export default function TeacherProfile() {
  const { id } = useParams()
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<{ teacher: Teacher }>(id ? `/api/public/teachers/${id}` : null)
  const teacher = data?.teacher

  usePageMeta({
    title: teacher ? teacher.name : t('teachers.profile'),
    description: teacher
      ? `${teacher.name} — ${teacher.designation || ''}, ${teacher.department || ''}. কোলা আদর্শ ডিগ্রি কলেজ।`
      : t('teachers.pending'),
    noindex: Boolean(error),
  })

  if (loading) {
    return (
      <div className="container-page py-12">
        <LoadingBlock />
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div className="container-page py-12">
        <ErrorState message={error || t('teachers.notFound')} onRetry={reload} />
        <div className="mt-4 text-center">
          <ButtonLink to="/teachers" variant="outline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('nav.teachers')}
          </ButtonLink>
        </div>
      </div>
    )
  }

  const isBn = lang === 'bn'
  const categoryLabel = t(`teachers.category.${teacher.category}`)
  const employmentLabel = t(`teachers.employment.${teacher.employmentType}`)

  return (
    <div>
      <PageHeader
        eyebrow={categoryLabel}
        title={teacher.name}
        description={`${teacher.designation || t('common.notAvailable')} · ${teacher.department || t('common.notAvailable')}`}
        breadcrumbs={[
          { label: t('nav.teachers'), to: '/teachers' },
          { label: teacher.name },
        ]}
      />

      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-pine-50 text-3xl font-extrabold text-pine-800 dark:bg-pine-950 dark:text-pine-200">
                {teacher.name.trim().charAt(0) || <UserRound className="h-8 w-8" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold">{teacher.name}</h2>
                <p className="mt-1 text-sm font-semibold text-pine-700 dark:text-pine-300">{teacher.designation}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{teacher.department}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {categoryLabel}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {employmentLabel}
                  </span>
                  <PendingBadge />
                </div>
              </div>
            </div>

            {teacher.bio ? (
              <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
                <h3 className="text-sm font-extrabold">{isBn ? 'পরিচিতি' : 'Biography'}</h3>
                <p className="prose-bn mt-2 text-sm">{teacher.bio}</p>
              </div>
            ) : null}

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              {t('teachers.pending')} {t('footer.verification')}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="text-base font-extrabold">{t('teachers.profile')}</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex gap-2.5">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                  <div>
                    <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('teachers.qualification')}</dt>
                    <dd className="mt-0.5 leading-6">{teacher.qualification || t('common.notAvailable')}</dd>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                  <div>
                    <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('teachers.employment')}</dt>
                    <dd className="mt-0.5 leading-6">{employmentLabel}</dd>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                  <div>
                    <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('teachers.email')}</dt>
                    <dd className="mt-0.5 break-all leading-6">
                      {teacher.email ? (
                        <a href={`mailto:${teacher.email}`} className="link-underline">{teacher.email}</a>
                      ) : (
                        t('common.notAvailable')
                      )}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('teachers.officeHours')}</dt>
                  <dd className="mt-0.5 leading-6">{teacher.officeHours || t('common.notAvailable')}</dd>
                </div>
              </dl>
            </div>

            <ButtonLink to="/teachers" variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('nav.teachers')}
            </ButtonLink>
          </aside>
        </div>
      </div>
    </div>
  )
}
