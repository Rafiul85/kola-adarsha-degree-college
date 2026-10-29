import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/format'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-navy-900 text-white hover:bg-navy-800 focus-visible:outline-navy-900 dark:bg-pine-600 dark:hover:bg-pine-500 dark:focus-visible:outline-pine-300',
  secondary:
    'bg-pine-600 text-white hover:bg-pine-700 focus-visible:outline-pine-700 dark:bg-pine-500 dark:hover:bg-pine-400 dark:text-navy-950',
  outline:
    'border border-navy-200 bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50 focus-visible:outline-navy-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  ghost:
    'text-navy-800 hover:bg-navy-50 focus-visible:outline-navy-700 dark:text-slate-200 dark:hover:bg-slate-800',
  danger:
    'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-800 dark:bg-red-600 dark:hover:bg-red-500',
  success:
    'bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:outline-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-xs gap-1.5',
  md: 'min-h-11 px-4 py-2.5 text-sm gap-2',
  lg: 'min-h-12 px-5 py-3 text-base gap-2',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = ''): string {
  return cn(
    'inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55',
    variants[variant],
    sizes[size],
    className,
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

interface ButtonLinkProps {
  to: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
  target?: string
  rel?: string
  ariaLabel?: string
  onClick?: () => void
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  target,
  rel,
  ariaLabel,
  onClick,
}: ButtonLinkProps) {
  const classes = buttonClass(variant, size, className)
  const external = /^https?:\/\//.test(to)
  if (external) {
    return (
      <a href={to} className={classes} target={target || '_blank'} rel={rel || 'noopener noreferrer'} aria-label={ariaLabel}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={classes} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </Link>
  )
}
