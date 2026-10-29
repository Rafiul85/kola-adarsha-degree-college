import { useState, type FormEvent } from 'react'
import { Copy, KeyRound, Pencil, Plus, ShieldCheck } from 'lucide-react'
import { api, useApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../context/ToastContext'
import { usePageMeta } from '../../components/SEO'
import type { AdminUser, Role } from '../../lib/types'
import { Alert, Badge, EmptyState, ErrorState, LoadingBlock, StatusBadge } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Overlay'
import { CheckboxField, FormGrid, SelectField, TextField } from '../../components/ui/Form'
import { formatDateTime } from '../../lib/format'

interface UsersPayload {
  items: AdminUser[]
  students: { id: string; name: string; studentId: string }[]
  teachers: { id: string; name: string; designation: string }[]
}

export default function AdminUsers() {
  usePageMeta({ title: 'ব্যবহারকারী ও ভূমিকা', noindex: true })
  const { t, lang } = useI18n()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const { data, loading, error, reload } = useApi<UsersPayload>('/api/admin/users')
  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [status, setStatus] = useState('active')
  const [linkedId, setLinkedId] = useState('')
  const [password, setPassword] = useState('')
  const [mustChangePassword, setMustChangePassword] = useState(true)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetInfo, setResetInfo] = useState<{ user: AdminUser; url: string; minutes: number } | null>(null)
  const isBn = lang === 'bn'

  function openCreate() {
    setDisplayName('')
    setEmail('')
    setRole('student')
    setStatus('active')
    setLinkedId('')
    setPassword('')
    setMustChangePassword(true)
    setFormError('')
    setEditing(null)
  }

  function openEdit(user: AdminUser) {
    setDisplayName(user.displayName)
    setEmail(user.email)
    setRole(user.role)
    setStatus(user.status)
    setLinkedId(user.linkedId || '')
    setPassword('')
    setMustChangePassword(user.mustChangePassword)
    setFormError('')
    setEditing(user)
  }

  const isSelf = Boolean(editing && currentUser && editing.id === currentUser.id)
  const linkOptions =
    role === 'student'
      ? (data?.students || []).map((student) => ({ value: student.id, label: `${student.name} — ${student.studentId}` }))
      : role === 'teacher'
        ? (data?.teachers || []).map((teacher) => ({ value: teacher.id, label: `${teacher.name}${teacher.designation ? ` — ${teacher.designation}` : ''}` }))
        : []

  async function save(event?: FormEvent) {
    event?.preventDefault()
    setFormError('')
    if (editing === null && !password) {
      setFormError(isBn ? 'নতুন অ্যাকাউন্টের জন্য পাসওয়ার্ড দিন।' : 'A password is required for a new account.')
      return
    }
    if (role !== 'admin' && !linkedId) {
      setFormError(isBn ? 'এই ভূমিকার জন্য একটি রেকর্ড নির্বাচন করুন।' : 'Select a linked record for this role.')
      return
    }
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        displayName,
        email,
        role,
        status,
        linkedId: role === 'admin' ? '' : linkedId,
        mustChangePassword,
      }
      if (password) payload.password = password
      const path = editing?.id ? `/api/admin/users/${editing.id}` : '/api/admin/users'
      await api(path, { method: editing?.id ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      toast(editing?.id ? t('dashboard.saved') : (isBn ? 'অ্যাকাউন্ট তৈরি হয়েছে।' : 'Account created.'))
      setEditing(undefined)
      reload()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  async function generateReset(user: AdminUser) {
    setBusy(true)
    setFormError('')
    try {
      const response = await api<{ resetUrl: string; expiresInMinutes: number }>(`/api/admin/users/${user.id}/reset-link`, { method: 'POST' })
      setResetInfo({ user, url: response.resetUrl, minutes: response.expiresInMinutes })
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function copyReset() {
    if (!resetInfo) return
    try {
      await navigator.clipboard.writeText(resetInfo.url)
      toast(t('dashboard.copied'))
    } catch {
      setFormError(isBn ? 'কপি করা যায়নি। লিংকটি ম্যানুয়ালি নির্বাচন করুন।' : 'Copy failed. Select the link manually.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t('dashboard.users')}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {isBn
              ? 'শিক্ষক ও শিক্ষার্থী অ্যাকাউন্ট শুধু সংশ্লিষ্ট রেকর্ডের সাথে সংযুক্ত করা যায়। নিজে নিজে নিবন্ধন বা অ্যাডমিন পদে উন্নীত হওয়ার কোনো সুযোগ নেই।'
              : 'Teacher and student accounts must be linked to their records. There is no self-registration or self-promotion to administrator.'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('dashboard.userCreate')}
        </Button>
      </div>

      <Alert kind="warning" title={t('dashboard.accountSecurity')}>
        {t('dashboard.selfRoleNote')}
      </Alert>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data && !data.items.length ? <EmptyState title={t('common.noData')} /> : null}

      {data && data.items.length ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base min-w-[48rem]">
              <thead>
                <tr>
                  <th scope="col">{t('dashboard.displayName')}</th>
                  <th scope="col">{t('dashboard.email')}</th>
                  <th scope="col">{t('dashboard.role')}</th>
                  <th scope="col">{t('dashboard.linkedRecord')}</th>
                  <th scope="col">{t('common.status')}</th>
                  <th scope="col" className="text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <p className="font-semibold">{user.displayName}</p>
                      <p className="text-[0.68rem] text-slate-500">
                        {isBn ? 'শেষ লগইন' : 'Last sign-in'}: {user.lastLoginAt ? formatDateTime(user.lastLoginAt, lang) : '—'}
                      </p>
                    </td>
                    <td className="text-xs">{user.email}</td>
                    <td><Badge tone={user.role === 'admin' ? 'navy' : user.role === 'teacher' ? 'green' : 'sky'}>{t(`role.${user.role}`)}</Badge></td>
                    <td className="text-xs">{user.linkedName || '—'}</td>
                    <td><StatusBadge status={user.status} /></td>
                    <td>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          aria-label={`${t('action.edit')}: ${user.displayName}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => void generateReset(user)}>
                          <KeyRound className="h-4 w-4" aria-hidden="true" />
                          {t('dashboard.generateReset')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <Modal
        open={editing !== undefined}
        onClose={() => (busy ? undefined : setEditing(undefined))}
        title={editing?.id ? t('dashboard.userEdit') : t('dashboard.userCreate')}
        description={isBn ? 'ভূমিকা ও সংযুক্ত রেকর্ড সতর্কভাবে নির্বাচন করুন।' : 'Choose the role and linked record carefully.'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(undefined)} disabled={busy}>{t('action.cancel')}</Button>
            <Button onClick={() => void save()} loading={busy}>{t('action.save')}</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <FormGrid>
            <TextField label={t('dashboard.displayName')} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={160} />
            <TextField label={t('dashboard.email')} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={200} autoComplete="off" />
            <SelectField
              label={t('dashboard.role')}
              value={role}
              onChange={(event) => {
                setRole(event.target.value as Role)
                setLinkedId('')
              }}
              options={(['admin', 'teacher', 'student'] as Role[]).map((value) => ({ value, label: t(`role.${value}`) }))}
              disabled={isSelf}
              hint={isSelf ? (isBn ? 'নিজের ভূমিকা পরিবর্তন করা যাবে না।' : 'You cannot change your own role.') : undefined}
            />
            <SelectField
              label={t('common.status')}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[{ value: 'active', label: t('status.active') }, { value: 'inactive', label: t('status.inactive') }]}
              disabled={isSelf}
            />
            {role !== 'admin' ? (
              <div className="sm:col-span-2">
                <SelectField
                  label={t('dashboard.linkedRecord')}
                  value={linkedId}
                  onChange={(event) => setLinkedId(event.target.value)}
                  options={linkOptions}
                  placeholder={isBn ? 'রেকর্ড নির্বাচন করুন' : 'Select a record'}
                  required
                  hint={
                    linkOptions.length
                      ? undefined
                      : isBn
                        ? 'আগে সংশ্লিষ্ট শিক্ষক বা শিক্ষার্থী রেকর্ড তৈরি করুন।'
                        : 'Create the teacher or student record first.'
                  }
                />
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <TextField
                label={editing?.id ? t('dashboard.passwordOptional') : t('dashboard.newPassword')}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required={editing === null}
                hint={isBn ? 'অন্তত ১০ অক্ষর, ইংরেজি অক্ষর ও সংখ্যাসহ।' : 'At least 10 characters including a letter and a number.'}
              />
            </div>
            <div className="sm:col-span-2">
              <CheckboxField
                label={t('dashboard.forcePasswordChange')}
                checked={mustChangePassword}
                onChange={(event) => setMustChangePassword(event.target.checked)}
              />
            </div>
          </FormGrid>
          {isSelf ? <Alert kind="info">{t('dashboard.selfRoleNote')}</Alert> : null}
          {formError ? <Alert kind="error">{formError}</Alert> : null}
        </form>
      </Modal>

      <Modal
        open={Boolean(resetInfo)}
        onClose={() => setResetInfo(null)}
        title={t('dashboard.resetLink')}
        description={resetInfo ? `${resetInfo.user.displayName} · ${resetInfo.user.email}` : undefined}
        footer={<Button variant="outline" onClick={() => setResetInfo(null)}>{t('action.close')}</Button>}
      >
        {resetInfo ? (
          <div className="space-y-4">
            <Alert kind="warning">{t('dashboard.resetNote')}</Alert>
            <div className="break-all rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono text-xs dark:border-slate-700 dark:bg-slate-800">
              {resetInfo.url}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isBn ? `মেয়াদ: ${resetInfo.minutes} মিনিট` : `Expires in ${resetInfo.minutes} minutes`}
            </p>
            <Button onClick={() => void copyReset()}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {t('dashboard.copy')}
            </Button>
            {formError ? <Alert kind="error">{formError}</Alert> : null}
          </div>
        ) : null}
      </Modal>

      <div className="card flex items-start gap-3 p-4 text-xs leading-6 text-slate-600 dark:text-slate-300">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-pine-700 dark:text-pine-300" aria-hidden="true" />
        <p>
          {isBn
            ? 'অ্যাকাউন্ট নিষ্ক্রিয় করলে ব্যবহারকারীর সব সেশন বন্ধ হয়। পাসওয়ার্ড পরিবর্তন করলেও অন্য সেশন বন্ধ হয়। অন্তত একজন সক্রিয় অ্যাডমিন থাকতে হবে।'
            : 'Deactivating an account ends all its sessions. Changing a password also ends other sessions. At least one active administrator must remain.'}
        </p>
      </div>
    </div>
  )
}
