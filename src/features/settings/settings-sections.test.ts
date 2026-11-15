import { describe, expect, it, vi } from 'vitest'
import {
  ALL_SETTINGS_SECTIONS,
  LOCAL_DATA_ACTIONS,
  LOCAL_DATA_ENTRIES,
  PROFILE_SECTION,
  SETTINGS_SECTIONS,
  THEME_CHOICES,
  WS_STATUS_LABELS,
  localDataEntry,
  normalizeTheme,
  profileSummary,
  removeStorageKey,
  settingsSection,
  yesNo,
} from '@/features/settings/settings-sections'
import type { RegistryDevice } from '@/api/types'

const device: RegistryDevice = {
  id: 'kantor',
  display_name: 'HP Kantor',
  jid: '6285820301617:5@s.whatsapp.net',
  state: 'logged_in',
  created_at: '2026-01-01T00:00:00Z',
}

describe('settings sections', () => {
  it('lists every section once, profile first', () => {
    expect(ALL_SETTINGS_SECTIONS[0]).toBe(PROFILE_SECTION)
    expect(SETTINGS_SECTIONS.map((section) => section.id)).toEqual([
      'appearance',
      'connection',
      'device',
      'server',
      'notifications',
      'local-data',
      'about',
    ])
    const ids = ALL_SETTINGS_SECTIONS.map((section) => section.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has Indonesian labels and descriptions', () => {
    for (const section of ALL_SETTINGS_SECTIONS) {
      expect(section.label).not.toBe('')
      expect(section.description).not.toBe('')
    }
    expect(settingsSection('local-data').label).toBe('Data lokal browser')
  })

  it('looks a section up by id', () => {
    expect(settingsSection('connection').label).toBe('Koneksi')
  })
})

describe('theme helpers', () => {
  it('offers light, dark and system in Indonesian', () => {
    expect(THEME_CHOICES.map((choice) => choice.label)).toEqual(['Terang', 'Gelap', 'Ikuti sistem'])
  })

  it('normalises unknown or missing themes to system', () => {
    expect(normalizeTheme('dark')).toBe('dark')
    expect(normalizeTheme('light')).toBe('light')
    expect(normalizeTheme(undefined)).toBe('system')
    expect(normalizeTheme('sepia')).toBe('system')
  })
})

describe('formatting', () => {
  it('labels WebSocket states and booleans', () => {
    expect(WS_STATUS_LABELS.connected).toBe('Tersambung')
    expect(WS_STATUS_LABELS.disconnected).toBe('Terputus')
    expect(yesNo(true)).toBe('Ya')
    expect(yesNo(false)).toBe('Tidak')
  })

  it('summarises the active device for the profile row', () => {
    expect(profileSummary(device, 'kantor')).toEqual({
      title: 'HP Kantor',
      subtitle: '+62 858-2030-1617',
    })
    expect(profileSummary({ ...device, display_name: '', jid: undefined }, 'kantor')).toEqual({
      title: 'kantor',
      subtitle: 'Belum dipasangkan',
    })
    expect(profileSummary(null, 'hilang').title).toBe('hilang')
    expect(profileSummary(null, null).title).toBe('Belum ada perangkat aktif')
  })
})

describe('local data', () => {
  it('describes every key the dashboard stores, without values', () => {
    expect(LOCAL_DATA_ENTRIES.map((entry) => entry.key)).toEqual([
      'gowa-ui.connection.v1',
      'gowa-ui.device.v1',
      'gowa-recipient',
      'gowa-ui.media-paths.v1',
      'gowa-ui.emoji-recent.v1',
      'gowa-ui.notify.v1',
      'gowa-ui.drafts.v1',
    ])
    for (const entry of LOCAL_DATA_ENTRIES) expect(entry.description).not.toBe('')
    expect(localDataEntry('drafts').storage).toBe('sessionStorage')
  })

  it('never offers a clear action for credentials', () => {
    const connection = LOCAL_DATA_ENTRIES.find((entry) => entry.key === 'gowa-ui.connection.v1')
    expect(connection?.action).toBeUndefined()
    expect(Object.keys(LOCAL_DATA_ACTIONS).sort()).toEqual([
      'drafts',
      'emoji-recent',
      'media-paths',
    ])
  })

  it('maps actions to their keys', () => {
    expect(localDataEntry('media-paths').key).toBe('gowa-ui.media-paths.v1')
    expect(localDataEntry('emoji-recent').key).toBe('gowa-ui.emoji-recent.v1')
  })

  it('removes a key and tolerates blocked storage', () => {
    const removeItem = vi.fn()
    expect(removeStorageKey({ removeItem }, 'gowa-ui.media-paths.v1')).toBe(true)
    expect(removeItem).toHaveBeenCalledWith('gowa-ui.media-paths.v1')
    expect(removeStorageKey(null, 'x')).toBe(false)
    expect(
      removeStorageKey(
        {
          removeItem: () => {
            throw new Error('blocked')
          },
        },
        'x',
      ),
    ).toBe(false)
  })
})
