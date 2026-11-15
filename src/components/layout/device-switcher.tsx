import { Smartphone } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { deviceTitle, stateDotStyles } from '@/features/devices/device-display'
import { useDevices } from '@/hooks/use-devices'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/device'

export function DeviceSwitcher() {
  const { data: devices } = useDevices()
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId)
  const selectDevice = useDeviceStore((state) => state.selectDevice)

  if (!devices?.length) return null

  return (
    <Select value={selectedDeviceId ?? ''} onValueChange={selectDevice}>
      <SelectTrigger
        size="sm"
        className="w-44 max-w-full min-w-0 sm:w-48 md:w-56"
        aria-label="Perangkat aktif"
      >
        <Smartphone className="text-muted-foreground size-4 shrink-0" />
        <SelectValue placeholder="Pilih perangkat" />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device) => (
          <SelectItem key={device.id} value={device.id}>
            <span className={cn('size-2 shrink-0 rounded-full', stateDotStyles[device.state])} />
            <span className="truncate">{deviceTitle(device)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
