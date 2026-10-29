import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, Filter, Megaphone, Paperclip, Search } from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Notice } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { DemoBadge, EmptyState, ErrorState, LoadingBlock } from '../components/ui/Feedback'
import { PageHeader, Pagination } from '../components/ui/Navigation'
import { TextField, SelectField } from '../components/ui/Form'
import { Button, ButtonLink } from '../components/ui/Button'
import { formatDate, formatNumber } from '../lib/format'

interface NoticesPayload {
  items: Notice[]
  total: number
  page: number
  pageSize: number
  categories: string[]
}

export default function Notices() {
  usePageMeta({
    title: 'নোটিশ ও বিজ্ঞপ্তি',
    description: 'কোলা আদর্শ ডিগ্রি কলেজের প্রকাশিত নোটিশ, বিজ্ঞপ্তি, ভর্তি ও একাডেমিক ঘোষণা।',
  })
  const { t, lang } = useI18n()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const from = params.get('from') || ''
  const to = params.get('to') || ''
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1)

  const [searchInput, setSearchInput] = useState(q)
  const [fromInput, setFromInput] = useState(from)
  const [toInput, setToInput] = useState(to)

  const path = useMemo(() => {
    const query = new URLSearchParams({ page: String(page) })
    if (q) query.set('q', q)
    if (category) query.set('category', category)
    if (from) query.set('from', from)
    if (to) query.set('to', to)
    return `/api/public/notices?${query.toString()}`
  }, [page, q, category, from, to])

  const { data, loading, error, reload } = useApi<NoticesPayload>(path)
  const filtersActive = Boolean(q || category || from || to)

  function updateParams(changes: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (resetPage) next.delete('page')
    setParams(next, { replace: true })
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    updateParams({ q: searchInput.trim(), from: fromInput, to: toInput })
  }

  function clearFilters() {
    setSearchInput('')
    setFromInput('')
    setToInput('')
    setParams(new URLSearchParams(), { replace: true })
  }

  function goToPage(nextPage: number) {
    updateParams({ page: String(nextPage) }, false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const categoryOptions = (data?.categories || []).map((value) => ({ value, label: value }))

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.notices')}
        title={t('notices.title')}
        description={t('notices.intro')}
        breadcrumbs={[{ label: t('notices.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <form onSubmit={applyFilters} className="card p-4 sm:p-5" role="search" aria-label={t('notices.searchPlaceholder')}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-end">
            <TextField
              label={t('common.search')}
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('notices.searchPlaceholder')}
            />
            <SelectField
              label={t('common.category')}
              value={category}
              onChange={(event) => updateParams({ category: event.target.value })}
              placeholder={t('common.all')}
              options={categoryOptions}
            />
            <TextField label={t('notices.from')} type="date" value={fromInput} onChange={(event) => setFromInput(event.target.value)} />
            <TextField label={t('notices.to')} type="date" value={toInput} onChange={(event) => setToInput(event.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Search className="h-4 w-4" aria-hidden="true" />
                {t('action.search')}
              </Button>
              {filtersActive || searchInput || fromInput || toInput ? (
                <Button type="button" variant="outline" onClick={clearFilters} aria-label={t('action.clear')}>
                  <Filter className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {data ? `${formatNumber(data.total, lang)} ${t('notices.title')}` : t('common.loading')}
          </p>
          {category ? <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.category')}: {category}</p> : null}
        </div>

        <div className="mt-4">
          {loading && !data ? <LoadingBlock /> : null}
          {error && !data ? <ErrorState message={error} onRetry={reload} /> : null}
          {data && data.items.length === 0 ? (
            <EmptyState
              title={t('notices.empty')}
              icon={<Megaphone className="h-6 w-6" aria-hidden="true" />}
              action={<ButtonLink to="/notices" variant="outline" size="sm">{t('action.reset')}</ButtonLink>}
            />
          ) : null}
          {data && data.items.length > 0 ? (
            <>
              <div className="space-y-3">
                {data.items.map((notice) => {
                  const date = new Date(notice.publishedAt)
                  return (
                    <article key={notice.id} className="card p-5 transition hover:border-pine-300 dark:hover:border-pine-700">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex shrink-0 items-center gap-2 sm:w-24 sm:flex-col sm:rounded-xl sm:bg-slate-50 sm:p-2.5 sm:text-center dark:sm:bg-slate-800">
                          <span className="text-2xl font-extrabold leading-none text-navy-900 dark:text-white">
                            {Number.isNaN(date.getTime()) ? '—' : date.getDate()}
                          </span>
                          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
                            {Number.isNaN(date.getTime())
                              ? ''
                              : new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', { month: 'short', year: 'numeric' }).format(date)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-pine-700 dark:text-pine-300">{notice.category}</span>
                            {notice.pinned ? (
                              <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[0.62rem] font-bold text-navy-800 dark:bg-navy-800 dark:text-navy-100">
                                {lang === 'bn' ? 'গুরুত্বপূর্ণ' : 'Important'}
                              </span>
                            ) : null}
                            {notice.isDemo ? <DemoBadge /> : null}
                          </div>
                          <h2 className="mt-1 text-base font-bold leading-7">
                            <Link to={`/notices/${notice.id}`} className="hover:text-pine-700 dark:hover:text-pine-300">
                              {notice.title}
                            </Link>
                          </h2>
                          {notice.summary ? (
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{notice.summary}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.68rem] text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                              {formatDate(notice.publishedAt, lang)}
                            </span>
                            {notice.deadline ? <span>{t('notices.deadline')}: {formatDate(notice.deadline, lang)}</span> : null}
                            {notice.attachmentUrl ? (
                              <span className="inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" aria-hidden="true" />{t('notices.attachment')}</span>
                            ) : null}
                          </div>
                          <Link to={`/notices/${notice.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">
                            {t('action.readMore')}
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
              {data.total > data.pageSize ? (
                <Pagination page={data.page} pageCount={Math.ceil(data.total / data.pageSize)} onChange={goToPage} />
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
