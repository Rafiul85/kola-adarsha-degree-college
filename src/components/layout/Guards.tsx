import type { ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../lib/i18n'
import { ButtonLink } from '../ui/Button'
import type { Role } from '../../lib/types'

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper dark:bg-[#07131f]" role="status">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-pine-600 dark:text-pine-300" aria-hidden="true" />
        <p className="text-sm text-slate-500 dark:text-slate-400">লোড হচ্ছে…</p>
      </div>
    </div>
  )
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AuthLoading />
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <Outlet />
}

export function RequireRole({ roles, children }: { roles: Role[]; children?: ReactNode }) {
  const { user } = useAuth()
  const { t } = useI18n()
  if (!user) return null
  if (!roles.includes(user.role)) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <ShieldAlert className="mx-auto h-9 w-9 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">{t('dashboard.noAccess')}</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {t('dashboard.noAccess')} {t('login.roleHint')}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <ButtonLink to="/dashboard">{t('nav.dashboard')}</ButtonLink>
            <Link to="/" className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 underline underline-offset-4 dark:text-slate-200">
              {t('action.goHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }
  return <>{children ?? <Outlet />}</>
}
