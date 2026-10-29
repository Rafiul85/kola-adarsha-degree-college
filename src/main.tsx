import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { ThemeProvider } from './context/ThemeContext'
import { I18nProvider } from './lib/i18n'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ScrollToTop } from './components/layout/ScrollToTop'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <ScrollToTop />
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)
