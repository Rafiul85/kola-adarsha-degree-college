import { useMemo, useState, type FormEvent } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { api, ApiError, useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../context/ToastContext'
import { usePageMeta } from '../../components/SEO'
import { ResourceManager, type ResourceConfig } from '../../components/admin/ResourceManager'
import { Alert, Badge, StatusBadge } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { CheckboxField, SelectField } from '../../components/ui/Form'
import type { AdminList, Examination, ImportPreview, ImportRow } from '../../lib/types'
import { formatDate } from '../../lib/format'

const CSV_HEADERS = ['roll', 'registration', 'studentName', 'gpa', 'resultStatus', 'subjects']

function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          value += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        value += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(value)
      value = ''
    } else if (char === '\n') {
      row.push(value)
      rows.push(row)
      row = []
      value = ''
    } else if (char !== '\r') {
      value += char
    }
  }
  if (value.length || row.length) {
    row.push(value)
    rows.push(row)
  }
  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ''))
}

function parseSubjectLines(raw: unknown) {
  const text = String(raw || '').trim()
  if (!text) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.lastIndexOf(':')
      if (separator < 0) return { name: line, marks: Number.NaN }
      return {
        name: line.slice(0, separator).trim(),
        marks: Number(line.slice(separator + 1).trim()),
      }
    })
}

function rowsToRecords(rows: string[][]): { records: Record<string, unknown>[]; error: string } {
  if (rows.length < 2) return { records: [], error: 'CSV ফাইলে হেডার ও অন্তত একটি সারি থাকতে হবে।' }
  const headers = rows[0].map((header) => header.trim().toLowerCase())
  const index = (name: string) => headers.indexOf(name.toLowerCase())
  const rollIndex = index('roll')
  const nameIndex = index('studentname') >= 0 ? index('studentname') : index('name')
  const subjectIndex = index('subjects')
  if (rollIndex < 0 || nameIndex < 0) {
    return { records: [], error: 'CSV-তে roll এবং studentName কলাম থাকতে হবে।' }
  }
  const registrationIndex = index('registration')
  const gpaIndex = index('gpa')
  const outcomeIndex = index('resultstatus') >= 0 ? index('resultstatus') : index('outcome')

  const records = rows.slice(1).map((cells) => {
    const cell = (position: number) => (position >= 0 ? String(cells[position] ?? '').trim() : '')
    const gpaRaw = cell(gpaIndex)
    const outcome = cell(outcomeIndex).toLowerCase() || 'pass'
    const record: Record<string, unknown> = {
      roll: cell(rollIndex),
      registration: cell(registrationIndex),
      studentName: cell(nameIndex),
      gpa: gpaRaw === '' ? null : Number(gpaRaw),
      outcome,
      subjects: parseSubjectLines(cell(subjectIndex)),
    }
    return record
  })
  return { records, error: '' }
}

