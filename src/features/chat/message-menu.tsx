import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  Copy,
  Eye,
  Forward,
  Headphones,
  Info,
  Loader2,
  Pencil,
  Reply,
  Search,
  Star,
  StarOff,
  Trash2,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import { listChats, type MessageInfo } from '@/api/chat'
import {
  deleteRequest,
  forwardRequest,
  playedRequest,
  reactRequest,
  readRequest,
  revokeRequest,
  starRequest,
  unstarRequest,
  updateRequest,
} from '@/api/message'
import { exec, type ApiRequest } from '@/api/request'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { chatTitle, messageSummary } from '@/features/chat/chat-format'
import {
  QUICK_REACTIONS,
  canEdit,
  canMarkPlayed,
  canMarkRead,
  canReact,
  canRevoke,
  myReaction,
} from '@/features/chat/message-actions'
import { senderDisplayName } from '@/features/chat/display-name'
import { toApiError } from '@/lib/api-error'
import { copyText } from '@/lib/clipboard'
import { formatDate } from '@/lib/format'
import { phoneDigits } from '@/lib/phone'
import { trackedQueryFn } from '@/lib/private-query'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'

type Dialogs = 'edit' | 'forward' | 'info' | 'delete' | 'revoke' | null

function useRunAction(deviceId: string, chatJid: string) {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const run = async (request: ApiRequest, success: string) => {
    setBusy(true)
    try {
      await exec(request, deviceId)
      toast.success(success)
      void queryClient.invalidateQueries({ queryKey: ['chat-messages', deviceId, chatJid] })
      return true
    } catch (error) {
      toast.error(toApiError(error).message)
      return false
    } finally {
      setBusy(false)
    }
  }
  return { run, busy }
}

