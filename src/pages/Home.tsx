import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CalendarClock,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  MapPin,
  Megaphone,
  Phone,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n, pickBilingual } from '../lib/i18n'
import { formatDate, formatDateShort } from '../lib/format'
import type { HomePayload } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { Alert, Badge, DemoBadge, EmptyState, ErrorState, PendingBadge, Skeleton } from '../components/ui/Feedback'
import { SectionHeading } from '../components/ui/Navigation'
import { ButtonLink } from '../components/ui/Button'

const quickAccess = [
  { to: '/students', titleKey: 'quick.studentPortal', descKey: 'quick.studentPortalDesc', icon: GraduationCap },
  { to: '/teachers', titleKey: 'quick.teacherDirectory', descKey: 'quick.teacherDirectoryDesc', icon: Users },
  { to: '/results', titleKey: 'quick.results', descKey: 'quick.resultsDesc', icon: ClipboardList },
  { to: '/academics#calendar', titleKey: 'quick.calendar', descKey: 'quick.calendarDesc', icon: CalendarDays },
  { to: '/admission', titleKey: 'quick.admission', descKey: 'quick.admissionDesc', icon: FileText },
  { to: '/academics#routines', titleKey: 'quick.routines', descKey: 'quick.routinesDesc', icon: CalendarClock },
  { to: '/academics#documents', titleKey: 'quick.documents', descKey: 'quick.documentsDesc', icon: Download },
  { to: '/contact', titleKey: 'quick.contact', descKey: 'quick.contactDesc', icon: Phone },
]

