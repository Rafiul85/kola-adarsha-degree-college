import { useState, type FormEvent } from 'react'
import { KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../context/ToastContext'
import { usePageMeta } from '../../components/SEO'
import { Alert } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Form'
import { formatDateTime } from '../../lib/format'

export default function AccountPage() {
  usePageMeta({ title: 'অ্যাকাউন্ট ও পাসওয়ার্ড', noindex: true })
  const { user, refresh } = useAuth()
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError(lang === 'bn' ? 'নতুন পাসওয়ার্ড দুটি মিলছে না।' : 'The new passwords do not match.')
      return
    }
    if (newPassword.length < 10 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError(
        lang === 'bn'
          ? 'পাসওয়ার্ড অন্তত ১০ অক্ষরের হতে হবে এবং এতে ইংরেজি অক্ষর ও সংখ্যা থাকতে হবে।'
          : 'Password must be at least 10 characters and include a letter and a number.',
      )
      return
    }
    setBusy(true)
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      toast(t('dashboard.passwordChanged'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-eyebrow">{t('dashboard.accountSecurity')}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{t('dashboard.account')}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr] lg:items-start">
        <section className="card p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine-700 dark:bg-pine-950 dark:text-pine-300">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">{user.displayName}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.role')}</dt>
              <dd className="font-semibold">{t(`role.${user.role}`)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.lastLogin')}</dt>
              <dd>{user.lastLoginAt ? formatDateTime(user.lastLoginAt, lang) : '—'}</dd>
            </div>
          </dl>
          <Alert kind="info" className="mt-4">{t('dashboard.securityNote')}</Alert>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-pine-700 dark:text-pine-300" aria-hidden="true" />
            <h2 className="text-lg font-extrabold">{t('dashboard.changePassword')}</h2>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'পাসওয়ার্ড অন্তত ১০ অক্ষরের হবে এবং এতে ইংরেজি অক্ষর ও সংখ্যা থাকতে হবে। পরিবর্তনের পর অন্য ডিভাইসের সেশন বন্ধ হবে।'
              : 'Use at least 10 characters including a letter and a number. Other device sessions will be signed out.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 max-w-xl space-y-4">
            <TextField
              label={t('dashboard.currentPassword')}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <TextField
              label={t('dashboard.newPassword')}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={10}
              required
            />
            <TextField
              label={lang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm new password'}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            {error ? <Alert kind="error">{error}</Alert> : null}
            <Button type="submit" loading={busy}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.changePassword')}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}
