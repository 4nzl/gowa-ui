import { Check, Grid3x3, Link2, Phone, PhoneCall, Video, X } from 'lucide-react'
import { DetailPaneBody, DetailPaneHeader, PaneSection } from '@/components/layout/list-detail'
import { Button } from '@/components/ui/button'
import { CallRejectForm } from '@/features/call/call-reject-form'

const SUPPORTED = [
  'Riwayat panggilan masuk yang dicatat GOWA (dipindai dari chat terbaru)',
  'Menolak panggilan masuk yang masih berdering',
  'Menolak otomatis lewat pengaturan server GOWA (tercatat sebagai "Ditolak otomatis")',
]

const UNSUPPORTED = [
  { icon: Phone, label: 'Panggilan suara' },
  { icon: Video, label: 'Panggilan video' },
  { icon: Link2, label: 'Tautan panggilan' },
  { icon: Grid3x3, label: 'Dial pad' },
]

/** Detail pane when no call is selected: what GOWA can and cannot do, plus manual reject. */
export function CallCapabilities({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {onBack && (
        <div className="tab:hidden">
          <DetailPaneHeader
            title="Kemampuan panggilan"
            onBack={onBack}
            backLabel="Kembali ke daftar panggilan"
          />
        </div>
      )}
      <DetailPaneBody>
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-6 text-center">
          <PhoneCall className="size-12" strokeWidth={1.4} />
          <h2 className="text-foreground text-xl font-normal">Panggilan</h2>
          <p className="max-w-sm text-sm">
            Pilih panggilan dari daftar untuk melihat detail, membuka chat penelepon, atau
            menolaknya.
          </p>
        </div>

        <PaneSection
          title="Kemampuan server GOWA"
          description="GOWA tidak menyimpan log panggilan khusus dan tidak mengirim event panggilan ke dashboard. Setiap panggilan masuk disimpan sebagai pesan di chat penelepon."
        >
          <ul className="flex flex-col gap-2 text-sm">
            {SUPPORTED.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="sr-only">Didukung: </span>
                  {item}
                </span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <X className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="text-muted-foreground">
                <span className="sr-only">Tidak didukung: </span>
                Panggilan keluar tidak tercatat, dan GOWA tidak membedakan panggilan yang diangkat
                dari yang terlewat.
              </span>
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {UNSUPPORTED.map(({ icon: Icon, label }) => (
              <Button
                key={label}
                variant="outline"
                disabled
                title={`${label} tidak didukung oleh API GOWA`}
                aria-label={`${label} (tidak didukung oleh API GOWA)`}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Tombol di atas nonaktif karena API GOWA tidak menyediakan fitur memulai panggilan,
            tautan panggilan, maupun dial pad.
          </p>
        </PaneSection>

        <PaneSection
          title="Tolak panggilan manual"
          description="Gunakan caller JID dan call ID dari event webhook call.offer. Penolakan hanya berlaku selama panggilan masih berdering."
        >
          <CallRejectForm hint="" />
        </PaneSection>
      </DetailPaneBody>
    </div>
  )
}
