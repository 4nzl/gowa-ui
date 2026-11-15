import { useState } from 'react'
import { Unplug } from 'lucide-react'
import { PaneSection } from '@/components/layout/list-detail'
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
import { InfoRow } from '@/features/settings/info-row'
import { WS_STATUS_LABELS, yesNo } from '@/features/settings/settings-sections'
import { cn } from '@/lib/utils'
import { useWsStore, type WsStatus } from '@/lib/ws'
import { useConnection } from '@/stores/connection'

const WS_DOT: Record<WsStatus, string> = {
  connected: 'bg-live live-dot',
  connecting: 'bg-amber-500 animate-pulse',
  disconnected: 'bg-muted-foreground/40',
}

export function ConnectionSection() {
  const baseUrl = useConnection((state) => state.baseUrl)
  const username = useConnection((state) => state.username)
  const allowInsecureHttp = useConnection((state) => state.allowInsecureHttp)
  const disconnect = useConnection((state) => state.disconnect)
  const wsStatus = useWsStore((state) => state.status)
  const [confirm, setConfirm] = useState(false)

  return (
    <>
      <PaneSection title="Server GOWA" description="Tujuan semua permintaan dari dashboard ini.">
        <dl>
          <InfoRow label="Alamat server" mono>
            {baseUrl ?? '—'}
          </InfoRow>
          <InfoRow label="Nama pengguna" mono>
            {username || '— (tanpa Basic Auth)'}
          </InfoRow>
          <InfoRow label="Kredensial lewat HTTP tanpa enkripsi diizinkan">
            {yesNo(allowInsecureHttp)}
          </InfoRow>
        </dl>
        <p className="text-muted-foreground mt-2 text-xs">
          Kata sandi tersimpan di browser ini dan tidak pernah ditampilkan.
        </p>
      </PaneSection>

      <PaneSection
        title="Pembaruan langsung (WebSocket)"
        description="Membawa event perangkat (login, logout, daftar perangkat, passkey, webhook). Pesan masuk belum dikirim lewat WebSocket."
      >
        <div role="status" className="flex items-center gap-2 text-sm">
          <span aria-hidden className={cn('size-2.5 rounded-full', WS_DOT[wsStatus])} />
          {WS_STATUS_LABELS[wsStatus]}
        </div>
      </PaneSection>

      <PaneSection
        title="Putuskan koneksi"
        tone="danger"
        description="Menghapus alamat server dan kredensial yang tersimpan di browser ini, lalu kembali ke halaman sambung. Server dan perangkat WhatsApp tidak terpengaruh."
      >
        <Button variant="outline" className="text-destructive" onClick={() => setConfirm(true)}>
          <Unplug className="size-4" />
          Putuskan koneksi
        </Button>
      </PaneSection>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Putuskan koneksi dari server?</AlertDialogTitle>
            <AlertDialogDescription>
              Alamat server, nama pengguna, dan kata sandi yang tersimpan di browser ini akan
              dihapus. Anda perlu memasukkannya lagi untuk menyambung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={disconnect}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Putuskan koneksi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
