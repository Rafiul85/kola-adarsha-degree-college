import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  KeyRound,
  LogOut,
  Mail,
  Menu,
  Moon,
  ScrollText,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
  Bell,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useI18n } from '../../lib/i18n'
import { cn } from '../../lib/format'
import { FALLBACK_INSTITUTION } from '../../lib/constants'
import type { Role } from '../../lib/types'

type NavItem = { to: string; key: string; icon: typeof LayoutDashboard; end?: boolean }

const adminNav: NavItem[] = [
  { to: '/dashboard', key: 'dashboard.overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/notices', key: 'dashboard.notices', icon: Bell },
  { to: '/dashboard/events', key: 'dashboard.events', icon: CalendarDays },
  { to: '/dashboard/teachers', key: 'dashboard.teachers', icon: Users },
  { to: '/dashboard/students', key: 'dashboard.students', icon: GraduationCap },
  { to: '/dashboard/results', key: 'dashboard.results', icon: ClipboardList },
  { to: '/dashboard/academics', key: 'dashboard.academics', icon: BookOpen },
  { to: '/dashboard/documents', key: 'dashboard.documents', icon: FileText },
  { to: '/dashboard/messages', key: 'dashboard.messages', icon: Mail },
  { to: '/dashboard/users', key: 'dashboard.users', icon: ShieldCheck },
  { to: '/dashboard/settings', key: 'dashboard.settings', icon: Settings },
  { to: '/dashboard/audit', key: 'dashboard.audit', icon: ScrollText },
]

const roleNav: Record<Role, NavItem[]> = {
  admin: adminNav,
  teacher: [{ to: '/dashboard', key: 'dashboard.overview', icon: LayoutDashboard, end: true }],
  student: [{ to: '/dashboard', key: 'dashboard.overview', icon: LayoutDashboard, end: true }],
}

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const { t, lang, toggleLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const nav = user ? roleNav[user.role] : []

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  async function handleSignOut() {
    setBusy(true)
    try {
      await signOut()
      navigate('/')
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10 text-white">
          <span className="text-lg font-extrabold leading-none">ক</span>
          <span className="mt-0.5 h-0.5 w-4 rounded bg-pine-300" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-white">{FALLBACK_INSTITUTION.nameBn}</p>
          <p className="font-latin truncate text-[0.58rem] uppercase tracking-[0.1em] text-slate-400">
            {t(`role.${user.role}`)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
          aria-label={t('nav.close')}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="ড্যাশবোর্ড নেভিগেশন">
        <p className="px-2 pb-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">
          {t('nav.menu')}
        </p>
        {nav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'mb-0.5 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-pine-600 text-white'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white',
                )
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{t(item.key)}</span>
            </NavLink>
          )
        })}
        <div className="my-3 border-t border-white/10" />
        <NavLink
          to="/dashboard/account"
          className={({ isActive }) =>
            cn(
              'mb-0.5 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              isActive ? 'bg-pine-600 text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white',
            )
          }
        >
          <KeyRound className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          {t('dashboard.account')}
        </NavLink>
        <Link
          to="/"
          className="mb-0.5 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white"
        >
          <Home className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          {t('dashboard.backToSite')}
        </Link>
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="truncate text-sm font-semibold text-white">{user.displayName}</p>
          <p className="truncate text-[0.68rem] text-slate-400">{user.email}</p>
          <p className="mt-1 text-[0.65rem] font-semibold text-pine-300">{t(`role.${user.role}`)}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/8 hover:text-white disabled:opacity-60"
        >
          <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
          {t('action.signOut')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-paper dark:bg-[#07131f]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-navy-950 lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-navy-950/70" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label={t('nav.menu')} className="absolute inset-y-0 left-0 w-[min(19rem,90vw)] bg-navy-950 shadow-2xl">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-slate-300 p-2 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
                aria-label={t('nav.menu')}
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900 dark:text-white">{t(`dashboard.${user.role}`)}</p>
                <p className="truncate text-[0.68rem] text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Link
                to="/"
                className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:inline-flex dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {t('dashboard.backToSite')}
              </Link>
              <button
                type="button"
                onClick={toggleLang}
                className="rounded-lg px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {lang === 'bn' ? 'EN' : 'বাংলা'}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={theme === 'light' ? 'ডার্ক থিম চালু করুন' : 'লাইট থিম চালু করুন'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label={t('action.signOut')}
                disabled={busy}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {user.mustChangePassword ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
              <p>{t('dashboard.passwordBanner')}</p>
              <Link to="/dashboard/account" className="font-bold underline underline-offset-4">
                {t('dashboard.changePassword')}
              </Link>
            </div>
          </div>
        ) : null}

        <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
