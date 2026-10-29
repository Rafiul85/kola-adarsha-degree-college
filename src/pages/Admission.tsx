import { CalendarClock, CheckCircle2, ExternalLink, FileCheck2, HelpCircle, Info, ListChecks, Wallet } from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { AdmissionSettings, Institution, Meta } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { Alert, PendingBadge } from '../components/ui/Feedback'
import { PageHeader, SectionHeading } from '../components/ui/Navigation'
import { ButtonLink } from '../components/ui/Button'
import { safeExternalUrl } from '../lib/format'

interface SettingsPayload {
  settings: { institution: Institution; admission: AdmissionSettings }
  meta: Meta
}

const sections = [
  { key: 'eligibility', icon: CheckCircle2, titleKey: 'admission.eligibility', bn: 'eligibilityBn', en: 'eligibilityEn' },
  { key: 'documents', icon: FileCheck2, titleKey: 'admission.documents', bn: 'documentsBn', en: 'documentsEn' },
  { key: 'steps', icon: ListChecks, titleKey: 'admission.steps', bn: 'stepsBn', en: 'stepsEn' },
  { key: 'fees', icon: Wallet, titleKey: 'admission.fees', bn: 'feesBn', en: 'feesEn' },
] as const

export default function Admission() {
  usePageMeta({
    title: 'ভর্তি তথ্য',
    description: 'কোলা আদর্শ ডিগ্রি কলেজের ভর্তি সংক্রান্ত অফিসিয়াল বিজ্ঞপ্তি, যোগ্যতা, ডকুমেন্ট, আবেদন প্রক্রিয়া ও ফি।',
  })
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<SettingsPayload>('/api/public/settings')
  const isBn = lang === 'bn'

  if (loading && !data) {
    return (
      <div className="container-page py-12">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
      </div>
    )
  }
  if (error && !data) {
    return (
      <div className="container-page py-12">
        <Alert kind="error" title={t('common.error')}>
          {error}
          <button type="button" onClick={reload} className="ml-2 font-bold underline">
            {t('action.retry')}
          </button>
        </Alert>
      </div>
    )
  }
  if (!data) return null

  const admission = data.settings.admission
  const institution = data.settings.institution
  const applyUrl = safeExternalUrl(admission.applyUrl)
  const deadline = admission.deadlineBn

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.admission')}
        title={t('admission.title')}
        description={admission.introBn}
        breadcrumbs={[{ label: t('nav.admission') }]}
        actions={
          <ButtonLink to="/notices" variant="secondary" size="sm">
            {t('nav.notices')}
          </ButtonLink>
        }
      />

      <div className="container-page py-10 sm:py-12">
        <Alert kind="warning" title={t('admission.verifyNote')}>
          {data.meta.demoContentNotice}
        </Alert>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            <section className="card p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="section-eyebrow">{t('admission.title')}</p>
                  <h2 className="mt-1 text-2xl font-extrabold">{isBn ? 'অফিসিয়াল ভর্তি নির্দেশনা' : 'Official admission guidance'}</h2>
                </div>
                <PendingBadge />
              </div>
              <p className="prose-bn mt-4">{isBn ? admission.introBn : admission.introEn}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {applyUrl ? (
                  <ButtonLink to={applyUrl} variant="secondary">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    {t('admission.apply')}
                  </ButtonLink>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <Info className="h-4 w-4" aria-hidden="true" />
                    {t('admission.noLink')}
                  </span>
                )}
                <ButtonLink to="/contact" variant="outline">
                  {t('nav.contact')}
                </ButtonLink>
              </div>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              {sections.map((section) => {
                const Icon = section.icon
                const value = isBn ? admission[section.bn] : admission[section.en]
                return (
                  <section key={section.key} className="card p-5 sm:p-6">
                    <span className="inline-flex rounded-xl bg-pine-50 p-2.5 text-pine-700 dark:bg-pine-950 dark:text-pine-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="mt-3 text-lg font-extrabold">{t(section.titleKey)}</h2>
                    <p className="prose-bn mt-2 text-sm">{value}</p>
                    <p className="mt-3 text-[0.65rem] font-semibold text-amber-700 dark:text-amber-300">{t('common.pending')}</p>
                  </section>
                )
              })}
            </div>

            <section className="card p-6 sm:p-8">
              <SectionHeading title={t('admission.deadline')} className="mb-3" />
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold">{deadline || t('common.notAvailable')}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'শেষ তারিখ কেবল অফিসিয়াল ভর্তি বিজ্ঞপ্তি থেকে নিশ্চিত করুন। এই পেজে অনুমানভিত্তিক তারিখ প্রকাশ করা হয় না।'
                      : 'Confirm the deadline only from the official admission notice. No assumed dates are published on this page.'}
                  </p>
                </div>
              </div>
            </section>

            <section className="card p-6 sm:p-8" aria-labelledby="admission-faq">
              <SectionHeading title={t('admission.faq')} className="mb-4" />
              <div className="space-y-2.5">
                {admission.faqs.map((faq) => (
                  <details key={faq.id || faq.qBn} className="group rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-bold">
                      <span>{isBn ? faq.qBn : faq.qEn}</span>
                      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 group-open:rotate-180 dark:text-pine-300" aria-hidden="true" />
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{isBn ? faq.aBn : faq.aEn}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-navy-950 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine-300">{t('nav.admission')}</p>
              <h2 className="mt-2 text-lg font-extrabold text-white">{isBn ? 'আবেদনের আগে যাচাই করুন' : 'Verify before applying'}</h2>
              <ul className="mt-3 space-y-2 text-xs leading-6 text-slate-300">
                <li>• {isBn ? 'অফিসিয়াল বিজ্ঞপ্তির তারিখ ও শেষ সময়' : 'Official notice date and deadline'}</li>
                <li>• {isBn ? 'যোগ্যতা ও প্রয়োজনীয় কাগজপত্র' : 'Eligibility and required documents'}</li>
                <li>• {isBn ? 'অনুমোদিত ফি ও পেমেন্ট পদ্ধতি' : 'Approved fees and payment method'}</li>
                <li>• {isBn ? 'আবেদনের অফিসিয়াল ওয়েবসাইট বা ঠিকানা' : 'Official application website or address'}</li>
              </ul>
            </div>

            <div className="card p-5">
              <h2 className="text-base font-extrabold">{t('about.contact')}</h2>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {isBn ? institution.addressBn : institution.addressEn}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {institution.phone || t('common.notAvailable')}
              </p>
              <ButtonLink to="/contact" variant="outline" size="sm" className="mt-3 w-full">
                {t('nav.contact')}
              </ButtonLink>
            </div>

            <div className="card p-5">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold">{isBn ? 'কোনো ফি বা তারিখ অনুমান করবেন না' : 'Do not assume fees or dates'}</p>
              <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'অনানুষ্ঠানিক সূত্র, ফোন কল বা সামাজিক মাধ্যম থেকে পাওয়া ভর্তি তথ্য যাচাই ছাড়া গ্রহণ করবেন না।'
                  : 'Do not rely on admission information from unofficial sources, phone calls or social media without verification.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
