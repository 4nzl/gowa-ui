import type { RegistryDevice } from '@/api/types'
import { formatPhone } from '@/lib/phone'
import type { WsStatus } from '@/lib/ws'

export type SettingsSectionId =
  | 'profile'
  | 'appearance'
  | 'connection'
  | 'device'
  | 'server'
  | 'notifications'
  | 'local-data'
  | 'about'

export interface SettingsSection {
  id: SettingsSectionId
  label: string
  description: string
}

/** The profile row is rendered separately as the list header; the rest follow in order. */
export const PROFILE_SECTION: SettingsSection = {
  id: 'profile',
  label: 'Profil',
  description: 'Perangkat aktif dan organisasi.',
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'appearance',
    label: 'Tampilan',
    description: 'Tema terang, gelap, atau ikuti sistem.',
  },
  {
    id: 'connection',
    label: 'Koneksi',
    description: 'Server GOWA, pengguna, dan pembaruan langsung.',
  },
  {
    id: 'device',
    label: 'Perangkat & webhook',
    description: 'Ringkasan perangkat aktif dan URL webhook-nya.',
  },
  {
    id: 'server',
    label: 'Server',
    description: 'Info server dan kesehatan sistem.',
  },
  {
    id: 'notifications',
    label: 'Notifikasi',
    description: 'Pemberitahuan pesan baru, bunyi, dan batasannya.',
  },
  {
    id: 'local-data',
    label: 'Data lokal browser',
    description: 'Data yang disimpan dashboard di browser ini.',
  },
  {
    id: 'about',
    label: 'Tentang',
    description: 'Versi aplikasi dan server.',
  },
]

export const ALL_SETTINGS_SECTIONS: SettingsSection[] = [PROFILE_SECTION, ...SETTINGS_SECTIONS]

export function settingsSection(id: SettingsSectionId): SettingsSection {
  const section = ALL_SETTINGS_SECTIONS.find((item) => item.id === id)
  if (!section) throw new Error(`Unknown settings section: ${id}`)
  return section
}

export type ThemeChoice = 'light' | 'dark' | 'system'

export const THEME_CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
  { value: 'system', label: 'Ikuti sistem' },
]

/** next-themes reports undefined before mount; anything unknown falls back to system. */
export function normalizeTheme(theme: string | undefined): ThemeChoice {
  return theme === 'light' || theme === 'dark' ? theme : 'system'
}

export const WS_STATUS_LABELS: Record<WsStatus, string> = {
  connected: 'Tersambung',
  connecting: 'Menyambung ulang…',
  disconnected: 'Terputus',
}

export function yesNo(value: boolean): string {
  return value ? 'Ya' : 'Tidak'
}

export type LocalDataAction = 'media-paths' | 'drafts' | 'emoji-recent'

export interface LocalDataEntry {
  key: string
  storage: 'localStorage' | 'sessionStorage'
  label: string
  description: string
  /** Set when the settings page offers a dedicated clear action for this key. */
  action?: LocalDataAction
}

/**
 * Everything the dashboard keeps in the browser. Only keys and descriptions are
 * listed here; values (credentials in particular) are never read for display.
 */
export const LOCAL_DATA_ENTRIES: LocalDataEntry[] = [
  {
    key: 'gowa-ui.connection.v1',
    storage: 'localStorage',
    label: 'Koneksi server',
    description:
      'Alamat server, nama pengguna, dan kata sandi Basic Auth. Hanya dihapus lewat "Putuskan koneksi".',
  },
  {
    key: 'gowa-ui.device.v1',
    storage: 'localStorage',
    label: 'Perangkat aktif',
    description: 'ID perangkat yang terakhir dipilih.',
  },
  {
    key: 'gowa-recipient',
    storage: 'localStorage',
    label: 'Penerima terakhir',
    description: 'Nomor atau grup tujuan yang terakhir diisi di kolom penerima.',
  },
  {
    key: 'gowa-ui.media-paths.v1',
    storage: 'localStorage',
    label: 'Cache lokasi media',
    description:
      'Lokasi berkas media yang sudah diunduh server, agar media tidak diunduh ulang saat chat dibuka lagi.',
    action: 'media-paths',
  },
  {
    key: 'gowa-ui.emoji-recent.v1',
    storage: 'localStorage',
    label: 'Emoji terakhir',
    description: 'Daftar emoji yang terakhir dipakai di kolom pesan.',
    action: 'emoji-recent',
  },
  {
    key: 'gowa-ui.notify.v1',
    storage: 'localStorage',
    label: 'Penanda pesan baru',
    description:
      'Waktu pesan terakhir yang sudah dilihat per chat dan pilihan pemberitahuan/bunyi. Hapus lewat "Tandai semua sudah dilihat" di Notifikasi.',
  },
  {
    key: 'gowa-ui.drafts.v1',
    storage: 'sessionStorage',
    label: 'Draft chat',
    description: 'Pesan yang belum terkirim per chat. Hilang otomatis saat tab ditutup.',
    action: 'drafts',
  },
]

export function localDataEntry(action: LocalDataAction): LocalDataEntry {
  const entry = LOCAL_DATA_ENTRIES.find((item) => item.action === action)
  if (!entry) throw new Error(`Unknown local data action: ${action}`)
  return entry
}

export const LOCAL_DATA_ACTIONS: Record<
  LocalDataAction,
  { button: string; title: string; description: string; done: string }
> = {
  'media-paths': {
    button: 'Hapus cache lokasi media',
    title: 'Hapus cache lokasi media?',
    description:
      'Dashboard lupa lokasi media yang sudah diunduh. Membuka media lama akan meminta server mengunduhnya lagi dari WhatsApp (dan menulis berkas baru di server).',
    done: 'Cache lokasi media dihapus',
  },
  drafts: {
    button: 'Hapus draft chat',
    title: 'Hapus semua draft chat?',
    description: 'Semua pesan yang belum terkirim di tab ini dihapus dan tidak dapat dikembalikan.',
    done: 'Draft chat dihapus',
  },
  'emoji-recent': {
    button: 'Hapus emoji terakhir',
    title: 'Hapus daftar emoji terakhir?',
    description: 'Bagian "Terakhir dipakai" di pemilih emoji akan kosong lagi.',
    done: 'Daftar emoji terakhir dihapus',
  },
}

/** Removes one key; storage that is blocked or missing counts as already empty. */
export function removeStorageKey(
  storage: Pick<Storage, 'removeItem'> | null,
  key: string,
): boolean {
  if (!storage) return false
  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function deviceName(device: RegistryDevice): string {
  return device.display_name || device.id
}

export function devicePhone(device: RegistryDevice): string {
  return formatPhone(device.jid || device.phone_number) ?? 'Belum dipasangkan'
}

/** Title and subtitle of the profile row at the top of the settings list. */
export function profileSummary(device: RegistryDevice | null, selectedId: string | null) {
  if (device) return { title: deviceName(device), subtitle: devicePhone(device) }
  if (selectedId) return { title: selectedId, subtitle: 'Perangkat tidak ditemukan di server' }
  return { title: 'Belum ada perangkat aktif', subtitle: 'Pilih perangkat di menu Perangkat' }
}
