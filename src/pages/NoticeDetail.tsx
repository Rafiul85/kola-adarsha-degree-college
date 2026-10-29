import { ArrowLeft, CalendarDays, Download, Megaphone, Paperclip } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Notice } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { Alert, DemoBadge, ErrorState, LoadingBlock } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/Navigation'
import { formatDate, safeExternalUrl } from '../lib/format'

export default function NoticeDetail() {
  const { id = '' } = useParams()
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<{ notice: Notice }>(
    id ? `/api/public/notices/${encodeURIComponent(id)}` : null,
  )
  const notice = data?.notice
  const isBn = lang === 'bn'

  usePageMeta({
    title: notice?.title || t('notices.detail'),
    description: notice?.summary || t('notices.intro'),
  })

  const attachment = safeExternalUrl(notice?.attachmentUrl)

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.notices')}
        title={t('notices.detail')}
        breadcrumbs={[{ label: t('notices.title'), to: '/notices' }, { label: notice?.title || t('notices.detail') }]}
      />

      <div className="container-page py-10 sm:py-12">
        {loading && !data ? <LoadingBlock /> : null}
        {error && !data ? <ErrorState message={error} onRetry={reload} /> : null}

        {notice ? (
          <article className="mx-auto max-w-4xl">
            <div className="card overflow-hidden">
              <header className="border-b border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-800/40 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-pine-100 px-2.5 py-1 font-bold text-pine-800 dark:bg-pine-950 dark:text-pine-200">
                    {notice.category}
                  </span>
                  {notice.pinned ? (
                    <span className="rounded-full bg-navy-100 px-2.5 py-1 font-bold text-navy-800 dark:bg-navy-800 dark:text-navy-100">
                      {isBn ? 'গুরুত্বপূর্ণ' : 'Important'}
                    </span>
                  ) : null}
                  {notice.isDemo ? <DemoBadge /> : null}
                </div>
                <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{notice.title}</h1>
                {notice.summary ? (
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{notice.summary}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {t('results.publishedAt')}: {formatDate(notice.publishedAt, lang)}
                  </span>
                  {notice.deadline ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                      {t('notices.deadline')}: {formatDate(notice.deadline, lang)}
                    </span>
                  ) : null}
                  {notice.sessionName ? <span>{notice.sessionName}</span> : null}
                </div>
              </header>

              <div className="p-6 sm:p-8">
                {notice.body ? (
                  <div className="prose-bn">{notice.body}</div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.notAvailable')}</p>
                )}

                {attachment ? (
                  <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <Paperclip className="h-4 w-4" aria-hidden="true" />
                      {t('notices.attachment')}
                    </p>
                    <a
                      href={attachment}
                      target={attachment.startsWith('/') ? undefined : '_blank'}
                      rel={attachment.startsWith('/') ? undefined : 'noopener noreferrer'}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-pine-700 hover:underline dark:text-pine-300"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {t('action.download')}
                    </a>
                  </div>
                ) : null}

                <Alert kind="warning" className="mt-7" title={t('home.verificationTitle')}>
                  {isBn
                    ? 'ওয়েবসাইটের নোটিশ অনলাইন কপি। অফিসিয়াল সিল, স্বাক্ষর বা মূল কপির জন্য কলেজ অফিসে যোগাযোগ করুন।'
                    : 'Website notices are online copies. Contact the college office for an officially sealed, signed or original copy.'}
                </Alert>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/notices"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('action.viewAllNotices')}
              </Link>
              <Link
                to="/contact"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-pine-700 hover:underline dark:text-pine-300"
              >
                <Megaphone className="h-4 w-4" aria-hidden="true" />
                {t('nav.contact')}
              </Link>
            </div>
          </article>
        ) : null}

        {!loading && !error && !notice ? <ErrorState message={t('notices.notFound')} /> : null}
      </div>
    </div>
  )
}
