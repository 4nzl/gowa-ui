import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DetailPaneBody,
  DetailPaneHeader,
  ListDetailLayout,
  ListPaneHeader,
} from '@/components/layout/list-detail'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModeForm } from '@/features/messaging/mode-form'
import { ModeList } from '@/features/messaging/mode-list'
import {
  DEFAULT_MODE_ID,
  MESSAGING_MODES,
  findMode,
  type MessagingModeId,
} from '@/features/messaging/modes'
import { RecipientBar } from '@/features/messaging/recipient-bar'
import { useAppInfo } from '@/hooks/use-app-info'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'

export default function MessagingPage() {
  const device = useSelectedDevice()
  const { data: info } = useAppInfo()
  const [modeId, setModeId] = useState<MessagingModeId>(DEFAULT_MODE_ID)
  // Mobile shows one pane at a time; wider layouts always show both.
  const [detailOpen, setDetailOpen] = useState(false)
  // Shared by every message action, so switching actions keeps the ID.
  const [messageId, setMessageId] = useState('')
  const mode = findMode(modeId) ?? MESSAGING_MODES[0]
  const Icon = mode.icon

  if (!device) {
    return (
      <div className="tab:p-6 mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4">
        <PageHeader
          title="Messaging"
          description="Pilih penerima sekali, lalu kirim pesan atau tindak lanjuti pesan yang ada."
        />
        <DeviceGuard />
      </div>
    )
  }

  return (
    <ListDetailLayout
      listLabel="Jenis pesan"
      detailLabel={mode.label}
      detailOpen={detailOpen}
      list={
        <>
          <ListPaneHeader
            title="Messaging"
            actions={
              info?.scheduled_sends ? (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-full"
                  title="Pesan terjadwal"
                >
                  <Link to="/scheduled" aria-label="Pesan terjadwal">
                    <CalendarClock className="size-5" />
                  </Link>
                </Button>
              ) : null
            }
          />
          <ModeList
            selectedId={modeId}
            onSelect={(id) => {
              setModeId(id)
              setDetailOpen(true)
            }}
          />
        </>
      }
      detail={
        <>
          <DetailPaneHeader
            title={mode.label}
            subtitle={mode.description}
            onBack={() => setDetailOpen(false)}
            leading={
              <span className="bg-primary/12 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-5" />
              </span>
            }
          />
          <DetailPaneBody>
            {mode.needsRecipient && <RecipientBar />}
            <section
              aria-label={mode.label}
              className="bg-card tab:p-5 flex flex-col gap-4 rounded-xl border p-4"
            >
              {mode.needsMessageId && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="act-message-id">Message ID</Label>
                  <Input
                    id="act-message-id"
                    className="font-mono"
                    autoComplete="off"
                    value={messageId}
                    onChange={(event) => setMessageId(event.target.value)}
                    placeholder="3EB0..."
                  />
                  <p className="text-muted-foreground text-xs">
                    ID pesan yang ingin ditindak, dari webhook atau riwayat chat.
                  </p>
                </div>
              )}
              {/* Keyed so each mode starts from a clean form, as before. */}
              <div key={mode.id} className="animate-in fade-in duration-200">
                <ModeForm mode={mode.id} messageId={messageId} />
              </div>
            </section>
          </DetailPaneBody>
        </>
      }
    />
  )
}
