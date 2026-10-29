import { Link, Outlet } from 'react-router-dom'
import { ArrowLeft, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useI18n } from '../../lib/i18n'
import { FALLBACK_INSTITUTION } from '../../lib/constants'

export function AuthLayout() {
  const { t, lang, toggleLang } = useI18n()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-paper dark:bg-[#07131f]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <aside className="hero-grid relative hidden overflow-hidden bg-navy-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 top-10 h-80 w-80 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-white/5" aria-hidden="true" />
          <Link to="/" className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white/10 text-white">
              <span className="text-xl font-extrabold leading-none">ক</span>
              <span className="mt-1 h-0.5 w-5 rounded bg-pine-300" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-extrabold text-white">{FALLBACK_INSTITUTION.nameBn}</span>
              <span className="font-latin block text-[0.65rem] uppercase tracking-[0.12em] text-slate-300">
                {FALLBACK_INSTITUTION.nameEn}
              </span>
            </span>
          </Link>

          <div className="relative max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pine-300">{t('hero.eyebrow')}</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white xl:text-5xl">{t('login.title')}</h1>
            <p className="mt-4 text-base leading-8 text-slate-300">{t('login.subtitle')}</p>
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-pine-300" aria-hidden="true" />
              <p className="text-sm leading-7 text-slate-300">{t('login.accountsNote')}</p>
            </div>
          </div>

          <p className="relative text-xs leading-6 text-slate-500">
            EIIN <span className="font-latin font-bold text-slate-300">{FALLBACK_INSTITUTION.eiin}</span> ·{' '}
            {lang === 'bn' ? FALLBACK_INSTITUTION.locationBn : 'Kola, Badalgachhi, Naogaon, Rajshahi'}
          </p>
        </aside>

        <div className="flex min-h-screen flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('action.back')}
            </Link>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleLang}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
              >
                {lang === 'bn' ? 'English' : 'বাংলা'}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                aria-label={theme === 'light' ? 'ডার্ক থিম চালু করুন' : 'লাইট থিম চালু করুন'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
            <div className="w-full max-w-md">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <span className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-navy-900 text-white">
                  <span className="text-lg font-extrabold leading-none">ক</span>
                </span>
                <div>
                  <p className="text-sm font-extrabold text-navy-900 dark:text-white">{FALLBACK_INSTITUTION.nameBn}</p>
                  <p className="font-latin text-[0.6rem] uppercase tracking-wide text-slate-500">{FALLBACK_INSTITUTION.nameEn}</p>
                </div>
              </div>
              <Outlet />
            </div>
          </div>
          <p className="px-4 pb-6 text-center text-[0.7rem] leading-5 text-slate-400 sm:px-8">
            {t('footer.siteNote')}
          </p>
        </div>
      </div>
    </div>
  )
}
