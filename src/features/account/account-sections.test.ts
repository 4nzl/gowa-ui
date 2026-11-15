import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_GROUPS,
  ACCOUNT_SECTIONS,
  accountSection,
  contactSubtitle,
  contactTitle,
  filterContacts,
  privacyLabel,
  recipientForContact,
  sectionsInGroup,
  sortContacts,
} from '@/features/account/account-sections'

const contacts = [
  { jid: '6285820301617@s.whatsapp.net', name: 'Budi' },
  { jid: '6281234567890@s.whatsapp.net', name: '' },
  { jid: '123456789012345@lid', name: 'Ani' },
]

describe('account sections', () => {
  it('has unique ids, each in a known group', () => {
    const ids = ACCOUNT_SECTIONS.map((section) => section.id)
    expect(new Set(ids).size).toBe(ids.length)
    const groups = new Set(ACCOUNT_GROUPS.map((group) => group.id))
    expect(ACCOUNT_SECTIONS.every((section) => groups.has(section.group))).toBe(true)
  })

  it('keeps own-account items first and lookups using the recipient bar', () => {
    expect(sectionsInGroup('account').map((section) => section.id)).toEqual(['profile', 'privacy'])
    expect(sectionsInGroup('lookup').every((section) => section.usesRecipient)).toBe(true)
    expect(accountSection('business').label).toBe('Profil bisnis')
  })
})

describe('contacts', () => {
  it('titles unnamed contacts by their formatted number', () => {
    expect(contactTitle(contacts[0])).toBe('Budi')
    expect(contactTitle(contacts[1])).toBe('+62 812-3456-7890')
    expect(contactSubtitle(contacts[2])).toBe('Kontak (LID)')
  })

  it('filters by name, JID or digits typed with formatting', () => {
    expect(filterContacts(contacts, 'bud').map((item) => item.name)).toEqual(['Budi'])
    expect(filterContacts(contacts, '+62 812-345')).toHaveLength(1)
    expect(filterContacts(contacts, '@lid')).toHaveLength(1)
    expect(filterContacts(contacts, '')).toHaveLength(3)
    expect(filterContacts(contacts, 'zzz')).toHaveLength(0)
  })

  it('sorts by title', () => {
    expect(sortContacts(contacts).map(contactTitle)).toEqual(['+62 812-3456-7890', 'Ani', 'Budi'])
  })

  it('maps a contact JID to a recipient-bar value', () => {
    expect(recipientForContact('6285820301617:5@s.whatsapp.net')).toEqual({
      phone: '6285820301617',
      type: 'user',
    })
    expect(recipientForContact('123@lid')).toEqual({ phone: '123', type: 'lid' })
    expect(recipientForContact('123-456@g.us')).toEqual({ phone: '123-456', type: 'group' })
  })
})

describe('privacy labels', () => {
  it('translates known values and keeps unknown ones', () => {
    expect(privacyLabel('last_seen', 'all')).toBe('Semua orang')
    expect(privacyLabel('profile', 'contacts')).toBe('Kontak saya')
    expect(privacyLabel('status', 'none')).toBe('Tidak ada')
    expect(privacyLabel('read_receipts', 'all')).toBe('Aktif')
    expect(privacyLabel('group_add', 'something')).toBe('something')
    expect(privacyLabel('group_add', '')).toBe('—')
  })
})
