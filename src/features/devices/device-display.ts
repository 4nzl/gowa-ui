import { formatPhone } from '@/lib/phone'
import type { DeviceState, RegistryDevice } from '@/api/types'

export function deviceTitle(device: RegistryDevice): string {
  return device.display_name || device.id
}

export function deviceSubtitle(device: RegistryDevice): string {
  return formatPhone(device.jid || device.phone_number) ?? 'Belum dipasangkan'
}

/** Case-insensitive match on name and ID; digits also match the phone number. */
export function filterDevices(devices: readonly RegistryDevice[], query: string): RegistryDevice[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...devices]
  const digits = needle.replace(/[^\d]/g, '')
  return devices.filter((device) => {
    const text = `${device.display_name ?? ''} ${device.id}`.toLowerCase()
    const phone = `${device.jid ?? ''}${device.phone_number ?? ''}`
    return text.includes(needle) || (digits.length > 0 && phone.includes(digits))
  })
}

/**
 * Which device the detail pane shows. Viewing a device never changes the active
 * device; that only happens through the explicit "Jadikan perangkat aktif" button.
 */
export function viewedDevice(
  devices: readonly RegistryDevice[],
  viewedId: string | null,
  activeId: string | null,
): RegistryDevice | null {
  return (
    devices.find((device) => device.id === viewedId) ??
    devices.find((device) => device.id === activeId) ??
    devices[0] ??
    null
  )
}

/** GOWA device states: logged_in is a paired, usable session; connected is a socket without login. */
export const stateLabels: Record<DeviceState, string> = {
  logged_in: 'Login aktif',
  connected: 'Belum login',
  connecting: 'Menyambung…',
  disconnected: 'Terputus',
}

export const stateDotStyles: Record<DeviceState, string> = {
  logged_in: 'bg-emerald-500',
  connected: 'bg-sky-500',
  connecting: 'bg-amber-500',
  disconnected: 'bg-muted-foreground/50',
}
