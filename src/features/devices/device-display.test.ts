import { describe, expect, it } from 'vitest'
import {
  deviceSubtitle,
  deviceTitle,
  filterDevices,
  viewedDevice,
} from '@/features/devices/device-display'
import type { RegistryDevice } from '@/api/types'

const device = (id: string, extra: Partial<RegistryDevice> = {}): RegistryDevice => ({
  id,
  state: 'logged_in',
  created_at: '2026-09-07T03:55:00Z',
  ...extra,
})

const ramafor = device('ramafor', {
  display_name: 'CV. Raja Mahakam Fortuna',
  jid: '6285820301617:5@s.whatsapp.net',
})
const spare = device('spare', { state: 'disconnected' })

describe('device labels', () => {
  it('prefers the display name and formats the paired number', () => {
    expect(deviceTitle(ramafor)).toBe('CV. Raja Mahakam Fortuna')
    expect(deviceSubtitle(ramafor)).toBe('+62 858-2030-1617')
  })

  it('falls back to the ID and an unpaired label', () => {
    expect(deviceTitle(spare)).toBe('spare')
    expect(deviceSubtitle(spare)).toBe('Belum dipasangkan')
  })
})

describe('filterDevices', () => {
  it('matches name, ID and phone digits', () => {
    expect(filterDevices([ramafor, spare], 'raja')).toEqual([ramafor])
    expect(filterDevices([ramafor, spare], 'SPA')).toEqual([spare])
    expect(filterDevices([ramafor, spare], '0858 2030')).toEqual([])
    expect(filterDevices([ramafor, spare], '82030')).toEqual([ramafor])
    expect(filterDevices([ramafor, spare], '  ')).toEqual([ramafor, spare])
  })
})

describe('viewedDevice', () => {
  it('shows the device the user opened', () => {
    expect(viewedDevice([ramafor, spare], 'spare', 'ramafor')).toBe(spare)
  })

  it('falls back to the active device, then the first one, for display only', () => {
    expect(viewedDevice([spare, ramafor], null, 'ramafor')).toBe(ramafor)
    expect(viewedDevice([spare, ramafor], 'gone', null)).toBe(spare)
    expect(viewedDevice([], null, null)).toBeNull()
  })
})
