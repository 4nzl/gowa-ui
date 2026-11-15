import { useMemo } from 'react'
import { Loader2, PhoneIncoming, PhoneMissed, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { chatTitle, formatChatTime } from '@/features/chat/chat-format'
import {
  CALL_SCAN_CHATS,
  callStatusLabel,
  groupCallsByDay,
  type CallRecord,
  type ScanProgress,
} from '@/features/call/call-history'
import { toApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'

export function CallList({
  calls,
  isLoading,
  error,
  progress,
  failed,
  totalChats,
  selectedKey,
  onSelect,
  onRetry,
}: {
  calls: CallRecord[] | undefined
  isLoading: boolean
  error: unknown
  progress: ScanProgress | null
  failed: number
  totalChats: number
  selectedKey: string | null
  onSelect: (call: CallRecord) => void
  onRetry: () => void
}) {
  const groups = useMemo(() => groupCallsByDay(calls ?? []), [calls])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="text-muted-foreground flex flex-col gap-1 px-4 pb-2 text-xs">
        <p>
          Hanya panggilan masuk yang dicatat GOWA, dari {CALL_SCAN_CHATS} chat terbaru. Panggilan
          keluar tidak tersimpan.
        </p>
        {progress && (
          <p role="status" className="text-primary flex items-center gap-1.5 font-medium">
            <Loader2 className="size-3 animate-spin" />
            Memindai {progress.done}/{progress.total} chat…
          </p>
        )}
        {!progress && failed > 0 && (
          <p className="text-destructive">{failed} chat gagal dipindai; daftar mungkin kurang.</p>
        )}
        {!progress && totalChats > CALL_SCAN_CHATS && calls && (
          <p>
            {totalChats - CALL_SCAN_CHATS} chat lama tidak dipindai; buka chatnya untuk melihat
            panggilan yang lebih lama.
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading && !calls ? (
          progress ? null : (
            <div className="flex justify-center p-6" role="status" aria-label="Memuat panggilan">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </div>
          )
        ) : error && !calls ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-destructive text-sm">
              Riwayat panggilan gagal dimuat: {toApiError(error).message}
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Coba lagi
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Belum ada panggilan masuk di {CALL_SCAN_CHATS} chat terbaru.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="text-muted-foreground bg-card sticky top-0 z-10 px-4 pt-3 pb-1 text-xs font-medium tracking-wide uppercase">
                {group.label}
              </h2>
              <ul>
                {group.calls.map((call) => (
                  <CallRow
                    key={call.key}
                    call={call}
                    selected={selectedKey === call.key}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function CallRow({
  call,
  selected,
  onSelect,
}: {
  call: CallRecord
  selected: boolean
  onSelect: (call: CallRecord) => void
}) {
  const name = chatTitle({ jid: call.chatJid, name: call.chatName })
  const Icon = call.autoRejected ? PhoneMissed : PhoneIncoming
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(call)}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex min-h-[72px] w-full items-center gap-3 px-3 text-left transition-colors',
          'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
          selected ? 'bg-accent' : 'hover:bg-accent/60',
        )}
      >
        <ChatAvatar jid={call.chatJid} name={name} className="size-12 text-lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                'truncate text-[15.5px] font-medium',
                call.autoRejected && 'text-destructive',
              )}
            >
              {name}
            </span>
            <time dateTime={call.timestamp} className="text-muted-foreground shrink-0 text-xs">
              {formatChatTime(call.timestamp)}
            </time>
          </span>
          <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[13.5px]">
            <Icon
              aria-hidden
              className={cn(
                'size-4 shrink-0',
                call.autoRejected ? 'text-destructive' : 'text-primary',
              )}
            />
            <span className="truncate">{callStatusLabel(call)}</span>
            {call.groupJid && (
              <span className="flex shrink-0 items-center gap-1">
                · <Users aria-hidden className="size-3.5" /> Grup
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}
