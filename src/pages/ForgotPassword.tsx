import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { Alert } from '../components/ui/Feedback'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/Form'
import { usePageMeta } from '../components/SEO'

export default function ForgotPassword() {
  usePageMeta({ title: 'পাসওয়ার্ড রিসেট', noindex: true })
  const { t, lang } = useI18n()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const isBn = lang === 'bn'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <p className="section-eyebrow">{t('nav.login')}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{t('forgot.title')}</h1>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{t('forgot.subtitle')}</p>

      {sent ? (
        <Alert kind="success" className="mt-5" title={isBn ? 'অনুরোধ গ্রহণ করা হয়েছে' : 'Request received'}>
          <p>{t('forgot.sent')}</p>
          <p className="mt-2 text-xs">
            {isBn
              ? 'ইমেইল সেবা এখনো কনফিগার না থাকলে কলেজ প্রশাসন আপনার পরিচয় যাচাই করে একবার ব্যবহারযোগ্য লিংক দিতে পারবে।'
              : 'If email delivery is not configured, college administration can verify your identity and provide a single-use link.'}
          </p>
        </Alert>
      ) : (
        <>
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
              autoComplete="email"
              required
              autoFocus
              hint={isBn ? 'অ্যাকাউন্টে ব্যবহৃত ইমেইলটি দিন।' : 'Enter the email used for your account.'}
            />
            <Button type="submit" loading={submitting} className="w-full">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {submitting ? t('action.sending') : t('forgot.title')}
            </Button>
          </form>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link to="/login" className="inline-flex items-center gap-1 font-bold text-pine-700 hover:underline dark:text-pine-300">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('action.back')}
        </Link>
        <span className="inline-flex items-center gap-1 text-slate-400">
          <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {isBn ? 'নিরাপদ রিসেট' : 'Secure reset'}
        </span>
      </div>
    </div>
  )
}
