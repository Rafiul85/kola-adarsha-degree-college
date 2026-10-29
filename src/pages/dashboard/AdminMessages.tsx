import { useMemo, useState } from 'react'
import { Check, Mail, MailOpen, Search, Trash2 } from 'lucide-react'
import { api, useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../context/ToastContext'
import { usePageMeta } from '../../components/SEO'
import type { ContactMessage } from '../../lib/types'
import { EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog, Modal } from '../../components/ui/Overlay'
import { Tabs } from '../../components/ui/Navigation'
import { formatDateTime } from '../../lib/format'

export default function AdminMessages() {
  usePageMeta({ title: 'যোগাযোগ বার্তা', noindex: true })
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const { data, loading, error, reload } = useApi<{ items: ContactMessage[] }>('/api/admin/messages')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null)
  const [busy, setBusy] = useState(false)
  const isBn = lang === 'bn'

  const items = data?.items || []
  const counts = {
    all: items.length,
    new: items.filter((item) => item.status === 'new').length,
    read: items.filter((item) => item.status === 'read').length,
    archived: items.filter((item) => item.status === 'archived').length,
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false
      if (!needle) return true
      return `${item.name} ${item.email} ${item.subject} ${item.message}`.toLowerCase().includes(needle)
    })
  }, [items, filter, query])

  async function setStatus(item: ContactMessage, status: string) {
    setBusy(true)
    try {
      await api(`/api/admin/messages/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      toast(t('dashboard.statusChanged'))
      setSelected((current) => (current && current.id === item.id ? { ...current, status: status as ContactMessage['status'] } : current))
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  function openMessage(item: ContactMessage) {
    setSelected(item)
    if (item.status === 'new') void setStatus(item, 'read')
  }

  async function remove() {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await api(`/api/admin/messages/${pendingDelete.id}`, { method: 'DELETE' })
      toast(t('dashboard.deleted'))
      if (selected?.id === pendingDelete.id) setSelected(null)
      setPendingDelete(null)
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t('dashboard.messages')}</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          {isBn
            ? 'যোগাযোগ ফর্মের বার্তা পর্যালোচনা করুন। ব্যক্তিগত তথ্য অনুমতি ছাড়া প্রকাশ বা শেয়ার করবেন না। মুছে ফেলার আগে স্বয়ংক্রিয় ব্যাকআপ তৈরি হয়।'
            : 'Review contact form messages. Do not publish or share personal data without permission. An automatic backup is created before deletion.'}
        </p>
      </div>

      <Tabs
        items={[
          { id: 'all', label: t('common.all'), count: counts.all },
          { id: 'new', label: t('status.new'), count: counts.new },
          { id: 'read', label: t('status.read'), count: counts.read },
          { id: 'archived', label: t('status.archived'), count: counts.archived },
        ]}
        active={filter}
        onChange={setFilter}
        variant="pills"
      />

      <div className="card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isBn ? 'নাম, ইমেইল, বিষয় বা বার্তা খুঁজুন' : 'Search name, email, subject or message'}
            aria-label={t('dashboard.searchRecords')}
            className="field-input pl-9"
          />
        </div>
      </div>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && !filtered.length ? <EmptyState title={t('dashboard.noMessages')} /> : null}

      {filtered.length ? (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((message) => (
            <article key={message.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" onClick={() => openMessage(message)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{message.subject}</p>
                    <StatusBadge status={message.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{message.name} · {message.email}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{message.message}</p>
                  <p className="mt-1 text-[0.68rem] text-slate-400">{formatDateTime(message.createdAt, lang)}</p>
                </button>
                <div className="flex flex-wrap items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => openMessage(message)}>
                    {message.status === 'new' ? <Mail className="h-4 w-4" aria-hidden="true" /> : <MailOpen className="h-4 w-4" aria-hidden="true" />}
                    {isBn ? 'দেখুন' : 'Open'}
                  </Button>
                  {message.status !== 'read' ? (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void setStatus(message, 'read')}>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {t('dashboard.markRead')}
                    </Button>
                  ) : null}
                  {message.status !== 'archived' ? (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void setStatus(message, 'archived')}>
                      {t('action.archive')}
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" className="text-red-700 dark:text-red-300" onClick={() => setPendingDelete(message)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t('action.delete')}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject || ''}
        description={selected ? `${selected.name} · ${selected.email}${selected.phone ? ` · ${selected.phone}` : ''}` : undefined}
        size="lg"
        footer={
          selected ? (
            <>
              {selected.status !== 'new' ? (
                <Button variant="outline" onClick={() => void setStatus(selected, 'new')} disabled={busy}>{t('dashboard.markNew')}</Button>
              ) : null}
              {selected.status !== 'read' ? (
                <Button variant="outline" onClick={() => void setStatus(selected, 'read')} disabled={busy}>{t('dashboard.markRead')}</Button>
              ) : null}
              <Button variant="outline" onClick={() => setSelected(null)}>{t('action.close')}</Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-slate-500">{formatDateTime(selected.createdAt, lang)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">{selected.message}</p>
            <dl className="grid gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Email</dt><dd className="break-all font-semibold">{selected.email}</dd></div>
              <div><dt className="text-xs text-slate-500">{isBn ? 'ফোন' : 'Phone'}</dt><dd>{selected.phone || '—'}</dd></div>
            </dl>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('action.delete')}
        message={t('dashboard.confirmDelete')}
        danger
        loading={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  )
}
