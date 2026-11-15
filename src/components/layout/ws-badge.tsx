import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useWsStore, type WsStatus } from '@/lib/ws'
import { cn } from '@/lib/utils'

const dotStyles: Record<WsStatus, string> = {
  connected: 'bg-live live-dot',
  connecting: 'bg-amber-500 animate-pulse',
  disconnected: 'bg-muted-foreground/40',
}

const labels: Record<WsStatus, string> = {
  connected: 'Pembaruan langsung tersambung',
  connecting: 'Pembaruan langsung menyambung ulang…',
  disconnected: 'Pembaruan langsung terputus',
}

export function WsBadge() {
  const status = useWsStore((state) => state.status)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="status"
          className="grid size-8 shrink-0 place-items-center"
          aria-label={labels[status]}
        >
          <span className={cn('size-2.5 rounded-full', dotStyles[status])} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{labels[status]}</TooltipContent>
    </Tooltip>
  )
}