function downloadTemplate() {
  const lines = [
    CSV_HEADERS.join(','),
    '101234,1500123456,উদাহরণ নাম,4.25,pass,বাংলা:85|ইংরেজি:78|গণিত:72',
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'results-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function PreviewTable({ rows, lang }: { rows: ImportRow[]; lang: 'bn' | 'en' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="table-base min-w-[48rem]">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{lang === 'bn' ? 'রোল' : 'Roll'}</th>
            <th scope="col">{lang === 'bn' ? 'নাম' : 'Name'}</th>
            <th scope="col">GPA</th>
            <th scope="col">{lang === 'bn' ? 'ফলাফল' : 'Outcome'}</th>
            <th scope="col">{lang === 'bn' ? 'অবস্থা' : 'Check'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((row) => {
            const data = row.data as { roll?: string; studentName?: string; gpa?: number | null; outcome?: string }
            return (
              <tr key={row.row} className={row.errors.length ? 'bg-red-50/60 dark:bg-red-950/20' : row.duplicate ? 'bg-amber-50/60 dark:bg-amber-950/20' : undefined}>
                <td>{row.row}</td>
                <td className="font-latin">{data.roll || '—'}</td>
                <td>{data.studentName || '—'}</td>
                <td>{data.gpa === null || data.gpa === undefined ? '—' : data.gpa}</td>
                <td>{data.outcome ? <StatusBadge status={data.outcome} /> : '—'}</td>
                <td>
                  {row.errors.length ? (
                    <ul className="space-y-1 text-[0.68rem] leading-5 text-red-700 dark:text-red-300">
                      {row.errors.map((message, position) => <li key={position}>{message}</li>)}
                    </ul>
                  ) : row.duplicate ? (
                    <Badge tone="amber">{lang === 'bn' ? 'বিদ্যমান ফলাফল' : 'Existing result'}</Badge>
                  ) : (
                    <Badge tone="green">{lang === 'bn' ? 'নতুন' : 'New'}</Badge>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length > 100 ? (
        <p className="border-t border-slate-200 p-2 text-center text-[0.68rem] text-slate-500 dark:border-slate-700">
          {lang === 'bn' ? `প্রথম ১০০টি সারি দেখানো হচ্ছে; মোট ${rows.length}।` : `Showing the first 100 of ${rows.length} rows.`}
        </p>
      ) : null}
    </div>
  )
}

export default function AdminResults() {
  usePageMeta({ title: 'ফলাফল ব্যবস্থাপনা', noindex: true })
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const { data: examsData } = useApi<AdminList<Examination>>('/api/admin/examinations')
  const [examinationId, setExaminationId] = useState('')
  const [fileName, setFileName] = useState('')
  const [records, setRecords] = useState<Record<string, unknown>[]>([])
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mode, setMode] = useState<'skip' | 'overwrite'>('skip')
  const [publish, setPublish] = useState(false)
  const [confirmOverwrite, setConfirmOverwrite] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState<'validate' | 'import' | ''>('')
  const [refreshToken, setRefreshToken] = useState(0)
  const isBn = lang === 'bn'

  const examOptions = useMemo(
    () =>
      (examsData?.items || []).map((exam) => ({
        value: exam.id,
        label: `${exam.name}${exam.sessionName ? ` — ${exam.sessionName}` : ''}${exam.programName ? ` (${exam.programName})` : ''} · ${t(`status.${exam.status}`)}`,
      })),
    [examsData, t],
  )

  async function readFile(file: File) {
    setError('')
    setPreview(null)
    setResult('')
    const text = await file.text()
    const parsed = parseCsv(text)
    const converted = rowsToRecords(parsed)
    if (converted.error) {
      setError(converted.error)
      setRecords([])
      setFileName('')
      return
    }
    setRecords(converted.records)
    setFileName(file.name)
  }

  async function validate(event: FormEvent) {
    event.preventDefault()
    setError('')
    setResult('')
    if (!examinationId) {
      setError(isBn ? 'প্রথমে পরীক্ষা নির্বাচন করুন।' : 'Select an examination first.')
      return
    }
    if (!records.length) {
      setError(isBn ? 'একটি CSV ফাইল নির্বাচন করুন।' : 'Choose a CSV file.')
      return
    }
    setBusy('validate')
    try {
      const response = await api<ImportPreview>('/api/admin/results/validate', {
        method: 'POST',
        body: JSON.stringify({ examinationId, records }),
      })
      setPreview(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy('')
    }
  }

  async function importResults() {
    if (!preview) return
    setError('')
    setResult('')
    if (mode === 'overwrite' && !confirmOverwrite) {
      setError(t('dashboard.overwriteConfirm'))
      return
    }
    setBusy('import')
    try {
      const response = await api<{ created: number; updated: number; skipped: number; backup: string; message: string }>(
        '/api/admin/results/import',
        {
          method: 'POST',
          body: JSON.stringify({
            examinationId,
            records,
            mode,
            publish,
            confirmOverwrite: mode === 'overwrite' ? confirmOverwrite : false,
          }),
        },
      )
      setResult(
        response.message +
          (response.backup
            ? ` ${isBn ? 'ব্যাকআপ:' : 'Backup:'} ${response.backup.split(/[\\/]/).pop()}`
            : ''),
      )
      toast(response.message)
      setPreview(null)
      setRecords([])
      setFileName('')
      setRefreshToken((value) => value + 1)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'OVERWRITE_CONFIRMATION') {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : t('common.error'))
      }
    } finally {
      setBusy('')
    }
  }

  const config: ResourceConfig = {
    entity: 'results',
    title: t('dashboard.results'),
    description: isBn
      ? 'নতুন ফলাফল সাধারণত CSV আমদানির মাধ্যমে যুক্ত করুন। ম্যানুয়াল এন্ট্রি শুধু সংশোধনের জন্য ব্যবহার করুন। প্রকাশের আগে পরীক্ষা প্রকাশিত থাকতে হবে।'
      : 'Add results primarily through CSV import. Use manual entry only for corrections. The examination must be published before results are published.',
    canDelete: true,
    searchPlaceholder: isBn ? 'রোল, রেজিস্ট্রেশন বা নাম খুঁজুন' : 'Search roll, registration or name',
    fields: [
      {
        name: 'examinationId',
        label: isBn ? 'পরীক্ষা' : 'Examination',
        type: 'select',
        required: true,
        colSpan: 2,
        options: (examsData?.items || []).map((exam) => ({
          value: exam.id,
          label: `${exam.name}${exam.sessionName ? ` — ${exam.sessionName}` : ''}`,
        })),
      },
      { name: 'roll', label: t('dashboard.roll'), required: true, max: 40 },
      { name: 'registration', label: t('dashboard.registration'), required: true, max: 60 },
      { name: 'studentName', label: isBn ? 'শিক্ষার্থীর নাম' : 'Student name', required: true, colSpan: 2, max: 160 },
      { name: 'gpa', label: 'GPA', type: 'number', min: 0, max: 5, step: 0.01 },
      {
        name: 'outcome',
        label: isBn ? 'ফলাফল' : 'Outcome',
        type: 'select',
        required: true,
        defaultValue: 'pass',
        options: ['pass', 'fail', 'withheld', 'absent'].map((value) => ({ value, label: t(`status.${value}`) })),
      },
      {
        name: 'subjects',
        label: isBn ? 'বিষয় ও নম্বর' : 'Subjects and marks',
        type: 'subjectlines',
        colSpan: 2,
        hint: isBn ? 'প্রতি লাইনে একটি বিষয়: বাংলা: 85' : 'One subject per line: Bangla: 85',
      },
      { name: 'publishedAt', label: t('results.publishedAt'), type: 'date' },
    ],
    columns: [
      {
        key: 'studentName',
        label: isBn ? 'শিক্ষার্থী' : 'Student',
        render: (item) => (
          <div>
            <p className="font-semibold">{String(item.studentName)}</p>
            <p className="text-[0.68rem] text-slate-500 dark:text-slate-400">
              {String(item.roll || '')} · {String(item.registration || '')}
            </p>
          </div>
        ),
      },
      {
        key: 'examinationId',
        label: isBn ? 'পরীক্ষা' : 'Examination',
        render: (item) => (
          <span className="text-xs">
            {(examsData?.items || []).find((exam) => exam.id === item.examinationId)?.name || '—'}
          </span>
        ),
      },
      {
        key: 'gpa',
        label: 'GPA',
        render: (item) => <span className="font-bold">{item.gpa === null || item.gpa === undefined ? '—' : String(item.gpa)}</span>,
      },
      {
        key: 'outcome',
        label: isBn ? 'ফলাফল' : 'Outcome',
        render: (item) => <StatusBadge status={String(item.outcome || '')} />,
      },
      {
        key: 'publishedAt',
        label: t('results.publishedAt'),
        render: (item) => <span className="text-xs">{formatDate(String(item.publishedAt || ''), lang)}</span>,
      },
    ],
    prepare: (values) => ({
      ...values,
      subjects: parseSubjectLines(values.subjects),
      gpa: values.gpa === '' || values.gpa === null || values.gpa === undefined ? null : Number(values.gpa),
    }),
  }

  return (
    <div className="space-y-6">
      <section className="card p-5" aria-labelledby="import-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 id="import-heading" className="flex items-center gap-2 text-xl font-extrabold">
              <FileSpreadsheet className="h-5 w-5 text-pine-700 dark:text-pine-300" aria-hidden="true" />
              {t('dashboard.importTitle')}
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t('dashboard.importSteps')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('dashboard.downloadTemplate')}
          </Button>
        </div>

        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {t('dashboard.csvFormat')}
        </p>

        <form onSubmit={validate} className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectField
            label={isBn ? 'পরীক্ষা' : 'Examination'}
            value={examinationId}
            onChange={(event) => {
              setExaminationId(event.target.value)
              setPreview(null)
            }}
            placeholder={isBn ? 'পরীক্ষা নির্বাচন করুন' : 'Select an examination'}
            options={examOptions}
            required
            hint={isBn ? 'ফলাফল প্রকাশের আগে পরীক্ষা প্রকাশ করতে হবে।' : 'Publish the examination before publishing its results.'}
          />
          <div>
            <label htmlFor="results-csv" className="field-label">{t('dashboard.importFile')}</label>
            <input
              id="results-csv"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void readFile(file)
              }}
              className="field-input py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-pine-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-pine-800 dark:file:bg-pine-950 dark:file:text-pine-200"
            />
            <p className="field-help">{fileName || (isBn ? 'সর্বোচ্চ ১০০০ সারি।' : 'Up to 1000 rows.')}</p>
          </div>
          {error ? <div className="sm:col-span-2"><Alert kind="error">{error}</Alert></div> : null}
          {result ? <div className="sm:col-span-2"><Alert kind="success">{result}</Alert></div> : null}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" loading={busy === 'validate'}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {busy === 'validate' ? t('dashboard.validating') : t('dashboard.validate')}
            </Button>
            {preview ? (
              <Button type="button" variant="secondary" onClick={importResults} loading={busy === 'import'}>
                {busy === 'import' ? t('dashboard.importing') : t('dashboard.import')}
              </Button>
            ) : null}
          </div>
        </form>

        {preview ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-200">{preview.validCount}</p>
                <p className="text-xs font-semibold">{t('dashboard.validRows')}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-200">{preview.duplicateCount}</p>
                <p className="text-xs font-semibold">{t('dashboard.duplicateRows')}</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center dark:border-red-900 dark:bg-red-950/30">
                <p className="text-2xl font-extrabold text-red-800 dark:text-red-200">{preview.errorCount}</p>
                <p className="text-xs font-semibold">{t('dashboard.errorRows')}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label={isBn ? 'ডুপ্লিকেটের ক্ষেত্রে' : 'When a duplicate exists'}
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as 'skip' | 'overwrite')
                  setConfirmOverwrite(false)
                }}
                options={[
                  { value: 'skip', label: isBn ? 'বাদ দিন' : 'Skip' },
                  { value: 'overwrite', label: t('dashboard.overwrite') },
                ]}
              />
              <div className="space-y-2">
                <CheckboxField
                  label={t('dashboard.publishAfterImport')}
                  hint={isBn ? 'শুধু প্রকাশিত পরীক্ষার জন্য।' : 'Only for published examinations.'}
                  checked={publish}
                  onChange={(event) => setPublish(event.target.checked)}
                />
                {mode === 'overwrite' ? (
                  <CheckboxField
                    label={t('dashboard.overwriteConfirm')}
                    checked={confirmOverwrite}
                    onChange={(event) => setConfirmOverwrite(event.target.checked)}
                  />
                ) : null}
              </div>
            </div>

            <PreviewTable rows={preview.rows} lang={lang} />
          </div>
        ) : null}
      </section>

      <ResourceManager config={config} refreshToken={refreshToken} />
    </div>
  )
}
