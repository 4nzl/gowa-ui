import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MessageSquareText } from 'lucide-react'
import { DetailPaneHeader } from '@/components/layout/list-detail'
import { Button } from '@/components/ui/button'
import { dayLabel, formatBubbleTime, formatChatTime } from '@/features/chat/chat-format'
import { FormattedText } from '@/features/chat/formatted-text'
import { MessageMedia } from '@/features/chat/message-media'
import { openChatState } from '@/features/chat/open-chat'
import { StatusRingAvatar } from '@/features/status/status-list'
import {
  clampIndex,
  initialStatusIndex,
  statusCount,
  type StatusPoster,
} from '@/features/status/status-format'
import { cn } from '@/lib/utils'

/** Above this many statuses the segmented bar becomes a single progress bar. */
const MAX_SEGMENTS = 30

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest('[role="dialog"], [role="alertdialog"]')) return true
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
}

function ProgressBar({ index, count }: { index: number; count: number }) {
  if (count > MAX_SEGMENTS) {
    return (
      <div className="bg-muted h-1 overflow-hidden rounded-full" aria-hidden>
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{ width: `${((index + 1) / count) * 100}%` }}
        />
      </div>
    )
  }
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: count }, (_, position) => (
        <span
          key={position}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            position <= index ? 'bg-primary' : 'bg-muted',
          )}
        />
      ))}
    </div>
  )
}

export function StatusViewer({
  poster,
  deviceId,
  onBack,
}: {
  poster: StatusPoster
  deviceId: string
  onBack: () => void
}) {
  const navigate = useNavigate()
  const { statuses } = poster
  const [position, setPosition] = useState(() => initialStatusIndex(statuses))
  const index = clampIndex(position, statuses.length)
  const status = statuses[index]
  const count = statuses.length

  const go = useCallback(
    (step: number) => setPosition((current) => clampIndex(current + step, count)),
    [count],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (isTypingTarget(event.target)) return
      if (event.key === 'ArrowLeft') go(-1)
      else if (event.key === 'ArrowRight') go(1)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const hasMedia = Boolean(status?.media_type)
  const openChat = () => navigate('/chats', { state: openChatState(poster.jid, poster.name) })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DetailPaneHeader
        onBack={onBack}
        leading={<StatusRingAvatar poster={poster} muted={!poster.recent} className="size-10" />}
        title={poster.name}
        subtitle={`${statusCount(count)} · terakhir ${formatChatTime(poster.latest)}`}
        actions={
          <Button variant="ghost" size="sm" onClick={openChat}>
            <MessageSquareText className="size-4" />
            <span className="max-tab:sr-only">Buka chat</span>
          </Button>
        }
      />

      {status && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="tab:px-6 flex flex-col gap-1.5 px-3 pt-3">
            <ProgressBar index={index} count={count} />
            <p className="text-muted-foreground text-center text-xs" aria-live="polite">
              Status {index + 1} dari {count} · {dayLabel(status.timestamp)}{' '}
              {formatBubbleTime(status.timestamp)}
            </p>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center gap-2 px-2 py-3">
            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              aria-label="Status sebelumnya"
              disabled={index === 0}
              onClick={() => go(-1)}
            >
              <ChevronLeft className="size-5" />
            </Button>

            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain">
              <article
                key={status.id}
                className="flex w-full max-w-lg flex-col items-center gap-3"
                aria-label={`Status ${index + 1} dari ${count}`}
              >
                {hasMedia ? (
                  <>
                    <div className="bg-card w-full max-w-md overflow-hidden rounded-xl border p-1.5 shadow-xs [&_img]:mx-auto [&_img]:max-h-[60vh]">
                      <MessageMedia message={status} deviceId={deviceId} />
                    </div>
                    {status.content && (
                      <FormattedText
                        text={status.content}
                        className="max-w-md text-center text-[15px] [overflow-wrap:anywhere]"
                      />
                    )}
                  </>
                ) : (
                  <div className="bg-primary text-primary-foreground grid min-h-[min(50vh,360px)] w-full max-w-md place-items-center rounded-2xl p-8 shadow-sm">
                    <FormattedText
                      text={status.content || '(status kosong)'}
                      className="text-center text-2xl leading-snug font-medium [overflow-wrap:anywhere]"
                    />
                  </div>
                )}
                <time
                  dateTime={status.timestamp}
                  className="text-muted-foreground text-xs"
                  title={new Date(status.timestamp).toLocaleString('id-ID')}
                >
                  {dayLabel(status.timestamp)}, {formatBubbleTime(status.timestamp)}
                </time>
              </article>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              aria-label="Status berikutnya"
              disabled={index === count - 1}
              onClick={() => go(1)}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          <p className="text-muted-foreground max-tab:hidden pb-3 text-center text-xs">
            Gunakan tombol panah ← / → pada keyboard untuk berpindah status.
          </p>
        </div>
      )}
    </div>
  )
}
