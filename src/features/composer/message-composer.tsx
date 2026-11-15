import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  CalendarClock,
  FileText,
  Headphones,
  ImageIcon,
  Loader2,
  Paperclip,
  SendHorizontal,
  Smile,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  sendAudio,
  sendFile,
  sendImage,
  sendText,
  sendVideo,
  type ScheduleFields as ScheduleDraft,
  type SendResult,
} from '@/api/send'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  KIND_LABELS,
  attachmentError,
  attachmentKind,
  type AttachmentKind,
  type PickMode,
} from '@/features/composer/attachment'
import { EmojiPicker } from '@/features/composer/emoji-picker'
import { insertAtCursor } from '@/features/composer/emoji-data'
import { draftKey, useDraftStore } from '@/features/chat/drafts'
import { ScheduleFields } from '@/features/send/schedule-fields'
import { useScheduleDraft } from '@/features/send/use-schedule-draft'
import { useAppInfo } from '@/hooks/use-app-info'
import { toApiError } from '@/lib/api-error'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Attachment {
  file: File
  kind: AttachmentKind
  previewUrl: string | null
}

const PICKERS: {
  mode: PickMode
  label: string
  accept: string
  icon: typeof FileText
  tone: string
}[] = [
  { mode: 'document', label: 'Dokumen', accept: '*/*', icon: FileText, tone: 'text-violet-600' },
  {
    mode: 'media',
    label: 'Foto & Video',
    accept: 'image/*,video/*',
    icon: ImageIcon,
    tone: 'text-sky-600',
  },
  { mode: 'audio', label: 'Audio', accept: 'audio/*', icon: Headphones, tone: 'text-orange-600' },
]

function prefersNewlineOnEnter(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches
  } catch {
    return false
  }
}

