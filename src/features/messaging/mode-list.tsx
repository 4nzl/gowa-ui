import { MESSAGING_GROUPS, type MessagingModeId } from '@/features/messaging/modes'
import { cn } from '@/lib/utils'

/** Grouped list of messaging modes for the left pane. */
export function ModeList({
  selectedId,
  onSelect,
}: {
  /** Highlighted mode; null when nothing is shown in the detail pane. */
  selectedId: MessagingModeId | null
  onSelect: (id: MessagingModeId) => void
}) {
  return (
    <nav
      aria-label="Jenis pesan dan tindakan"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
    >
      {MESSAGING_GROUPS.map((group) => (
        <div key={group.id} className="pb-2">
          <h2 className="text-muted-foreground px-4 pt-3 pb-2 text-xs font-semibold tracking-wide uppercase">
            {group.label}
          </h2>
          <ul>
            {group.modes.map(({ id, label, description, icon: Icon }) => {
              const selected = id === selectedId
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSelect(id)}
                    aria-current={selected ? 'true' : undefined}
                    className={cn(
                      'flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
                      selected ? 'bg-accent' : 'hover:bg-accent/60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                        selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{label}</span>
                      <span className="text-muted-foreground block truncate text-[13px]">
                        {description}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
