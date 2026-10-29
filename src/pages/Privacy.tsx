import { Link } from 'react-router-dom'
import { Database, Eye, LockKeyhole, Mail, ShieldCheck, UserCheck } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../components/SEO'
import { Alert } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/Navigation'

const updated = '২৯ অক্টোবর ২০২৬'

export default function Privacy() {
  usePageMeta({
    title: 'গোপনীয়তা নীতি',
    description: 'কোলা আদর্শ ডিগ্রি কলেজ ওয়েবসাইটে সংগৃহীত তথ্য, কুকি, সেশন, সংরক্ষণ ও ব্যবহারকারীর অধিকার সম্পর্কে নীতি।',
  })
  const { t, lang } = useI18n()
  const isBn = lang === 'bn'

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.privacy')}
        title={t('privacy.title')}
        description={isBn ? 'এই ওয়েবসাইটে তথ্য কীভাবে সংগ্রহ, ব্যবহার ও সুরক্ষিত রাখা হয়।' : 'How information is collected, used and protected on this website.'}
        breadcrumbs={[{ label: t('privacy.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Alert kind="warning" title={isBn ? 'অনুমোদন প্রক্রিয়াধীন' : 'Awaiting approval'}>
            {isBn
              ? 'এটি ওয়েবসাইট পরিচালনার জন্য প্রস্তুতকৃত সাধারণ গোপনীয়তা নীতি। কলেজ কর্তৃপক্ষের অফিসিয়াল অনুমোদনের পর চূড়ান্ত নীতি প্রকাশ করা হবে। আইনি পরামর্শের জন্য যোগ্য পেশাদারের সাথে পরামর্শ করুন।'
              : 'This is a general privacy policy prepared for website operation. The final policy will be published after official approval by the college authority. Consult a qualified professional for legal advice.'}
          </Alert>

          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
            {t('legal.updated')}: {isBn ? updated : '29 October 2026'}
          </p>

          <div className="mt-5 space-y-5">
            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Database className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'আমরা কী তথ্য সংগ্রহ করি' : 'Information we collect'}
              </h2>
              <ul className="prose-bn mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>{isBn ? 'যোগাযোগ ফর্মে প্রদান করা নাম, ইমেইল, ঐচ্ছিক ফোন নম্বর, বিষয় ও বার্তা।' : 'Name, email, optional phone number, subject and message provided through the contact form.'}</li>
                <li>{isBn ? 'লগইন করা ব্যবহারকারীর অ্যাকাউন্ট তথ্য, ভূমিকা, সেশন ও অডিট লগ।' : 'Account details, role, session and audit logs for signed-in users.'}</li>
                <li>{isBn ? 'নিরাপত্তা ও ত্রুটি নির্ণয়ের জন্য সার্ভার লগ, অনুরোধের সময়, আইপি ঠিকানা ও ব্রাউজার তথ্য।' : 'Server logs, request times, IP addresses and browser information for security and troubleshooting.'}</li>
                <li>{isBn ? 'প্রকাশ্য ফলাফল অনুসন্ধানে দেওয়া পরীক্ষা, রোল ও রেজিস্ট্রেশন নম্বর।' : 'Examination, roll and registration numbers submitted in public result searches.'}</li>
              </ul>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Eye className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'তথ্যের ব্যবহার' : 'How information is used'}
              </h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn
                  ? 'প্রশ্ন ও অনুরোধের উত্তর দিতে, অ্যাকাউন্ট ও ভূমিকা পরিচালনা করতে, প্রকাশিত ফলাফল দেখাতে, নিরাপত্তা ঘটনা তদন্ত করতে, সেবার মান উন্নত করতে এবং আইনি বাধ্যবাধকতা পূরণ করতে তথ্য ব্যবহার করা হয়। অনুমোদিত প্রশাসকরা প্রয়োজনে যোগাযোগ বার্তা ও অডিট লগ দেখতে পারেন।'
                  : 'Information is used to respond to questions and requests, manage accounts and roles, display published results, investigate security incidents, improve services and meet legal obligations. Authorised administrators may review contact messages and audit logs when necessary.'}
              </p>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <LockKeyhole className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'কুকি, লোকাল স্টোরেজ ও সেশন' : 'Cookies, local storage and sessions'}
              </h2>
              <ul className="prose-bn mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>{isBn ? 'লগইন সেশন HttpOnly কুকিতে রাখা হয়; এটি স্ক্রিপ্টের মাধ্যমে পড়া যায় না।' : 'The login session is stored in an HttpOnly cookie; it cannot be read by scripts.'}</li>
                <li>{isBn ? 'ভাষা ও থিম পছন্দ ব্রাউজারের লোকাল স্টোরেজে সংরক্ষণ করা হয়।' : 'Language and theme preferences are stored in browser local storage.'}</li>
                <li>{isBn ? 'এই ইনস্টলেশনটি বর্তমানে বিজ্ঞাপন বা তৃতীয় পক্ষের ট্র্যাকিং কুকি ব্যবহার করে না।' : 'This installation currently uses no advertising or third-party tracking cookies.'}</li>
              </ul>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <ShieldCheck className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'সংরক্ষণ ও নিরাপত্তা' : 'Retention and security'}
              </h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn
                  ? 'তথ্য প্রয়োজনীয় সময় পর্যন্ত সংরক্ষণ করা হয় এবং নিয়মিত ব্যাকআপ রাখা হয়। অ্যাক্সেস ভূমিকা অনুযায়ী সীমিত, পাসওয়ার্ড হ্যাশ করা হয় এবং গুরুত্বপূর্ণ কাজ অডিট লগে রাখা হয়। তবে কোনো সিস্টেম সম্পূর্ণ নিরাপদ বলে দাবি করা যায় না। এই ইনস্টলেশনটি স্থানীয় ফাইলভিত্তিক ডেটা স্টোর ব্যবহার করে; উৎপাদনে ডেটাবেস, এনক্রিপশন, ইমেইল ও মনিটরিং কনফিগার করতে হবে।'
                  : 'Information is retained as long as necessary and backed up regularly. Access is role-limited, passwords are hashed and significant actions are logged. No system can be guaranteed completely secure. This installation uses a local file-based data store; production deployment requires a database, encryption, email and monitoring configuration.'}
              </p>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <UserCheck className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'আপনার অধিকার ও পছন্দ' : 'Your rights and choices'}
              </h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn
                  ? 'আপনার সম্পর্কে সংরক্ষিত তথ্য সম্পর্কে জানতে, ভুল সংশোধন করতে বা অ্যাকাউন্ট নিষ্ক্রিয় করার অনুরোধ করতে কলেজ অফিসে যোগাযোগ করুন। কিছু তথ্য আইনি বা প্রশাসনিক কারণে নির্দিষ্ট সময় পর্যন্ত রাখতে হতে পারে। ব্যক্তিগত তথ্য সর্বজনীনভাবে প্রকাশ করা হয় না।'
                  : 'Contact the college office to ask about information held about you, request corrections or request account deactivation. Some information may need to be retained for legal or administrative reasons. Personal information is not published publicly.'}
              </p>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Mail className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'যোগাযোগ' : 'Contact'}
              </h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn ? 'গোপনীয়তা সংক্রান্ত প্রশ্ন বা অনুরোধের জন্য ' : 'For privacy questions or requests, use the '}
                <Link to="/contact" className="font-bold text-pine-700 underline underline-offset-4 dark:text-pine-300">
                  {t('nav.contact')}
                </Link>
                {isBn ? ' পেজের ফর্ম ব্যবহার করুন। সংবেদনশীল তথ্য (পাসওয়ার্ড, জাতীয় পরিচয়পত্রের নম্বর) পাঠাবেন না।' : ' page. Do not send sensitive information such as passwords or national ID numbers.'}
              </p>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/terms" className="text-sm font-bold text-pine-700 hover:underline dark:text-pine-300">
              {t('nav.terms')} →
            </Link>
            <Link to="/faq" className="text-sm font-bold text-pine-700 hover:underline dark:text-pine-300">
              {t('nav.faq')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
