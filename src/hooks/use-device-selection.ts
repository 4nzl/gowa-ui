import { useEffect } from 'react'
import { useDevices } from '@/hooks/use-devices'
import { useDeviceStore } from '@/stores/device'

/**
 * Decides the selected device after the device list changes.
 *
 * A selection that no longer exists is cleared, never moved to another device:
 * sending through a device the user did not choose is worse than asking them to
 * choose. The only automatic pick is the first load of a session with nothing
 * selected and exactly one device, which is the device the backend itself
 * defaults to.
 */
export function resolveDeviceSelection(
  deviceIds: readonly string[],
  selected: string | null,
  allowAutoPick: boolean,
): string | null {
  if (selected !== null) return deviceIds.includes(selected) ? selected : null
  return allowAutoPick && deviceIds.length === 1 ? deviceIds[0] : null
}

let autoPickUsed = false

/** Keeps the persisted device selection valid. Mount once, in the app shell. */
export function useDeviceSelectionSync() {
  const { data: devices } = useDevices()
  const selectedDeviceId = useDeviceStore((state) => state.selectedDeviceId)
  const selectDevice = useDeviceStore((state) => state.selectDevice)

  useEffect(() => {
    if (!devices) return
    const next = resolveDeviceSelection(
      devices.map((device) => device.id),
      selectedDeviceId,
      !autoPickUsed,
    )
    autoPickUsed = true
    if (next !== selectedDeviceId) selectDevice(next)
  }, [devices, selectedDeviceId, selectDevice])
}
