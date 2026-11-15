import { useState } from 'react'
import { ChevronDown, CircleDashed, History, Loader2, Plus, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { formatChatTime } from '@/features/chat/chat-format'
import { statusCount, type StatusPoster } from '@/features/status/status-format'
import type { useStatuses } from '@/features/status/use-statuses'
import { toApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'

const rowClass = cn(
  'flex min-h-[72px] w-full items-center gap-3 px-3 text-left transition-colors',
  'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
)

/** Poster avatar inside the green "has status" ring. */
export function StatusRingAvatar({
  poster,
  className,
  muted = false,
}: {
  poster: Pick<StatusPoster, 'jid' | 'name'>
  className?: string
  /** Older statuses get a grey ring, like viewed stories in WhatsApp. */
  muted?: boolean
}) {
  return (
    <span
      className={cn(
        'ring-offset-card shrink-0 rounded-full ring-2 ring-offset-2',
        muted ? 'ring-muted-foreground/40' : 'ring-primary',
      )}
    >
      <ChatAvatar jid={poster.jid} name={poster.name} className={cn('size-11', className)} />
    </span>
  )
}

function PosterRow({
  poster,
  selected,
  onSelect,
}: {
  poster: StatusPoster
  selected: boolean
  onSelect: (poster: StatusPoster) => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(poster)}
        aria-current={selected ? 'true' : undefined}
        className={cn(rowClass, selected ? 'bg-accent' : 'hover:bg-accent/60')}
      >
        <StatusRingAvatar poster={poster} muted={!poster.recent} className="text-lg" />
        <span className="ml-0.5 flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
          <span className="truncate text-[15.5px] font-medium">{poster.name}</span>
          <span className="text-muted-foreground truncate text-[13.5px]">
            {statusCount(poster.statuses.length)} · {formatChatTime(poster.latest)}
          </span>
        </span>
      </button>
    </li>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="text-primary px-4 pt-4 pb-1 text-[13px] font-medium tracking-wide uppercase">
      {children}
    </h2>
  )
}

export function StatusList({
  data,
  selectedJid,
  mineSelected,
  onSelectMine,
  onSelectPoster,
}: {
  data: ReturnType<typeof useStatuses>
  selectedJid: string | null
  mineSelected: boolean
  onSelectMine: () => void
  onSelectPoster: (poster: StatusPoster) => void
}) {
  const [showOlder, setShowOlder] = useState(true)
  const { sections, isLoading, error } = data
  const empty = !isLoading && sections.recent.length === 0 && sections.older.length === 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul>
          <li>
            <button
              type="button"
              onClick={onSelectMine}
              aria-current={mineSelected ? 'true' : undefined}
              className={cn(rowClass, mineSelected ? 'bg-accent' : 'hover:bg-accent/60')}
            >
              <span className="bg-primary text-primary-foreground grid size-12 shrink-0 place-items-center rounded-full">
                <Plus className="size-6" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
                <span className="truncate text-[15.5px] font-medium">Status saya</span>
                <span className="text-muted-foreground truncate text-[13.5px]">
                  Ketuk untuk membuat status baru
                </span>
              </span>
            </button>
          </li>
        </ul>

        {error && (
          <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-6 text-center text-sm">
            <p>Gagal memuat status: {toApiError(error).message}</p>
            <Button variant="outline" size="sm" onClick={data.refetch}>
              <RotateCw className="size-4" />
              Coba lagi
            </Button>
          </div>
        )}

        {isLoading && (
          <ul aria-label="Memuat status">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="flex min-h-[72px] items-center gap-3 px-3">
                <Skeleton className="size-12 rounded-full" />
                <span className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </span>
              </li>
            ))}
          </ul>
        )}

        {empty && !error && (
          <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-10 text-center text-sm">
            <CircleDashed className="size-10" strokeWidth={1.4} />
            <p>Belum ada status tersimpan di server untuk perangkat ini.</p>
          </div>
        )}

        {sections.recent.length > 0 && (
          <section aria-label="Status terbaru">
            <SectionLabel>Terbaru</SectionLabel>
            <ul>
              {sections.recent.map((poster) => (
                <PosterRow
                  key={poster.jid}
                  poster={poster}
                  selected={poster.jid === selectedJid}
                  onSelect={onSelectPoster}
                />
              ))}
            </ul>
          </section>
        )}

        {sections.older.length > 0 && (
          <section aria-label="Status sebelumnya">
            <button
              type="button"
              onClick={() => setShowOlder((value) => !value)}
              aria-expanded={showOlder}
              className="text-primary flex w-full items-center justify-between px-4 pt-4 pb-1 text-[13px] font-medium tracking-wide uppercase"
            >
              Sebelumnya ({sections.older.length})
              <ChevronDown
                className={cn('size-4 transition-transform', !showOlder && '-rotate-90')}
              />
            </button>
            {showOlder && (
              <ul>
                {sections.older.map((poster) => (
                  <PosterRow
                    key={poster.jid}
                    poster={poster}
                    selected={poster.jid === selectedJid}
                    onSelect={onSelectPoster}
                  />
                ))}
              </ul>
            )}
          </section>
        )}

        {data.hasMore && (
          <div className="flex justify-center px-4 py-4">
            <Button variant="outline" size="sm" disabled={data.loadingMore} onClick={data.loadMore}>
              {data.loadingMore ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <History className="size-4" />
              )}
              Muat status lama
            </Button>
          </div>
        )}
      </div>
      <p className="text-muted-foreground border-t px-4 py-2 text-xs">
        {statusCount(data.total)} dimuat · diperbarui tiap menit
      </p>
    </div>
  )
}
