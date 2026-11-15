import { useState } from 'react'
import { Info, Loader2, RefreshCw } from 'lucide-react'
import { ListDetailLayout, ListPaneHeader } from '@/components/layout/list-detail'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { CallCapabilities } from '@/features/call/call-capabilities'
import { CallDetail } from '@/features/call/call-detail'
import { CallList } from '@/features/call/call-list'
import { useCallHistory } from '@/features/call/use-call-history'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import type { CallRecord } from '@/features/call/call-history'

interface CallSelection {
  deviceId: string
  call: CallRecord
}

function CallsWorkspace({ deviceId }: { deviceId: string }) {
  const [selection, setSelection] = useState<CallSelection | null>(null)
  // Mobile only: the capability pane otherwise sits behind the list.
  const [infoOpen, setInfoOpen] = useState(false)
  const { query, progress } = useCallHistory(deviceId)
  const selected = selection?.deviceId === deviceId ? selection.call : null

  return (
    <ListDetailLayout
      listLabel="Daftar panggilan"
      detailLabel="Detail panggilan"
      detailOpen={selected !== null || infoOpen}
      list={
        <>
          <ListPaneHeader
            title="Panggilan"
            actions={
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="tab:hidden rounded-full"
                  aria-label="Kemampuan panggilan dan tolak manual"
                  title="Info"
                  onClick={() => setInfoOpen(true)}
                >
                  <Info className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Muat ulang riwayat panggilan"
                  title="Muat ulang"
                  disabled={query.isFetching}
                  onClick={() => void query.refetch()}
                >
                  {query.isFetching ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-5" />
                  )}
                </Button>
              </>
            }
          />
          <div className="min-h-0 flex-1">
            <CallList
              calls={query.data?.calls}
              isLoading={query.isLoading}
              error={query.error}
              progress={progress}
              failed={query.data?.failed ?? 0}
              totalChats={query.data?.totalChats ?? 0}
              selectedKey={selected?.key ?? null}
              onSelect={(call) => {
                setInfoOpen(false)
                setSelection({ deviceId, call })
              }}
              onRetry={() => void query.refetch()}
            />
          </div>
        </>
      }
      detail={
        selected ? (
          <CallDetail
            key={`${deviceId}:${selected.key}`}
            call={selected}
            onBack={() => setSelection(null)}
          />
        ) : (
          <CallCapabilities onBack={() => setInfoOpen(false)} />
        )
      }
    />
  )
}

export default function CallsPage() {
  const device = useSelectedDevice()

  if (!device) {
    return (
      <div className="tab:p-6 mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4">
        <PageHeader
          title="Panggilan"
          description="Riwayat panggilan masuk dan penolakan panggilan untuk perangkat aktif."
        />
        <DeviceGuard />
      </div>
    )
  }

  return <CallsWorkspace key={device} deviceId={device} />
}
