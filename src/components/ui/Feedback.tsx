import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Inbox, Info, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/format'
import { useI18n } from '../../lib/i18n'
import { Button } from './Button'

type AlertKind = 'info' | 'success' | 'warning' | 'error'

const alertStyles: Record<AlertKind, string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-100',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100',
  warning:
    'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100',
  error: 'border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100',
}

const alertIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
}

export function Alert({
  kind = 'info',
  title,
  children,
  className,
}: {
  kind?: AlertKind
  title?: string
  children: ReactNode
  className?: string
}) {
  const Icon = alertIcons[kind]
  return (
    <div
      className={cn('flex gap-3 rounded-xl border p-4 text-sm leading-6', alertStyles[kind], className)}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="mb-1 font-bold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  )
}

type Tone = 'neutral' | 'navy' | 'green' | 'amber' | 'red' | 'sky' | 'purple'

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  navy: 'bg-navy-100 text-navy-800 dark:bg-navy-800 dark:text-navy-100',
  green: 'bg-pine-100 text-pine-800 dark:bg-pine-900 dark:text-pine-100',
  amber: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100',
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-100',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-100',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-bold leading-none',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const statusTones: Record<string, Tone> = {
  draft: 'neutral',
  review: 'amber',
  published: 'green',
  archived: 'neutral',
  active: 'green',
  inactive: 'neutral',
  graduated: 'sky',
  new: 'sky',
  read: 'neutral',
  pass: 'green',
  fail: 'red',
  withheld: 'amber',
  absent: 'neutral',
  full_time: 'navy',
  part_time: 'sky',
  guest: 'purple',
  other: 'neutral',
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n()
  const key = `status.${status}`
  const label = t(key)
  return <Badge tone={statusTones[status] || 'neutral'}>{label === key ? status : label}</Badge>
}

export function DemoBadge() {
  const { t } = useI18n()
  return <Badge tone="amber">{t('common.demo')}</Badge>
}

export function PendingBadge() {
  const { t } = useI18n()
  return <Badge tone="amber">{t('common.pending')}</Badge>
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact = false,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center dark:border-slate-700 dark:bg-slate-900/40',
        compact ? 'py-8' : 'py-14',
      )}
    >
      <div className="mb-3 rounded-full bg-white p-3 text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500">
        {icon || <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <p className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800', className)} aria-hidden="true" />
}

export function LoadingBlock({ label }: { label?: string }) {
  const { t } = useI18n()
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-pine-600 dark:text-pine-300" aria-hidden="true" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{label || t('common.loading')}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center dark:border-red-900 dark:bg-red-950/30" role="alert">
      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
      <p className="text-sm font-medium text-red-900 dark:text-red-100">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('action.retry')}
        </Button>
      ) : null}
    </div>
  )
}