export function MessageComposer({
  chatJid,
  deviceId,
  onSent,
}: {
  chatJid: string
  deviceId: string
  onSent: () => void
}) {
  const key = draftKey(deviceId, chatJid)
  const text = useDraftStore((state) => state.drafts[key] ?? '')
  const setDraft = useDraftStore((state) => state.setDraft)
  const { data: info } = useAppInfo()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [pickMode, setPickMode] = useState<PickMode>('media')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [caption, setCaption] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const { draft: scheduleDraft, patch: patchSchedule, reset: resetSchedule } = useScheduleDraft()

  useEffect(
    () => () => {
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl)
    },
    [attachment],
  )

  useLayoutEffect(() => {
    const element = textarea.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 144)}px`
  }, [text])

  const schedule: ScheduleDraft = scheduling ? scheduleDraft : {}

  const send = useMutation<SendResult, unknown, void>({
    mutationFn: () => {
      if (attachment) {
        const base = { phone: chatJid, file: attachment.file, ...schedule }
        const withCaption = { ...base, caption: caption.trim() || undefined }
        switch (attachment.kind) {
          case 'image':
            return sendImage(withCaption, deviceId)
          case 'video':
            return sendVideo(withCaption, deviceId)
          case 'audio':
            return sendAudio(base, deviceId)
          default:
            return sendFile(withCaption, deviceId)
        }
      }
      return sendText({ phone: chatJid, message: text.trim(), ...schedule }, deviceId)
    },
    onSuccess: (result) => {
      toast.success(result.schedule_id ? 'Pesan dijadwalkan' : 'Terkirim')
      if (attachment) {
        setAttachment(null)
        setCaption('')
      } else {
        setDraft(key, '')
      }
      if (scheduling) {
        setScheduling(false)
        resetSchedule()
      }
      onSent()
    },
    onError: (error) => toast.error(`Gagal mengirim: ${toApiError(error).message}`),
  })

  // Without a time, withSchedule drops the schedule and the message would go out now.
  const scheduleReady = !scheduling || Boolean(scheduleDraft.scheduled_at)
  const canSend =
    !send.isPending && scheduleReady && (attachment !== null || text.trim().length > 0)
  const submit = () => {
    if (canSend) send.mutate()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    if (prefersNewlineOnEnter()) return
    event.preventDefault()
    submit()
  }

  const openPicker = (mode: PickMode) => {
    setPickMode(mode)
    setMenuOpen(false)
    // Let the menu close before the native dialog opens.
    window.setTimeout(() => fileInput.current?.click(), 0)
  }

  const onFile = (file: File | undefined) => {
    if (!file) return
    const kind = attachmentKind(file, pickMode)
    const error = attachmentError(file, kind, info)
    if (error) {
      toast.error(error)
      return
    }
    setAttachment({
      file,
      kind,
      previewUrl: kind === 'image' || kind === 'video' ? URL.createObjectURL(file) : null,
    })
    setCaption(text.trim())
  }

  const insertEmoji = (emoji: string) => {
    const element = textarea.current
    const next = insertAtCursor(
      text,
      element?.selectionStart ?? null,
      element?.selectionEnd ?? null,
      emoji,
    )
    setDraft(key, next.value)
    requestAnimationFrame(() => {
      element?.focus()
      element?.setSelectionRange(next.caret, next.caret)
    })
  }

  const picker = PICKERS.find((item) => item.mode === pickMode)!

  return (
    <div className="bg-card shrink-0 border-t">
      {scheduling && (
        <div className="tab:px-4 max-h-[45dvh] overflow-y-auto border-b px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Jadwalkan pesan</p>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              aria-label="Batalkan penjadwalan"
              onClick={() => {
                setScheduling(false)
                resetSchedule()
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
          <ScheduleFields draft={scheduleDraft} patch={patchSchedule} />
          {!scheduleReady && (
            <p className="text-muted-foreground mt-2 text-xs">
              Pilih tanggal dan jam kirim terlebih dahulu.
            </p>
          )}
        </div>
      )}

      {attachment && (
        <div className="tab:px-4 border-b px-3 py-3">
          <div className="flex items-start gap-3">
            <div className="bg-muted grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg">
              {attachment.kind === 'image' && attachment.previewUrl ? (
                <img src={attachment.previewUrl} alt="" className="size-full object-cover" />
              ) : attachment.kind === 'video' && attachment.previewUrl ? (
                <video src={attachment.previewUrl} muted className="size-full object-cover" />
              ) : (
                <FileText className="text-muted-foreground size-8" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{attachment.file.name}</p>
              <p className="text-muted-foreground text-xs">
                {KIND_LABELS[attachment.kind]} · {formatBytes(attachment.file.size)}
              </p>
              {attachment.kind !== 'audio' && (
                <input
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                      event.preventDefault()
                      submit()
                    }
                  }}
                  placeholder="Tambahkan keterangan"
                  aria-label="Keterangan lampiran"
                  className="bg-muted focus-visible:ring-ring mt-2 h-9 w-full rounded-lg px-3 text-sm outline-none focus-visible:ring-2"
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 rounded-full"
              aria-label="Batalkan lampiran"
              disabled={send.isPending}
              onClick={() => setAttachment(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="tab:px-3 flex items-end gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              aria-label="Lampiran dan opsi"
              disabled={send.isPending}
            >
              <Paperclip className="size-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-56 p-1.5">
            {PICKERS.map(({ mode, label, icon: Icon, tone }) => (
              <button
                key={mode}
                type="button"
                onClick={() => openPicker(mode)}
                className="hover:bg-accent flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm"
              >
                <Icon className={cn('size-5', tone)} />
                {label}
              </button>
            ))}
            <div className="bg-border my-1 h-px" />
            <button
              type="button"
              onClick={() => {
                setScheduling(true)
                setMenuOpen(false)
              }}
              className="hover:bg-accent flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm"
            >
              <CalendarClock className="text-primary size-5" />
              Jadwalkan pesan
            </button>
          </PopoverContent>
        </Popover>

        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              aria-label="Emoji"
              disabled={attachment !== null}
            >
              <Smile className="size-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-auto p-2">
            <EmojiPicker onPick={insertEmoji} />
          </PopoverContent>
        </Popover>

        <textarea
          ref={textarea}
          rows={1}
          value={text}
          onChange={(event) => setDraft(key, event.target.value)}
          onKeyDown={onKeyDown}
          disabled={attachment !== null}
          placeholder={attachment ? 'Keterangan diisi pada lampiran' : 'Ketik pesan'}
          aria-label="Pesan"
          className="bg-muted placeholder:text-muted-foreground focus-visible:ring-ring max-h-36 min-h-10 min-w-0 flex-1 resize-none rounded-[20px] px-4 py-2.5 text-[15px] leading-5 outline-none focus-visible:ring-2 disabled:opacity-60"
        />

        <Button
          size="icon"
          className="size-10 shrink-0 rounded-full"
          aria-label={scheduling ? 'Jadwalkan' : 'Kirim'}
          disabled={!canSend}
          onClick={submit}
        >
          {send.isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : scheduling ? (
            <CalendarClock className="size-5" />
          ) : (
            <SendHorizontal className="size-5" />
          )}
        </Button>
      </div>

      <input
        ref={fileInput}
        type="file"
        hidden
        accept={picker.accept}
        onChange={(event) => {
          onFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
