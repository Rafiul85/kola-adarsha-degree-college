import {
  CalendarClock,
  ClipboardList,
  Download,
  FileSearch,
  GraduationCap,
  LockKeyhole,
  Megaphone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Meta, Settings } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { Alert, ErrorState, LoadingBlock } from '../components/ui/Feedback'
import { PageHeader, SectionHeading } from '../components/ui/Navigation'
import { ButtonLink } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const services = [
  { icon: UserRound, titleKey: 'students.profile', bodyBn: 'নিজের নাম, শিক্ষার্থী আইডি, রোল, রেজিস্ট্রেশন, শিক্ষাবর্ষ ও প্রোগ্রামের তথ্য দেখুন।', bodyEn: 'View your name, student ID, roll, registration, session and programme details.', to: '/dashboard' },
  { icon: CalendarClock, titleKey: 'students.routine', bodyBn: 'নিজের শ্রেণি, গ্রুপ ও শিক্ষাবর্ষের প্রকাশিত ক্লাস রুটিন দেখুন।', bodyEn: 'View the published class routine for your class, group and session.', to: '/dashboard' },
  { icon: ClipboardList, titleKey: 'students.examSchedule', bodyBn: 'প্রকাশিত পরীক্ষার সময়সূচি ও নিজের ফলাফল ড্যাশবোর্ডে দেখুন।', bodyEn: 'View published examination schedules and your own results in the dashboard.', to: '/dashboard' },
  { icon: Download, titleKey: 'students.documents', bodyBn: 'প্রকাশিত সিলেবাস ও একাডেমিক ডকুমেন্ট ডাউনলোড করুন।', bodyEn: 'Download published syllabus and academic documents.', to: '/academics#documents' },
  { icon: FileSearch, titleKey: 'students.results', bodyBn: 'পরীক্ষা, রোল ও রেজিস্ট্রেশন নম্বর দিয়ে প্রকাশিত ফলাফল যাচাই করুন।', bodyEn: 'Check published results using the examination, roll and registration number.', to: '/results' },
  { icon: Megaphone, titleKey: 'students.notices', bodyBn: 'শিক্ষার্থীদের জন্য প্রকাশিত নোটিশ ও ঘোষণা দেখুন।', bodyEn: 'Read notices and announcements published for students.', to: '/notices' },
]

export default function Students() {
  usePageMeta({
    title: 'শিক্ষার্থী তথ্য ও পোর্টাল',
    description: 'শিক্ষার্থী পোর্টাল, অ্যাকাউন্ট নির্দেশনা, রুটিন, ফলাফল ও একাডেমিক সেবা। ব্যক্তিগত তথ্য সর্বজনীনভাবে প্রকাশ করা হয় না।',
  })
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const { data, loading, error, reload } = useApi<{ settings: Settings; meta: Meta }>('/api/public/settings')
  const isBn = lang === 'bn'
  const portalHref = user ? '/dashboard' : '/login?next=%2Fdashboard'

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

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.students')}
        title={t('students.title')}
        description={t('students.intro')}
        breadcrumbs={[{ label: t('nav.students') }]}
        actions={
          <ButtonLink to={portalHref} variant="secondary">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            {user ? t('nav.dashboard') : t('students.login')}
          </ButtonLink>
        }
      />

      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="card overflow-hidden" aria-labelledby="student-portal">
            <div className="bg-navy-950 p-6 text-white sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine-300">{t('students.portalTitle')}</p>
              <h2 id="student-portal" className="mt-2 text-2xl font-extrabold text-white">
                {isBn ? 'নিজের একাডেমিক তথ্য এক জায়গায়' : 'Your academic information in one place'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{t('students.loginHint')}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <ButtonLink to={portalHref} variant="secondary">
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  {user ? t('nav.dashboard') : t('students.login')}
                </ButtonLink>
                <ButtonLink to="/contact" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  {t('students.support')}
                </ButtonLink>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <SectionHeading title={t('students.services')} className="mb-4" />
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => {
                  const Icon = service.icon
                  return (
                    <div key={service.titleKey} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <span className="inline-flex rounded-lg bg-pine-50 p-2 text-pine-700 dark:bg-pine-950 dark:text-pine-300">
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <p className="mt-2.5 text-sm font-bold">{t(service.titleKey)}</p>
                      <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                        {isBn ? service.bodyBn : service.bodyEn}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <Alert kind="info" title={t('students.private')}>
              <ul className="mt-2 space-y-1.5 text-xs leading-6">
                <li>{isBn ? 'শিক্ষার্থীদের কোনো পাবলিক ডিরেক্টরি নেই।' : 'There is no public student directory.'}</li>
                <li>{isBn ? 'ফলাফল দেখতে রোল ও রেজিস্ট্রেশন উভয়ই প্রয়োজন।' : 'Both roll and registration are required to view results.'}</li>
                <li>{isBn ? 'শিক্ষকগণ শুধু নির্ধারিত শিক্ষাবর্ষের সীমিত তথ্য দেখতে পারেন।' : 'Teachers can see limited details only for assigned sessions.'}</li>
                <li>{isBn ? 'অ্যাকাউন্ট তৈরি ও ভূমিকা নির্ধারণ করে কলেজ প্রশাসন।' : 'College administration creates accounts and assigns roles.'}</li>
              </ul>
            </Alert>

            <div className="card p-5">
              <ShieldCheck className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
              <h2 className="mt-2 text-base font-extrabold">{t('students.portalTitle')}</h2>
              <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'শিক্ষার্থী অ্যাকাউন্টের সাথে অনুমোদিত শিক্ষার্থী রেকর্ড সংযুক্ত থাকে। অ্যাকাউন্ট না থাকলে কলেজ অফিসে যোগাযোগ করুন।'
                  : 'Student accounts are linked to approved student records. Contact the college office if you do not have an account.'}
              </p>
              <ButtonLink to="/faq" variant="ghost" size="sm" className="mt-2 px-0">
                {t('nav.faq')}
              </ButtonLink>
            </div>

            {data ? (
              <div className="card p-5">
                <h2 className="text-base font-extrabold">{t('nav.contact')}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('about.address')}</dt>
                    <dd className="mt-0.5 leading-6">{isBn ? data.settings.institution.addressBn : data.settings.institution.addressEn}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('contact.officeHours')}</dt>
                    <dd className="mt-0.5 leading-6">
                      {(isBn ? data.settings.institution.officeHoursBn : data.settings.institution.officeHoursEn) || t('common.notAvailable')}
                    </dd>
                  </div>
                </dl>
                <ButtonLink to="/contact" variant="outline" size="sm" className="mt-3 w-full">
                  {t('nav.contact')}
                </ButtonLink>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
