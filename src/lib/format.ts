import type { Language } from './types'

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

function locale(lang: Language): string {
  return lang === 'bn' ? 'bn-BD' : 'en-GB'
}

export function formatDate(value: string | undefined | null, lang: Language = 'bn'): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale(lang), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatDateShort(value: string | undefined | null, lang: Language = 'bn'): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale(lang), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | undefined | null, lang: Language = 'bn'): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale(lang), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function formatNumber(value: number, lang: Language = 'bn'): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale(lang)).format(value)
}

export function formatBytes(bytes: number, lang: Language = 'bn'): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${formatNumber(Math.round(value * 10) / 10, lang)} ${units[index]}`
}

export function toDateInput(value: string | undefined | null): string {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function toDateTimeInput(value: string | undefined | null): string {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function safeExternalUrl(value: string | undefined | null): string {
  if (!value) return ''
  const trimmed = String(value).trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
  } catch {
    return ''
  }
  return ''
}

export const dayLabels: Record<string, { bn: string; en: string }> = {
  saturday: { bn: 'শনিবার', en: 'Saturday' },
  sunday: { bn: 'রবিবার', en: 'Sunday' },
  monday: { bn: 'সোমবার', en: 'Monday' },
  tuesday: { bn: 'মঙ্গলবার', en: 'Tuesday' },
  wednesday: { bn: 'বুধবার', en: 'Wednesday' },
  thursday: { bn: 'বৃহস্পতিবার', en: 'Thursday' },
  friday: { bn: 'শুক্রবার', en: 'Friday' },
}
