import { useEffect, type ComponentType, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useShellStore } from '@/stores/shell'

/**
 * WhatsApp-Web style two-pane page: a list on the left and a detail pane on
 * the right. Tablet and desktop show both; mobile (≤690px) shows one at a time
 * and, while the detail is open, hides the shell's navigation (immersive mode).
 *
 * Register the page path in FULL_BLEED_PATHS (app-shell.tsx) so the shell does
 * not wrap it in a padded column.
 */
export function ListDetailLayout({
  listLabel,
  detailLabel,
  list,
  detail,
  detailOpen,
}: {
  listLabel: string
  detailLabel: string
  list: ReactNode
  /** Rendered in the right pane; pass an EmptyPane when nothing is selected. */
  detail: ReactNode
  /** Mobile only: true shows the detail pane instead of the list. */
  detailOpen: boolean
}) {
  const setImmersive = useShellStore((state) => state.setImmersive)

  useEffect(() => {
    setImmersive(detailOpen)
  }, [detailOpen, setImmersive])
  useEffect(() => () => setImmersive(false), [setImmersive])

  return (
    <div className="flex h-full min-h-0">
      <aside
        aria-label={listLabel}
        className={cn(
          'bg-card flex min-h-0 w-full flex-col',
          'tab:w-[clamp(285px,39vw,345px)] tab:shrink-0 tab:border-r desk:w-[clamp(350px,29vw,465px)]',
          detailOpen && 'max-tab:hidden',
        )}
      >
        {list}
      </aside>
      <section
        aria-label={detailLabel}
        className={cn(
          'bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-clip',
          !detailOpen && 'max-tab:hidden',
        )}
      >
        {detail}
      </section>
    </div>
  )
}

/** Title row at the top of a list pane, with optional actions on the right. */
export function ListPaneHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="flex min-h-16 shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  )
}

/** Header bar of a detail pane; the back button only shows on mobile. */
export function DetailPaneHeader({
  title,
  subtitle,
  leading,
  actions,
  onBack,
  backLabel = 'Kembali',
}: {
  title: ReactNode
  subtitle?: ReactNode
  leading?: ReactNode
  actions?: ReactNode
  onBack?: () => void
  backLabel?: string
}) {
  return (
    <header className="bg-card tab:px-4 flex h-16 shrink-0 items-center gap-3 border-b px-2">
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          className="tab:hidden size-10 shrink-0 rounded-full"
          aria-label={backLabel}
          onClick={onBack}
        >
          <ArrowLeft className="size-5" />
        </Button>
      )}
      {leading}
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-medium">{title}</h2>
        {subtitle && <p className="text-muted-foreground truncate text-xs">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  )
}

/** Scrollable body of a detail pane with the standard padding and width. */
export function DetailPaneBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="tab:p-6 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
      <div
        className={cn(
          'mx-auto flex max-w-3xl flex-col gap-3 pb-[env(safe-area-inset-bottom)]',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Placeholder shown in the detail pane when nothing is selected. */
export function EmptyPane({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon className="size-12" strokeWidth={1.4} />
      <h2 className="text-foreground text-xl font-normal">{title}</h2>
      {hint && <p className="max-w-sm text-sm">{hint}</p>}
      {action}
    </div>
  )
}

/** Card-like section inside a detail pane. */
export function PaneSection({
  title,
  description,
  children,
  tone,
  actions,
}: {
  title: string
  description?: ReactNode
  children?: ReactNode
  tone?: 'danger'
  actions?: ReactNode
}) {
  return (
    <section
      className={cn(
        'bg-card tab:p-5 rounded-xl border p-4',
        tone === 'danger' && 'border-destructive/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn('font-medium', tone === 'danger' && 'text-destructive')}>{title}</h3>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        {actions}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </section>
  )
}
