import { Link } from 'react-router-dom'
import { ExternalLink, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { useApi } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import type { Settings } from '../../lib/types'
import { FALLBACK_INSTITUTION } from '../../lib/constants'

const quick = [
  { to: '/admission', key: 'nav.admission' },
  { to: '/notices', key: 'nav.notices' },
  { to: '/results', key: 'nav.results' },
  { to: '/academics', key: 'nav.academics' },
  { to: '/teachers', key: 'nav.teachers' },
  { to: '/events', key: 'nav.events' },
]

const important = [
  { to: '/about', key: 'nav.about' },
  { to: '/students', key: 'nav.students' },
  { to: '/contact', key: 'nav.contact' },
  { to: '/faq', key: 'nav.faq' },
  { to: '/privacy', key: 'nav.privacy' },
  { to: '/terms', key: 'nav.terms' },
]

export function Footer() {
  const { t, lang } = useI18n()
  const { data } = useApi<{ settings: Settings }>('/api/public/settings')
  const institution = data?.settings.institution
  const nameBn = institution?.nameBn || FALLBACK_INSTITUTION.nameBn
  const nameEn = institution?.nameEn || FALLBACK_INSTITUTION.nameEn
  const address =
    lang === 'bn'
      ? institution?.addressBn || FALLBACK_INSTITUTION.locationBn
      : institution?.addressEn || FALLBACK_INSTITUTION.locationBn
  const eiin = institution?.eiin || FALLBACK_INSTITUTION.eiin
  const phone = institution?.phone || ''
  const email = institution?.email || ''
  const officeHours = lang === 'bn' ? institution?.officeHoursBn : institution?.officeHoursEn
  const year = new Date().getFullYear()

  return (
    <footer className="no-print mt-16 border-t border-white/10 bg-navy-950 text-slate-300">
      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_1fr_1.25fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white/10 text-white">
                <span className="text-xl font-extrabold leading-none">ক</span>
                <span className="mt-1 h-0.5 w-5 rounded bg-pine-300" aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-extrabold text-white">{nameBn}</p>
                <p className="font-latin text-[0.65rem] uppercase tracking-[0.12em] text-slate-400">{nameEn}</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">{t('footer.verification')}</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-pine-300" aria-hidden="true" />
              EIIN <span className="font-latin font-bold text-white">{eiin}</span>
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">{t('footer.quickLinks')}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {quick.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-slate-400 transition hover:text-white">
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">{t('footer.important')}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {important.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-slate-400 transition hover:text-white">
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white">{t('footer.contact')}</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pine-300" aria-hidden="true" />
                <span>{address}</span>
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-pine-300" aria-hidden="true" />
                <span>{phone || t('common.notAvailable')}</span>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-pine-300" aria-hidden="true" />
                <span className="break-all">{email || t('common.notAvailable')}</span>
              </li>
              <li className="text-xs leading-6">
                {t('contact.officeHours')}: {officeHours || t('common.notAvailable')}
              </li>
            </ul>
            <Link
              to="/login"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-pine-300 hover:text-pine-200"
            >
              {t('footer.adminLogin')}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-xs leading-6 text-slate-500">{t('footer.siteNote')}</p>
          <div className="mt-3 flex flex-col justify-between gap-2 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>
              © {year} {nameBn}. {t('footer.copyright')}.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link to="/privacy" className="hover:text-slate-300">
                {t('nav.privacy')}
              </Link>
              <Link to="/terms" className="hover:text-slate-300">
                {t('nav.terms')}
              </Link>
              <Link to="/contact" className="hover:text-slate-300">
                {t('nav.contact')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
