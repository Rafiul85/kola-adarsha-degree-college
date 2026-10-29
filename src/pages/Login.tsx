import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../lib/i18n'
import { Alert } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/Form'
import { usePageMeta } from '../components/SEO'

function safeNext(value: string | null): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  if (value.startsWith('/login') || value.startsWith('/reset-password')) return '/dashboard'
  return value
}

export default function Login() {
  usePageMeta({ title: 'সাইন ইন', noindex: true })
  const { t, lang } = useI18n()
  const { signIn, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isBn = lang === 'bn'

  if (!authLoading && user) {
    return <Navigate to={next} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <p className="section-eyebrow">{t('nav.login')}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{t('login.title')}</h1>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{t('login.subtitle')}</p>

      {error ? (
        <Alert kind="error" className="mt-5">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <TextField
          label={t('login.email')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          inputMode="email"
          required
          autoFocus
        />
        <div>
          <label htmlFor="login-password" className="field-label">
            {t('login.password')}
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="field-input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              aria-label={showPassword ? (isBn ? 'পাসওয়ার্ড লুকান' : 'Hide password') : isBn ? 'পাসওয়ার্ড দেখান' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link to="/forgot-password" className="font-bold text-pine-700 hover:underline dark:text-pine-300">
            {t('login.forgot')}
          </Link>
          <span className="text-slate-400">{t('login.roleHint')}</span>
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {submitting ? t('action.signingIn') : t('action.signIn')}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs leading-6 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{t('login.accountsNote')}</p>
      </div>

      <p className="mt-4 text-[0.68rem] leading-5 text-slate-500 dark:text-slate-400">{t('login.demoNote')}</p>
    </div>
  )
}
