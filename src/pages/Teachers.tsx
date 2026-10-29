import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, Search, SlidersHorizontal, UserRound, Users } from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { Teacher } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { EmptyState, ErrorState, LoadingBlock, PendingBadge } from '../components/ui/Feedback'
import { PageHeader, Pagination } from '../components/ui/Navigation'
import { SelectField, TextField } from '../components/ui/Form'
import { Button, ButtonLink } from '../components/ui/Button'
import { formatNumber } from '../lib/format'

interface TeacherListPayload {
  items: Array<Pick<Teacher, 'id' | 'name' | 'designation' | 'department' | 'qualification' | 'employmentType' | 'email' | 'officeHours' | 'category'>>
  total: number
  page: number
  pageSize: number
  designations: string[]
  departments: string[]
}

export default function Teachers() {
  usePageMeta({
    title: 'শিক্ষকমণ্ডলী',
    description: 'কোলা আদর্শ ডিগ্রি কলেজের শিক্ষক ও কর্মী তালিকা। যাচাইকৃত অনুমোদিত রেকর্ড থেকে প্রকাশিত তথ্য।',
  })
  const { t, lang } = useI18n()
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('')
  const [sort, setSort] = useState('name')
  const [page, setPage] = useState(1)

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), sort })
    if (q) params.set('q', q)
    if (designation) params.set('designation', designation)
    if (department) params.set('department', department)
    return `/api/public/teachers?${params.toString()}`
  }, [page, sort, q, designation, department])

  const { data, loading, error, reload } = useApi<TeacherListPayload>(path)

  function applySearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    setQ(searchInput.trim())
  }

  function clearFilters() {
    setSearchInput('')
    setQ('')
    setDesignation('')
    setDepartment('')
    setSort('name')
    setPage(1)
  }

  const designationOptions = (data?.designations || []).map((value) => ({ value, label: value }))
  const departmentOptions = (data?.departments || []).map((value) => ({ value, label: value }))
  const filtersActive = Boolean(q || designation || department || sort !== 'name')

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.teachers')}
        title={t('teachers.title')}
        description={t('teachers.pending')}
        breadcrumbs={[{ label: t('teachers.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <form onSubmit={applySearch} className="card p-4 sm:p-5" role="search" aria-label={t('teachers.searchPlaceholder')}>
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] lg:items-end">
            <TextField
              label={t('common.search')}
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('teachers.searchPlaceholder')}
            />
            <SelectField
              label={t('teachers.designation')}
              value={designation}
              onChange={(event) => {
                setDesignation(event.target.value)
                setPage(1)
              }}
              placeholder={t('common.all')}
              options={designationOptions}
            />
            <SelectField
              label={t('teachers.department')}
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value)
                setPage(1)
              }}
              placeholder={t('common.all')}
              options={departmentOptions}
            />
            <SelectField
              label={t('teachers.sort')}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(1)
              }}
              options={[
                { value: 'name', label: t('teachers.sortName') },
                { value: 'designation', label: t('teachers.sortDesignation') },
              ]}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Search className="h-4 w-4" aria-hidden="true" />
                {t('action.search')}
              </Button>
              {filtersActive ? (
                <Button type="button" variant="outline" onClick={clearFilters} aria-label={t('action.clear')}>
                  {t('action.clear')}
                </Button>
              ) : null}
            </div>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {data ? `${formatNumber(data.total, lang)} ${t('teachers.count')}` : t('common.loading')}
          </p>
          <Link to="/contact" className="text-xs font-semibold text-pine-700 hover:underline dark:text-pine-300">
            {t('nav.contact')}
          </Link>
        </div>

        <div className="mt-4">
          {loading && !data ? <LoadingBlock /> : null}
          {error && !data ? <ErrorState message={error} onRetry={reload} /> : null}
          {data && data.items.length === 0 ? (
            <EmptyState
              title={t('teachers.empty')}
              description={t('teachers.pending')}
              icon={<Users className="h-6 w-6" aria-hidden="true" />}
              action={<ButtonLink to="/contact" variant="outline" size="sm">{t('nav.contact')}</ButtonLink>}
            />
          ) : null}
          {data && data.items.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((teacher) => (
                  <article key={teacher.id} className="card group flex flex-col p-5 transition hover:border-pine-300 dark:hover:border-pine-700">
                    <div className="flex items-start gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pine-50 text-xl font-extrabold text-pine-800 dark:bg-pine-950 dark:text-pine-200">
                        {teacher.name.trim().charAt(0) || <UserRound className="h-5 w-5" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-base font-extrabold leading-6">
                          <Link to={`/teachers/${teacher.id}`} className="hover:text-pine-700 dark:hover:text-pine-300">
                            {teacher.name}
                          </Link>
                        </h2>
                        <p className="mt-0.5 text-xs font-semibold text-pine-700 dark:text-pine-300">
                          {teacher.designation || t('common.notAvailable')}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {teacher.department || t('common.notAvailable')}
                        </p>
                      </div>
                    </div>
                    <dl className="mt-4 space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                      <div>
                        <dt className="inline font-semibold text-slate-500 dark:text-slate-500">{t('teachers.qualification')}: </dt>
                        <dd className="inline">{teacher.qualification || t('common.notAvailable')}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-slate-500 dark:text-slate-500">{t('teachers.officeHours')}: </dt>
                        <dd className="inline">{teacher.officeHours || t('common.notAvailable')}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="break-all">{teacher.email || t('common.notAvailable')}</span>
                      </div>
                    </dl>
                    <div className="mt-auto pt-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {t(`teachers.category.${teacher.category}`)}
                        </span>
                        <PendingBadge />
                      </div>
                      <Link to={`/teachers/${teacher.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-pine-700 hover:underline dark:text-pine-300">
                        {t('teachers.profile')}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
              {data.total > data.pageSize ? (
                <Pagination page={data.page} pageCount={Math.ceil(data.total / data.pageSize)} onChange={setPage} />
              ) : null}
            </>
          ) : null}
        </div>

        {data && data.items.length > 0 ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="flex items-center gap-2 font-bold">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {t('teachers.pending')}
            </p>
            <p className="mt-1 text-xs leading-6">{t('footer.verification')}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
