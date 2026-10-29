import { Link } from 'react-router-dom'
import { BookOpenCheck, Copyright, FileWarning, Gavel, ShieldAlert, Wrench } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../components/SEO'
import { Alert } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/Navigation'

const updated = '২৯ অক্টোবর ২০২৬'

export default function Terms() {
  usePageMeta({
    title: 'ব্যবহারের শর্তাবলি',
    description: 'কোলা আদর্শ ডিগ্রি কলেজ ওয়েবসাইট ব্যবহারের শর্ত, অ্যাকাউন্ট নিরাপত্তা, ফলাফল ও ডকুমেন্ট সংক্রান্ত নির্দেশনা।',
  })
  const { t, lang } = useI18n()
  const isBn = lang === 'bn'

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.terms')}
        title={t('terms.title')}
        description={isBn ? 'এই ওয়েবসাইট ব্যবহারের সাধারণ শর্ত ও দায়বদ্ধতা।' : 'General terms and responsibilities for using this website.'}
        breadcrumbs={[{ label: t('terms.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Alert kind="warning" title={isBn ? 'অনুমোদন প্রক্রিয়াধীন' : 'Awaiting approval'}>
            {isBn
              ? 'এটি ওয়েবসাইট পরিচালনার জন্য প্রস্তুতকৃত সাধারণ ব্যবহারের শর্ত। কলেজ কর্তৃপক্ষের অফিসিয়াল অনুমোদনের পর চূড়ান্ত শর্তাবলি প্রকাশ করা হবে। এটি আইনি পরামর্শ নয়।'
              : 'These are general terms prepared for website operation. Final terms will be published after official approval by the college authority. This is not legal advice.'}
          </Alert>

          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
            {t('legal.updated')}: {isBn ? updated : '29 October 2026'}
          </p>

          <div className="mt-5 space-y-5">
            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <BookOpenCheck className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'ওয়েবসাইটের উদ্দেশ্য' : 'Purpose of this website'}
              </h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn
                  ? 'এই ওয়েবসাইট কলেজ সম্পর্কিত তথ্য, নোটিশ, একাডেমিক সময়সূচি, প্রকাশিত ফলাফল, ডকুমেন্ট ও যোগাযোগের সুবিধা প্রদান করে। এটি কোনো সরকারি, বোর্ড বা বিশ্ববিদ্যালয়ের অফিসিয়াল পোর্টাল নয় এবং অনুমোদনের দাবি করে না।'
                  : 'This website provides college information, notices, academic schedules, published results, documents and contact facilities. It is not an official government, board or university portal and does not claim approval.'}
              </p>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <ShieldAlert className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'অ্যাকাউন্ট ও নিরাপত্তা' : 'Accounts and security'}
              </h2>
              <ul className="prose-bn mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>{isBn ? 'শুধু কলেজ প্রশাসনের দেওয়া অ্যাকাউন্ট ব্যবহার করুন এবং পাসওয়ার্ড গোপন রাখুন।' : 'Use only accounts issued by college administration and keep passwords confidential.'}</li>
                <li>{isBn ? 'অন্যের অ্যাকাউন্টে প্রবেশ, তথ্য পরিবর্তন বা অনুমতিহীন অ্যাক্সেসের চেষ্টা নিষিদ্ধ।' : 'Accessing another person’s account, altering records or attempting unauthorised access is prohibited.'}</li>
                <li>{isBn ? 'নিজের ভূমিকা বা অনুমতি নিজে বাড়ানোর চেষ্টা করা যাবে না; সব ভূমিকা সার্ভারে যাচাই করা হয়।' : 'You may not attempt to elevate your own role or permissions; all roles are verified server-side.'}</li>
                <li>{isBn ? 'সন্দেহজনক কার্যক্রম দেখা দিলে দ্রুত কলেজ প্রশাসনকে জানান এবং পাসওয়ার্ড পরিবর্তন করুন।' : 'Report suspicious activity promptly and change your password.'}</li>
              </ul>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <FileWarning className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'তথ্য, ফলাফল ও ডকুমেন্ট' : 'Information, results and documents'}
              </h2>
              <ul className="prose-bn mt-3 list-disc space-y-2 pl-5 text-sm">
                <li>{isBn ? 'ওয়েবসাইটের ফলাফল অনলাইন কপি; অফিসিয়াল সিল ও স্বাক্ষরযুক্ত কপির জন্য কলেজ অফিসে যোগাযোগ করুন।' : 'Results on this website are online copies; contact the college office for an officially sealed and signed copy.'}</li>
                <li>{isBn ? 'প্রকাশিত ফলাফল শুধু নির্দিষ্ট পরীক্ষা, রোল ও রেজিস্ট্রেশন নম্বরের ভিত্তিতে দেখানো হয়।' : 'Published results are shown only for the specified examination, roll and registration numbers.'}</li>
                <li>{isBn ? 'যাচাই প্রক্রিয়াধীন তথ্য স্পষ্টভাবে চিহ্নিত; তা অফিসিয়াল নিশ্চিতকরণ হিসেবে গণ্য হবে না।' : 'Information awaiting verification is clearly marked and must not be treated as official confirmation.'}</li>
                <li>{isBn ? 'ডকুমেন্ট শুধু অনুমোদিত প্রকাশনা থেকে ডাউনলোড করুন এবং পরিবর্তন বা ভুল উপস্থাপন করবেন না।' : 'Download documents only from authorised publications and do not alter or misrepresent them.'}</li>
              </ul>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Copyright className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'মেধাস্বত্ব ও ব্যবহারের সীমা' : 'Intellectual property and acceptable use'}
              </h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn
                  ? 'ওয়েবসাইটের লেখা, লোগো, ডকুমেন্ট ও ডিজাইন সংশ্লিষ্ট অধিকারধারীদের সম্পত্তি। ব্যক্তিগত, শিক্ষামূলক বা অফিসিয়াল প্রয়োজনে যুক্তিসঙ্গত ব্যবহার অনুমোদিত; বাণিজ্যিক পুনঃপ্রকাশ, স্বয়ংক্রিয় স্ক্র্যাপিং, ক্ষতিকর কোড, স্প্যাম বা সেবা ব্যাহত করার কার্যক্রম নিষিদ্ধ।'
                  : 'Text, logos, documents and design on this website belong to their respective rights holders. Reasonable personal, educational or official use is permitted; commercial republication, automated scraping, malicious code, spam or activity that disrupts the service is prohibited.'}
              </p>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Wrench className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'সেবার প্রাপ্যতা ও পরিবর্তন' : 'Availability and changes'}
              </h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn
                  ? 'রক্ষণাবেক্ষণ, নিরাপত্তা বা কারিগরি কারণে সেবা সাময়িকভাবে বন্ধ থাকতে পারে। তথ্য, সময়সূচি ও ফিচার আগে নোটিশ ছাড়াই সংশোধন বা হালনাগাদ করা হতে পারে। গুরুত্বপূর্ণ সিদ্ধান্তের আগে কলেজ অফিস থেকে তথ্য নিশ্চিত করুন।'
                  : 'The service may be temporarily unavailable for maintenance, security or technical reasons. Information, schedules and features may be corrected or updated without prior notice. Confirm important details with the college office before relying on them.'}
              </p>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Gavel className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                {isBn ? 'দায়বদ্ধতার সীমা ও প্রযোজ্য আইন' : 'Limitation and governing law'}
              </h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn
                  ? 'ওয়েবসাইটটি “যেমন আছে” ভিত্তিতে প্রদান করা হয়। অনুমতিহীন ব্যবহার, তৃতীয় পক্ষের লিংক বা সেবা ব্যাহত হওয়ার ফলে উদ্ভূত ক্ষতির জন্য কলেজ কর্তৃপক্ষকে দায়ী করা যাবে না, যতটা প্রযোজ্য আইনে অনুমোদিত। বাংলাদেশের প্রযোজ্য আইন এই শর্তগুলো নিয়ন্ত্রণ করবে।'
                  : 'The website is provided “as is”. To the extent permitted by applicable law, the college authority is not liable for loss arising from unauthorised use, third-party links or service interruption. Applicable laws of Bangladesh govern these terms.'}
              </p>
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="text-lg font-extrabold">{isBn ? 'যোগাযোগ' : 'Contact'}</h2>
              <p className="prose-bn mt-3 text-sm">
                {isBn ? 'শর্তাবলি সম্পর্কে প্রশ্ন থাকলে ' : 'If you have questions about these terms, use the '}
                <Link to="/contact" className="font-bold text-pine-700 underline underline-offset-4 dark:text-pine-300">
                  {t('nav.contact')}
                </Link>
                {isBn ? ' পেজের মাধ্যমে কলেজ প্রশাসনের সাথে যোগাযোগ করুন।' : ' page to contact college administration.'}
              </p>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/privacy" className="text-sm font-bold text-pine-700 hover:underline dark:text-pine-300">
              {t('nav.privacy')} →
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
