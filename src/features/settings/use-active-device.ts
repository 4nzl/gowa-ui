import { useDevices } from '@/hooks/use-devices'
import { useDeviceStore } from '@/stores/device'
import type { RegistryDevice } from '@/api/types'

/** The active device (selectedDeviceId) resolved against the server's device list. */
export function useActiveDevice(): {
  selectedId: string | null
  device: RegistryDevice | null
  isLoading: boolean
} {
  const selectedId = useDeviceStore((state) => state.selectedDeviceId)
  const { data, isLoading } = useDevices()
  const device = selectedId ? (data?.find((item) => item.id === selectedId) ?? null) : null
  return { selectedId, device, isLoading }
}
