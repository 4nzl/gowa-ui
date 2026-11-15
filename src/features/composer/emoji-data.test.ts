import { describe, expect, it } from 'vitest'
import { ALL_EMOJIS, insertAtCursor, searchEmojis } from '@/features/composer/emoji-data'

describe('emoji data', () => {
  it('has no duplicate emoji', () => {
    const emojis = ALL_EMOJIS.map(([emoji]) => emoji)
    expect(new Set(emojis).size).toBe(emojis.length)
  })

  it('searches Indonesian and English keywords by prefix', () => {
    expect(searchEmojis('terima kasih')).toContain('🙏')
    expect(searchEmojis('thumb')).toContain('👍')
    expect(searchEmojis('pesawat')).toContain('✈️')
    expect(searchEmojis('   ')).toEqual([])
    expect(searchEmojis('zzzz')).toEqual([])
  })
})

describe('insertAtCursor', () => {
  it('inserts at the caret and replaces a selection', () => {
    expect(insertAtCursor('halo dunia', 5, 5, '👋 ')).toEqual({ value: 'halo 👋 dunia', caret: 8 })
    expect(insertAtCursor('halo dunia', 5, 10, '🌍')).toEqual({ value: 'halo 🌍', caret: 7 })
    expect(insertAtCursor('halo', null, null, '!')).toEqual({ value: 'halo!', caret: 5 })
  })
})
