import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, activeNavItem } from '@/components/layout/nav-items'

describe('NAV_ITEMS', () => {
  it('keeps the Master Plan v5 order with Perangkat first and Chat second', () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      'Perangkat',
      'Chat',
      'Panggilan',
      'Status',
      'Saluran',
      'Grup',
      'Messaging',
      'Akun & Kontak',
      'Pengaturan',
    ])
  })

  it('gives every item a unique route', () => {
    const routes = NAV_ITEMS.map((item) => item.to)
    expect(new Set(routes).size).toBe(routes.length)
  })
})

describe('activeNavItem', () => {
  it.each([
    ['/', 'Perangkat'],
    ['/chats', 'Chat'],
    ['/calls', 'Panggilan'],
    ['/channels', 'Saluran'],
    ['/messaging', 'Messaging'],
    ['/scheduled', 'Messaging'],
    ['/settings', 'Pengaturan'],
  ])('maps %s to %s', (pathname, label) => {
    expect(activeNavItem(pathname)?.label).toBe(label)
  })

  it('matches the root only exactly and ignores lookalike prefixes', () => {
    expect(activeNavItem('/unknown')).toBeUndefined()
    expect(activeNavItem('/chatsx')).toBeUndefined()
    expect(activeNavItem('/chats/123')?.label).toBe('Chat')
  })
})
