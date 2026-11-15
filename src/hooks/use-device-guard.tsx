import { Smartphone } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { useDeviceStore } from '@/stores/device'

/** Renders a banner when no device is selected; feature pages gate on this. */
export function DeviceGuard() {
  return (
    <EmptyState
      icon={Smartphone}
      title="Belum ada perangkat dipilih"
      hint="Pilih perangkat aktif di bilah atas atau di menu Perangkat. Perangkat tidak dipilih otomatis agar pesan tidak terkirim lewat perangkat yang salah."
    />
  )
}

export function useSelectedDevice(): string | null {
  return useDeviceStore((state) => state.selectedDeviceId)
}
