import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../context/ToastContext'
import { cn, formatDate, toDateInput } from '../../lib/format'
import { ConfirmDialog, Modal } from '../ui/Overlay'
import { Button } from '../ui/Button'
import { CheckboxField, FormGrid, SelectField, TextAreaField, TextField } from '../ui/Form'
import { StatusBadge } from '../ui/Feedback'
import { Pagination } from '../ui/Navigation'

export type AdminFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'tags'
  | 'multiselect'
  | 'subjectlines'

export interface AdminField {
  name: string
  label: string
  type?: AdminFieldType
  required?: boolean
  placeholder?: string
  hint?: string
  options?: { value: string; label: string }[]
  defaultValue?: unknown
  colSpan?: 1 | 2
  min?: number
  max?: number
  step?: number
  rows?: number
  dateValue?: boolean
}

export interface AdminColumn {
  key: string
  label: string
  render?: (item: AdminRecord) => ReactNode
  className?: string
}

export type AdminRecord = { id: string; status?: string } & Record<string, unknown>

interface ResourcePayload {
  items: AdminRecord[]
  total: number
  statuses: string[]
  label: string
}

export interface ResourceConfig {
  entity: string
  title: string
  description?: string
  fields: AdminField[]
  columns: AdminColumn[]
  searchPlaceholder?: string
  emptyText?: string
  canDelete?: boolean
  prepare?: (values: Record<string, unknown>) => Record<string, unknown>
  extraActions?: (item: AdminRecord, reload: () => void) => ReactNode
  onChanged?: () => void
}

function fieldInitial(field: AdminField, item?: AdminRecord | null): string | boolean | string[] {
  const raw = item ? item[field.name] : field.defaultValue
  if (field.type === 'checkbox') return Boolean(raw)
  if (field.type === 'tags') return Array.isArray(raw) ? raw.map(String).join(', ') : String(raw || '')
  if (field.type === 'multiselect') return Array.isArray(raw) ? raw.map(String) : []
  if (field.type === 'subjectlines' && Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return ''
        const subject = entry as { name?: unknown; marks?: unknown }
        return `${String(subject.name || '')}: ${String(subject.marks ?? '')}`
      })
      .filter(Boolean)
      .join('\n')
  }
  if (field.type === 'date') return toDateInput(raw as string)
  if (field.type === 'number') return raw === null || raw === undefined ? '' : String(raw)
  return String(raw ?? '')
}

