import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  MapPin,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useI18n } from '../../lib/i18n'
import { useApi } from '../../lib/api'
import type { Settings } from '../../lib/types'
import { FALLBACK_INSTITUTION } from '../../lib/constants'
import { cn } from '../../lib/format'

const primaryLinks = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/about', key: 'nav.about' },
  { to: '/teachers', key: 'nav.teachers' },
  { to: '/students', key: 'nav.students' },
  { to: '/results', key: 'nav.results' },
  { to: '/academics', key: 'nav.academics' },
  { to: '/admission', key: 'nav.admission' },
  { to: '/notices', key: 'nav.notices' },
]

const moreLinks = [
  { to: '/events', key: 'nav.events' },
  { to: '/contact', key: 'nav.contact' },
  { to: '/faq', key: 'nav.faq' },
  { to: '/privacy', key: 'nav.privacy' },
  { to: '/terms', key: 'nav.terms' },
]

export function Header() {
  const { t, lang, toggleLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const mobileCloseRef = useRef<HTMLButtonElement>(null)
  const { data } = useApi<{ settings: Settings }>('/api/public/settings')
  const institution = data?.settings.institution

  const nameBn = institution?.nameBn || FALLBACK_INSTITUTION.nameBn
  const nameEn = institution?.nameEn || FALLBACK_INSTITUTION.nameEn
  const tagline =
    (lang === 'bn' ? data?.settings.content.taglineBn : data?.settings.content.taglineEn) ||
    (lang === 'bn' ? FALLBACK_INSTITUTION.taglineBn : FALLBACK_INSTITUTION.taglineEn)
  const locationBn = institution?.addressBn || FALLBACK_INSTITUTION.locationBn
  const eiin = institution?.eiin || FALLBACK_INSTITUTION.eiin

  useEffect(() => {
    setMobileOpen(false)
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!moreOpen) return
    function onPointerDown(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    mobileCloseRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  const moreActive = moreLinks.some((link) => location.pathname.startsWith(link.to))

  return (
    <header className="no-print">
      <div className="bg-navy-950 text-slate-300">
        <div className="container-page flex min-h-9 flex-wrap items-center justify-between gap-2 py-1.5 text-[0.7rem]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-pine-300" aria-hidden="true" />
              {locationBn}
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <span className="text-slate-500">EIIN</span>
              <span className="font-latin rounded bg-white/10 px-1.5 py-0.5 font-semibold tracking-wide text-white">{eiin}</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleLang}
              className="rounded px-2 py-1 font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
              aria-label={lang === 'bn' ? 'Switch interface language to English' : 'বাংলা ইন্টারফেসে পরিবর্তন করুন'}
            >
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </button>
            <span className="h-3 w-px bg-white/20" aria-hidden="true" />
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
              aria-label={theme === 'light' ? 'ডার্ক থিম চালু করুন' : 'লাইট থিম চালু করুন'}
            >
              {theme === 'light' ? <Moon className="h-3.5 w-3.5" aria-hidden="true" /> : <Sun className="h-3.5 w-3.5" aria-hidden="true" />}
              <span className="hidden sm:inline">{theme === 'light' ? (lang === 'bn' ? 'ডার্ক' : 'Dark') : lang === 'bn' ? 'লাইট' : 'Light'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3 rounded-lg" aria-label={`${nameBn} — হোম`}>
            <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-900 text-white shadow-sm dark:bg-pine-700 sm:h-14 sm:w-14">
              <span className="text-xl font-extrabold leading-none sm:text-2xl">ক</span>
              <span className="mt-1 h-0.5 w-5 rounded bg-pine-300" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-extrabold leading-tight text-navy-900 dark:text-white sm:text-xl">{nameBn}</span>
              <span className="font-latin block truncate text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 sm:text-xs">
                {nameEn}
              </span>
              <span className="mt-0.5 hidden truncate text-xs text-pine-700 dark:text-pine-300 md:block">{tagline}</span>
            </span>
          </Link>
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-800 dark:bg-pine-600 dark:hover:bg-pine-500"
            >
              {user ? <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
              {user ? t('nav.dashboard') : t('nav.login')}
            </Link>
            <Link
              to="/students"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-pine-200 bg-pine-50 px-3 text-sm font-semibold text-pine-800 transition hover:bg-pine-100 dark:border-pine-800 dark:bg-pine-950 dark:text-pine-200 dark:hover:bg-pine-900"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              {t('quick.studentPortal')}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200"
            aria-label={t('nav.menu')}
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('nav.menu')}</span>
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="container-page hidden items-center justify-between gap-4 lg:flex">
          <nav aria-label="প্রধান নেভিগেশন" className="flex flex-1 items-center gap-0.5">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'relative inline-flex min-h-12 items-center px-2.5 text-[0.82rem] font-semibold transition-colors xl:px-3',
                    isActive
                      ? 'text-navy-950 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-t after:bg-pine-600 dark:text-white dark:after:bg-pine-400'
                      : 'text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white',
                  )
                }
              >
                {t(link.key)}
              </NavLink>
            ))}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                className={cn(
                  'inline-flex min-h-12 items-center gap-1 px-2.5 text-[0.82rem] font-semibold transition-colors xl:px-3',
                  moreActive
                    ? 'text-navy-950 underline decoration-pine-600 decoration-2 underline-offset-[18px] dark:text-white dark:decoration-pine-400'
                    : 'text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white',
                )}
              >
                {t('nav.more')}
                <ChevronDown className={cn('h-4 w-4 transition-transform', moreOpen && 'rotate-180')} aria-hidden="true" />
              </button>
              {moreOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  {moreLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      role="menuitem"
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-navy-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      {t(link.key)}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  <Link
                    to="/students"
                    role="menuitem"
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-pine-800 hover:bg-pine-50 dark:text-pine-200 dark:hover:bg-pine-950"
                  >
                    {t('quick.studentPortal')}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ) : null}
            </div>
          </nav>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-bold text-navy-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {user ? t('nav.dashboard') : t('nav.login')}
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
            className="absolute inset-y-0 right-0 flex w-[min(22rem,92vw)] flex-col bg-white shadow-2xl dark:bg-slate-950"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-navy-900 dark:text-white">{nameBn}</p>
                <p className="font-latin truncate text-[0.65rem] uppercase tracking-wide text-slate-500">{nameEn}</p>
              </div>
              <button
                ref={mobileCloseRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={t('nav.close')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="মোবাইল নেভিগেশন">
              <p className="px-2 pb-1 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">{t('nav.allLinks')}</p>
              {[...primaryLinks, ...moreLinks].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={'end' in link ? Boolean(link.end) : false}
                  className={({ isActive }) =>
                    cn(
                      'mb-0.5 flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold',
                      isActive
                        ? 'bg-navy-900 text-white dark:bg-pine-600'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
                    )
                  }
                >
                  {t(link.key)}
                </NavLink>
              ))}
            </nav>
            <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <Link
                to={user ? '/dashboard' : '/login'}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-bold text-white dark:bg-pine-600"
              >
                {user ? <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
                {user ? t('nav.dashboard') : t('nav.login')}
              </Link>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <button type="button" onClick={toggleLang} className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {lang === 'bn' ? 'English' : 'বাংলা'}
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
                  {theme === 'light' ? (lang === 'bn' ? 'ডার্ক থিম' : 'Dark theme') : lang === 'bn' ? 'লাইট থিম' : 'Light theme'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
