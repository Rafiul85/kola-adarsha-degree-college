import { useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { usePageMeta } from '../../components/SEO'
import { ResourceManager, TextCell, type ResourceConfig } from '../../components/admin/ResourceManager'
import type { AcademicSession, AdminList, Program } from '../../lib/types'

export default function AdminStudents() {
  usePageMeta({ title: 'শিক্ষার্থী ব্যবস্থাপনা', noindex: true })
  const { t, lang } = useI18n()
  const { data: sessionsData } = useApi<AdminList<AcademicSession>>('/api/admin/academic-sessions')
  const { data: programsData } = useApi<AdminList<Program>>('/api/admin/programs')
  const isBn = lang === 'bn'

  const sessionName = (id: unknown) =>
    (sessionsData?.items || []).find((session) => session.id === id)?.name || ''
  const programName = (id: unknown) =>
    (programsData?.items || []).find((program) => program.id === id)?.nameBn || ''

  const config: ResourceConfig = {
    entity: 'students',
    title: t('dashboard.students'),
    description: isBn
      ? 'শিক্ষার্থীর রেকর্ড অফিসিয়াল ভর্তি ও রেজিস্ট্রেশন তথ্য অনুযায়ী তৈরি করুন। রোল ও শিক্ষার্থী আইডি অনন্য হতে হবে। এই তথ্য কেবল অনুমোদিত স্টাফ দেখতে পাবেন।'
      : 'Create student records from official admission and registration information. Roll and student ID must be unique. Only approved staff can view these records.',
    canDelete: false,
    searchPlaceholder: isBn ? 'নাম, শিক্ষার্থী আইডি, রোল বা রেজিস্ট্রেশন খুঁজুন' : 'Search name, student ID, roll or registration',
    fields: [
      { name: 'name', label: isBn ? 'শিক্ষার্থীর নাম' : 'Student name', required: true, colSpan: 2, max: 160 },
      { name: 'studentId', label: t('dashboard.studentId'), required: true, max: 80 },
      { name: 'roll', label: isBn ? 'রোল নম্বর' : 'Roll number', required: true, max: 40 },
      { name: 'registration', label: t('dashboard.registration'), max: 60 },
      {
        name: 'sessionId',
        label: t('dashboard.session'),
        type: 'select',
        options: (sessionsData?.items || []).map((session) => ({ value: session.id, label: session.name })),
      },
      {
        name: 'programId',
        label: t('dashboard.program'),
        type: 'select',
        options: (programsData?.items || []).map((program) => ({ value: program.id, label: program.nameBn })),
      },
      { name: 'group', label: t('dashboard.group'), max: 80 },
      { name: 'subjects', label: t('dashboard.subjectList'), type: 'tags', hint: isBn ? 'কমা দিয়ে আলাদা করুন।' : 'Separate with commas.' },
      { name: 'phone', label: isBn ? 'শিক্ষার্থীর ফোন' : 'Student phone', max: 30 },
      { name: 'guardianPhone', label: isBn ? 'অভিভাবকের ফোন' : 'Guardian phone', max: 30 },
      { name: 'dob', label: isBn ? 'জন্মতারিখ' : 'Date of birth', type: 'date' },
      { name: 'address', label: isBn ? 'ঠিকানা' : 'Address', type: 'textarea', colSpan: 2, rows: 3, max: 500 },
    ],
    columns: [
      {
        key: 'name',
        label: isBn ? 'শিক্ষার্থী' : 'Student',
        render: (item) => (
          <div>
            <TextCell className="font-semibold">{String(item.name)}</TextCell>
            <p className="mt-0.5 font-latin text-[0.68rem] text-slate-500 dark:text-slate-400">
              {String(item.studentId || '')}
            </p>
          </div>
        ),
      },
      { key: 'roll', label: isBn ? 'রোল' : 'Roll' },
      { key: 'registration', label: t('dashboard.registration') },
      {
        key: 'sessionId',
        label: t('dashboard.session'),
        render: (item) => <span className="text-xs">{sessionName(item.sessionId) || '—'}</span>,
      },
      {
        key: 'programId',
        label: t('dashboard.program'),
        render: (item) => (
          <div className="text-xs">
            <p>{programName(item.programId) || '—'}</p>
            <p className="text-slate-500 dark:text-slate-400">{String(item.group || '')}</p>
          </div>
        ),
      },
    ],
  }

  return <ResourceManager config={config} />
}
