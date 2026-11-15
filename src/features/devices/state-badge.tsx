import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { stateDotStyles, stateLabels } from '@/features/devices/device-display'
import type { DeviceState } from '@/api/types'

const stateStyles: Record<DeviceState, string> = {
  logged_in: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  connected: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  connecting: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  disconnected: 'bg-muted text-muted-foreground',
}

export function StateBadge({ state }: { state: DeviceState }) {
  return (
    <Badge variant="secondary" className={cn('border-transparent', stateStyles[state])}>
      {stateLabels[state] ?? state}
    </Badge>
  )
}

export function StateDot({ state, className }: { state: DeviceState; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2.5 shrink-0 rounded-full',
        stateDotStyles[state],
        className,
      )}
    />
  )
}
