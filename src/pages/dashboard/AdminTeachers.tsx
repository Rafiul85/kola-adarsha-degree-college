import { useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { usePageMeta } from '../../components/SEO'
import { ResourceManager, TextCell, type ResourceConfig } from '../../components/admin/ResourceManager'
import { Badge } from '../../components/ui/Feedback'
import type { AcademicSession, AdminList } from '../../lib/types'

export default function AdminTeachers() {
  usePageMeta({ title: 'শিক্ষক ব্যবস্থাপনা', noindex: true })
  const { t, lang } = useI18n()
  const { data: sessionsData } = useApi<AdminList<AcademicSession>>('/api/admin/academic-sessions')
  const isBn = lang === 'bn'

  const employmentLabels: Record<string, { bn: string; en: string }> = {
    full_time: { bn: 'পূর্ণকালীন', en: 'Full-time' },
    part_time: { bn: 'আংশিককালীন', en: 'Part-time' },
    guest: { bn: 'অতিথি', en: 'Guest' },
    other: { bn: 'অন্যান্য', en: 'Other' },
  }

  const categoryLabels: Record<string, { bn: string; en: string }> = {
    principal: { bn: 'অধ্যক্ষ', en: 'Principal' },
    vice_principal: { bn: 'উপাধ্যক্ষ', en: 'Vice Principal' },
    lecturer: { bn: 'প্রভাষক', en: 'Lecturer' },
    administrative: { bn: 'প্রশাসনিক', en: 'Administrative' },
    support: { bn: 'সহায়ক', en: 'Support' },
  }

  const config: ResourceConfig = {
    entity: 'teachers',
    title: t('dashboard.teachers'),
    description: isBn
      ? 'শিক্ষকের নাম, পদবি, বিভাগ ও যোগাযোগের তথ্য অফিসিয়াল নথি অনুযায়ী যুক্ত করুন। অনুমোদন ছাড়া কোনো নাম প্রকাশ করবেন না এবং নমুনা তথ্য ব্যবহার করবেন না।'
      : 'Add teacher names, designations, departments and contact details from official records. Do not publish unapproved names or sample data.',
    canDelete: false,
    searchPlaceholder: isBn ? 'নাম, পদবি, বিভাগ বা যোগ্যতা খুঁজুন' : 'Search name, designation, department or qualification',
    fields: [
      { name: 'name', label: isBn ? 'পূর্ণ নাম' : 'Full name', required: true, colSpan: 2, max: 160 },
      { name: 'designation', label: isBn ? 'পদবি' : 'Designation', max: 120 },
      { name: 'department', label: isBn ? 'বিভাগ' : 'Department', max: 120 },
      {
        name: 'category',
        label: isBn ? 'শ্রেণি' : 'Category',
        type: 'select',
        defaultValue: 'lecturer',
        options: Object.entries(categoryLabels).map(([value, label]) => ({
          value,
          label: isBn ? label.bn : label.en,
        })),
      },
      {
        name: 'employmentType',
        label: isBn ? 'নিয়োগের ধরন' : 'Employment type',
        type: 'select',
        defaultValue: 'full_time',
        options: Object.entries(employmentLabels).map(([value, label]) => ({
          value,
          label: isBn ? label.bn : label.en,
        })),
      },
      { name: 'qualification', label: isBn ? 'শিক্ষাগত যোগ্যতা' : 'Qualification', max: 300 },
      { name: 'email', label: t('dashboard.email'), type: 'text', max: 200 },
      { name: 'officeHours', label: isBn ? 'অফিস সময়' : 'Office hours', max: 160 },
      {
        name: 'assignedSessions',
        label: t('dashboard.assignedSessions'),
        type: 'multiselect',
        colSpan: 2,
        hint: isBn
          ? 'শিক্ষককে কোন শিক্ষাবর্ষের শিক্ষার্থী তালিকা দেখতে দেওয়া হবে তা নির্বাচন করুন।'
          : 'Choose which academic sessions this teacher may view student lists for.',
        options: (sessionsData?.items || []).map((session) => ({ value: session.id, label: session.name })),
      },
      { name: 'bio', label: isBn ? 'সংক্ষিপ্ত পরিচিতি' : 'Short biography', type: 'textarea', colSpan: 2, rows: 5, max: 5000 },
    ],
    columns: [
      {
        key: 'name',
        label: isBn ? 'শিক্ষক' : 'Teacher',
        render: (item) => (
          <div>
            <TextCell className="font-semibold">{String(item.name)}</TextCell>
            <p className="mt-0.5 text-[0.68rem] text-slate-500 dark:text-slate-400">
              {categoryLabels[String(item.category)]?.[lang] || String(item.category || '')}
            </p>
          </div>
        ),
      },
      { key: 'designation', label: isBn ? 'পদবি' : 'Designation' },
      { key: 'department', label: isBn ? 'বিভাগ' : 'Department' },
      {
        key: 'employmentType',
        label: isBn ? 'নিয়োগ' : 'Employment',
        render: (item) => {
          const value = String(item.employmentType || '')
          return <Badge tone={value === 'guest' ? 'purple' : value === 'part_time' ? 'sky' : 'neutral'}>{employmentLabels[value]?.[lang] || value || '—'}</Badge>
        },
      },
      {
        key: 'assignedSessions',
        label: isBn ? 'শিক্ষাবর্ষ' : 'Sessions',
        render: (item) => {
          const assigned = Array.isArray(item.assignedSessions) ? (item.assignedSessions as string[]) : []
          const names = assigned
            .map((id) => (sessionsData?.items || []).find((session) => session.id === id)?.name)
            .filter(Boolean)
          return <span className="text-xs text-slate-600 dark:text-slate-300">{names.length ? names.join(', ') : '—'}</span>
        },
      },
    ],
  }

  return <ResourceManager config={config} />
}