function HomeSkeleton() {
  return (
    <div>
      <div className="bg-navy-950 py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <Skeleton className="h-4 w-48 bg-white/10" />
            <Skeleton className="h-12 w-full max-w-xl bg-white/10" />
            <Skeleton className="h-5 w-3/4 bg-white/10" />
            <Skeleton className="h-16 w-full max-w-2xl bg-white/10" />
          </div>
          <Skeleton className="h-72 w-full bg-white/10" />
        </div>
      </div>
      <div className="container-page grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  usePageMeta({})
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<HomePayload>('/api/public/home')

  if (loading && !data) return <HomeSkeleton />
  if (error && !data) {
    return (
      <div className="container-page py-20">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }
  if (!data) return null

  const { settings, meta, notices, events } = data
  const institution = settings.institution
  const content = settings.content
  const welcomeTitle =
    lang === 'bn'
      ? content.welcomeTitleBn || 'কলেজ পরিবারের পক্ষ থেকে স্বাগতম'
      : content.welcomeTitleEn || 'Welcome from the college family'
  const welcome = pickBilingual(content as unknown as Record<string, unknown>, 'welcome', lang)
  const intro = pickBilingual(content as unknown as Record<string, unknown>, 'aboutIntro', lang)
  const tagline = lang === 'bn' ? content.taglineBn : content.taglineEn
  const established = formatDate(institution.establishedDate, lang)
  const upcomingEvents = events.filter((event) => event.status === 'published').slice(0, 3)
  const pinned = notices.filter((notice) => notice.pinned)
  const noticeList = (pinned.length ? pinned : notices).slice(0, 3)

  return (
    <div>
      <section className="hero-grid relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute -bottom-48 left-1/3 h-96 w-96 rounded-full border border-white/5" aria-hidden="true" />
        <div className="container-page relative grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-16">
          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-pine-300">
                {t('hero.eyebrow')}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold text-slate-300">
                EIIN <span className="font-latin text-white">{institution.eiin}</span>
              </span>
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl xl:text-[3.4rem]">
              {institution.nameBn}
            </h1>
            <p className="font-latin mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300 sm:text-base">
              {institution.nameEn}
            </p>
            <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-pine-200 sm:text-lg">{tagline}</p>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">{intro}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink to="/admission" variant="secondary" size="lg">
                {t('nav.admission')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to="/results" size="lg" className="border border-white/20 bg-white/10 text-white hover:bg-white/15">
                {t('nav.results')}
              </ButtonLink>
              <ButtonLink to="/academics" size="lg" className="border border-white/20 bg-transparent text-white hover:bg-white/10">
                {t('nav.academics')}
              </ButtonLink>
              <ButtonLink to="/notices" size="lg" className="border border-white/20 bg-transparent text-white hover:bg-white/10">
                {t('nav.notices')}
              </ButtonLink>
            </div>

            <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <dt className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-pine-300" aria-hidden="true" />
                  {t('hero.location')}
                </dt>
                <dd className="mt-1 text-xs leading-6 text-slate-200">{institution.addressBn}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">{t('hero.eiin')}</dt>
                <dd className="font-latin mt-1 text-base font-bold text-white">{institution.eiin}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">{t('hero.established')}</dt>
                <dd className="mt-1 text-xs leading-5 text-slate-200">
                  {established}
                  {!institution.establishedVerified ? (
                    <span className="mt-1 block text-[0.65rem] font-semibold text-amber-300">{t('common.pending')}</span>
                  ) : null}
                </dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-white/15 bg-white p-5 text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-900 dark:text-white">
                  <Megaphone className="h-4 w-4 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                  {t('hero.noticeBoard')}
                </h2>
                <Link to="/notices" className="text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">
                  {t('action.viewAll')}
                </Link>
              </div>
              {noticeList.length ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {noticeList.map((notice) => (
                    <li key={notice.id}>
                      <Link to={`/notices/${notice.id}`} className="group block py-3">
                        <div className="flex items-center gap-2 text-[0.65rem] font-semibold text-slate-500 dark:text-slate-400">
                          <span>{formatDateShort(notice.publishedAt, lang)}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                          <span className="text-pine-700 dark:text-pine-300">{notice.category}</span>
                          {notice.isDemo ? <DemoBadge /> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-navy-900 group-hover:text-pine-700 dark:text-slate-100 dark:group-hover:text-pine-300">
                          {notice.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-xs text-slate-500">{t('hero.noNotices')}</p>
              )}
              <Link
                to="/notices"
                className="mt-2 flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-navy-900 text-xs font-bold text-white hover:bg-navy-800 dark:bg-pine-600 dark:hover:bg-pine-500"
              >
                {t('action.viewAllNotices')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[0.68rem] leading-5 text-amber-100">
              {meta.demoContentNotice}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-1 py-8 sm:py-10" aria-labelledby="quick-access-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">{t('hero.quickLinks')}</p>
            <h2 id="quick-access-heading" className="mt-1 text-xl font-extrabold sm:text-2xl">
              {t('home.quickAccess')}
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickAccess.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-pine-700"
              >
                <span className="rounded-lg bg-pine-50 p-2.5 text-pine-700 transition group-hover:bg-pine-600 group-hover:text-white dark:bg-pine-950 dark:text-pine-300 dark:group-hover:bg-pine-600 dark:group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-navy-900 dark:text-slate-100">{t(item.titleKey)}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{t(item.descKey)}</span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-pine-600 dark:text-slate-600 dark:group-hover:text-pine-300" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="container-page py-8 sm:py-10" aria-labelledby="welcome-heading">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-6 sm:p-8">
            <p className="section-eyebrow">{t('home.welcome')}</p>
            <h2 id="welcome-heading" className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-[1.7rem]">
              {welcomeTitle}
            </h2>
            <p className="prose-bn mt-4 line-clamp-[10]">{welcome}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink to="/about" variant="outline" size="sm">
                {t('nav.about')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to="/contact" variant="ghost" size="sm">
                {t('nav.contact')}
              </ButtonLink>
            </div>
          </div>

          <div className="card p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-eyebrow">{t('home.academicOverview')}</p>
                <h2 className="mt-1 text-xl font-extrabold">{t('nav.academics')}</h2>
              </div>
              <BookOpen className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
            </div>
            <div className="mt-4 space-y-3">
              {institution.educationLevels.map((level) => (
                <div key={level.nameBn} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{lang === 'bn' ? level.nameBn : level.nameEn}</span>
                  {level.verified ? <Badge tone="green">{t('common.official')}</Badge> : <PendingBadge />}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">{t('academics.groups')}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {institution.groups.map((group) => (
                  <span
                    key={group.nameBn}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    {lang === 'bn' ? group.nameBn : group.nameEn}
                    {!group.verified ? <span className="text-amber-600 dark:text-amber-400" title={t('common.pending')}>•</span> : null}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                গ্রুপ ও বিষয়ের তথ্য যাচাই প্রক্রিয়াধীন।{' '}
                <Link to="/academics" className="font-semibold text-pine-700 underline underline-offset-4 dark:text-pine-300">
                  বিস্তারিত
                </Link>
              </p>
            </div>
            <ButtonLink to="/admission" variant="secondary" size="sm" className="mt-4 w-full">
              {t('nav.admission')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="container-page py-8 sm:py-10" aria-labelledby="notices-heading">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <SectionHeading
              eyebrow={t('nav.notices')}
              title={t('home.latestNotices')}
              action={
                <ButtonLink to="/notices" variant="outline" size="sm">
                  {t('action.viewAllNotices')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              }
            />
            {notices.length ? (
              <div className="space-y-3">
                {notices.map((notice) => (
                  <article key={notice.id} className="card p-5 transition hover:border-pine-300 dark:hover:border-pine-700">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex shrink-0 flex-row items-center gap-2 sm:w-20 sm:flex-col sm:rounded-xl sm:bg-slate-50 sm:py-2 sm:text-center dark:sm:bg-slate-800">
                        <span className="text-lg font-extrabold leading-none text-navy-900 dark:text-white">
                          {new Date(notice.publishedAt).getDate()}
                        </span>
                        <span className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
                          {new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { month: 'short', year: 'numeric' }).format(new Date(notice.publishedAt))}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-pine-700 dark:text-pine-300">{notice.category}</span>
                          {notice.pinned ? <Badge tone="navy">গুরুত্বপূর্ণ</Badge> : null}
                          {notice.isDemo ? <DemoBadge /> : null}
                        </div>
                        <h3 className="mt-1 text-base font-bold leading-7">
                          <Link to={`/notices/${notice.id}`} className="hover:text-pine-700 dark:hover:text-pine-300">
                            {notice.title}
                          </Link>
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{notice.summary}</p>
                        <Link to={`/notices/${notice.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">
                          {t('action.readMore')}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t('hero.noNotices')}
                description={meta.demoContentNotice}
                action={<ButtonLink to="/notices" size="sm">{t('nav.notices')}</ButtonLink>}
              />
            )}
          </div>

          <div className="space-y-4">
            <Alert kind="warning" title={t('home.verificationTitle')}>
              {t('home.verificationBody')}
            </Alert>
            <div className="card p-5">
              <h2 className="text-base font-extrabold">{t('home.importantInfo')}</h2>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link to="/academics#calendar" className="flex items-start gap-2 rounded-lg p-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-pine-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-pine-300">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    {t('quick.calendar')}
                  </Link>
                </li>
                <li>
                  <Link to="/academics#exams" className="flex items-start gap-2 rounded-lg p-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-pine-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-pine-300">
                    <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    {t('academics.exams')}
                  </Link>
                </li>
                <li>
                  <Link to="/teachers" className="flex items-start gap-2 rounded-lg p-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-pine-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-pine-300">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    {t('quick.teacherDirectory')}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="flex items-start gap-2 rounded-lg p-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-pine-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-pine-300">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    {t('nav.login')}
                  </Link>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-navy-950 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-pine-300">{t('nav.admission')}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                ভর্তি সংক্রান্ত অফিসিয়াল বিজ্ঞপ্তি প্রকাশিত হলে ওয়েবসাইটের নোটিশ ও ভর্তি পেজে দেখা যাবে।
              </p>
              <ButtonLink to="/notices" variant="secondary" size="sm" className="mt-3 w-full">
                {t('nav.notices')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8 sm:py-10" aria-labelledby="events-heading">
        <SectionHeading
          eyebrow={t('nav.events')}
          title={t('home.upcomingEvents')}
          action={
            <ButtonLink to="/events" variant="outline" size="sm">
              {t('action.viewAll')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          }
        />
        {upcomingEvents.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => {
              const date = new Date(event.startDate)
              return (
                <article key={event.id} className="card flex gap-4 p-5">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-pine-50 text-pine-800 dark:bg-pine-950 dark:text-pine-200">
                    <span className="text-xl font-extrabold leading-none">{date.getDate()}</span>
                    <span className="mt-1 text-[0.6rem] font-bold uppercase">
                      {new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { month: 'short' }).format(date)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="green">{t('events.upcoming')}</Badge>
                      {event.isDemo ? <DemoBadge /> : null}
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold leading-6 text-navy-900 dark:text-slate-100">{event.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{event.description}</p>
                    <p className="mt-2 text-[0.68rem] font-medium text-slate-500 dark:text-slate-400">
                      {event.startTime || ''} {event.venue ? `· ${event.venue}` : ''}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState title={t('events.empty')} />
        )}
      </section>

      <section className="container-page pb-4 pt-6">
        <div className="overflow-hidden rounded-2xl bg-navy-950 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine-300">{t('nav.contact')}</p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">প্রশ্ন বা তথ্য সংশোধনের প্রয়োজন?</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                যোগাযোগ ফর্মের মাধ্যমে কলেজ প্রশাসনকে জানান। যাচাই করে প্রয়োজনীয় পদক্ষেপ নেওয়া হবে। জরুরি কাজে সরাসরি কলেজ অফিসে যোগাযোগ করুন।
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="/contact" variant="secondary" size="md">
                {t('nav.contact')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to="/about" variant="outline" size="md" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                {t('nav.about')}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
