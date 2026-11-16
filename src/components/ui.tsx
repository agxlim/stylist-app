import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Page({ children, narrow = true }: { children: ReactNode; narrow?: boolean }) {
  return (
    <main
      className={`mx-auto min-h-full w-full px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] ${
        narrow ? 'max-w-md' : 'max-w-3xl'
      }`}
    >
      {children}
    </main>
  )
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-3xl leading-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-stone-600">{subtitle}</p>}
    </header>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  busy?: boolean
}

export function Button({ variant = 'primary', busy, className = '', children, disabled, ...rest }: ButtonProps) {
  const styles = {
    primary: 'bg-ink text-paper hover:bg-stone-800',
    secondary: 'border border-stone-300 bg-white text-ink hover:bg-stone-100',
    ghost: 'text-stone-700 hover:bg-stone-100',
    danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  }[variant]
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  )
}

export function Chip({
  selected,
  onClick,
  children,
  hint,
  single = false,
}: {
  single?: boolean
  selected: boolean
  onClick: () => void
  children: ReactNode
  hint?: string
}) {
  return (
    <button
      type="button"
      role={single ? 'radio' : 'checkbox'}
      aria-checked={selected}
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        selected ? 'border-ink bg-ink text-paper' : 'border-stone-300 bg-white hover:border-stone-500'
      }`}
    >
      <span className="block font-medium">{children}</span>
      {hint && <span className={`block text-sm ${selected ? 'text-stone-300' : 'text-stone-500'}`}>{hint}</span>}
    </button>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
      {children}
    </p>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status">
      <span className="size-6 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6 flex gap-1.5" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-stone-200'}`} />
      ))}
    </div>
  )
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return 'Something went wrong. Please try again.'
}