function coerce(field: AdminField, value: string | boolean | string[]): unknown {
  if (field.type === 'checkbox') return Boolean(value)
  if (field.type === 'multiselect') return Array.isArray(value) ? value : []
  if (field.type === 'number') {
    if (value === '' || value === null || value === undefined) return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
  }
  if (field.type === 'tags') {
    if (Array.isArray(value)) return value
    return String(value)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return String(value ?? '').trim()
}

export function ResourceManager({ config, refreshToken = 0 }: { config: ResourceConfig; refreshToken?: number }) {
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [table, setTable] = useState<ResourcePayload | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminRecord | null | undefined>(undefined)
  const [values, setValues] = useState<Record<string, string | boolean | string[]>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<{ item: AdminRecord; status: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<AdminRecord | null>(null)

  const pageSize = 15

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    api<ResourcePayload>(`/api/admin/${config.entity}`)
      .then((result) => {
        if (active) setTable(result)
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof Error ? err.message : t('common.error'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [config.entity, reloadKey, refreshToken, t])

  function reload() {
    setReloadKey((value) => value + 1)
    config.onChanged?.()
  }

  const items = table?.items || []
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false
      if (!needle) return true
      return Object.values(item).some((value) => {
        if (Array.isArray(value)) return value.join(' ').toLowerCase().includes(needle)
        return String(value ?? '').toLowerCase().includes(needle)
      })
    })
  }, [items, query, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function openCreate() {
    const initial: Record<string, string | boolean | string[]> = {}
    for (const field of config.fields) initial[field.name] = fieldInitial(field)
    setValues(initial)
    setFormError('')
    setEditing(null)
  }

  function openEdit(item: AdminRecord) {
    const initial: Record<string, string | boolean | string[]> = {}
    for (const field of config.fields) initial[field.name] = fieldInitial(field, item)
    setValues(initial)
    setFormError('')
    setEditing(item)
  }

  function closeForm() {
    if (busy) return
    setEditing(undefined)
    setFormError('')
  }

  async function submitForm() {
    const invalid = config.fields.some((field) => {
      if (!field.required) return false
      const value = values[field.name]
      if (field.type === 'checkbox') return false
      return !String(value ?? '').trim()
    })
    if (invalid) {
      setFormError(t('dashboard.requiredFields'))
      return
    }
    setBusy(true)
    setFormError('')
    try {
      const payload: Record<string, unknown> = {}
      for (const field of config.fields) {
        payload[field.name] = coerce(field, values[field.name])
      }
      const prepared = config.prepare ? config.prepare(payload) : payload
      const path = editing?.id ? `/api/admin/${config.entity}/${editing.id}` : `/api/admin/${config.entity}`
      await api(path, {
        method: editing?.id ? 'PUT' : 'POST',
        body: JSON.stringify(prepared),
      })
      toast(t('dashboard.saved'))
      setEditing(undefined)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  async function applyStatus() {
    if (!pendingStatus) return
    setBusy(true)
    try {
      await api(`/api/admin/${config.entity}/${pendingStatus.item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: pendingStatus.status }),
      })
      toast(t('dashboard.statusChanged'))
      setPendingStatus(null)
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!pendingDelete) return
    setBusy(true)
    try {
      await api(`/api/admin/${config.entity}/${pendingDelete.id}`, { method: 'DELETE' })
      toast(t('dashboard.deleted'))
      setPendingDelete(null)
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const statusOptions = (table?.statuses || []).map((status) => ({
    value: status,
    label: t(`status.${status}`) === `status.${status}` ? status : t(`status.${status}`),
  }))

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{config.title}</h1>
          {config.description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{config.description}</p>
          ) : null}
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('action.create')}
        </Button>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder={config.searchPlaceholder || t('dashboard.searchRecords')}
              aria-label={t('dashboard.searchRecords')}
              className="field-input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}
            className="field-input"
            aria-label={t('common.status')}
          >
            <option value="">{t('common.all')}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 card overflow-hidden">
        {loading && !table ? (
          <p className="p-8 text-center text-sm text-slate-500" role="status">
            {t('common.loading')}
          </p>
        ) : null}
        {loadError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-300" role="alert">
              {loadError}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={reload}>
              {t('action.retry')}
            </Button>
          </div>
        ) : null}
        {!loading && !loadError && filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {config.emptyText || t('dashboard.noRecords')}
          </p>
        ) : null}

        {paged.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="table-base min-w-[48rem]">
                <thead>
                  <tr>
                    {config.columns.map((column) => (
                      <th key={column.key} scope="col" className={column.className}>
                        {column.label}
                      </th>
                    ))}
                    <th scope="col">{t('common.status')}</th>
                    <th scope="col" className="text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((item) => (
                    <tr key={item.id}>
                      {config.columns.map((column) => (
                        <td key={column.key} className={column.className}>
                          {column.render
                            ? column.render(item)
                            : column.key === 'createdAt' || column.key === 'updatedAt' || column.key === 'publishedAt'
                              ? formatDate(String(item[column.key] || ''), lang)
                              : String(item[column.key] ?? '—') || '—'}
                        </td>
                      ))}
                      <td>
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={String(item.status || 'draft')} />
                          <select
                            value={String(item.status || '')}
                            onChange={(event) => setPendingStatus({ item, status: event.target.value })}
                            className="mt-1 max-w-[8.5rem] rounded-lg border border-slate-300 bg-white px-2 py-1 text-[0.68rem] dark:border-slate-700 dark:bg-slate-950"
                            aria-label={`${t('common.status')}: ${String(item.title || item.name || item.studentName || item.id)}`}
                          >
                            {(table?.statuses || []).map((status) => (
                              <option key={status} value={status}>
                                {t(`status.${status}`) === `status.${status}` ? status : t(`status.${status}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {config.extraActions?.(item, reload)}
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            aria-label={`${t('action.edit')}: ${String(item.title || item.name || item.studentName || item.id)}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {config.canDelete ? (
                            <button
                              type="button"
                              onClick={() => setPendingDelete(item)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                              aria-label={`${t('action.delete')}: ${String(item.title || item.name || item.studentName || item.id)}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 pb-3">
              <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
            </div>
          </>
        ) : null}
      </div>

      <Modal
        open={editing !== undefined}
        onClose={closeForm}
        title={editing ? t('dashboard.editRecord') : t('dashboard.createRecord')}
        description={config.title}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeForm} disabled={busy}>
              {t('action.cancel')}
            </Button>
            <Button onClick={submitForm} loading={busy}>
              {t('action.save')}
            </Button>
          </>
        }
      >
        {formError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100" role="alert">
            {formError}
          </p>
        ) : null}
        <FormGrid>
          {config.fields.map((field) => {
            const value = values[field.name]
            const common = {
              label: field.label,
              required: field.required,
              hint: field.hint,
              className: field.colSpan === 2 ? 'sm:col-span-2' : undefined,
            }
            if (field.type === 'multiselect') {
              const selected = Array.isArray(value) ? value : []
              return (
                <div key={field.name} className={common.className || 'sm:col-span-2'}>
                  <p className="field-label">{field.label}</p>
                  {field.hint ? <p className="field-help mb-2">{field.hint}</p> : null}
                  <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/40">
                    {(field.options || []).map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.includes(option.value)}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...selected, option.value]
                              : selected.filter((entry) => entry !== option.value)
                            setValues((current) => ({ ...current, [field.name]: next }))
                          }}
                          className="h-4 w-4 rounded border-slate-400 text-pine-600"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                    {(field.options || []).length === 0 ? (
                      <p className="text-xs text-slate-500">{t('common.noData')}</p>
                    ) : null}
                  </div>
                </div>
              )
            }
            if (field.type === 'textarea' || field.type === 'subjectlines') {
              return (
                <TextAreaField
                  key={field.name}
                  {...common}
                  rows={field.type === 'subjectlines' ? field.rows || 6 : field.rows || 5}
                  value={String(value ?? '')}
                  placeholder={field.placeholder || (field.type === 'subjectlines' ? 'বাংলা: 85\nইংরেজি: 78' : undefined)}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              )
            }
            if (field.type === 'select') {
              return (
                <SelectField
                  key={field.name}
                  {...common}
                  value={String(value ?? '')}
                  options={field.options || []}
                  placeholder={field.placeholder || t('common.optional')}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              )
            }
            if (field.type === 'checkbox') {
              return (
                <CheckboxField
                  key={field.name}
                  label={field.label}
                  hint={field.hint}
                  checked={Boolean(value)}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))}
                />
              )
            }
            return (
              <TextField
                key={field.name}
                {...common}
                type={field.type === 'tags' ? 'text' : field.type || 'text'}
                min={field.min}
                max={field.max}
                step={field.step}
                value={String(value ?? '')}
                placeholder={field.placeholder}
                onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              />
            )
          })}
        </FormGrid>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={t('dashboard.statusChanged')}
        message={
          pendingStatus
            ? `${t('common.status')}: ${String(pendingStatus.item.title || pendingStatus.item.name || pendingStatus.item.studentName || pendingStatus.item.id)} → ${t(`status.${pendingStatus.status}`)}`
            : ''
        }
        loading={busy}
        onCancel={() => setPendingStatus(null)}
        onConfirm={applyStatus}
      />

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

export function TextCell({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('block max-w-[18rem] truncate', className)} title={typeof children === 'string' ? children : undefined}>{children}</span>
}
