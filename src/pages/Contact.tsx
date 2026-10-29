import { useState, type FormEvent } from 'react'
import { Clock, Mail, MapPin, Phone, Send, ShieldAlert } from 'lucide-react'
import { api, useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Settings } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { Alert, ErrorState, LoadingBlock } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/Navigation'
import { Button } from '../components/ui/Button'
import { TextAreaField, TextField } from '../components/ui/Form'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  website: '',
}

export default function Contact() {
  usePageMeta({
    title: 'যোগাযোগ',
    description: 'কোলা আদর্শ ডিগ্রি কলেজের ঠিকানা, যোগাযোগের তথ্য এবং অনলাইন বার্তা পাঠানোর ফর্ম।',
  })
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<{ settings: Settings }>('/api/public/settings')
  const [form, setForm] = useState(initialForm)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const isBn = lang === 'bn'
  const institution = data?.settings.institution

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setSent(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    setSending(true)
    try {
      await api('/api/public/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setSent(true)
      setForm(initialForm)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.contact')}
        title={t('contact.title')}
        description={t('contact.intro')}
        breadcrumbs={[{ label: t('contact.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section className="card p-6 sm:p-8" aria-labelledby="contact-form-title">
            <h2 id="contact-form-title" className="text-xl font-extrabold">
              {t('contact.formTitle')}
            </h2>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{t('contact.formNote')}</p>

            {sent ? (
              <Alert kind="success" className="mt-5" title={t('common.yes')}>
                {t('contact.success')}
              </Alert>
            ) : null}

            {formError ? (
              <Alert kind="error" className="mt-5">
                {formError}
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextField
                label={t('contact.name')}
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                autoComplete="name"
                minLength={2}
                maxLength={120}
                required
              />
              <TextField
                label={t('contact.email')}
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                autoComplete="email"
                required
              />
              <TextField
                label={t('contact.phone')}
                type="tel"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                autoComplete="tel"
                maxLength={30}
              />
              <TextField
                label={t('contact.subject')}
                value={form.subject}
                onChange={(event) => update('subject', event.target.value)}
                minLength={3}
                maxLength={160}
                required
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  label={t('contact.message')}
                  value={form.message}
                  onChange={(event) => update('message', event.target.value)}
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  required
                  hint={isBn ? '১০ থেকে ৫০০০ অক্ষর।' : 'Between 10 and 5,000 characters.'}
                />
              </div>
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => update('website', event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" loading={sending} className="w-full sm:w-auto">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {sending ? t('action.sending') : t('action.submit')}
                </Button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            {loading && !data ? <LoadingBlock /> : null}
            {error && !data ? <ErrorState message={error} onRetry={reload} /> : null}

            {institution ? (
              <>
                <div className="card p-6">
                  <h2 className="text-base font-extrabold">{isBn ? 'কলেজ অফিস' : 'College office'}</h2>
                  <ul className="mt-4 space-y-4 text-sm">
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                      <div>
                        <p className="font-bold">{institution.nameBn}</p>
                        <p className="mt-0.5 text-xs leading-6 text-slate-500 dark:text-slate-400">
                          {isBn ? institution.addressBn : institution.addressEn}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'ফোন' : 'Phone'}</p>
                        <p className="mt-0.5">{institution.phone || t('common.notAvailable')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-4.5 w-4.5 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{isBn ? 'ইমেইল' : 'Email'}</p>
                        <p className="mt-0.5 break-all">{institution.email || t('common.notAvailable')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('contact.officeHours')}</p>
                        <p className="mt-0.5">
                          {(isBn ? institution.officeHoursBn : institution.officeHoursEn) || t('common.notAvailable')}
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                  <p className="mt-2 font-bold">{isBn ? 'ম্যাপ ও যাচাই' : 'Map and verification'}</p>
                  <p className="mt-1 text-xs leading-6">{t('contact.mapNote')}</p>
                </div>

                <div className="card p-5 text-xs leading-6 text-slate-500 dark:text-slate-400">
                  EIIN <span className="font-latin font-bold text-navy-900 dark:text-white">{institution.eiin}</span>
                  <br />
                  {t('footer.siteNote')}
                </div>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
