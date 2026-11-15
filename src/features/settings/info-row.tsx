import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Label/value row; wrap several in a <dl>. */
export function InfoRow({
  label,
  children,
  mono,
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-right text-sm font-medium [overflow-wrap:anywhere]',
          mono && 'font-mono font-normal',
        )}
      >
        {children}
      </dd>
    </div>
  )
}
