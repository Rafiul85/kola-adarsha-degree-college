import { useState, type FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  GraduationCap,
  Printer,
  Search,
  ShieldAlert,
} from 'lucide-react'
import { api, useApi, ApiError } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { PublicResult, ResultMeta } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { Alert, EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../components/ui/Feedback'
import { PageHeader } from '../components/ui/Navigation'
import { Button, ButtonLink } from '../components/ui/Button'
import { SelectField, TextField } from '../components/ui/Form'
import { formatDate, formatNumber } from '../lib/format'

export default function Results() {
  usePageMeta({
    title: 'পরীক্ষার ফলাফল',
    description: 'কোলা আদর্শ ডিগ্রি কলেজের অফিসিয়ালভাবে প্রকাশিত পরীক্ষার ফলাফল যাচাই করুন। পরীক্ষা, রোল ও রেজিস্ট্রেশন নম্বর প্রয়োজন।',
  })
  const { t, lang } = useI18n()
  const { data: meta, loading, error, reload } = useApi<ResultMeta>('/api/public/results-meta')
  const [examinationId, setExaminationId] = useState('')
  const [roll, setRoll] = useState('')
  const [registration, setRegistration] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [result, setResult] = useState<PublicResult | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSearchError('')
    setResult(null)
    setSearched(true)
    if (!examinationId || !roll.trim() || !registration.trim()) {
      setSearchError(t('dashboard.requiredFields'))
      return
    }
    setSearching(true)
    try {
      const response = await api<{ result: PublicResult }>('/api/public/results/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examinationId, roll: roll.trim(), registration: registration.trim() }),
      })
      setResult(response.result)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
        setSearchError(err.message)
      } else {
        setSearchError(err instanceof Error ? err.message : t('results.notFound'))
      }
    } finally {
      setSearching(false)
    }
  }

  const examinationOptions = (meta?.examinations || []).map((exam) => ({
    value: exam.id,
    label: `${exam.name} — ${exam.programName || ''}${exam.sessionName ? ` (${exam.sessionName})` : ''}`,
  }))
  const hasPublishedResults = Boolean(meta && (meta.examinations.length > 0 || meta.totalPublishedResults > 0))

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.results')}
        title={t('results.title')}
        description={t('results.intro')}
        breadcrumbs={[{ label: t('results.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[24rem_1fr] lg:items-start">
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">{t('results.search')}</h2>
            <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">{t('results.formHint')}</p>

            {loading ? <div className="mt-4"><LoadingBlock /></div> : null}
            {error ? <div className="mt-4"><ErrorState message={error} onRetry={reload} /></div> : null}

            {meta ? (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <SelectField
                  label={t('results.examination')}
                  value={examinationId}
                  onChange={(event) => {
                    setExaminationId(event.target.value)
                    setResult(null)
                    setSearched(false)
                  }}
                  placeholder={t('results.examination')}
                  options={examinationOptions}
                  required
                />
                <TextField
                  label={t('results.roll')}
                  value={roll}
                  onChange={(event) => setRoll(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={40}
                  required
                />
                <TextField
                  label={t('results.registration')}
                  value={registration}
                  onChange={(event) => setRegistration(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={60}
                  required
                />
                {searchError ? (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {searchError}
                  </div>
                ) : null}
                <Button type="submit" loading={searching} className="w-full">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  {searching ? t('results.searching') : t('results.search')}
                </Button>
                <p className="text-[0.68rem] leading-5 text-slate-500 dark:text-slate-400">
                  {t('results.unofficial')}
                </p>
              </form>
            ) : null}

            {meta && !hasPublishedResults ? (
              <div className="mt-4">
                <EmptyState compact title={t('results.noResults')} description={t('results.formHint')} />
              </div>
            ) : null}
          </div>

          <div>
            {result ? (
              <section className="print-sheet card overflow-hidden" aria-labelledby="result-heading">
                <div className="border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50 sm:p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="section-eyebrow">{t('results.publishedAt')}</p>
                      <h2 id="result-heading" className="mt-1 text-xl font-extrabold">{result.examination.name}</h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {result.programName} · {result.sessionName}
                      </p>
                    </div>
                    <span className="print-only text-sm font-bold">কোলা আদর্শ ডিগ্রি কলেজ</span>
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
                      <Printer className="h-4 w-4" aria-hidden="true" />
                      {t('action.print')}
                    </Button>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('results.student')}</dt>
                      <dd className="mt-0.5 font-bold">{result.studentName}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('results.roll')}</dt>
                      <dd className="font-latin mt-0.5 font-bold">{result.roll}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('results.registration')}</dt>
                      <dd className="font-latin mt-0.5 font-bold">{result.registration}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">{t('results.gpa')}</dt>
                      <dd className="mt-0.5 flex items-center gap-2 text-lg font-extrabold">
                        {result.gpa === null ? '—' : formatNumber(result.gpa, lang)}
                        <StatusBadge status={result.outcome} />
                      </dd>
                    </div>
                  </dl>

                  {result.group ? (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {t('dashboard.group')}: {result.group}
                    </p>
                  ) : null}

                  {result.subjects.length ? (
                    <div className="mt-6 overflow-x-auto">
                      <table className="table-base min-w-[28rem]">
                        <caption className="mb-2 text-left text-sm font-bold">{t('results.subjects')}</caption>
                        <thead>
                          <tr>
                            <th scope="col">বিষয় / Subject</th>
                            <th scope="col" className="text-right">{t('results.marks')}</th>
                            <th scope="col" className="text-right">{t('results.grade')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.subjects.map((subject, index) => (
                            <tr key={`${subject.name}-${index}`}>
                              <td>{subject.name}</td>
                              <td className="text-right">{formatNumber(subject.marks, lang)}</td>
                              <td className="text-right font-bold">{subject.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                      {lang === 'bn' ? 'বিষয়ভিত্তিক নম্বর প্রকাশ করা হয়নি।' : 'Subject-wise marks have not been published.'}
                    </p>
                  )}

                  <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>
                      {t('results.unofficial')}
                      <span className="mt-1 block opacity-80">
                        {t('results.publishedAt')}: {formatDate(result.publishedAt, lang)}
                      </span>
                    </p>
                  </div>
                </div>
              </section>
            ) : searched && !searching && !searchError ? (
              <EmptyState title={t('results.notFound')} />
            ) : (
              <div className="card p-6 sm:p-8">
                <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="section-eyebrow">{t('results.title')}</p>
                    <h2 className="mt-1 text-xl font-extrabold">
                      {lang === 'bn' ? 'প্রকাশিত ফলাফল যাচাই করুন' : 'Check a published result'}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                      {lang === 'bn'
                        ? 'বাম দিকের ফর্মে পরীক্ষা, রোল নম্বর ও রেজিস্ট্রেশন নম্বর দিন। শুধু অফিসিয়ালভাবে প্রকাশিত ফলাফল দেখা যাবে।'
                        : 'Enter the examination, roll number and registration number in the form. Only officially published results are available.'}
                    </p>
                    {meta && meta.latestPublishedAt ? (
                      <p className="mt-3 text-xs font-semibold text-pine-700 dark:text-pine-300">
                        {t('results.publishedAt')}: {formatDate(meta.latestPublishedAt, lang)}
                      </p>
                    ) : null}
                  </div>
                  <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-pine-50 text-pine-700 dark:bg-pine-950 dark:text-pine-300">
                    <ClipboardCheck className="h-10 w-10" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <GraduationCap className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    <p className="mt-1.5 text-xs font-bold">{lang === 'bn' ? 'শুধু প্রকাশিত ফলাফল' : 'Published results only'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    <p className="mt-1.5 text-xs font-bold">{lang === 'bn' ? 'রোল ও রেজিস্ট্রেশন যাচাই' : 'Roll and registration check'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <Download className="h-5 w-5 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                    <p className="mt-1.5 text-xs font-bold">{lang === 'bn' ? 'প্রিন্টযোগ্য অনলাইন কপি' : 'Printable online copy'}</p>
                  </div>
                </div>
              </div>
            )}

            <Alert kind="warning" className="mt-5" title={t('results.unofficial')}>
              {lang === 'bn'
                ? 'ওয়েবসাইটে প্রকাশিত ফলাফল অনলাইন কপি। অফিসিয়াল সিল ও স্বাক্ষরযুক্ত কপির জন্য কলেজ অফিসে যোগাযোগ করুন। কোনো ফলাফল নিয়ে আপত্তি থাকলে দ্রুত কলেজে জানান।'
                : 'Results on this website are online copies. Contact the college office for an officially sealed and signed copy. Report any discrepancy to the college promptly.'}
            </Alert>

            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink to="/contact" variant="outline" size="sm">{t('nav.contact')}</ButtonLink>
              <ButtonLink to="/faq" variant="ghost" size="sm">{t('nav.faq')}</ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
