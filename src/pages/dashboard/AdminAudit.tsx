import { useMemo, useState } from 'react'
import { History, Search, ShieldCheck } from 'lucide-react'
import { useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { usePageMeta } from '../../components/SEO'
import type { AuditLog } from '../../lib/types'
import { Alert, Badge, EmptyState, ErrorState, LoadingBlock } from '../../components/ui/Feedback'
import { formatDateTime } from '../../lib/format'

type AuditTone = 'green' | 'red' | 'amber' | 'sky' | 'navy' | 'purple' | 'neutral'

const actionTones: Record<string, AuditTone> = {
  create: 'green',
  update: 'sky',
  delete: 'red',
  publish: 'green',
  archive: 'amber',
  login: 'navy',
  logout: 'neutral',
  'login.failed': 'red',
  import: 'purple',
  backup: 'navy',
  restore: 'amber',
  password: 'amber',
}

function humanize(value: string): string {
  return value
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (character) => character.toUpperCase())
}

export default function AdminAudit() {
  usePageMeta({ title: 'অডিট লগ', noindex: true })
  const { t, lang } = useI18n()
  const isBn = lang === 'bn'
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(200)
  const [role, setRole] = useState('all')

  const path = useMemo(() => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (query.trim()) params.set('q', query.trim())
    return `/api/admin/audit-logs?${params.toString()}`
  }, [limit, query])

  const { data, loading, error, reload } = useApi<{ items: AuditLog[]; total: number }>(path)

  const items = useMemo(() => {
    const rows = data?.items || []
    if (role === 'all') return rows
    return rows.filter((item) => item.actorRole === role)
  }, [data, role])

  const roles = useMemo(() => {
    const set = new Set((data?.items || []).map((item) => item.actorRole))
    return Array.from(set).sort()
  }, [data])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <History className="h-6 w-6 text-pine-600 dark:text-pine-300" aria-hidden="true" />
          {t('dashboard.audit')}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          {isBn
            ? 'প্রশাসনিক কার্যক্রমের অপরিবর্তনীয় রেকর্ড। কে, কখন, কোন তথ্যে পরিবর্তন করেছেন তা এখানে দেখা যায়। এই লগ শুধুমাত্র পড়ার জন্য; কোনো এন্ট্রি সম্পাদনা বা মুছে ফেলা যায় না।'
            : 'An append-only record of administrative activity: who changed what, and when. This log is read-only; no entry can be edited or deleted here.'}
        </p>
      </div>

      <Alert kind="info" title={isBn ? 'গোপনীয়তা' : 'Privacy'}>
        {isBn
          ? 'অডিট লগে ব্যক্তিগত তথ্য থাকতে পারে। এটি শুধুমাত্র অনুমোদিত প্রশাসকের কাছে প্রকাশ করুন এবং প্রয়োজনের অতিরিক্ত সময় সংরক্ষণ করবেন না।'
          : 'Audit logs can contain personal data. Share them only with authorised administrators and do not retain them longer than necessary.'}
      </Alert>

      <div className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isBn ? 'ব্যক্তি, কাজ, তথ্য বা বিবরণ খুঁজুন' : 'Search actor, action, entity or details'}
            aria-label={t('dashboard.searchRecords')}
            className="field-input pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">{isBn ? 'ভূমিকা' : 'Role'}</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label={isBn ? 'ভূমিকা অনুযায়ী ফিল্টার' : 'Filter by role'}
            className="field-input min-w-32"
          >
            <option value="all">{isBn ? 'সব' : 'All'}</option>
            {roles.map((value) => (
              <option key={value} value={value}>{humanize(value)}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">{isBn ? 'সর্বোচ্চ' : 'Limit'}</span>
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            aria-label={isBn ? 'সর্বোচ্চ সংখ্যা' : 'Maximum entries'}
            className="field-input min-w-24"
          >
            {[50, 100, 200, 500].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {isBn
            ? `${items.length}টি এন্ট্রি দেখানো হচ্ছে (মোট ${data.total}টি)।`
            : `Showing ${items.length} of ${data.total} entries.`}
        </p>
      ) : null}

      {data && !items.length ? (
        <EmptyState
          title={isBn ? 'কোনো অডিট এন্ট্রি পাওয়া যায়নি' : 'No audit entries found'}
          description={isBn ? 'অন্য শব্দ দিয়ে খুঁজুন অথবা ফিল্টার পরিবর্তন করুন।' : 'Try a different search term or filter.'}
        />
      ) : null}

      {items.length ? (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[11rem_9rem_1fr_9rem_9rem] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400 lg:grid">
            <span>{isBn ? 'সময়' : 'Time'}</span>
            <span>{isBn ? 'ব্যক্তি' : 'Actor'}</span>
            <span>{isBn ? 'কার্যক্রম' : 'Activity'}</span>
            <span>{isBn ? 'তথ্য' : 'Entity'}</span>
            <span>{isBn ? 'ভূমিকা' : 'Role'}</span>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((entry) => (
              <li key={entry.id} className="grid gap-2 px-4 py-4 text-sm lg:grid-cols-[11rem_9rem_1fr_9rem_9rem] lg:items-start lg:gap-3">
                <time dateTime={entry.createdAt} className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDateTime(entry.createdAt, lang)}
                </time>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{entry.actorName || '—'}</p>
                  <p className="truncate text-[0.68rem] text-slate-400">{entry.actorId || '—'}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={actionTones[entry.action] || 'neutral'}>{humanize(entry.action)}</Badge>
                    {entry.details ? (
                      <span className="break-words text-slate-600 dark:text-slate-300">{entry.details}</span>
                    ) : null}
                  </div>
                </div>
                <div className="min-w-0 text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{humanize(entry.entity || '—')}</p>
                  {entry.entityId ? <p className="truncate">{entry.entityId}</p> : null}
                </div>
                <div>
                  <Badge tone="navy">
                    <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                    {humanize(entry.actorRole || '—')}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
