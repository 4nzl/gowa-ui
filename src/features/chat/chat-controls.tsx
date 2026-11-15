import { useQueryClient } from '@tanstack/react-query'
import { Archive, ArchiveRestore, MoreVertical, Pin, PinOff, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { archiveChat, pinChat, setDisappearing, type ChatInfo } from '@/api/chat'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toApiError } from '@/lib/api-error'

const DISAPPEARING_OPTIONS: { label: string; seconds: number }[] = [
  { label: 'Nonaktif', seconds: 0 },
  { label: '24 jam', seconds: 86_400 },
  { label: '7 hari', seconds: 604_800 },
  { label: '90 hari', seconds: 7_776_000 },
]

export function ChatControls({ chat, deviceId }: { chat: ChatInfo; deviceId: string }) {
  const queryClient = useQueryClient()

  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action()
      toast.success(label)
      void queryClient.invalidateQueries({ queryKey: ['chats', deviceId] })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Menu chat">
          <MoreVertical className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => run('Chat disematkan di ponsel', () => pinChat(chat.jid, true, deviceId))}
        >
          <Pin className="size-4" /> Sematkan
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => run('Sematan chat dilepas', () => pinChat(chat.jid, false, deviceId))}
        >
          <PinOff className="size-4" /> Lepas sematan
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            run(chat.archived ? 'Chat dikeluarkan dari arsip' : 'Chat diarsipkan', () =>
              archiveChat(chat.jid, !chat.archived, deviceId),
            )
          }
        >
          {chat.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
          {chat.archived ? 'Keluarkan dari arsip' : 'Arsipkan'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Timer className="size-4" /> Pesan sementara
        </DropdownMenuLabel>
        {DISAPPEARING_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.seconds}
            onClick={() =>
              run(`Pesan sementara: ${option.label}`, () =>
                setDisappearing(chat.jid, option.seconds, deviceId),
              )
            }
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
