import { useState } from 'react'
import { CircleDashed } from 'lucide-react'
import { EmptyPane, ListDetailLayout, ListPaneHeader } from '@/components/layout/list-detail'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { StatusCreate } from '@/features/status/status-create'
import { StatusList } from '@/features/status/status-list'
import { StatusViewer } from '@/features/status/status-viewer'
import { useStatuses } from '@/features/status/use-statuses'
import type { StatusPoster } from '@/features/status/status-format'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'

type Selection = { deviceId: string } & ({ kind: 'mine' } | { kind: 'poster'; jid: string })

export default function StatusPage() {
  const device = useSelectedDevice()

  if (!device) {
    return (
      <div className="tab:p-6 mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4">
        <PageHeader
          title="Status"
          description="Status kontak yang tersimpan di server dan status baru dari perangkat ini."
        />
        <DeviceGuard />
      </div>
    )
  }

  return <StatusWorkspace key={device} deviceId={device} />
}

function StatusWorkspace({ deviceId }: { deviceId: string }) {
  const data = useStatuses(deviceId)
  const [stored, setSelection] = useState<Selection | null>(null)
  // A selection made on another device never leaks into this one.
  const selection = stored && stored.deviceId === deviceId ? stored : null
  const selectedJid = selection?.kind === 'poster' ? selection.jid : null
  const poster: StatusPoster | undefined = selectedJid
    ? [...data.sections.recent, ...data.sections.older].find((item) => item.jid === selectedJid)
    : undefined
  const close = () => setSelection(null)

  return (
    <ListDetailLayout
      listLabel="Daftar status"
      detailLabel="Detail status"
      detailOpen={selection !== null}
      list={
        <>
          <ListPaneHeader title="Status" />
          <div className="min-h-0 flex-1">
            <StatusList
              data={data}
              selectedJid={selectedJid}
              mineSelected={selection?.kind === 'mine'}
              onSelectMine={() => setSelection({ deviceId, kind: 'mine' })}
              onSelectPoster={(item) => setSelection({ deviceId, kind: 'poster', jid: item.jid })}
            />
          </div>
        </>
      }
      detail={
        selection?.kind === 'mine' ? (
          <StatusCreate deviceId={deviceId} onBack={close} />
        ) : poster ? (
          <StatusViewer key={poster.jid} poster={poster} deviceId={deviceId} onBack={close} />
        ) : selection ? (
          <EmptyPane
            icon={CircleDashed}
            title="Status tidak ditemukan"
            hint="Status poster ini tidak lagi ada di data yang dimuat."
            action={
              <Button variant="outline" onClick={close}>
                Kembali ke daftar
              </Button>
            }
          />
        ) : (
          <EmptyPane
            icon={CircleDashed}
            title="Lihat status"
            hint="Pilih kontak untuk melihat statusnya, atau buka Status saya untuk membuat status baru."
            action={
              <Button onClick={() => setSelection({ deviceId, kind: 'mine' })}>Buat status</Button>
            }
          />
        )
      }
    />
  )
}
