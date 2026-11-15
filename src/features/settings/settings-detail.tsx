import { useState } from 'react'
import { CircleUserRound, Settings, Smartphone, Webhook } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DetailPaneBody,
  DetailPaneHeader,
  EmptyPane,
  PaneSection,
} from '@/components/layout/list-detail'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BRAND } from '@/config/brand'
import { StateBadge } from '@/features/devices/state-badge'
import { DeviceWebhookDialog } from '@/features/devices/webhook-dialog'
import { MetricsCard } from '@/features/server/metrics-card'
import { AppearanceSection } from '@/features/settings/appearance-section'
import { ConnectionSection } from '@/features/settings/connection-section'
import { InfoRow } from '@/features/settings/info-row'
import { LocalDataSection } from '@/features/settings/local-data-section'
import {
  devicePhone,
  deviceName,
  profileSummary,
  settingsSection,
  yesNo,
  type SettingsSectionId,
} from '@/features/settings/settings-sections'
import { useActiveDevice } from '@/features/settings/use-active-device'
import { useAppInfo } from '@/hooks/use-app-info'
import { Switch } from '@/components/ui/switch'
import { useNotifyStore } from '@/features/notify/notify-store'
import { WATCH_POLL_MS } from '@/features/notify/use-new-message-watcher'
import { formatBytes } from '@/lib/format'

function ProfileSection() {
  const { device, selectedId } = useActiveDevice()
  const profile = profileSummary(device, selectedId)
  return (
    <>
      <section className="bg-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
        <img
          src={BRAND.logoUrl}
          alt={BRAND.name}
          className="bg-muted size-28 rounded-full border object-contain p-2"
        />
        <div className="min-w-0">
          <p className="text-lg font-medium [overflow-wrap:anywhere]">{profile.title}</p>
          <p className="text-muted-foreground text-sm">{profile.subtitle}</p>
          <p className="text-muted-foreground mt-1 text-xs">{BRAND.name}</p>
        </div>
        {device && <StateBadge state={device.state} />}
      </section>
      <PaneSection
        title="Kelola"
        description="Profil WhatsApp (nama dan foto) diatur di menu Akun. Perangkat aktif dipilih di menu Perangkat."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/account">
              <CircleUserRound className="size-4" />
              Buka Akun & Kontak
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <Smartphone className="size-4" />
              Buka Perangkat
            </Link>
          </Button>
        </div>
      </PaneSection>
    </>
  )
}

function DeviceSection() {
  const { device, selectedId, isLoading } = useActiveDevice()
  const [webhookOpen, setWebhookOpen] = useState(false)

  if (!selectedId) {
    return (
      <PaneSection
        title="Belum ada perangkat aktif"
        description="Pilih atau tambahkan perangkat di menu Perangkat untuk melihat ringkasan dan mengatur webhook-nya."
      >
        <Button asChild>
          <Link to="/">
            <Smartphone className="size-4" />
            Buka Perangkat
          </Link>
        </Button>
      </PaneSection>
    )
  }

  return (
    <>
      <PaneSection title="Perangkat aktif">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : device ? (
          <dl>
            <InfoRow label="Nama">{deviceName(device)}</InfoRow>
            <InfoRow label="Nomor">{devicePhone(device)}</InfoRow>
            <InfoRow label="ID perangkat" mono>
              {device.id}
            </InfoRow>
            <InfoRow label="Status">
              <StateBadge state={device.state} />
            </InfoRow>
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">
            Perangkat <span className="font-mono">{selectedId}</span> tidak ditemukan di server.
            Pilih perangkat lain di menu Perangkat.
          </p>
        )}
      </PaneSection>
      <PaneSection
        title="Webhook"
        description="Event perangkat ini dikirim (POST) ke URL webhook yang diatur per perangkat."
      >
        <div className="flex flex-wrap gap-2">
          <Button disabled={!device} onClick={() => setWebhookOpen(true)}>
            <Webhook className="size-4" />
            Atur webhook
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <Smartphone className="size-4" />
              Buka Perangkat
            </Link>
          </Button>
        </div>
      </PaneSection>
      {device && (
        <DeviceWebhookDialog device={device} open={webhookOpen} onOpenChange={setWebhookOpen} />
      )}
    </>
  )
}

function ServerSection() {
  const { data: info, isLoading, error } = useAppInfo()
  return (
    <>
      <PaneSection title="Info server" description="Dilaporkan GET /app/info.">
        {isLoading && <Skeleton className="h-32" />}
        {error && (
          <p className="text-muted-foreground text-sm">
            Server ini belum menyediakan /app/info (perlu pembaruan GOWA dengan dukungan
            lintas-origin).
          </p>
        )}
        {info && (
          <dl>
            <InfoRow label="Versi" mono>
              {info.version}
            </InfoRow>
            <InfoRow label="Nama OS perangkat" mono>
              {info.os}
            </InfoRow>
            <InfoRow label="Base path" mono>
              {info.base_path || '/'}
            </InfoRow>
            <InfoRow label="Batas ukuran gambar" mono>
              {formatBytes(info.max_image_size)}
            </InfoRow>
            <InfoRow label="Batas ukuran video" mono>
              {formatBytes(info.max_video_size)}
            </InfoRow>
            <InfoRow label="Batas ukuran berkas" mono>
              {formatBytes(info.max_file_size)}
            </InfoRow>
            <InfoRow label="Chatwoot aktif">{yesNo(info.chatwoot_enabled)}</InfoRow>
            {info.scheduled_sends !== undefined && (
              <InfoRow label="Pengiriman terjadwal">{yesNo(info.scheduled_sends)}</InfoRow>
            )}
          </dl>
        )}
      </PaneSection>
      <MetricsCard />
    </>
  )
}