function ForwardDialog({
  open,
  onOpenChange,
  message,
  deviceId,
  run,
  busy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: MessageInfo
  deviceId: string
  run: (request: ApiRequest, success: string) => Promise<boolean>
  busy: boolean
}) {
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState<{ jid: string; title: string } | null>(null)
  const connectionId = useConnection((state) => state.connectionId)
  const chats = useQuery({
    queryKey: ['forward-targets', deviceId, search, connectionId],
    queryFn: trackedQueryFn(connectionId, () =>
      listChats({ search: search.trim() || undefined, limit: 20 }, deviceId),
    ),
    enabled: open && connectionId !== null,
    staleTime: 30_000,
  })
  const typedDigits = phoneDigits(search)
  const typedJid = typedDigits ? `${typedDigits}@s.whatsapp.net` : null

  const submit = async () => {
    if (!target) return
    const sent = await run(
      forwardRequest(message.id, { phone: target.jid }),
      `Pesan diteruskan ke ${target.title}`,
    )
    if (sent) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teruskan pesan</DialogTitle>
          <DialogDescription className="line-clamp-2">
            “{messageSummary(message)}”
          </DialogDescription>
        </DialogHeader>
        <label className="bg-muted flex h-10 items-center gap-2 rounded-full px-3.5">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari chat atau ketik nomor 62…"
            aria-label="Cari tujuan"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
        <ul className="-mx-2 max-h-72 overflow-y-auto" aria-label="Tujuan">
          {typedJid && (
            <li>
              <TargetRow
                jid={typedJid}
                title={`Kirim ke ${chatTitle({ jid: typedJid, name: '' })}`}
                selected={target?.jid === typedJid}
                onSelect={() =>
                  setTarget({ jid: typedJid, title: chatTitle({ jid: typedJid, name: '' }) })
                }
              />
            </li>
          )}
          {chats.isLoading && (
            <li className="flex justify-center py-4">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </li>
          )}
          {chats.data?.data.map((chat) => (
            <li key={chat.jid}>
              <TargetRow
                jid={chat.jid}
                title={chatTitle(chat)}
                selected={target?.jid === chat.jid}
                onSelect={() => setTarget({ jid: chat.jid, title: chatTitle(chat) })}
              />
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button disabled={!target || busy} onClick={() => void submit()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Forward className="size-4" />}
            {target ? `Teruskan ke ${target.title}` : 'Pilih tujuan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TargetRow({
  jid,
  title,
  selected,
  onSelect,
}: {
  jid: string
  title: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left',
        selected ? 'bg-primary/10' : 'hover:bg-accent',
      )}
    >
      <ChatAvatar jid={jid} name={title} className="size-9 text-sm" />
      <span className="min-w-0 flex-1 truncate text-sm">{title}</span>
      {selected && <Check className="text-primary size-4" />}
    </button>
  )
}

export function MessageMenu({
  message,
  chatJid,
  deviceId,
  onReply,
}: {
  message: MessageInfo
  chatJid: string
  deviceId: string
  onReply: (message: MessageInfo) => void
}) {
  const { run, busy } = useRunAction(deviceId, chatJid)
  const [dialog, setDialog] = useState<Dialogs>(null)
  const [editText, setEditText] = useState(message.content)
  const phone = { phone: chatJid }
  const mine = myReaction(message)
  const close = () => setDialog(null)

  const react = (emoji: string) =>
    void run(
      reactRequest(message.id, { ...phone, emoji }),
      emoji ? `Reaksi ${emoji} dikirim` : 'Reaksi dihapus',
    )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Aksi pesan"
            className={cn(
              'text-muted-foreground absolute top-1 right-1 z-10 grid size-6 place-items-center rounded-full bg-inherit',
              'opacity-0 transition-opacity group-hover/bubble:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
              '[@media(pointer:coarse)]:opacity-70',
            )}
          >
            <ChevronDown className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={message.is_from_me ? 'end' : 'start'} className="w-56">
          {canReact(message) && (
            <>
              <div
                className="flex justify-between px-1 py-1"
                role="group"
                aria-label="Reaksi cepat"
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <DropdownMenuItem
                    key={emoji}
                    aria-label={`Reaksi ${emoji}`}
                    onClick={() => react(emoji)}
                    className={cn(
                      'size-8 justify-center p-0 text-lg',
                      mine === emoji && 'bg-primary/15',
                    )}
                  >
                    {emoji}
                  </DropdownMenuItem>
                ))}
              </div>
              {mine && (
                <DropdownMenuItem onClick={() => react('')}>
                  <Undo2 className="size-4" /> Hapus reaksi {mine}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => onReply(message)}>
            <Reply className="size-4" /> Balas
          </DropdownMenuItem>
          {message.content && (
            <DropdownMenuItem
              onClick={async () =>
                (await copyText(message.content))
                  ? toast.success('Teks disalin')
                  : toast.error('Browser menolak menyalin teks')
              }
            >
              <Copy className="size-4" /> Salin teks
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setDialog('forward')}>
            <Forward className="size-4" /> Teruskan
          </DropdownMenuItem>
          {canEdit(message) && (
            <DropdownMenuItem
              onClick={() => {
                setEditText(message.content)
                setDialog('edit')
              }}
            >
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => void run(starRequest(message.id, phone), 'Pesan dibintangi')}
          >
            <Star className="size-4" /> Bintangi
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void run(unstarRequest(message.id, phone), 'Bintang dihapus')}
          >
            <StarOff className="size-4" /> Hapus bintang
          </DropdownMenuItem>
          {canMarkRead(message) && (
            <DropdownMenuItem
              onClick={() => void run(readRequest(message.id, phone), 'Ditandai sudah dibaca')}
            >
              <Eye className="size-4" /> Tandai dibaca
            </DropdownMenuItem>
          )}
          {canMarkPlayed(message) && (
            <DropdownMenuItem
              onClick={() => void run(playedRequest(message.id, phone), 'Ditandai sudah diputar')}
            >
              <Headphones className="size-4" /> Tandai diputar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setDialog('info')}>
            <Info className="size-4" /> Info pesan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDialog('delete')}>
            <Trash2 className="size-4" /> Hapus untuk saya
          </DropdownMenuItem>
          {canRevoke(message) && (
            <DropdownMenuItem variant="destructive" onClick={() => setDialog('revoke')}>
              <Trash2 className="size-4" /> Hapus untuk semua
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === 'edit'} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit pesan</DialogTitle>
            <DialogDescription>
              WhatsApp hanya mengizinkan edit dalam 15 menit setelah pesan dikirim.
            </DialogDescription>
          </DialogHeader>
          <textarea
            autoFocus
            rows={4}
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            aria-label="Teks baru"
            className="bg-muted focus-visible:ring-ring w-full resize-y rounded-lg p-3 text-sm outline-none focus-visible:ring-2"
          />
          <DialogFooter>
            <Button
              disabled={busy || !editText.trim() || editText.trim() === message.content.trim()}
              onClick={async () => {
                if (
                  await run(
                    updateRequest(message.id, { ...phone, message: editText.trim() }),
                    'Pesan diedit',
                  )
                )
                  close()
              }}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog === 'forward' && (
        <ForwardDialog
          open
          onOpenChange={(open) => !open && close()}
          message={message}
          deviceId={deviceId}
          run={run}
          busy={busy}
        />
      )}

      <Dialog open={dialog === 'info'} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Info pesan</DialogTitle>
            <DialogDescription>
              Status terkirim/dibaca tidak disimpan oleh server GOWA.
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Dari</dt>
            <dd className="[overflow-wrap:anywhere]">
              {message.is_from_me ? 'Anda (perangkat ini)' : senderDisplayName(message)}
            </dd>
            <dt className="text-muted-foreground">Waktu</dt>
            <dd>{formatDate(message.timestamp)}</dd>
            <dt className="text-muted-foreground">Jenis</dt>
            <dd>{message.media_type || 'Teks'}</dd>
            <dt className="text-muted-foreground">ID pesan</dt>
            <dd className="flex items-center gap-2">
              <code className="font-mono text-xs [overflow-wrap:anywhere]">{message.id}</code>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label="Salin ID pesan"
                onClick={async () =>
                  (await copyText(message.id)) && toast.success('ID pesan disalin')
                }
              >
                <Copy className="size-3.5" />
              </Button>
            </dd>
          </dl>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={dialog === 'delete' || dialog === 'revoke'}
        onOpenChange={(open) => !open && close()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog === 'revoke' ? 'Hapus untuk semua orang?' : 'Hapus untuk saya?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === 'revoke'
                ? 'Pesan ditarik dari chat semua peserta dan diganti keterangan "Pesan ini telah dihapus". WhatsApp hanya mengizinkannya sekitar 2½ hari setelah dikirim.'
                : 'Pesan dihapus dari perangkat tertaut ini saja. Peserta lain tetap melihatnya.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() =>
                void run(
                  dialog === 'revoke'
                    ? revokeRequest(message.id, phone)
                    : deleteRequest(message.id, phone),
                  dialog === 'revoke' ? 'Pesan dihapus untuk semua' : 'Pesan dihapus untuk Anda',
                )
              }
            >
              <Undo2 className="size-4" />
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
