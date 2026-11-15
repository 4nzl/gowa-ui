import { useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  CircleUserRound,
  Headset,
  KeyRound,
  Loader2,
  QrCode,
  RefreshCw,
  Trash2,
  Unplug,
  Webhook,
} from 'lucide-react'
import { toast } from 'sonner'
import { logoutDevice, reconnectDevice, removeDevice } from '@/api/devices'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeviceChatwootDialog } from '@/features/devices/chatwoot-dialog'
import { deviceSubtitle, deviceTitle, stateLabels } from '@/features/devices/device-display'
import { StateBadge } from '@/features/devices/state-badge'
import { DeviceWebhookDialog } from '@/features/devices/webhook-dialog'
import { useAppInfo } from '@/hooks/use-app-info'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import { toApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/device'
import type { RegistryDevice } from '@/api/types'

function Section({
  title,
  description,
  children,
  tone,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
  tone?: 'danger'
}) {
  return (
    <section
      className={cn(
        'bg-card tab:p-5 rounded-xl border p-4',
        tone === 'danger' && 'border-destructive/30',
      )}
    >
      <h3 className={cn('font-medium', tone === 'danger' && 'text-destructive')}>{title}</h3>
      {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

export function DeviceDetail({
  device,
  onBack,
  onLoginQr,
  onLoginCode,
}: {
  device: RegistryDevice
  onBack?: () => void
  onLoginQr: (device: RegistryDevice) => void
  onLoginCode: (device: RegistryDevice) => void
}) {
  const queryClient = useQueryClient()
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId)
  const selectDevice = useDeviceStore((state) => state.selectDevice)
  const chatwootEnabled = useAppInfo().data?.chatwoot_enabled ?? false
  const avatar = useDeviceAvatar(device)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [chatwootOpen, setChatwootOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteTyped, setDeleteTyped] = useState('')
  const active = selectedDeviceId === device.id
  const loggedIn = device.state === 'logged_in'
  const title = deviceTitle(device)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['devices'] })

  const reconnect = useMutation({
    mutationFn: () => reconnectDevice(device.id),
    onSuccess: () => {
      toast.success(`Permintaan sambung ulang dikirim untuk ${title}`)
      void invalidate()
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  const logout = useMutation({
    mutationFn: () => logoutDevice(device.id),
    onSuccess: () => {
      toast.success(`${title} telah logout dari WhatsApp`)
      void invalidate()
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  const remove = useMutation({
    mutationFn: () => removeDevice(device.id),
    onSuccess: () => {
      toast.success(`Perangkat ${device.id} dihapus`)
      if (active) selectDevice(null)
      setConfirmDelete(false)
      void invalidate()
    },
    onError: (error) => toast.error(toApiError(error).message),
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="bg-card tab:px-5 flex h-16 shrink-0 items-center gap-3 border-b px-2">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="tab:hidden size-10 shrink-0 rounded-full"
            aria-label="Kembali ke daftar perangkat"
            onClick={onBack}
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <Avatar className="size-10">
          {avatar.data?.url && <AvatarImage src={avatar.data.url} alt="" />}
          <AvatarFallback>
            <CircleUserRound className="text-muted-foreground size-5" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium">{title}</h2>
          <p className="text-muted-foreground truncate text-xs">{deviceSubtitle(device)}</p>
        </div>
        <StateBadge state={device.state} />
      </div>

      <div className="tab:p-6 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 pb-[env(safe-area-inset-bottom)]">
          <Section
            title="Perangkat aktif"
            description={
              active
                ? 'Chat, Messaging, Grup, Saluran, dan menu lain memakai perangkat ini.'
                : 'Menu lain memakai perangkat aktif. Pilih perangkat ini bila ingin mengirim atau membaca lewat akun ini.'
            }
          >
            {active ? (
              <p className="text-primary flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="size-4" />
                Sedang dipakai sebagai perangkat aktif
              </p>
            ) : (
              <Button onClick={() => selectDevice(device.id)}>Jadikan perangkat aktif</Button>
            )}
          </Section>

          <Section
            title="Pemasangan"
            description={
              loggedIn
                ? `Tertaut ke WhatsApp ${deviceSubtitle(device)}. Untuk memasangkan nomor lain, logout lebih dulu.`
                : 'Buka WhatsApp di ponsel → Perangkat tertaut → Tautkan perangkat, lalu pindai QR atau masukkan kode pairing.'
            }
          >
            {!loggedIn && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onLoginQr(device)}>
                  <QrCode className="size-4" />
                  Pindai QR
                </Button>
                <Button variant="outline" onClick={() => onLoginCode(device)}>
                  <KeyRound className="size-4" />
                  Kode pairing
                </Button>
              </div>
            )}
          </Section>

          <Section title="Informasi">
            <dl>
              <InfoRow label="ID perangkat">
                <span className="font-mono">{device.id}</span>
              </InfoRow>
              <InfoRow label="Nomor">{deviceSubtitle(device)}</InfoRow>
              {device.jid && (
                <InfoRow label="JID">
                  <span className="font-mono text-xs">{device.jid}</span>
                </InfoRow>
              )}
              <InfoRow label="Status">{stateLabels[device.state]}</InfoRow>
              <InfoRow label="Dimuat server sejak">{formatDate(device.created_at)}</InfoRow>
            </dl>
          </Section>

          <Section
            title="Koneksi"
            description="Sambung ulang membuka kembali koneksi ke WhatsApp tanpa memutus sesi. Logout mengakhiri sesi; perangkat harus dipasangkan ulang."
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={reconnect.isPending}
                onClick={() => reconnect.mutate()}
              >
                {reconnect.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Sambung ulang
              </Button>
              <Button
                variant="outline"
                disabled={!loggedIn || logout.isPending}
                onClick={() => setConfirmLogout(true)}
              >
                {logout.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Unplug className="size-4" />
                )}
                Logout perangkat
              </Button>
            </div>
          </Section>

          <Section title="Integrasi" description="Kirim event perangkat ini ke webhook milik Anda.">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setWebhookOpen(true)}>
                <Webhook className="size-4" />
                Webhook
              </Button>
              {chatwootEnabled && (
                <Button variant="outline" onClick={() => setChatwootOpen(true)}>
                  <Headset className="size-4" />
                  Chatwoot
                </Button>
              )}
            </div>
          </Section>

          <Section
            tone="danger"
            title="Hapus perangkat"
            description="Menghapus slot perangkat beserta sesi WhatsApp-nya dari server. Tidak dapat dibatalkan."
          >
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setDeleteTyped('')
                setConfirmDelete(true)
              }}
            >
              <Trash2 className="size-4" />
              Hapus perangkat
            </Button>
          </Section>
        </div>
      </div>

      <DeviceWebhookDialog device={device} open={webhookOpen} onOpenChange={setWebhookOpen} />
      {chatwootEnabled && (
        <DeviceChatwootDialog device={device} open={chatwootOpen} onOpenChange={setChatwootOpen} />
      )}

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout {title}?</AlertDialogTitle>
            <AlertDialogDescription>
              Sesi WhatsApp {deviceSubtitle(device)} akan diakhiri dan hilang dari daftar perangkat
              tertaut di ponsel. Dashboard dan aplikasi lain yang memakai API GOWA tidak dapat
              mengirim atau menerima pesan lewat perangkat ini sampai dipasangkan ulang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => logout.mutate()}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus perangkat {device.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Slot perangkat dan sesi WhatsApp-nya dihapus permanen dari server. Ketik ID perangkat
              untuk melanjutkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-delete-device">ID perangkat</Label>
            <Input
              id="confirm-delete-device"
              autoComplete="off"
              spellCheck={false}
              value={deleteTyped}
              onChange={(event) => setDeleteTyped(event.target.value)}
              placeholder={device.id}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteTyped !== device.id || remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending && <Loader2 className="size-4 animate-spin" />}
              Hapus permanen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
