import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, Database, Download, Plus, Save, Trash2 } from 'lucide-react'
import { api, useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../context/ToastContext'
import { usePageMeta } from '../../components/SEO'
import type { AdmissionSettings, BackupItem, ContentSettings, Institution, Settings } from '../../lib/types'
import { Alert, Badge, EmptyState, ErrorState, LoadingBlock } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { CheckboxField, FormGrid, TextAreaField, TextField } from '../../components/ui/Form'
import { Tabs } from '../../components/ui/Navigation'
import { formatBytes, formatDateTime } from '../../lib/format'

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-base font-extrabold">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ArrayBlock({
  title,
  description,
  onAdd,
  addLabel,
  children,
}: {
  title: string
  description?: string
  onAdd: () => void
  addLabel: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold">{title}</h3>
          {description ? <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  )
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button variant="ghost" size="sm" className="text-red-700 dark:text-red-300" onClick={onClick}>
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  )
}

export default function AdminSettings() {
  usePageMeta({ title: 'সাইট সেটিংস', noindex: true })
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const { data, loading, error, reload } = useApi<{ settings: Settings }>('/api/admin/settings')
  const backups = useApi<{ items: BackupItem[] }>('/api/admin/backups')
  const [draft, setDraft] = useState<Settings | null>(null)
  const [tab, setTab] = useState('institution')
  const [busy, setBusy] = useState('')
  const [formError, setFormError] = useState('')
  const isBn = lang === 'bn'

  useEffect(() => {
    if (data?.settings) setDraft(data.settings)
  }, [data])

  function setInstitution<K extends keyof Institution>(key: K, value: Institution[K]) {
    setDraft((current) => (current ? { ...current, institution: { ...current.institution, [key]: value } } : current))
  }

  function setContent<K extends keyof ContentSettings>(key: K, value: ContentSettings[K]) {
    setDraft((current) => (current ? { ...current, content: { ...current.content, [key]: value } } : current))
  }

  function setAdmission<K extends keyof AdmissionSettings>(key: K, value: AdmissionSettings[K]) {
    setDraft((current) => (current ? { ...current, admission: { ...current.admission, [key]: value } } : current))
  }

  async function save(event?: FormEvent) {
    event?.preventDefault()
    if (!draft) return
    setBusy('save')
    setFormError('')
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(draft) })
      toast(t('dashboard.settingsSaved'))
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy('')
    }
  }

  async function createBackup() {
    setBusy('backup')
    try {
      await api('/api/admin/backups', { method: 'POST' })
      toast(isBn ? 'ব্যাকআপ তৈরি হয়েছে।' : 'Backup created.')
      backups.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy('')
    }
  }

  async function removeDemo() {
    if (!window.confirm(t('dashboard.removeDemo') + '?')) return
    setBusy('demo')
    try {
      await api('/api/admin/demo-content', { method: 'DELETE' })
      toast(t('dashboard.demoRemoved'))
      backups.reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy('')
    }
  }

  if (loading && !draft) return <LoadingBlock />
  if (error && !draft) return <ErrorState message={error} onRetry={reload} />
  if (!draft) return null

  const institution = draft.institution
  const content = draft.content
  const admission = draft.admission

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('dashboard.settings')}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {isBn
              ? 'শুধু যাচাইকৃত অফিসিয়াল তথ্য প্রকাশ করুন। যাচাই না হওয়া তথ্য “যাচাই প্রক্রিয়াধীন” হিসেবে চিহ্নিত রাখুন। যাচাই সম্পন্ন হলে সংশ্লিষ্ট ঘরে টিক দিন।'
              : 'Publish only verified official information. Keep unverified details marked as pending and tick the verified box once confirmed.'}
          </p>
        </div>
        <Button onClick={() => void save()} loading={busy === 'save'}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {t('action.save')}
        </Button>
      </div>

      {formError ? <Alert kind="error">{formError}</Alert> : null}

      <Tabs
        items={[
          { id: 'institution', label: t('dashboard.settingsInstitution') },
          { id: 'content', label: t('dashboard.settingsContent') },
          { id: 'admission', label: t('dashboard.settingsAdmission') },
          { id: 'data', label: t('dashboard.backups') },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'institution' ? (
        <form onSubmit={save} className="space-y-5">
          <Panel
            title={t('dashboard.settingsInstitution')}
            description={isBn ? 'প্রতিষ্ঠানের নাম, EIIN, ঠিকানা ও যোগাযোগের তথ্য।' : 'Institution name, EIIN, address and contact details.'}
          >
            <FormGrid>
              <TextField label={isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'} value={institution.nameBn} onChange={(event) => setInstitution('nameBn', event.target.value)} required maxLength={200} />
              <TextField label={isBn ? 'নাম (ইংরেজি)' : 'Name (English)'} value={institution.nameEn} onChange={(event) => setInstitution('nameEn', event.target.value)} required maxLength={200} />
              <TextField label="EIIN" value={institution.eiin} onChange={(event) => setInstitution('eiin', event.target.value)} required maxLength={30} />
              <TextField label={isBn ? 'প্রতিষ্ঠাকাল' : 'Established date'} type="date" value={institution.establishedDate} onChange={(event) => setInstitution('establishedDate', event.target.value)} />
              <TextField label={isBn ? 'উপজেলা' : 'Upazila'} value={institution.upazila} onChange={(event) => setInstitution('upazila', event.target.value)} maxLength={100} />
              <TextField label={isBn ? 'জেলা' : 'District'} value={institution.district} onChange={(event) => setInstitution('district', event.target.value)} maxLength={100} />
              <TextField label={isBn ? 'বিভাগ' : 'Division'} value={institution.division} onChange={(event) => setInstitution('division', event.target.value)} maxLength={100} />
              <TextField label={isBn ? 'পোস্ট কোড' : 'Post code'} value={institution.postCode} onChange={(event) => setInstitution('postCode', event.target.value)} maxLength={20} />
              <TextField label={isBn ? 'ঠিকানা (বাংলা)' : 'Address (Bangla)'} value={institution.addressBn} onChange={(event) => setInstitution('addressBn', event.target.value)} className="sm:col-span-2" maxLength={500} />
              <TextField label={isBn ? 'ঠিকানা (ইংরেজি)' : 'Address (English)'} value={institution.addressEn} onChange={(event) => setInstitution('addressEn', event.target.value)} className="sm:col-span-2" maxLength={500} />
              <TextField label={isBn ? 'ধরন (বাংলা)' : 'Type (Bangla)'} value={institution.typeBn} onChange={(event) => setInstitution('typeBn', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'ধরন (ইংরেজি)' : 'Type (English)'} value={institution.typeEn} onChange={(event) => setInstitution('typeEn', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'অধিভুক্তি' : 'Affiliation'} value={institution.affiliationBn} onChange={(event) => setInstitution('affiliationBn', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'স্বীকৃতি' : 'Recognition'} value={institution.recognitionBn} onChange={(event) => setInstitution('recognitionBn', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'ফোন' : 'Phone'} value={institution.phone} onChange={(event) => setInstitution('phone', event.target.value)} maxLength={50} />
              <TextField label={t('dashboard.email')} type="email" value={institution.email} onChange={(event) => setInstitution('email', event.target.value)} maxLength={200} />
              <TextField label={isBn ? 'ওয়েবসাইট' : 'Website'} value={institution.website} onChange={(event) => setInstitution('website', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'অফিস সময় (বাংলা)' : 'Office hours (Bangla)'} value={institution.officeHoursBn} onChange={(event) => setInstitution('officeHoursBn', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'অফিস সময় (ইংরেজি)' : 'Office hours (English)'} value={institution.officeHoursEn} onChange={(event) => setInstitution('officeHoursEn', event.target.value)} maxLength={300} />
              <CheckboxField label={isBn ? 'প্রতিষ্ঠাকাল যাচাই সম্পন্ন' : 'Established date verified'} checked={institution.establishedVerified} onChange={(event) => setInstitution('establishedVerified', event.target.checked)} />
              <CheckboxField label={isBn ? 'মানচিত্র/অবস্থান যাচাই সম্পন্ন' : 'Map/location verified'} checked={institution.mapVerified} onChange={(event) => setInstitution('mapVerified', event.target.checked)} />
            </FormGrid>
          </Panel>

          <Panel title={isBn ? 'শিক্ষার স্তর ও গ্রুপ' : 'Education levels and groups'}>
            <div className="space-y-4">
              <ArrayBlock
                title={isBn ? 'শিক্ষার স্তর' : 'Education levels'}
                onAdd={() => setInstitution('educationLevels', [...institution.educationLevels, { nameBn: '', nameEn: '', verified: false }])}
                addLabel={t('dashboard.addRow')}
              >
                {institution.educationLevels.map((level, index) => (
                  <div key={`level-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <FormGrid>
                      <TextField label={isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'} value={level.nameBn} onChange={(event) => setInstitution('educationLevels', institution.educationLevels.map((item, position) => position === index ? { ...item, nameBn: event.target.value } : item))} />
                      <TextField label={isBn ? 'নাম (ইংরেজি)' : 'Name (English)'} value={level.nameEn} onChange={(event) => setInstitution('educationLevels', institution.educationLevels.map((item, position) => position === index ? { ...item, nameEn: event.target.value } : item))} />
                      <CheckboxField label={t('dashboard.verificationFlag')} checked={level.verified} onChange={(event) => setInstitution('educationLevels', institution.educationLevels.map((item, position) => position === index ? { ...item, verified: event.target.checked } : item))} />
                      <div className="flex items-end justify-end"><RemoveButton label={t('dashboard.removeRow')} onClick={() => setInstitution('educationLevels', institution.educationLevels.filter((_item, position) => position !== index))} /></div>
                    </FormGrid>
                  </div>
                ))}
                {!institution.educationLevels.length ? <p className="text-xs text-slate-500">{t('common.noData')}</p> : null}
              </ArrayBlock>

              <ArrayBlock
                title={isBn ? 'গ্রুপ' : 'Groups'}
                onAdd={() => setInstitution('groups', [...institution.groups, { nameBn: '', nameEn: '', verified: false }])}
                addLabel={t('dashboard.addRow')}
              >
                {institution.groups.map((group, index) => (
                  <div key={`group-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <FormGrid>
                      <TextField label={isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'} value={group.nameBn} onChange={(event) => setInstitution('groups', institution.groups.map((item, position) => position === index ? { ...item, nameBn: event.target.value } : item))} />
                      <TextField label={isBn ? 'নাম (ইংরেজি)' : 'Name (English)'} value={group.nameEn} onChange={(event) => setInstitution('groups', institution.groups.map((item, position) => position === index ? { ...item, nameEn: event.target.value } : item))} />
                      <CheckboxField label={t('dashboard.verificationFlag')} checked={group.verified} onChange={(event) => setInstitution('groups', institution.groups.map((item, position) => position === index ? { ...item, verified: event.target.checked } : item))} />
                      <div className="flex items-end justify-end"><RemoveButton label={t('dashboard.removeRow')} onClick={() => setInstitution('groups', institution.groups.filter((_item, position) => position !== index))} /></div>
                    </FormGrid>
                  </div>
                ))}
                {!institution.groups.length ? <p className="text-xs text-slate-500">{t('common.noData')}</p> : null}
              </ArrayBlock>
            </div>
          </Panel>
          <div className="flex justify-end"><Button type="submit" loading={busy === 'save'}><Save className="h-4 w-4" aria-hidden="true" />{t('action.save')}</Button></div>
        </form>
      ) : null}

      {tab === 'content' ? (
        <form onSubmit={save} className="space-y-5">
          <Panel title={isBn ? 'হোমপেজ ও পরিচিতি' : 'Homepage and introduction'}>
            <FormGrid>
              <TextField label={isBn ? 'ট্যাগলাইন (বাংলা)' : 'Tagline (Bangla)'} value={content.taglineBn} onChange={(event) => setContent('taglineBn', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'ট্যাগলাইন (ইংরেজি)' : 'Tagline (English)'} value={content.taglineEn} onChange={(event) => setContent('taglineEn', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'স্বাগতম শিরোনাম (বাংলা)' : 'Welcome title (Bangla)'} value={content.welcomeTitleBn} onChange={(event) => setContent('welcomeTitleBn', event.target.value)} maxLength={300} />
              <TextField label={isBn ? 'স্বাগতম শিরোনাম (ইংরেজি)' : 'Welcome title (English)'} value={content.welcomeTitleEn} onChange={(event) => setContent('welcomeTitleEn', event.target.value)} maxLength={300} />
              <TextAreaField label={isBn ? 'স্বাগতম বার্তা (বাংলা)' : 'Welcome message (Bangla)'} value={content.welcomeBn} onChange={(event) => setContent('welcomeBn', event.target.value)} rows={4} maxLength={10000} />
              <TextAreaField label={isBn ? 'স্বাগতম বার্তা (ইংরেজি)' : 'Welcome message (English)'} value={content.welcomeEn} onChange={(event) => setContent('welcomeEn', event.target.value)} rows={4} maxLength={10000} />
              <TextAreaField label={isBn ? 'পরিচিতি (বাংলা)' : 'Introduction (Bangla)'} value={content.aboutIntroBn} onChange={(event) => setContent('aboutIntroBn', event.target.value)} rows={4} maxLength={10000} />
              <TextAreaField label={isBn ? 'পরিচিতি (ইংরেজি)' : 'Introduction (English)'} value={content.aboutIntroEn} onChange={(event) => setContent('aboutIntroEn', event.target.value)} rows={4} maxLength={10000} />
              <TextAreaField label={isBn ? 'ইতিহাস (বাংলা)' : 'History (Bangla)'} value={content.historyBn} onChange={(event) => setContent('historyBn', event.target.value)} rows={5} maxLength={20000} />
              <TextAreaField label={isBn ? 'ইতিহাস (ইংরেজি)' : 'History (English)'} value={content.historyEn} onChange={(event) => setContent('historyEn', event.target.value)} rows={5} maxLength={20000} />
              <TextAreaField label={isBn ? 'মিশন (বাংলা)' : 'Mission (Bangla)'} value={content.missionBn} onChange={(event) => setContent('missionBn', event.target.value)} rows={3} maxLength={10000} />
              <TextAreaField label={isBn ? 'মিশন (ইংরেজি)' : 'Mission (English)'} value={content.missionEn} onChange={(event) => setContent('missionEn', event.target.value)} rows={3} maxLength={10000} />
              <TextAreaField label={isBn ? 'ভিশন (বাংলা)' : 'Vision (Bangla)'} value={content.visionBn} onChange={(event) => setContent('visionBn', event.target.value)} rows={3} maxLength={10000} />
              <TextAreaField label={isBn ? 'ভিশন (ইংরেজি)' : 'Vision (English)'} value={content.visionEn} onChange={(event) => setContent('visionEn', event.target.value)} rows={3} maxLength={10000} />
            </FormGrid>
          </Panel>

          <Panel title={isBn ? 'অধ্যক্ষের বার্তা' : "Principal's message"} description={isBn ? 'নাম, পদবি ও স্বাক্ষর কেবল অফিসিয়াল অনুমোদনের পর প্রকাশ করুন।' : 'Publish name, designation and signature only after official approval.'}>
            <FormGrid>
              <TextField label={isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'} value={content.principalNameBn} onChange={(event) => setContent('principalNameBn', event.target.value)} maxLength={200} />
              <TextField label={isBn ? 'নাম (ইংরেজি)' : 'Name (English)'} value={content.principalNameEn} onChange={(event) => setContent('principalNameEn', event.target.value)} maxLength={200} />
              <TextField label={isBn ? 'পদবি (বাংলা)' : 'Designation (Bangla)'} value={content.principalDesignationBn} onChange={(event) => setContent('principalDesignationBn', event.target.value)} maxLength={200} />
              <TextField label={isBn ? 'পদবি (ইংরেজি)' : 'Designation (English)'} value={content.principalDesignationEn} onChange={(event) => setContent('principalDesignationEn', event.target.value)} maxLength={200} />
              <TextAreaField label={isBn ? 'বার্তা (বাংলা)' : 'Message (Bangla)'} value={content.principalMessageBn} onChange={(event) => setContent('principalMessageBn', event.target.value)} rows={5} maxLength={10000} />
              <TextAreaField label={isBn ? 'বার্তা (ইংরেজি)' : 'Message (English)'} value={content.principalMessageEn} onChange={(event) => setContent('principalMessageEn', event.target.value)} rows={5} maxLength={10000} />
            </FormGrid>
          </Panel>

          <Panel title={isBn ? 'লক্ষ্য, সুবিধা ও অর্জন' : 'Objectives, facilities and achievements'}>
            <div className="space-y-4">
              <ArrayBlock
                title={isBn ? 'লক্ষ্য' : 'Objectives'}
                onAdd={() => setContent('objectives', [...content.objectives, { bn: '', en: '' }])}
                addLabel={t('dashboard.addRow')}
              >
                {content.objectives.map((objective, index) => (
                  <div key={`objective-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <FormGrid>
                      <TextField label={isBn ? 'বাংলা' : 'Bangla'} value={objective.bn} onChange={(event) => setContent('objectives', content.objectives.map((item, position) => position === index ? { ...item, bn: event.target.value } : item))} />
                      <TextField label={isBn ? 'ইংরেজি' : 'English'} value={objective.en} onChange={(event) => setContent('objectives', content.objectives.map((item, position) => position === index ? { ...item, en: event.target.value } : item))} />
                      <div className="sm:col-span-2 flex justify-end"><RemoveButton label={t('dashboard.removeRow')} onClick={() => setContent('objectives', content.objectives.filter((_item, position) => position !== index))} /></div>
                    </FormGrid>
                  </div>
                ))}
                {!content.objectives.length ? <p className="text-xs text-slate-500">{t('common.noData')}</p> : null}
              </ArrayBlock>

              <ArrayBlock
                title={isBn ? 'সুবিধা' : 'Facilities'}
                description={isBn ? 'সুবিধা যাচাই না হওয়া পর্যন্ত “যাচাই প্রক্রিয়াধীন” হিসেবে দেখানো হবে।' : 'Facilities show as pending until verified.'}
                onAdd={() => setContent('facilities', [...content.facilities, { nameBn: '', nameEn: '', detailBn: '', detailEn: '', verified: false }])}
                addLabel={t('dashboard.addRow')}
              >
                {content.facilities.map((facility, index) => (
                  <div key={facility.id || `facility-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <FormGrid>
                      <TextField label={isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'} value={facility.nameBn} onChange={(event) => setContent('facilities', content.facilities.map((item, position) => position === index ? { ...item, nameBn: event.target.value } : item))} />
                      <TextField label={isBn ? 'নাম (ইংরেজি)' : 'Name (English)'} value={facility.nameEn} onChange={(event) => setContent('facilities', content.facilities.map((item, position) => position === index ? { ...item, nameEn: event.target.value } : item))} />
                      <TextField label={isBn ? 'বিবরণ (বাংলা)' : 'Detail (Bangla)'} value={facility.detailBn} onChange={(event) => setContent('facilities', content.facilities.map((item, position) => position === index ? { ...item, detailBn: event.target.value } : item))} />
                      <TextField label={isBn ? 'বিবরণ (ইংরেজি)' : 'Detail (English)'} value={facility.detailEn} onChange={(event) => setContent('facilities', content.facilities.map((item, position) => position === index ? { ...item, detailEn: event.target.value } : item))} />
                      <CheckboxField label={t('dashboard.verificationFlag')} checked={facility.verified} onChange={(event) => setContent('facilities', content.facilities.map((item, position) => position === index ? { ...item, verified: event.target.checked } : item))} />
                      <div className="flex items-end justify-end"><RemoveButton label={t('dashboard.removeRow')} onClick={() => setContent('facilities', content.facilities.filter((_item, position) => position !== index))} /></div>
                    </FormGrid>
                  </div>
                ))}
              </ArrayBlock>

              <ArrayBlock
                title={isBn ? 'অর্জন' : 'Achievements'}
                description={isBn ? 'অনুমোদিত ও যাচাইকৃত অর্জন ছাড়া কিছু যোগ করবেন না।' : 'Add only approved and verified achievements.'}
                onAdd={() => setContent('achievements', [...content.achievements, { titleBn: '', titleEn: '', detailBn: '', detailEn: '', year: '', verified: false }])}
                addLabel={t('dashboard.addRow')}
              >
                {content.achievements.map((achievement, index) => (
                  <div key={achievement.id || `achievement-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <FormGrid>
                      <TextField label={isBn ? 'শিরোনাম (বাংলা)' : 'Title (Bangla)'} value={achievement.titleBn} onChange={(event) => setContent('achievements', content.achievements.map((item, position) => position === index ? { ...item, titleBn: event.target.value } : item))} />
                      <TextField label={isBn ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'} value={achievement.titleEn} onChange={(event) => setContent('achievements', content.achievements.map((item, position) => position === index ? { ...item, titleEn: event.target.value } : item))} />
                      <TextField label={isBn ? 'বিবরণ (বাংলা)' : 'Detail (Bangla)'} value={achievement.detailBn} onChange={(event) => setContent('achievements', content.achievements.map((item, position) => position === index ? { ...item, detailBn: event.target.value } : item))} />
                      <TextField label={isBn ? 'বিবরণ (ইংরেজি)' : 'Detail (English)'} value={achievement.detailEn} onChange={(event) => setContent('achievements', content.achievements.map((item, position) => position === index ? { ...item, detailEn: event.target.value } : item))} />
                      <TextField label={isBn ? 'সাল' : 'Year'} value={achievement.year} onChange={(event) => setContent('achievements', content.achievements.map((item, position) => position === index ? { ...item, year: event.target.value } : item))} />
                      <CheckboxField label={t('dashboard.verificationFlag')} checked={achievement.verified} onChange={(event) => setContent('achievements', content.achievements.map((item, position) => position === index ? { ...item, verified: event.target.checked } : item))} />
                      <div className="sm:col-span-2 flex justify-end"><RemoveButton label={t('dashboard.removeRow')} onClick={() => setContent('achievements', content.achievements.filter((_item, position) => position !== index))} /></div>
                    </FormGrid>
                  </div>
                ))}
              </ArrayBlock>
            </div>
          </Panel>
          <div className="flex justify-end"><Button type="submit" loading={busy === 'save'}><Save className="h-4 w-4" aria-hidden="true" />{t('action.save')}</Button></div>
        </form>
      ) : null}

      {tab === 'admission' ? (
        <form onSubmit={save} className="space-y-5">
          <Panel title={t('dashboard.settingsAdmission')} description={isBn ? 'ফি, যোগ্যতা, ডকুমেন্ট ও সময়সূচি শুধু অফিসিয়াল বিজ্ঞপ্তি থেকে দিন।' : 'Enter fees, eligibility, documents and deadlines only from the official notice.'}>
            <FormGrid>
              <TextAreaField label={isBn ? 'ভূমিকা (বাংলা)' : 'Introduction (Bangla)'} value={admission.introBn} onChange={(event) => setAdmission('introBn', event.target.value)} rows={3} />
              <TextAreaField label={isBn ? 'ভূমিকা (ইংরেজি)' : 'Introduction (English)'} value={admission.introEn} onChange={(event) => setAdmission('introEn', event.target.value)} rows={3} />
              <TextAreaField label={isBn ? 'যোগ্যতা (বাংলা)' : 'Eligibility (Bangla)'} value={admission.eligibilityBn} onChange={(event) => setAdmission('eligibilityBn', event.target.value)} rows={3} />
              <TextAreaField label={isBn ? 'যোগ্যতা (ইংরেজি)' : 'Eligibility (English)'} value={admission.eligibilityEn} onChange={(event) => setAdmission('eligibilityEn', event.target.value)} rows={3} />
              <TextAreaField label={isBn ? 'প্রয়োজনীয় ডকুমেন্ট (বাংলা)' : 'Required documents (Bangla)'} value={admission.documentsBn} onChange={(event) => setAdmission('documentsBn', event.target.value)} rows={3} />
              <TextAreaField label={isBn ? 'প্রয়োজনীয় ডকুমেন্ট (ইংরেজি)' : 'Required documents (English)'} value={admission.documentsEn} onChange={(event) => setAdmission('documentsEn', event.target.value)} rows={3} />
              <TextAreaField label={isBn ? 'আবেদন প্রক্রিয়া (বাংলা)' : 'Application steps (Bangla)'} value={admission.stepsBn} onChange={(event) => setAdmission('stepsBn', event.target.value)} rows={4} />
              <TextAreaField label={isBn ? 'আবেদন প্রক্রিয়া (ইংরেজি)' : 'Application steps (English)'} value={admission.stepsEn} onChange={(event) => setAdmission('stepsEn', event.target.value)} rows={4} />
              <TextAreaField label={isBn ? 'ফি (বাংলা)' : 'Fees (Bangla)'} value={admission.feesBn} onChange={(event) => setAdmission('feesBn', event.target.value)} rows={3} />
              <TextAreaField label={isBn ? 'ফি (ইংরেজি)' : 'Fees (English)'} value={admission.feesEn} onChange={(event) => setAdmission('feesEn', event.target.value)} rows={3} />
              <TextField label={isBn ? 'শেষ তারিখের বিবরণ' : 'Deadline details'} value={admission.deadlineBn} onChange={(event) => setAdmission('deadlineBn', event.target.value)} maxLength={200} />
              <TextField label={isBn ? 'আবেদনের লিংক' : 'Application link'} value={admission.applyUrl} onChange={(event) => setAdmission('applyUrl', event.target.value)} maxLength={500} hint={isBn ? 'শুধু https:// লিংক ব্যবহার করুন।' : 'Use only https:// links.'} />
            </FormGrid>
          </Panel>

          <Panel title={t('admission.faq')}>
            <ArrayBlock
              title={t('admission.faq')}
              onAdd={() => setAdmission('faqs', [...admission.faqs, { qBn: '', aBn: '', qEn: '', aEn: '' }])}
              addLabel={t('dashboard.addRow')}
            >
              {admission.faqs.map((faq, index) => (
                <div key={faq.id || `faq-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <FormGrid>
                    <TextField label={isBn ? 'প্রশ্ন (বাংলা)' : 'Question (Bangla)'} value={faq.qBn} onChange={(event) => setAdmission('faqs', admission.faqs.map((item, position) => position === index ? { ...item, qBn: event.target.value } : item))} />
                    <TextField label={isBn ? 'প্রশ্ন (ইংরেজি)' : 'Question (English)'} value={faq.qEn} onChange={(event) => setAdmission('faqs', admission.faqs.map((item, position) => position === index ? { ...item, qEn: event.target.value } : item))} />
                    <TextAreaField label={isBn ? 'উত্তর (বাংলা)' : 'Answer (Bangla)'} value={faq.aBn} onChange={(event) => setAdmission('faqs', admission.faqs.map((item, position) => position === index ? { ...item, aBn: event.target.value } : item))} rows={3} />
                    <TextAreaField label={isBn ? 'উত্তর (ইংরেজি)' : 'Answer (English)'} value={faq.aEn} onChange={(event) => setAdmission('faqs', admission.faqs.map((item, position) => position === index ? { ...item, aEn: event.target.value } : item))} rows={3} />
                    <div className="sm:col-span-2 flex justify-end"><RemoveButton label={t('dashboard.removeRow')} onClick={() => setAdmission('faqs', admission.faqs.filter((_item, position) => position !== index))} /></div>
                  </FormGrid>
                </div>
              ))}
            </ArrayBlock>
          </Panel>
          <div className="flex justify-end"><Button type="submit" loading={busy === 'save'}><Save className="h-4 w-4" aria-hidden="true" />{t('action.save')}</Button></div>
        </form>
      ) : null}

      {tab === 'data' ? (
        <div className="space-y-5">
          <Panel title={t('dashboard.backups')} description={isBn ? 'স্বয়ংক্রিয় ও ম্যানুয়াল ব্যাকআপ। সর্বোচ্চ ২৫টি ব্যাকআপ রাখা হয়।' : 'Automatic and manual backups. A maximum of 25 backups are kept.'}>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button onClick={createBackup} loading={busy === 'backup'}><Database className="h-4 w-4" aria-hidden="true" />{t('dashboard.createBackup')}</Button>
              <Button variant="outline" onClick={() => backups.reload()}>{t('action.retry')}</Button>
            </div>
            {backups.loading && !backups.data ? <LoadingBlock /> : null}
            {backups.error ? <ErrorState message={backups.error} onRetry={backups.reload} /> : null}
            {backups.data && !backups.data.items.length ? <EmptyState compact title={t('common.noData')} /> : null}
            {backups.data && backups.data.items.length ? (
              <div className="overflow-x-auto">
                <table className="table-base min-w-[34rem]">
                  <thead><tr><th scope="col">{t('dashboard.file')}</th><th scope="col">{t('common.date')}</th><th scope="col">{isBn ? 'আকার' : 'Size'}</th><th scope="col" className="text-right">{t('common.actions')}</th></tr></thead>
                  <tbody>
                    {backups.data.items.map((backup) => (
                      <tr key={backup.file}>
                        <td className="font-mono text-[0.68rem]">{backup.file}</td>
                        <td className="text-xs">{formatDateTime(backup.createdAt, lang)}</td>
                        <td className="text-xs">{formatBytes(backup.size, lang)}</td>
                        <td className="text-right">
                          <a href={`/api/admin/backups/${encodeURIComponent(backup.file)}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-pine-700 hover:bg-pine-50 dark:text-pine-300 dark:hover:bg-pine-950/40">
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />{t('action.download')}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Panel>

          <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900 dark:bg-red-950/20">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-red-900 dark:text-red-100">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              {t('dashboard.dangerZone')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-red-900/80 dark:text-red-100/80">
              {t('dashboard.demoWarning')}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="red">{isBn ? 'অপরিবর্তনীয়' : 'Irreversible'}</Badge>
              <Button variant="danger" onClick={removeDemo} loading={busy === 'demo'}>{t('dashboard.removeDemo')}</Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