function NotificationsSection() {
  const secure = typeof window !== 'undefined' && window.isSecureContext
  const prefs = useNotifyStore((state) => state.prefs)
  const setPrefs = useNotifyStore((state) => state.setPrefs)
  const { device } = useActiveDevice()
  const clearDevice = useNotifyStore((state) => state.clearDevice)
  return (
    <>
      <PaneSection
        title="Notifikasi di dashboard"
        description={`Selama tab dashboard terbuka, GOWA dicek tiap ${WATCH_POLL_MS / 1000} detik. Pesan masuk baru memunculkan pemberitahuan, bunyi, angka di ikon Chat, dan angka di judul tab.`}
      >
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>
              <span className="block font-medium">Tampilkan pemberitahuan</span>
              <span className="text-muted-foreground block text-xs">
                Kotak kecil berisi pengirim dan cuplikan pesan, dengan tombol Buka.
              </span>
            </span>
            <Switch
              checked={prefs.toast}
              onCheckedChange={(toast) => setPrefs({ toast })}
              aria-label="Tampilkan pemberitahuan"
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>
              <span className="block font-medium">Bunyi</span>
              <span className="text-muted-foreground block text-xs">
                Bunyi pendek. Browser baru mengizinkan suara setelah halaman pernah diklik.
              </span>
            </span>
            <Switch
              checked={prefs.sound}
              onCheckedChange={(sound) => setPrefs({ sound })}
              aria-label="Bunyi notifikasi"
            />
          </label>
          {device && (
            <Button variant="outline" className="self-start" onClick={() => clearDevice(device.id)}>
              Tandai semua sudah dilihat
            </Button>
          )}
        </div>
      </PaneSection>
      <PaneSection title="Batasan">
        <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
          <li>
            Angka &quot;baru&quot; berarti pesan masuk sejak chat terakhir dibuka di browser ini,
            bukan status baca WhatsApp: GOWA tidak menyimpan status baca.
          </li>
          <li>
            Ada jeda hingga {WATCH_POLL_MS / 1000} detik karena GOWA belum mengirim event pesan
            masuk lewat WebSocket. Hanya 30 chat terbaru yang dipantau.
          </li>
          <li>
            Pemberitahuan sistem operasi (muncul saat browser diminimalkan) butuh HTTPS. Dashboard
            yang dibuka lewat HTTP di jaringan lokal tidak mendapat izin itu.
          </li>
        </ul>
        <dl className="mt-3">
          <InfoRow label="Konteks aman (window.isSecureContext)">{yesNo(secure)}</InfoRow>
        </dl>
      </PaneSection>
    </>
  )
}

function AboutSection() {
  const { data: info } = useAppInfo()
  return (
    <section className="bg-card flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
      <img
        src={BRAND.logoUrl}
        alt=""
        className="bg-muted size-20 rounded-full border object-contain p-2"
      />
      <div>
        <p className="text-lg font-medium">GOWA UI</p>
        <p className="text-muted-foreground text-sm">
          Dashboard untuk server GOWA WhatsApp API · {BRAND.name}
        </p>
      </div>
      <dl className="w-full text-left">
        <InfoRow label="Organisasi">{BRAND.name}</InfoRow>
        <InfoRow label="Versi GOWA UI" mono>
          {__APP_VERSION__}
        </InfoRow>
        <InfoRow label="Versi server GOWA" mono>
          {info?.version ?? '—'}
        </InfoRow>
      </dl>
    </section>
  )
}

function SectionBody({ id }: { id: SettingsSectionId }) {
  switch (id) {
    case 'profile':
      return <ProfileSection />
    case 'appearance':
      return <AppearanceSection />
    case 'connection':
      return <ConnectionSection />
    case 'device':
      return <DeviceSection />
    case 'server':
      return <ServerSection />
    case 'notifications':
      return <NotificationsSection />
    case 'local-data':
      return <LocalDataSection />
    case 'about':
      return <AboutSection />
  }
}

export function SettingsDetail({
  id,
  onBack,
}: {
  id: SettingsSectionId | null
  onBack: () => void
}) {
  if (!id) {
    return (
      <EmptyPane
        icon={Settings}
        title="Pengaturan"
        hint="Pilih bagian di sebelah kiri untuk mengatur tampilan, koneksi, perangkat, dan data lokal dashboard."
      />
    )
  }
  const section = settingsSection(id)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DetailPaneHeader title={section.label} subtitle={section.description} onBack={onBack} />
      <DetailPaneBody>
        <SectionBody id={id} />
      </DetailPaneBody>
    </div>
  )
}
