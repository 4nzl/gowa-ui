import { useEffect, useState } from 'react'
import { MessagesSquare } from 'lucide-react'
import { ChatList } from '@/features/chat/chat-list'
import { MessageView } from '@/features/chat/message-view'
import { PageHeader } from '@/components/shared/page-header'
import { selectedChatForDevice, type ChatSelection } from '@/features/chat/device-scope'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import { cn } from '@/lib/utils'
import { useShellStore } from '@/stores/shell'
import type { ChatInfo } from '@/api/chat'

/**
 * List/detail layout. Tablet and desktop show both panes side by side; mobile
 * shows one at a time and the open chat takes the whole screen with a back button.
 */
export default function ChatsPage() {
  const device = useSelectedDevice()
  const [selection, setSelection] = useState<ChatSelection | null>(null)
  const selected = selectedChatForDevice(selection, device)
  const setImmersive = useShellStore((state) => state.setImmersive)
  const hasSelection = selected !== null

  useEffect(() => {
    setImmersive(hasSelection)
  }, [hasSelection, setImmersive])
  useEffect(() => () => setImmersive(false), [setImmersive])

  const handleSelect = (chat: ChatInfo) => {
    if (!device) return
    setSelection({ deviceId: device, chat })
  }

  if (!device) {
    return (
      <div className="tab:p-6 mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4">
        <PageHeader title="Chat" description="Percakapan tersimpan untuk perangkat ini." />
        <DeviceGuard />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0">
      <aside
        aria-label="Daftar chat"
        className={cn(
          'bg-card flex min-h-0 w-full flex-col',
          'tab:w-[clamp(285px,39vw,345px)] tab:shrink-0 tab:border-r desk:w-[clamp(350px,29vw,465px)]',
          hasSelection && 'max-tab:hidden',
        )}
      >
        <h1 className="px-4 pt-4 pb-3 text-2xl font-semibold tracking-tight">Chat</h1>
        <div className="min-h-0 flex-1">
          <ChatList
            key={device}
            deviceId={device}
            selectedJid={selected?.jid ?? null}
            onSelect={handleSelect}
          />
        </div>
      </aside>

      <section
        aria-label="Percakapan"
        className={cn(
          'bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-clip',
          !hasSelection && 'max-tab:hidden',
        )}
      >
        {selected ? (
          <div className="min-h-0 flex-1">
            <MessageView
              key={`${device}:${selected.jid}`}
              chat={selected}
              deviceId={device}
              onBack={() => setSelection(null)}
            />
          </div>
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <MessagesSquare className="size-12" strokeWidth={1.4} />
            <h2 className="text-foreground text-xl font-normal">Pilih percakapan</h2>
            <p className="max-w-sm text-sm">
              Buka chat dari daftar untuk melihat pesan dan membalas lewat perangkat aktif.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
