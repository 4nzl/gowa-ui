import { describe, expect, it } from 'vitest'
import { DEFAULT_MODE_ID, MESSAGING_GROUPS, MESSAGING_MODES, findMode } from './modes'

const COMPOSE = [
  'text',
  'image',
  'video',
  'file',
  'audio',
  'sticker',
  'contact',
  'location',
  'link',
  'poll',
  'interactive',
  'presence',
  'chat-presence',
  'subscribe-presence',
]
const ACT = ['react', 'update', 'read', 'played', 'star', 'revoke', 'delete', 'forward']

describe('messaging modes', () => {
  it('lists every compose type and message action exactly once', () => {
    const ids = MESSAGING_MODES.map((mode) => mode.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual([...COMPOSE, ...ACT].sort())
    expect(ids).toHaveLength(22)
  })

  it('groups modes into send, presence and message actions', () => {
    expect(MESSAGING_GROUPS.map((group) => group.label)).toEqual([
      'Kirim pesan',
      'Kehadiran',
      'Tindakan pesan',
    ])
    for (const group of MESSAGING_GROUPS) {
      for (const mode of group.modes) expect(mode.group).toBe(group.id)
    }
    expect(MESSAGING_GROUPS[0].modes).toHaveLength(11)
    expect(MESSAGING_GROUPS[1].modes).toHaveLength(3)
    expect(MESSAGING_GROUPS[2].modes.map((mode) => mode.id)).toEqual(ACT)
  })

  it('asks for a Message ID only on message actions', () => {
    for (const mode of MESSAGING_MODES) {
      expect(mode.needsMessageId).toBe(ACT.includes(mode.id))
    }
  })

  it('needs a recipient everywhere except device-wide presence', () => {
    const without = MESSAGING_MODES.filter((mode) => !mode.needsRecipient).map((mode) => mode.id)
    expect(without).toEqual(['presence'])
  })

  it('has unique, non-empty labels', () => {
    const labels = MESSAGING_MODES.map((mode) => mode.label)
    expect(new Set(labels).size).toBe(labels.length)
    for (const mode of MESSAGING_MODES) {
      expect(mode.label.trim()).not.toBe('')
      expect(mode.description.trim()).not.toBe('')
    }
  })

  it('finds modes by id and defaults to text', () => {
    expect(findMode(DEFAULT_MODE_ID)?.label).toBe('Teks')
    expect(findMode('forward')?.group).toBe('action')
    expect(findMode('nope')).toBeUndefined()
    expect(findMode(null)).toBeUndefined()
  })
})
