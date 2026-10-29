import { useI18n } from '../../lib/i18n'
import { usePageMeta } from '../../components/SEO'
import { ResourceManager, TextCell, type ResourceConfig } from '../../components/admin/ResourceManager'
import { DemoBadge } from '../../components/ui/Feedback'

export default function AdminEvents() {
  usePageMeta({ title: 'ইভেন্ট ব্যবস্থাপনা', noindex: true })
  const { t, lang } = useI18n()
  const isBn = lang === 'bn'

  const config: ResourceConfig = {
    entity: 'events',
    title: t('dashboard.events'),
    description: isBn
      ? 'ইভেন্টের তারিখ, সময় ও স্থান যাচাই করে প্রকাশ করুন। অনুমোদনের আগে খসড়া হিসেবে রাখুন।'
      : 'Publish events after verifying dates, times and venues. Keep them as drafts before approval.',
    canDelete: false,
    searchPlaceholder: isBn ? 'শিরোনাম, বিবরণ বা স্থান খুঁজুন' : 'Search title, description or venue',
    fields: [
      { name: 'title', label: isBn ? 'শিরোনাম' : 'Title', required: true, colSpan: 2, max: 220 },
      { name: 'startDate', label: isBn ? 'শুরুর তারিখ' : 'Start date', type: 'date', required: true },
      { name: 'endDate', label: isBn ? 'শেষ তারিখ' : 'End date', type: 'date' },
      { name: 'startTime', label: isBn ? 'শুরুর সময়' : 'Start time', type: 'time' },
      { name: 'endTime', label: isBn ? 'শেষ সময়' : 'End time', type: 'time' },
      { name: 'venue', label: t('common.venue'), max: 200 },
      { name: 'registrationInfo', label: t('events.registration'), },
      { name: 'description', label: isBn ? 'বিবরণ' : 'Description', type: 'textarea', colSpan: 2, rows: 5, max: 10000 },
    ],
    columns: [
      {
        key: 'title',
        label: isBn ? 'শিরোনাম' : 'Title',
        render: (item) => (
          <div>
            <TextCell className="font-semibold">{String(item.title)}</TextCell>
            {item.isDemo ? <div className="mt-1"><DemoBadge /></div> : null}
          </div>
        ),
      },
      { key: 'startDate', label: isBn ? 'শুরুর তারিখ' : 'Start date' },
      { key: 'startTime', label: t('common.time') },
      { key: 'venue', label: t('common.venue') },
    ],
  }

  return <ResourceManager config={config} />
}
