import { useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { usePageMeta } from '../../components/SEO'
import { ResourceManager, TextCell, type ResourceConfig } from '../../components/admin/ResourceManager'
import { DemoBadge } from '../../components/ui/Feedback'
import type { AcademicSession } from '../../lib/types'

interface SessionPayload {
  items: AcademicSession[]
}

export default function AdminNotices() {
  usePageMeta({ title: 'নোটিশ ব্যবস্থাপনা', noindex: true })
  const { t, lang } = useI18n()
  const { data: sessionsData } = useApi<SessionPayload>('/api/admin/academic-sessions')
  const isBn = lang === 'bn'

  const config: ResourceConfig = {
    entity: 'notices',
    title: t('dashboard.notices'),
    description: isBn
      ? 'নোটিশ তৈরি, সম্পাদনা, প্রকাশ ও আর্কাইভ করুন। প্রকাশের আগে তথ্য যাচাই করুন এবং নমুনা কনটেন্ট মুছে ফেলুন।'
      : 'Create, edit, publish and archive notices. Verify information before publishing and remove sample content.',
    canDelete: false,
    searchPlaceholder: isBn ? 'শিরোনাম, বিভাগ বা সারাংশ খুঁজুন' : 'Search title, category or summary',
    fields: [
      { name: 'title', label: isBn ? 'শিরোনাম' : 'Title', required: true, colSpan: 2, max: 220 },
      { name: 'category', label: t('common.category'), required: true, defaultValue: 'সাধারণ', max: 60 },
      {
        name: 'audience',
        label: isBn ? 'কাদের জন্য' : 'Audience',
        type: 'select',
        defaultValue: 'all',
        options: [
          { value: 'all', label: isBn ? 'সবার জন্য' : 'Everyone' },
          { value: 'student', label: t('role.student') },
          { value: 'teacher', label: t('role.teacher') },
        ],
      },
      { name: 'publishedAt', label: t('results.publishedAt'), type: 'date' },
      { name: 'deadline', label: t('notices.deadline'), type: 'date' },
      {
        name: 'sessionId',
        label: t('dashboard.session'),
        type: 'select',
        placeholder: isBn ? 'প্রযোজ্য নয় / সব শিক্ষাবর্ষ' : 'Not applicable / all sessions',
        options: (sessionsData?.items || []).map((session) => ({ value: session.id, label: session.name })),
      },
      { name: 'summary', label: isBn ? 'সারাংশ' : 'Summary', type: 'textarea', colSpan: 2, rows: 3, max: 800 },
      { name: 'body', label: isBn ? 'বিস্তারিত' : 'Details', type: 'textarea', colSpan: 2, rows: 9, max: 30000 },
      { name: 'attachmentUrl', label: isBn ? 'সংযুক্তির লিংক (ঐচ্ছিক)' : 'Attachment link (optional)', colSpan: 2, hint: isBn ? 'শুধু https:// বা সাইটের / দিয়ে শুরু হওয়া নিরাপদ লিংক ব্যবহার করুন।' : 'Use only safe https:// or site-relative / links.' },
      { name: 'pinned', label: isBn ? 'গুরুত্বপূর্ণ হিসেবে চিহ্নিত করুন' : 'Mark as important', type: 'checkbox' },
    ],
    columns: [
      {
        key: 'title',
        label: isBn ? 'শিরোনাম' : 'Title',
        render: (item) => (
          <div>
            <TextCell className="font-semibold">{String(item.title)}</TextCell>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="text-[0.65rem] text-slate-500">{String(item.category || '')}</span>
              {item.isDemo ? <DemoBadge /> : null}
              {item.pinned ? <span className="text-[0.65rem] font-bold text-amber-700 dark:text-amber-300">★</span> : null}
            </div>
          </div>
        ),
      },
      { key: 'publishedAt', label: t('results.publishedAt') },
      { key: 'deadline', label: t('notices.deadline') },
    ],
  }

  return <ResourceManager config={config} />
}
