import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { useI18n } from '../../lib/i18n'

export function PublicLayout() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only z-[120] rounded-lg bg-white px-4 py-3 font-bold text-navy-900 shadow-xl focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
