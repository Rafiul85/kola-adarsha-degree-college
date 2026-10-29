import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react'
import { cn } from '../lib/format'

type ToastKind = 'success' | 'error' | 'info' | 'warning'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastValue {
  toast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastValue | null>(null)

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const styles: Record<ToastKind, string> = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  error: 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
  info: 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100',
  warning: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setItems((list) => list.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setItems((list) => [...list.slice(-3), { id, kind, message }])
      window.setTimeout(() => remove(id), 6000)
    },
    [remove],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4 no-print"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => {
          const Icon = icons[item.kind]
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
                styles[item.kind],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm leading-6">{item.message}</p>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded p-1 opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}
