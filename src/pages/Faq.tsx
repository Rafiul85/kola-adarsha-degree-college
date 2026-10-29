import { ChevronDown, HelpCircle, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Settings } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { ErrorState, LoadingBlock } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/Navigation'
import { TextField } from '../components/ui/Form'

interface GeneralFaq {
  qBn: string
  aBn: string
  qEn: string
  aEn: string
}

const generalFaqs: GeneralFaq[] = [
  {
    qBn: 'ওয়েবসাইটে প্রকাশিত তথ্য কি অফিসিয়াল?',
    aBn: 'প্রতিষ্ঠানের নাম, EIIN ও ঠিকানা ব্যতীত অন্যান্য প্রতিষ্ঠানসংক্রান্ত তথ্য যাচাই প্রক্রিয়াধীন হিসেবে চিহ্নিত। যাচাই সম্পন্ন হওয়ার আগে অনুমানভিত্তিক তথ্য প্রকাশ করা হয় না। অফিসিয়াল কপির জন্য কলেজ অফিসে যোগাযোগ করুন।',
    qEn: 'Is the information on this website official?',
    aEn: 'Apart from the institution name, EIIN and address, institution-specific details are marked as awaiting verification. No assumed information is published before verification. Contact the college office for official copies.',
  },
  {
    qBn: 'শিক্ষার্থী বা শিক্ষক অ্যাকাউন্ট কীভাবে তৈরি করব?',
    aBn: 'অ্যাকাউন্ট কলেজ প্রশাসন তৈরি করে এবং সংশ্লিষ্ট শিক্ষার্থী বা শিক্ষক রেকর্ডের সাথে সংযুক্ত করে। ওয়েবসাইটে নিজে নিজে অ্যাকাউন্ট খোলা বা প্রশাসকের ভূমিকা নেওয়ার সুযোগ নেই।',
    qEn: 'How do I create a student or teacher account?',
    aEn: 'College administration creates accounts and links them to the relevant student or teacher record. There is no self-registration or self-promotion to administrator on this website.',
  },
  {
    qBn: 'পাসওয়ার্ড ভুলে গেলে কী করব?',
    aBn: 'লগইন পেজের “পাসওয়ার্ড ভুলে গেছেন?” লিংক ব্যবহার করুন। ইমেইল সেবা কনফিগার না থাকলে কলেজ প্রশাসন নিরাপদভাবে একবার ব্যবহারযোগ্য রিসেট লিংক দিতে পারে।',
    qEn: 'What should I do if I forget my password?',
    aEn: 'Use the “Forgot password?” link on the login page. If email delivery is not configured, college administration can provide a single-use reset link securely.',
  },
  {
    qBn: 'ফলাফল কীভাবে যাচাই করব?',
    aBn: 'ফলাফল পেজে পরীক্ষা নির্বাচন করে রোল নম্বর ও রেজিস্ট্রেশন নম্বর দিন। শুধু প্রকাশিত ফলাফল অনুসন্ধানযোগ্য। ওয়েবসাইটের ফলাফল অনলাইন কপি; অফিসিয়াল সিলযুক্ত কপির জন্য কলেজ অফিসে যোগাযোগ করুন।',
    qEn: 'How do I check a result?',
    aEn: 'On the Results page, choose the examination and enter the roll and registration numbers. Only published results are searchable. Website results are online copies; contact the college office for an officially sealed copy.',
  },
  {
    qBn: 'তথ্য ভুল বা পুরোনো মনে হলে কী করব?',
    aBn: 'যোগাযোগ পেজের ফর্মে বিষয়টি লিখুন। প্রশাসন যাচাই করে প্রয়োজনীয় সংশোধন করবে। জরুরি বা অফিসিয়াল কাজে সরাসরি কলেজ অফিসে যোগাযোগ করুন।',
    qEn: 'What should I do if information appears incorrect or outdated?',
    aEn: 'Use the form on the Contact page. Administration will verify and correct it as needed. For urgent or official matters, contact the college office directly.',
  },
  {
    qBn: 'ওয়েবসাইটে কোনো ভর্তি ফি বা শেষ তারিখ অনুমান করে দেওয়া হয় কি?',
    aBn: 'না। ভর্তি ফি, যোগ্যতা, ডকুমেন্ট তালিকা ও সময়সূচি শুধু অফিসিয়াল ভর্তি বিজ্ঞপ্তি থেকে নিশ্চিত করা উচিত। যাচাই না হওয়া তথ্য অনুমান করে প্রকাশ করা হয় না।',
    qEn: 'Are admission fees or deadlines estimated on this website?',
    aEn: 'No. Fees, eligibility, document lists and schedules should be confirmed only through the official admission notice. Unverified details are not estimated or published.',
  },
  {
    qBn: 'ব্যক্তিগত তথ্য কি সর্বজনীনভাবে দেখা যায়?',
    aBn: 'না। শিক্ষার্থীদের জন্মতারিখ, ফোন নম্বর, অভিভাবকের নম্বর ও ঠিকানা পাবলিক ডিরেক্টরিতে প্রকাশ করা হয় না। ব্যক্তিগত তথ্য শুধু অনুমোদিত ব্যবহারকারী ও সংশ্লিষ্ট ভূমিকা দেখতে পারেন।',
    qEn: 'Is personal information publicly visible?',
    aEn: 'No. Student dates of birth, phone numbers, guardian numbers and addresses are not published in a public directory. Personal information is visible only to authorised users and relevant roles.',
  },
  {
    qBn: 'ডকুমেন্ট ডাউনলোড করার সময় সমস্যা হলে কী করব?',
    aBn: 'পেজটি রিফ্রেশ করে আবার চেষ্টা করুন। ফাইলটি সরানো বা প্রকাশনা থেকে প্রত্যাহার করা থাকলে ডাউনলোড লিংক কাজ করবে না। সমস্যা অব্যাহত থাকলে যোগাযোগ ফর্মে জানান।',
    qEn: 'What if a document download does not work?',
    aEn: 'Refresh the page and try again. If the file has been removed or unpublished, the download link will not work. Report the issue through the contact form if it persists.',
  },
]

