import { Info } from 'lucide-react'
import { ActionCard } from '@/components/shared/action-card'
import { PageHeader } from '@/components/shared/page-header'
import { CallRejectForm } from '@/features/call/call-reject-form'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'

export default function CallsPage() {
  const device = useSelectedDevice()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Panggilan" description="Tangani panggilan masuk ke perangkat aktif." />

      <div
        role="note"
        className="bg-card text-muted-foreground flex gap-3 rounded-xl border p-4 text-sm"
      >
        <Info className="text-primary mt-0.5 size-4 shrink-0" />
        <p>
          Server GOWA hanya mendukung <strong className="text-foreground">penolakan</strong>{' '}
          panggilan masuk. Memulai panggilan suara/video, tautan panggilan, dan dial pad tidak
          tersedia. Daftar riwayat panggilan masuk sedang disiapkan.
        </p>
      </div>

      {!device ? (
        <DeviceGuard />
      ) : (
        <ActionCard
          className="max-w-xl"
          title="Tolak panggilan"
          description="Gunakan caller JID dan call ID dari event webhook call.offer."
        >
          <CallRejectForm />
        </ActionCard>
      )}
    </div>
  )
}
