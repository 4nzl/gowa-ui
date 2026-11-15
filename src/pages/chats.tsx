import { useState } from 'react'
import { MessagesSquare } from 'lucide-react'
import { ChatList } from '@/features/chat/chat-list'
import { MessageView } from '@/features/chat/message-view'
import { EmptyPane, ListDetailLayout, ListPaneHeader } from '@/components/layout/list-detail'
import { PageHeader } from '@/components/shared/page-header'
import { selectedChatForDevice, type ChatSelection } from '@/features/chat/device-scope'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import type { ChatInfo } from '@/api/chat'

export default function ChatsPage() {
  const device = useSelectedDevice()
  const [selection, setSelection] = useState<ChatSelection | null>(null)
  const selected = selectedChatForDevice(selection, device)

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
    <ListDetailLayout
      listLabel="Daftar chat"
      detailLabel="Percakapan"
      detailOpen={selected !== null}
      list={
        <>
          <ListPaneHeader title="Chat" />
          <div className="min-h-0 flex-1">
            <ChatList
              key={device}
              deviceId={device}
              selectedJid={selected?.jid ?? null}
              onSelect={handleSelect}
            />
          </div>
        </>
      }
      detail={
        selected ? (
          <div className="min-h-0 flex-1">
            <MessageView
              key={`${device}:${selected.jid}`}
              chat={selected}
              deviceId={device}
              onBack={() => setSelection(null)}
            />
          </div>
        ) : (
          <EmptyPane
            icon={MessagesSquare}
            title="Pilih percakapan"
            hint="Buka chat dari daftar untuk melihat pesan dan membalas lewat perangkat aktif."
          />
        )
      }
    />
  )
}
