import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react'
import { api, useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { Alert, LoadingBlock } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/Form'
import { usePageMeta } from '../components/SEO'

interface TokenInfo {
  valid: boolean
  email: string
}

export default function ResetPassword() {
  usePageMeta({ title: 'নতুন পাসওয়ার্ড দিন', noindex: true })
  const { t, lang } = useI18n()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { data, loading, error } = useApi<TokenInfo>(
    token ? `/api/auth/reset-password/${encodeURIComponent(token)}` : null,
  )
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [done, setDone] = useState(false)
  const isBn = lang === 'bn'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setFormError(t('reset.hint'))
      return
    }
    if (password !== confirm) {
      setFormError(isBn ? 'দুটি পাসওয়ার্ড মিলছে না।' : 'The two passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setDone(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <p className="section-eyebrow">{t('nav.login')}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{t('reset.title')}</h1>

      {!token ? (
        <Alert kind="error" className="mt-5" title={t('reset.invalid')}>
          {isBn
            ? 'রিসেট লিংকে প্রয়োজনীয় টোকেন নেই। কলেজ প্রশাসনের কাছ থেকে নতুন লিংক নিন।'
            : 'The reset link does not contain a token. Request a new link from college administration.'}
        </Alert>
      ) : null}

      {token && loading ? <div className="mt-5"><LoadingBlock /></div> : null}

      {token && error ? (
        <Alert kind="error" className="mt-5" title={t('reset.invalid')}>
          {error}
        </Alert>
      ) : null}

      {done ? (
        <Alert kind="success" className="mt-5" title={t('reset.success')}>
          <p>{isBn ? 'আপনার অন্যান্য সেশন বন্ধ করা হয়েছে।' : 'Your other sessions have been signed out.'}</p>
        </Alert>
      ) : null}

      {token && data?.valid && !done ? (
        <>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
            {isBn ? 'অ্যাকাউন্ট: ' : 'Account: '}
            <span className="font-latin font-bold text-slate-800 dark:text-slate-100">{data.email}</span>
          </p>

          {formError ? (
            <Alert kind="error" className="mt-5">
              {formError}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <TextField
              label={t('reset.newPassword')}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={10}
              required
              hint={t('reset.hint')}
              autoFocus
            />
            <TextField
              label={t('reset.confirmPassword')}
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              minLength={10}
              required
            />
            <Button type="submit" loading={submitting} className="w-full">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {submitting ? t('action.saving') : t('reset.title')}
            </Button>
          </form>
        </>
      ) : null}

      {done ? (
        <Link
          to="/login"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 dark:bg-pine-600 dark:hover:bg-pine-500"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {t('action.signIn')}
        </Link>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link to="/login" className="inline-flex items-center gap-1 font-bold text-pine-700 hover:underline dark:text-pine-300">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('action.back')}
        </Link>
        <Link to="/forgot-password" className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:underline dark:text-slate-400">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          {t('forgot.title')}
        </Link>
      </div>
    </div>
  )
}
