import { Link } from 'react-router-dom'
import { ArrowRight, Compass, FileQuestion } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { usePageMeta } from '../components/SEO'

export default function NotFound() {
  const { t, lang } = useI18n()
  usePageMeta({ title: t('notfound.title'), noindex: true })
  const isBn = lang === 'bn'

  return (
    <div className="container-page flex min-h-[65vh] items-center justify-center py-16">
      <div className="max-w-2xl text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-pine-50 text-pine-700 dark:bg-pine-950 dark:text-pine-300">
          <FileQuestion className="h-10 w-10" aria-hidden="true" />
        </span>
        <p className="font-latin mt-6 text-5xl font-extrabold tracking-tight text-slate-300 dark:text-slate-700">404</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{t('notfound.title')}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-400">{t('notfound.body')}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800 dark:bg-pine-600 dark:hover:bg-pine-500"
          >
            {t('action.goHome')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/notices"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            {t('nav.notices')}
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-400">
          {isBn ? 'সহায়তা প্রয়োজন হলে ' : 'If you need assistance, '}
          <Link to="/contact" className="font-bold text-pine-700 hover:underline dark:text-pine-300">
            {t('nav.contact')}
          </Link>
          {isBn ? ' পেজটি ব্যবহার করুন।' : ' page.'}
        </p>
      </div>
    </div>
  )
}
