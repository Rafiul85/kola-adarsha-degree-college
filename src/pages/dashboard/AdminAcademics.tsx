import { useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { usePageMeta } from '../../components/SEO'
import { ResourceManager, TextCell, type ResourceConfig } from '../../components/admin/ResourceManager'
import { Badge, DemoBadge } from '../../components/ui/Feedback'
import { Tabs } from '../../components/ui/Navigation'
import { dayLabels } from '../../lib/format'
import { useSearchParams } from 'react-router-dom'
import type { AdminList, Program, AcademicSession, Teacher } from '../../lib/types'

const tabs = ['sessions', 'programs', 'subjects', 'routines', 'examinations', 'calendar'] as const
type TabKey = (typeof tabs)[number]

export default function AdminAcademics() {
  usePageMeta({ title: 'একাডেমিক ব্যবস্থাপনা', noindex: true })
  const { t, lang } = useI18n()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as TabKey | null
  const active: TabKey = requested && tabs.includes(requested) ? requested : 'sessions'
  const isBn = lang === 'bn'

  const { data: sessionsData } = useApi<AdminList<AcademicSession>>('/api/admin/academic-sessions')
  const { data: programsData } = useApi<AdminList<Program>>('/api/admin/programs')
  const { data: teachersData } = useApi<AdminList<Teacher>>('/api/admin/teachers')

  const sessionOptions = (sessionsData?.items || []).map((session) => ({ value: session.id, label: session.name }))
  const programOptions = (programsData?.items || []).map((program) => ({ value: program.id, label: program.nameBn }))
  const teacherOptions = (teachersData?.items || []).map((teacher) => ({ value: teacher.id, label: `${teacher.name}${teacher.designation ? ` — ${teacher.designation}` : ''}` }))
  const programName = (id: unknown) => (programsData?.items || []).find((program) => program.id === id)?.nameBn || ''
  const sessionName = (id: unknown) => (sessionsData?.items || []).find((session) => session.id === id)?.name || ''

  const configs: Record<TabKey, ResourceConfig> = {
    sessions: {
      entity: 'academic-sessions',
      title: t('dashboard.academics'),
      description: isBn
        ? 'শিক্ষাবর্ষের নাম ও সময়কাল নির্ধারণ করুন। ব্যবহৃত শিক্ষাবর্ষ মুছে ফেলা যাবে না; নিষ্ক্রিয় করুন।'
        : 'Define academic session names and periods. Sessions in use cannot be deleted; make them inactive instead.',
      canDelete: true,
      searchPlaceholder: isBn ? 'শিক্ষাবর্ষ খুঁজুন' : 'Search sessions',
      fields: [
        { name: 'name', label: isBn ? 'শিক্ষাবর্ষের নাম' : 'Session name', required: true, colSpan: 2, max: 80 },
        { name: 'startDate', label: isBn ? 'শুরুর তারিখ' : 'Start date', type: 'date' },
        { name: 'endDate', label: isBn ? 'শেষ তারিখ' : 'End date', type: 'date' },
      ],
      columns: [
        { key: 'name', label: isBn ? 'শিক্ষাবর্ষ' : 'Session', render: (item) => <TextCell className="font-semibold">{String(item.name)}</TextCell> },
        { key: 'startDate', label: isBn ? 'শুরু' : 'Start' },
        { key: 'endDate', label: isBn ? 'শেষ' : 'End' },
        {
          key: 'usage',
          label: isBn ? 'দ্রষ্টব্য' : 'Note',
          render: () => <span className="text-xs text-slate-500">{isBn ? 'মুছে ফেলার আগে শিক্ষার্থী ও পরীক্ষার সংযুক্তি যাচাই করুন' : 'Check student and examination links before deleting'}</span>,
        },
      ],
    },
    programs: {
      entity: 'programs',
      title: t('dashboard.academics'),
      description: isBn ? 'প্রোগ্রামের নাম, স্তর ও গ্রুপ নির্ধারণ করুন। যাচাই সম্পন্ন হলে যাচাইকৃত হিসেবে চিহ্নিত করুন।' : 'Define programme names, levels and groups. Mark as verified only after official verification.',
      canDelete: true,
      fields: [
        { name: 'nameBn', label: isBn ? 'নাম (বাংলা)' : 'Name (Bangla)', required: true, max: 160 },
        { name: 'nameEn', label: isBn ? 'নাম (ইংরেজি)' : 'Name (English)', max: 160 },
        { name: 'level', label: isBn ? 'স্তর' : 'Level', type: 'select', required: true, defaultValue: 'HSC', options: [{ value: 'HSC', label: 'HSC' }, { value: 'DEGREE', label: 'Degree' }, { value: 'OTHER', label: isBn ? 'অন্যান্য' : 'Other' }] },
        { name: 'groups', label: isBn ? 'গ্রুপ' : 'Groups', type: 'tags', hint: isBn ? 'কমা দিয়ে আলাদা করুন।' : 'Separate with commas.' },
        { name: 'verified', label: t('dashboard.verificationFlag'), type: 'checkbox', colSpan: 2, hint: isBn ? 'শুধু অফিসিয়াল অনুমোদনের পর টিক দিন।' : 'Tick only after official approval.' },
      ],
      columns: [
        {
          key: 'nameBn',
          label: isBn ? 'প্রোগ্রাম' : 'Programme',
          render: (item) => (
            <div>
              <TextCell className="font-semibold">{String(item.nameBn)}</TextCell>
              <p className="text-[0.68rem] text-slate-500">{String(item.nameEn || '')}</p>
            </div>
          ),
        },
        { key: 'level', label: isBn ? 'স্তর' : 'Level', render: (item) => <Badge tone="navy">{String(item.level)}</Badge> },
        {
          key: 'groups',
          label: isBn ? 'গ্রুপ' : 'Groups',
          render: (item) => <span className="text-xs">{Array.isArray(item.groups) ? item.groups.join(', ') : '—'}</span>,
        },
        {
          key: 'verified',
          label: t('dashboard.verificationFlag'),
          render: (item) => item.verified ? <Badge tone="green">{t('common.yes')}</Badge> : <Badge tone="amber">{t('common.pending')}</Badge>,
        },
      ],
    },
    subjects: {
      entity: 'subjects',
      title: t('dashboard.academics'),
      description: isBn ? 'বিষয় কোড, নাম ও প্রোগ্রাম/গ্রুপ সংযুক্তি দিন।' : 'Add subject codes, names and programme/group links.',
      canDelete: true,
      fields: [
        { name: 'code', label: isBn ? 'কোড' : 'Code', max: 30 },
        { name: 'nameBn', label: isBn ? 'নাম (বাংলা)' : 'Name (Bangla)', required: true, max: 160 },
        { name: 'nameEn', label: isBn ? 'নাম (ইংরেজি)' : 'Name (English)', max: 160 },
        { name: 'group', label: isBn ? 'গ্রুপ' : 'Group', max: 80 },
        { name: 'programId', label: t('dashboard.program'), type: 'select', colSpan: 2, options: programOptions },
      ],
      columns: [
        {
          key: 'nameBn',
          label: isBn ? 'বিষয়' : 'Subject',
          render: (item) => (
            <div>
              <TextCell className="font-semibold">{String(item.nameBn)}</TextCell>
              <p className="text-[0.68rem] text-slate-500">{String(item.code || '')} {String(item.nameEn || '')}</p>
            </div>
          ),
        },
        { key: 'programId', label: t('dashboard.program'), render: (item) => <span className="text-xs">{programName(item.programId) || '—'}</span> },
        { key: 'group', label: t('dashboard.group') },
      ],
    },
    routines: {
      entity: 'routines',
      title: t('dashboard.academics'),
      description: isBn ? 'ক্লাস রুটিন তৈরি করুন। প্রকাশের আগে দিন, সময়, বিষয় ও শিক্ষক যাচাই করুন।' : 'Create class routines. Verify day, time, subject and teacher before publishing.',
      canDelete: true,
      fields: [
        { name: 'sessionId', label: t('dashboard.session'), type: 'select', options: sessionOptions },
        { name: 'programId', label: t('dashboard.program'), type: 'select', options: programOptions },
        { name: 'group', label: t('dashboard.group'), max: 80 },
        {
          name: 'day',
          label: isBn ? 'দিন' : 'Day',
          type: 'select',
          required: true,
          defaultValue: 'saturday',
          options: Object.entries(dayLabels).map(([value, label]) => ({ value, label: isBn ? label.bn : label.en })),
        },
        { name: 'startTime', label: isBn ? 'শুরুর সময়' : 'Start time', type: 'time', required: true },
        { name: 'endTime', label: isBn ? 'শেষ সময়' : 'End time', type: 'time', required: true },
        { name: 'subject', label: isBn ? 'বিষয়' : 'Subject', required: true, max: 160 },
        { name: 'room', label: isBn ? 'কক্ষ' : 'Room', max: 80 },
        { name: 'teacherId', label: isBn ? 'শিক্ষক' : 'Teacher', type: 'select', colSpan: 2, options: teacherOptions },
      ],
      columns: [
        {
          key: 'subject',
          label: isBn ? 'বিষয়' : 'Subject',
          render: (item) => (
            <div>
              <TextCell className="font-semibold">{String(item.subject)}</TextCell>
              <p className="text-[0.68rem] text-slate-500">{String(item.room || '')}</p>
            </div>
          ),
        },
        {
          key: 'day',
          label: isBn ? 'দিন ও সময়' : 'Day and time',
          render: (item) => <span className="text-xs">{dayLabels[String(item.day)]?.[lang] || String(item.day)} · {String(item.startTime)}–{String(item.endTime)}</span>,
        },
        { key: 'sessionId', label: t('dashboard.session'), render: (item) => <span className="text-xs">{sessionName(item.sessionId) || '—'}</span> },
        { key: 'programId', label: t('dashboard.program'), render: (item) => <span className="text-xs">{programName(item.programId) || '—'}</span> },
        {
          key: 'teacherId',
          label: isBn ? 'শিক্ষক' : 'Teacher',
          render: (item) => <span className="text-xs">{(teachersData?.items || []).find((teacher) => teacher.id === item.teacherId)?.name || '—'}</span>,
        },
      ],
    },
    examinations: {
      entity: 'examinations',
      title: t('dashboard.academics'),
      description: isBn ? 'পরীক্ষার নাম, শিক্ষাবর্ষ ও সময়কাল দিন। ফলাফল প্রকাশের আগে পরীক্ষা প্রকাশ করুন।' : 'Define examination names, sessions and periods. Publish the examination before publishing results.',
      canDelete: true,
      fields: [
        { name: 'name', label: isBn ? 'পরীক্ষার নাম' : 'Examination name', required: true, colSpan: 2, max: 180 },
        { name: 'sessionId', label: t('dashboard.session'), type: 'select', options: sessionOptions },
        { name: 'programId', label: t('dashboard.program'), type: 'select', options: programOptions },
        { name: 'startDate', label: isBn ? 'শুরুর তারিখ' : 'Start date', type: 'date' },
        { name: 'endDate', label: isBn ? 'শেষ তারিখ' : 'End date', type: 'date' },
      ],
      columns: [
        { key: 'name', label: isBn ? 'পরীক্ষা' : 'Examination', render: (item) => <TextCell className="font-semibold">{String(item.name)}</TextCell> },
        { key: 'sessionId', label: t('dashboard.session'), render: (item) => <span className="text-xs">{sessionName(item.sessionId) || '—'}</span> },
        { key: 'programId', label: t('dashboard.program'), render: (item) => <span className="text-xs">{programName(item.programId) || '—'}</span> },
        {
          key: 'dates',
          label: isBn ? 'সময়কাল' : 'Period',
          render: (item) => <span className="text-xs">{String(item.startDate || '—')} – {String(item.endDate || '—')}</span>,
        },
      ],
    },
    calendar: {
      entity: 'calendar',
      title: t('dashboard.academics'),
      description: isBn ? 'একাডেমিক ক্যালেন্ডারের তারিখ যোগ করুন। অনুমোদনের আগে “সম্ভাব্য” হিসেবে চিহ্নিত রাখুন।' : 'Add academic calendar dates. Keep them marked provisional until approved.',
      canDelete: true,
      fields: [
        { name: 'title', label: isBn ? 'শিরোনাম' : 'Title', required: true, colSpan: 2, max: 200 },
        { name: 'date', label: t('common.date'), type: 'date', required: true },
        { name: 'endDate', label: isBn ? 'শেষ তারিখ' : 'End date', type: 'date' },
        {
          name: 'type',
          label: isBn ? 'ধরন' : 'Type',
          type: 'select',
          required: true,
          defaultValue: 'academic',
          options: [
            { value: 'admission', label: isBn ? 'ভর্তি' : 'Admission' },
            { value: 'academic', label: isBn ? 'একাডেমিক' : 'Academic' },
            { value: 'examination', label: isBn ? 'পরীক্ষা' : 'Examination' },
            { value: 'holiday', label: isBn ? 'ছুটি' : 'Holiday' },
            { value: 'result', label: isBn ? 'ফলাফল' : 'Result' },
            { value: 'other', label: isBn ? 'অন্যান্য' : 'Other' },
          ],
        },
        { name: 'provisional', label: isBn ? 'সম্ভাব্য তারিখ' : 'Provisional date', type: 'checkbox' },
        { name: 'note', label: isBn ? 'নোট' : 'Note', type: 'textarea', colSpan: 2, rows: 3, max: 1000 },
      ],
      columns: [
        {
          key: 'title',
          label: isBn ? 'শিরোনাম' : 'Title',
          render: (item) => (
            <div>
              <TextCell className="font-semibold">{String(item.title)}</TextCell>
              <div className="mt-1 flex gap-1">{item.provisional ? <Badge tone="amber">{isBn ? 'সম্ভাব্য' : 'Provisional'}</Badge> : null}{item.isDemo ? <DemoBadge /> : null}</div>
            </div>
          ),
        },
        { key: 'date', label: t('common.date') },
        { key: 'type', label: isBn ? 'ধরন' : 'Type' },
      ],
    },
  }

  return (
    <div className="space-y-5">
      <Tabs
        items={[
          { id: 'sessions', label: t('dashboard.session') },
          { id: 'programs', label: t('dashboard.program') },
          { id: 'subjects', label: isBn ? 'বিষয়' : 'Subjects' },
          { id: 'routines', label: isBn ? 'রুটিন' : 'Routines' },
          { id: 'examinations', label: isBn ? 'পরীক্ষা' : 'Examinations' },
          { id: 'calendar', label: isBn ? 'ক্যালেন্ডার' : 'Calendar' },
        ]}
        active={active}
        onChange={(id) => setParams(id === 'sessions' ? {} : { tab: id })}
      />
      <ResourceManager config={configs[active]} />
    </div>
  )
}
