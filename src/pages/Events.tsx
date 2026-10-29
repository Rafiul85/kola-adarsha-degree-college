import { useState } from 'react'
import { CalendarDays, CalendarX2, Clock, MapPin, Ticket } from 'lucide-react'
import { useApi } from '../lib/api'
import { useI18n } from '../lib/i18n'
import type { EventItem } from '../lib/types'
import { usePageMeta } from '../components/SEO'
import { DemoBadge, EmptyState, ErrorState, LoadingBlock } from '../components/ui/Feedback'
import { PageHeader, Tabs } from '../components/ui/Navigation'
import { formatDate } from '../lib/format'

type Tab = 'upcoming' | 'past'

export default function Events() {
  usePageMeta({
    title: 'ইভেন্ট ও কার্যক্রম',
    description: 'কোলা আদর্শ ডিগ্রি কলেজের আসন্ন ও পূর্ববর্তী ইভেন্ট, অনুষ্ঠান ও কার্যক্রমের তথ্য।',
  })
  const { t, lang } = useI18n()
  const { data, loading, error, reload } = useApi<{ events: EventItem[] }>('/api/public/events')
  const [tab, setTab] = useState<Tab>('upcoming')
  const isBn = lang === 'bn'

  const events = data?.events || []
  const upcoming = events.filter((event) => !event.isPast)
  const past = events.filter((event) => event.isPast).reverse()
  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <div>
      <PageHeader
        eyebrow={t('nav.events')}
        title={t('events.title')}
        description={t('events.intro')}
        breadcrumbs={[{ label: t('events.title') }]}
      />

      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <Tabs
            items={[
              { id: 'upcoming', label: t('events.upcoming'), count: upcoming.length },
              { id: 'past', label: t('events.past'), count: past.length },
            ]}
            active={tab}
            onChange={(value) => setTab(value as Tab)}
            variant="pills"
            className="max-w-sm"
          />

          <div className="mt-6">
            {loading && !data ? <LoadingBlock /> : null}
            {error && !data ? <ErrorState message={error} onRetry={reload} /> : null}

            {data && shown.length === 0 ? (
              <EmptyState
                icon={<CalendarX2 className="h-6 w-6" aria-hidden="true" />}
                title={t('events.empty')}
                description={tab === 'past' ? (isBn ? 'পূর্ববর্তী কোনো প্রকাশিত ইভেন্ট নেই।' : 'There are no published past events.') : undefined}
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {shown.map((event) => (
                <article key={event.id} className="card overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-white text-navy-900 shadow-sm dark:bg-slate-900 dark:text-white">
                      <span className="text-lg font-extrabold leading-none">
                        {Number.isNaN(new Date(event.startDate).getTime()) ? '—' : new Date(event.startDate).getDate()}
                      </span>
                      <span className="mt-0.5 text-[0.58rem] font-bold uppercase">
                        {Number.isNaN(new Date(event.startDate).getTime())
                          ? ''
                          : new Intl.DateTimeFormat(isBn ? 'bn-BD' : 'en-GB', { month: 'short' }).format(new Date(event.startDate))}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                        {tab === 'past' ? t('events.past') : t('events.upcoming')}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {formatDate(event.startDate, lang)}
                        {event.endDate ? ` — ${formatDate(event.endDate, lang)}` : ''}
                      </p>
                    </div>
                    {event.isDemo ? <DemoBadge /> : null}
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-extrabold leading-7">{event.title}</h2>
                    {event.description ? (
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{event.description}</p>
                    ) : null}
                    <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {event.startTime || event.endTime ? (
                        <li className="flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                          {[event.startTime, event.endTime].filter(Boolean).join(' – ')}
                        </li>
                      ) : null}
                      {event.venue ? (
                        <li className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                          {event.venue}
                        </li>
                      ) : null}
                      {event.registrationInfo ? (
                        <li className="flex items-start gap-2">
                          <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-pine-600 dark:text-pine-300" aria-hidden="true" />
                          <span>
                            <span className="font-bold">{t('events.registration')}: </span>
                            {event.registrationInfo}
                          </span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </article>
              ))}
            </div>

            {data ? (
              <p className="mt-6 flex items-center justify-center gap-2 text-center text-[0.68rem] text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {isBn
                  ? 'ইভেন্টের তারিখ ও স্থান পরিবর্তনযোগ্য। অংশগ্রহণের আগে কলেজ অফিসে নিশ্চিত করুন।'
                  : 'Event dates and venues may change. Confirm with the college office before attending.'}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
