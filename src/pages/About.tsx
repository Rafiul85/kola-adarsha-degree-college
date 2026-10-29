import {
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Target,
  Telescope,
  Users,
} from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Meta, Settings } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { Alert, EmptyState, ErrorState, LoadingBlock, PendingBadge } from '../components/ui/Feedback'
import { PageHeader, SectionHeading } from '../components/ui/Navigation'
import { ButtonLink } from '../components/ui/Button'
import { formatDate } from '../lib/format'

export default function About() {
  usePageMeta({
    title: 'কলেজ সম্পর্কে',
    description: 'কোলা আদর্শ ডিগ্রি কলেজের প্রতিষ্ঠান পরিচিতি, ইতিহাস, মিশন, সুবিধা ও যাচাইকৃত তথ্য।',
  })
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<{ settings: Settings; meta: Meta }>('/api/public/settings')

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

  const { settings, meta } = data
  const institution = settings.institution
  const content = settings.content
  const isBn = lang === 'bn'
  const address = isBn ? institution.addressBn : institution.addressEn
  const type = isBn ? institution.typeBn : institution.typeEn
  const intro = isBn ? content.aboutIntroBn : content.aboutIntroEn
  const history = isBn ? content.historyBn : content.historyEn
  const mission = isBn ? content.missionBn : content.missionEn
  const vision = isBn ? content.visionBn : content.visionEn
  const principalName = isBn ? content.principalNameBn : content.principalNameEn
  const principalDesignation = isBn ? content.principalDesignationBn : content.principalDesignationEn
  const principalMessage = isBn ? content.principalMessageBn : content.principalMessageEn
  const officeHours = isBn ? institution.officeHoursBn : institution.officeHoursEn

  return (
    <div>
      <PageHeader
        eyebrow={t('about.title')}
        title={institution.nameBn}
        description={isBn ? 'প্রতিষ্ঠান পরিচিতি, ইতিহাস, লক্ষ্য এবং যাচাইকৃত তথ্য।' : 'Institutional introduction, history, objectives and verified information.'}
        breadcrumbs={[{ label: t('about.title') }]}
        actions={
          <ButtonLink to="/contact" variant="secondary" size="sm">
            {t('nav.contact')}
          </ButtonLink>
        }
      />

      <div className="container-page py-10 sm:py-12">
        <Alert kind="warning" title={t('home.verificationTitle')}>
          {meta.demoContentNotice} {t('home.verificationBody')}
        </Alert>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <section className="card p-6 sm:p-8" aria-labelledby="about-intro">
              <p className="section-eyebrow">{t('about.intro')}</p>
              <h2 id="about-intro" className="mt-1.5 text-2xl font-extrabold">
                {institution.nameBn}
              </h2>
              <p className="font-latin mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {institution.nameEn}
              </p>
              <p className="prose-bn mt-4">{intro}</p>
            </section>

            <section className="card p-6 sm:p-8" aria-labelledby="about-history">
              <SectionHeading title={t('about.history')} className="mb-4" />
              <p className="prose-bn">{history}</p>
              <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {t('about.established')}: {formatDate(institution.establishedDate, lang)}
                {!institution.establishedVerified ? <PendingBadge /> : <BadgeCheck className="h-4 w-4" aria-hidden="true" />}
              </div>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section className="card p-6" aria-labelledby="about-mission">
                <span className="inline-flex rounded-xl bg-pine-50 p-2.5 text-pine-700 dark:bg-pine-950 dark:text-pine-300">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 id="about-mission" className="mt-3 text-xl font-extrabold">
                  {t('about.mission')}
                </h2>
                <p className="prose-bn mt-3 text-sm">{mission}</p>
              </section>
              <section className="card p-6" aria-labelledby="about-vision">
                <span className="inline-flex rounded-xl bg-sky-50 p-2.5 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  <Telescope className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 id="about-vision" className="mt-3 text-xl font-extrabold">
                  {t('about.vision')}
                </h2>
                <p className="prose-bn mt-3 text-sm">{vision}</p>
              </section>
            </div>

            <section className="card p-6 sm:p-8" aria-labelledby="about-objectives">
              <SectionHeading title={t('about.objectives')} className="mb-4" />
              {content.objectives.length ? (
                <ol className="space-y-3">
                  {content.objectives.map((item, index) => (
                    <li key={`${item.bn}-${index}`} className="flex gap-3 text-sm leading-7">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine-100 text-xs font-extrabold text-pine-800 dark:bg-pine-950 dark:text-pine-200">
                        {new Intl.NumberFormat(isBn ? 'bn-BD' : 'en-GB').format(index + 1)}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{isBn ? item.bn : item.en}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState compact title={t('common.notAvailable')} />
              )}
            </section>

            <section className="card p-6 sm:p-8" aria-labelledby="about-principal">
              <SectionHeading title={t('about.principal')} className="mb-4" />
              <div className="grid gap-5 sm:grid-cols-[9rem_1fr]">
                <div className="flex h-36 w-full max-w-[9rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <Users className="h-8 w-8 text-slate-400" aria-hidden="true" />
                  <span className="mt-2 px-3 text-[0.68rem] leading-5 text-slate-500 dark:text-slate-400">
                    {t('common.pending')}
                  </span>
                </div>
                <div>
                  <p className="text-base font-extrabold">{principalName || t('common.notAvailable')}</p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {principalDesignation || t('common.pending')}
                  </p>
                  <p className="prose-bn mt-3 text-sm">{principalMessage}</p>
                  {!principalName ? (
                    <p className="mt-3 text-xs leading-6 text-amber-700 dark:text-amber-300">{t('about.principalPending')}</p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="card p-6 sm:p-8" aria-labelledby="about-facilities">
              <SectionHeading title={t('about.facilities')} className="mb-4" />
              <div className="grid gap-3 sm:grid-cols-2">
                {content.facilities.map((facility) => (
                  <div key={facility.id || facility.key || facility.nameBn} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold">{isBn ? facility.nameBn : facility.nameEn}</p>
                      {facility.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> : <PendingBadge />}
                    </div>
                    <p className="mt-1.5 text-xs leading-6 text-slate-500 dark:text-slate-400">
                      {isBn ? facility.detailBn : facility.detailEn}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-6 sm:p-8" aria-labelledby="about-achievements">
              <SectionHeading title={t('about.achievements')} className="mb-4" />
              {content.achievements.length ? (
                <div className="space-y-3">
                  {content.achievements.map((achievement) => (
                    <div key={achievement.id || achievement.titleBn} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">{isBn ? achievement.titleBn : achievement.titleEn}</p>
                        <span className="text-xs text-slate-500">{achievement.year}</span>
                        {!achievement.verified ? <PendingBadge /> : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {isBn ? achievement.detailBn : achievement.detailEn}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact title={t('about.noAchievements')} />
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-base font-extrabold">
                <Building2 className="h-4.5 w-4.5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {t('about.info')}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('about.name')}</dt>
                  <dd className="mt-0.5 font-semibold">{institution.nameBn}</dd>
                  <dd className="font-latin text-xs text-slate-500">{institution.nameEn}</dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">EIIN</dt>
                  <dd className="font-latin mt-0.5 font-bold text-navy-900 dark:text-white">{institution.eiin}</dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('about.type')}</dt>
                  <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 leading-6">
                    {type} <PendingBadge />
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('about.address')}</dt>
                  <dd className="mt-0.5 flex gap-1.5 leading-6">
                    <MapPin className="mt-1 h-3.5 w-3.5 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    {address}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('about.levels')}</dt>
                  <dd className="mt-1.5 space-y-1.5">
                    {institution.educationLevels.map((level) => (
                      <div key={level.nameBn} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-800/60">
                        <span>{isBn ? level.nameBn : level.nameEn}</span>
                        {level.verified ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <span className="text-amber-600 dark:text-amber-400">•</span>}
                      </div>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('about.groups')}</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {institution.groups.map((group) => (
                      <span key={group.nameBn} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs dark:border-slate-700">
                        {isBn ? group.nameBn : group.nameEn}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('about.affiliation')}</dt>
                  <dd className="mt-0.5 leading-6">{institution.affiliationBn}</dd>
                  <dd className="text-xs leading-5 text-slate-500">{institution.recognitionBn}</dd>
                </div>
              </dl>
            </div>

            <div className="card p-5">
              <h2 className="text-base font-extrabold">{t('about.contact')}</h2>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                  <span>{institution.phone || t('common.notAvailable')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                  <span className="break-all">{institution.email || t('common.notAvailable')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                  <span>{officeHours || t('common.notAvailable')}</span>
                </li>
              </ul>
              <ButtonLink to="/contact" variant="outline" size="sm" className="mt-4 w-full">
                {t('nav.contact')}
              </ButtonLink>
            </div>

            <div className="rounded-2xl bg-navy-950 p-5 text-white">
              <GraduationCap className="h-6 w-6 text-pine-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-bold text-white">{t('quick.admission')}</p>
              <p className="mt-1 text-xs leading-6 text-slate-300">{t('admission.verifyNote')}</p>
              <ButtonLink to="/admission" variant="secondary" size="sm" className="mt-3 w-full">
                {t('nav.admission')}
              </ButtonLink>
            </div>

            <div className="card p-5">
              <BookOpen className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold">{t('nav.academics')}</p>
              <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {isBn ? 'প্রোগ্রাম, সময়সূচি ও ডকুমেন্ট দেখুন।' : 'Explore programmes, schedules and documents.'}
              </p>
              <ButtonLink to="/academics" variant="ghost" size="sm" className="mt-2 px-0">
                {t('action.learnMore')}
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
