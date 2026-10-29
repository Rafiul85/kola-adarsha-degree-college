import { useState, type FormEvent } from 'react'
import { Download, FileText, Pencil, Upload } from 'lucide-react'
import { api, useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../context/ToastContext'
import { usePageMeta } from '../../components/SEO'
import type { DocumentItem } from '../../lib/types'
import { DemoBadge, EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Overlay'
import { FormGrid, SelectField, TextField } from '../../components/ui/Form'
import { formatBytes, formatDate } from '../../lib/format'

const statuses = ['draft', 'published', 'archived']

export default function AdminDocuments() {
  usePageMeta({ title: 'ডকুমেন্ট ব্যবস্থাপনা', noindex: true })
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const { data, loading, error, reload } = useApi<{ items: DocumentItem[] }>('/api/admin/documents')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentItem | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('draft')
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const isBn = lang === 'bn'

  function openUpload() {
    setTitle('')
    setCategory('')
    setStatus('draft')
    setFile(null)
    setFormError('')
    setUploadOpen(true)
  }

  function openEdit(doc: DocumentItem) {
    setTitle(doc.title)
    setCategory(doc.category)
    setStatus(doc.status)
    setFormError('')
    setEditing(doc)
  }

  async function upload(event?: FormEvent) {
    event?.preventDefault()
    setFormError('')
    if (!file) {
      setFormError(isBn ? 'একটি ফাইল নির্বাচন করুন।' : 'Choose a file.')
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.set('title', title)
      form.set('category', category)
      form.set('status', status)
      form.set('file', file)
      await api('/api/admin/documents', { method: 'POST', body: form })
      toast(isBn ? 'ডকুমেন্ট আপলোড হয়েছে।' : 'Document uploaded.')
      setUploadOpen(false)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit(event?: FormEvent) {
    event?.preventDefault()
    if (!editing) return
    setFormError('')
    setBusy(true)
    try {
      await api(`/api/admin/documents/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, category, status }),
      })
      toast(t('dashboard.saved'))
      setEditing(null)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('dashboard.documents')}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {isBn
              ? 'সিল, স্বাক্ষর বা ব্যক্তিগত তথ্যসহ ফাইল প্রকাশের আগে অনুমোদন ও গোপনীয়তা যাচাই করুন। ডকুমেন্ট কেবল নিয়ন্ত্রিত ডাউনলোড রুটে পরিবেশন করা হয়।'
              : 'Verify approval and privacy before publishing files containing seals, signatures or personal data. Documents are served only through controlled download routes.'}
          </p>
        </div>
        <Button onClick={openUpload}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          {t('dashboard.uploadDocument')}
        </Button>
      </div>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {data && !data.items.length ? <EmptyState title={t('dashboard.noDocuments')} /> : null}

      {data && data.items.length ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base min-w-[46rem]">
              <thead>
                <tr>
                  <th scope="col">{t('dashboard.titleLabel')}</th>
                  <th scope="col">{t('dashboard.categoryLabel')}</th>
                  <th scope="col">{t('dashboard.file')}</th>
                  <th scope="col">{t('common.date')}</th>
                  <th scope="col">{t('common.status')}</th>
                  <th scope="col" className="text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-pine-700 dark:text-pine-300" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="font-semibold">{doc.title}</p>
                          <div className="mt-1 flex gap-1">{doc.isDemo ? <DemoBadge /> : null}</div>
                        </div>
                      </div>
                    </td>
                    <td>{doc.category}</td>
                    <td>
                      <p className="max-w-[16rem] truncate text-xs">{doc.filename}</p>
                      <p className="text-[0.68rem] text-slate-500">{formatBytes(doc.size, lang)}</p>
                    </td>
                    <td className="text-xs">{formatDate(doc.uploadedAt, lang)}</td>
                    <td><StatusBadge status={doc.status} /></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/api/admin/documents/${doc.id}/download`}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`${t('action.download')}: ${doc.title}`}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEdit(doc)}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`${t('action.edit')}: ${doc.title}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Modal
        open={uploadOpen}
        onClose={() => (busy ? undefined : setUploadOpen(false))}
        title={t('dashboard.uploadDocument')}
        description={t('dashboard.fileHint')}
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={busy}>{t('action.cancel')}</Button>
            <Button onClick={() => void upload()} loading={busy}>{t('dashboard.upload')}</Button>
          </>
        }
      >
        <form onSubmit={upload} className="space-y-4">
          <FormGrid>
            <TextField label={t('dashboard.titleLabel')} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={220} className="sm:col-span-2" />
            <TextField label={t('dashboard.categoryLabel')} value={category} onChange={(event) => setCategory(event.target.value)} required maxLength={100} />
            <SelectField
              label={t('common.status')}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={statuses.map((value) => ({ value, label: t(`status.${value}`) }))}
            />
            <div className="sm:col-span-2">
              <label htmlFor="document-file" className="field-label">{t('dashboard.file')}</label>
              <input
                id="document-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx,.xls,.xlsx"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="field-input py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-pine-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-pine-800 dark:file:bg-pine-950 dark:file:text-pine-200"
                required
              />
              <p className="field-help">{t('dashboard.fileHint')}</p>
            </div>
          </FormGrid>
          {formError ? <p className="text-sm text-red-700 dark:text-red-300" role="alert">{formError}</p> : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => (busy ? undefined : setEditing(null))}
        title={t('action.edit')}
        description={editing?.filename}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>{t('action.cancel')}</Button>
            <Button onClick={() => void saveEdit()} loading={busy}>{t('action.save')}</Button>
          </>
        }
      >
        <form onSubmit={saveEdit} className="space-y-4">
          <TextField label={t('dashboard.titleLabel')} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={220} />
          <TextField label={t('dashboard.categoryLabel')} value={category} onChange={(event) => setCategory(event.target.value)} required maxLength={100} />
          <SelectField
            label={t('common.status')}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={statuses.map((value) => ({ value, label: t(`status.${value}`) }))}
            hint={isBn ? 'আর্কাইভ করলে পাবলিক পেজ ও ডাউনলোড থেকে সরিয়ে নেওয়া হবে।' : 'Archiving removes it from public pages and downloads.'}
          />
          {formError ? <p className="text-sm text-red-700 dark:text-red-300" role="alert">{formError}</p> : null}
        </form>
      </Modal>
    </div>
  )
}