export default function Faq() {
  usePageMeta({
    title: 'সাধারণ প্রশ্ন ও উত্তর',
    description: 'ওয়েবসাইট ব্যবহার, অ্যাকাউন্ট, ফলাফল, ব্যক্তিগত তথ্য ও যোগাযোগ সম্পর্কে সাধারণ প্রশ্নের উত্তর।',
  })
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<{ settings: Settings }>('/api/public/settings')
  const [query, setQuery] = useState('')
  const isBn = lang === 'bn'

  const admissionFaqs = data?.settings.admission.faqs || []
  const allFaqs = useMemo<GeneralFaq[]>(() => [...generalFaqs, ...admissionFaqs], [admissionFaqs])
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return allFaqs
    return allFaqs.filter((faq) => `${faq.qBn} ${faq.aBn} ${faq.qEn} ${faq.aEn}`.toLowerCase().includes(needle))
  }, [allFaqs, query])

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.faq')}
        title={t('faq.title')}
        description={t('faq.intro')}
        breadcrumbs={[{ label: t('faq.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="card p-4 sm:p-5">
            <TextField
              label={t('common.search')}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isBn ? 'প্রশ্নের শব্দ লিখুন' : 'Search questions'}
            />
          </div>

          {loading && !data ? <div className="mt-6"><LoadingBlock /></div> : null}
          {error && !data ? <div className="mt-6"><ErrorState message={error} onRetry={reload} /></div> : null}

          {filtered.length ? (
            <div className="mt-6 space-y-3">
              {filtered.map((faq, index) => (
                <details key={`${faq.qBn}-${index}`} className="group card overflow-hidden" open={Boolean(query.trim())}>
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-5 text-left font-bold marker:hidden">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine-100 text-xs font-extrabold text-pine-800 dark:bg-pine-950 dark:text-pine-200">
                      {new Intl.NumberFormat(isBn ? 'bn-BD' : 'en-GB').format(index + 1)}
                    </span>
                    <span className="min-w-0 flex-1 leading-7">{isBn ? faq.qBn : faq.qEn || faq.qBn}</span>
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
                    <p className="prose-bn text-sm">{isBn ? faq.aBn : faq.aEn || faq.aBn}</p>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <HelpCircle className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">{t('common.noData')}</p>
              <button type="button" onClick={() => setQuery('')} className="mt-2 text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">
                {t('action.reset')}
              </button>
            </div>
          )}

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-6 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            <Search className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t('faq.note')}
          </div>
        </div>
      </div>
    </div>
  )
}
