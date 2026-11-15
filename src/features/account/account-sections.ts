import type { Contact, PrivacyResponse } from '@/api/user'
import type { RecipientType } from '@/lib/jid'
import { formatPhone } from '@/lib/phone'

export type AccountSectionId = 'profile' | 'privacy' | 'info' | 'check' | 'avatar' | 'business'

export interface AccountSection {
  id: AccountSectionId
  group: 'account' | 'lookup'
  label: string
  description: string
  /** Lookup sections read their target from the shared recipient bar. */
  usesRecipient: boolean
}

export const ACCOUNT_GROUPS: { id: AccountSection['group']; label: string }[] = [
  { id: 'account', label: 'Akun saya' },
  { id: 'lookup', label: 'Alat pencarian' },
]

export const ACCOUNT_SECTIONS: AccountSection[] = [
  {
    id: 'profile',
    group: 'account',
    label: 'Profil saya',
    description: 'Foto profil dan nama tampilan perangkat aktif.',
    usesRecipient: false,
  },
  {
    id: 'privacy',
    group: 'account',
    label: 'Privasi',
    description: 'Pengaturan privasi akun saat ini (hanya baca).',
    usesRecipient: false,
  },
  {
    id: 'info',
    group: 'lookup',
    label: 'Info pengguna',
    description: 'Info publik pengguna berdasarkan nomor atau LID.',
    usesRecipient: true,
  },
  {
    id: 'check',
    group: 'lookup',
    label: 'Cek nomor WhatsApp',
    description: 'Periksa apakah sebuah nomor terdaftar di WhatsApp.',
    usesRecipient: true,
  },
  {
    id: 'avatar',
    group: 'lookup',
    label: 'Foto profil',
    description: 'Ambil foto profil pengguna atau grup.',
    usesRecipient: true,
  },
  {
    id: 'business',
    group: 'lookup',
    label: 'Profil bisnis',
    description: 'Profil publik akun WhatsApp Business.',
    usesRecipient: true,
  },
]

export function accountSection(id: AccountSectionId): AccountSection {
  return ACCOUNT_SECTIONS.find((section) => section.id === id) ?? ACCOUNT_SECTIONS[0]
}

export function sectionsInGroup(group: AccountSection['group']): AccountSection[] {
  return ACCOUNT_SECTIONS.filter((section) => section.group === group)
}

/** Contact title: its saved name, else the formatted number, else the raw JID. */
export function contactTitle(contact: Contact): string {
  const name = contact.name?.trim()
  if (name) return name
  return formatPhone(contact.jid) ?? contact.jid.split('@')[0]
}

/** Second line of a contact row: the number, or the kind of id. */
export function contactSubtitle(contact: Contact): string {
  if (contact.jid.endsWith('@lid')) return 'Kontak (LID)'
  return formatPhone(contact.jid) ?? contact.jid
}

/** Client-side contact search by name, formatted number, or raw digits/JID. */
export function filterContacts(contacts: readonly Contact[], query: string): Contact[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...contacts]
  const digits = needle.replace(/[^\d]/g, '')
  return contacts.filter((contact) => {
    if (contact.name?.toLowerCase().includes(needle)) return true
    if (contact.jid.toLowerCase().includes(needle)) return true
    return digits.length > 0 && contact.jid.split('@')[0].includes(digits)
  })
}

/** Sorted by title so the list reads like an address book. */
export function sortContacts(contacts: readonly Contact[]): Contact[] {
  return [...contacts].sort((a, b) =>
    contactTitle(a).localeCompare(contactTitle(b), 'id', { sensitivity: 'base' }),
  )
}

/** Rendering every contact of a large address book stalls the list; cap it. */
export const CONTACT_RENDER_LIMIT = 300

/** Recipient-bar value that targets a contact in the lookup forms. */
export function recipientForContact(jid: string): { phone: string; type: RecipientType } {
  const [user, server] = jid.split('@')
  if (server === 'lid') return { phone: user, type: 'lid' }
  if (server === 'g.us') return { phone: user, type: 'group' }
  if (server === 's.whatsapp.net' || server === 'c.us') {
    return { phone: user.split(':')[0], type: 'user' }
  }
  return { phone: jid, type: 'user' }
}

const PRIVACY_VALUES: Record<string, string> = {
  all: 'Semua orang',
  contacts: 'Kontak saya',
  contact_blacklist: 'Kontak saya, kecuali…',
  match_last_seen: 'Sama seperti Terakhir dilihat',
  known: 'Kontak dan nomor yang dikenal',
  none: 'Tidak ada',
}

export function privacyValueLabel(value: string | undefined | null): string {
  if (!value) return '—'
  return PRIVACY_VALUES[value] ?? value
}

export function readReceiptsLabel(value: string | undefined | null): string {
  if (!value) return '—'
  if (value === 'all') return 'Aktif'
  if (value === 'none') return 'Nonaktif'
  return value
}

export const PRIVACY_ROWS: { key: keyof PrivacyResponse; label: string }[] = [
  { key: 'group_add', label: 'Siapa yang bisa menambahkan ke grup' },
  { key: 'last_seen', label: 'Siapa yang bisa melihat terakhir dilihat' },
  { key: 'status', label: 'Siapa yang bisa melihat status' },
  { key: 'profile', label: 'Siapa yang bisa melihat foto profil' },
  { key: 'read_receipts', label: 'Laporan dibaca' },
]

export function privacyLabel(key: keyof PrivacyResponse, value: string | undefined): string {
  return key === 'read_receipts' ? readReceiptsLabel(value) : privacyValueLabel(value)
}
