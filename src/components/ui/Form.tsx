import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/format'

interface BaseFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
}

function FieldShell({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: BaseFieldProps & { htmlFor: string; children: ReactNode }) {
  return (
    <div className={cn('w-full', className)}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? (
          <span className="ml-1 text-red-600 dark:text-red-400" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? <p className="field-help">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {}

export function TextField({ label, hint, error, required, className, id, ...props }: TextFieldProps) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <input
        id={inputId}
        className={cn('field-input', error && 'border-red-500 focus:border-red-600 focus:ring-red-600/20')}
        required={required}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </FieldShell>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseFieldProps {}

export function TextAreaField({ label, hint, error, required, className, id, ...props }: TextAreaFieldProps) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <textarea
        id={inputId}
        className={cn('field-input min-h-28 resize-y', error && 'border-red-500')}
        required={required}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </FieldShell>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseFieldProps {
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  id,
  options,
  placeholder,
  ...props
}: SelectFieldProps) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={className}>
      <select
        id={inputId}
        className={cn('field-input', error && 'border-red-500')}
        required={required}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
}

export function CheckboxField({ label, hint, className, id, ...props }: CheckboxFieldProps) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40', className)}>
      <input
        id={inputId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-400 text-pine-600 focus:ring-pine-600 dark:border-slate-600 dark:bg-slate-900"
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p> : null}
      </div>
    </div>
  )
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-4 sm:grid-cols-2', className)}>{children}</div>
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-base font-bold text-navy-900 dark:text-slate-100">{title}</legend>
      {description ? <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}
      {children}
    </fieldset>
  )
}
