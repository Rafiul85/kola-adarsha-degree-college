import type { KeyboardEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronRight as Chevron, Home } from 'lucide-react'
import { cn, formatNumber } from '../../lib/format'
import { useI18n } from '../../lib/i18n'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items, light = false }: { items: Crumb[]; light?: boolean }) {
  const { t } = useI18n()
  return (
    <nav aria-label="ব্রেডক্রাম্ব" className="mb-5">
      <ol className={cn('flex flex-wrap items-center gap-1.5 text-xs', light ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400')}>
        <li>
          <Link
            to="/"
            className={cn('inline-flex items-center gap-1 rounded px-1 py-0.5 hover:underline', light ? 'hover:text-white' : 'hover:text-navy-900 dark:hover:text-white')}
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            {t('breadcrumb.home')}
          </Link>
        </li>
        {items.map((item) => (
          <li key={`${item.label}-${item.to || ''}`} className="flex items-center gap-1.5">
            <Chevron className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
            {item.to ? (
              <Link to={item.to} className={cn('rounded px-1 py-0.5 hover:underline', light ? 'hover:text-white' : 'hover:text-navy-900 dark:hover:text-white')}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={light ? 'text-white' : 'font-medium text-slate-700 dark:text-slate-200'}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
}) {
  return (
    <div className="hero-grid relative overflow-hidden bg-navy-950 text-white">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" aria-hidden="true" />
      <div className="absolute -bottom-36 right-24 h-72 w-72 rounded-full border border-white/5" aria-hidden="true" />
      <div className="container-page relative py-9 sm:py-12">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} light /> : null}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-pine-300">{eyebrow}</p>
            ) : null}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">{title}</h1>
            {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="section-eyebrow mb-1.5">{eyebrow}</p> : null}
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-[1.7rem]">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  const { t, lang } = useI18n()
  if (pageCount <= 1) return null
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value))
  if (page >= pageCount - 2) [pageCount - 1, pageCount - 2, pageCount - 3].forEach((value) => pages.add(value))
  const sorted = [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b)

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-between gap-3" aria-label="পৃষ্ঠা পরিবর্তন">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('common.page')} {formatNumber(page, lang)} / {formatNumber(pageCount, lang)}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('common.previous')}
        </button>
        {sorted.map((value, index) => {
          const previous = sorted[index - 1]
          const gap = previous && value - previous > 1
          return (
            <span key={value} className="flex items-center gap-1.5">
              {gap ? <span className="px-1 text-slate-400">…</span> : null}
              <button
                type="button"
                onClick={() => onChange(value)}
                aria-current={value === page ? 'page' : undefined}
                className={cn(
                  'min-h-9 min-w-9 rounded-lg border px-2 text-xs font-bold',
                  value === page
                    ? 'border-navy-900 bg-navy-900 text-white dark:border-pine-500 dark:bg-pine-600'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {formatNumber(value, lang)}
              </button>
            </span>
          )
        })}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t('common.next')}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

export interface TabItem {
  id: string
  label: string
  count?: number
}

export function Tabs({
  items,
  active,
  onChange,
  variant = 'underline',
  className,
}: {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pills'
  className?: string
}) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = items.findIndex((item) => item.id === active)
    let nextIndex = index
    if (event.key === 'ArrowLeft') nextIndex = index <= 0 ? items.length - 1 : index - 1
    if (event.key === 'ArrowRight') nextIndex = index >= items.length - 1 ? 0 : index + 1
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = items.length - 1
    onChange(items[nextIndex].id)
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    buttons[nextIndex]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="বিভাগ"
      onKeyDown={onKeyDown}
      className={cn(
        'flex gap-1 overflow-x-auto',
        variant === 'underline'
          ? 'border-b border-slate-200 dark:border-slate-800'
          : 'flex-wrap rounded-xl bg-slate-100 p-1 dark:bg-slate-800',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === active
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-1.5 px-3.5 text-sm font-semibold transition-colors',
              variant === 'underline'
                ? selected
                  ? 'border-b-2 border-pine-600 text-navy-900 dark:border-pine-400 dark:text-white'
                  : 'border-b-2 border-transparent text-slate-500 hover:text-navy-800 dark:text-slate-400 dark:hover:text-slate-200'
                : selected
                  ? 'rounded-lg bg-white text-navy-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'rounded-lg text-slate-600 hover:text-navy-900 dark:text-slate-300 dark:hover:text-white',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
