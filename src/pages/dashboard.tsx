import { useEffect, useState } from 'react'
import { Loader2, Smartphone } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { CreateDeviceDialog } from '@/features/devices/create-device-dialog'
import { DeviceDetail } from '@/features/devices/device-detail'
import { viewedDevice } from '@/features/devices/device-display'
import { DeviceList } from '@/features/devices/device-list'
import { LoginCodeDialog } from '@/features/session/login-code-dialog'
import { LoginQrDialog } from '@/features/session/login-qr-dialog'
import { useDevices } from '@/hooks/use-devices'
import { toApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/device'
import { useShellStore } from '@/stores/shell'
import type { RegistryDevice } from '@/api/types'

export default function DevicesPage() {
  const { data: devices, isLoading, error } = useDevices({ poll: true })
  const activeId = useDeviceStore((state) => state.selectedDeviceId)
  const setImmersive = useShellStore((state) => state.setImmersive)
  const [viewedId, setViewedId] = useState<string | null>(null)
  // Mobile shows one pane at a time; wider layouts always show both.
  const [detailOpen, setDetailOpen] = useState(false)
  const [qrDevice, setQrDevice] = useState<RegistryDevice | null>(null)
  const [codeDevice, setCodeDevice] = useState<RegistryDevice | null>(null)
  const viewed = viewedDevice(devices ?? [], viewedId, activeId)
  const showDetail = detailOpen && viewed !== null

  useEffect(() => {
    setImmersive(showDetail)
  }, [showDetail, setImmersive])
  useEffect(() => () => setImmersive(false), [setImmersive])

  return (
    <div className="flex h-full min-h-0">
      <aside
        aria-label="Daftar perangkat"
        className={cn(
          'bg-card flex min-h-0 w-full flex-col',
          'tab:w-[clamp(285px,39vw,345px)] tab:shrink-0 tab:border-r desk:w-[clamp(350px,29vw,465px)]',
          showDetail && 'max-tab:hidden',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">Perangkat</h1>
          <CreateDeviceDialog />
        </div>

        {error && (
          <p
            role="alert"
            className="text-destructive mx-4 mb-3 rounded-lg border border-current/30 p-3 text-sm"
          >
            Gagal memuat perangkat: {toApiError(error).message}
          </p>
        )}
        {isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 px-4 py-6 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Memuat perangkat…
          </div>
        )}
        {devices && devices.length === 0 && (
          <div className="px-4">
            <EmptyState
              icon={Smartphone}
              title="Belum ada perangkat"
              hint="Tambahkan slot perangkat, lalu pasangkan dengan ponsel lewat QR atau kode pairing."
            />
          </div>
        )}
        {devices && devices.length > 0 && (
          <DeviceList
            devices={devices}
            viewedId={viewed?.id ?? null}
            activeId={activeId}
            onView={(device) => {
              setViewedId(device.id)
              setDetailOpen(true)
            }}
          />
        )}
      </aside>

      <section
        aria-label="Detail perangkat"
        className={cn(
          'bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-clip',
          !showDetail && 'max-tab:hidden',
        )}
      >
        {viewed ? (
          <DeviceDetail
            key={viewed.id}
            device={viewed}
            onBack={() => setDetailOpen(false)}
            onLoginQr={setQrDevice}
            onLoginCode={setCodeDevice}
          />
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <Smartphone className="size-12" strokeWidth={1.4} />
            <h2 className="text-foreground text-xl font-normal">Perangkat WhatsApp</h2>
            <p className="max-w-sm text-sm">
              Tambahkan perangkat untuk mulai memasangkan akun WhatsApp ke server GOWA.
            </p>
          </div>
        )}
      </section>

      <LoginQrDialog device={qrDevice} onOpenChange={(open) => !open && setQrDevice(null)} />
      <LoginCodeDialog device={codeDevice} onOpenChange={(open) => !open && setCodeDevice(null)} />
    </div>
  )
}
