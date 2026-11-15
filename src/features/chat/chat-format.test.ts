import { describe, expect, it } from 'vitest'
import {
  avatarTone,
  chatSubtitle,
  dayLabel,
  formatChatTime,
  mergeMessages,
  olderCursor,
  sameDay,
} from '@/features/chat/chat-format'
import type { MessageInfo } from '@/api/chat'

const now = new Date(2026, 10, 15, 14, 30)
const at = (day: number, hour = 9) => new Date(2026, 10, day, hour, 5).toISOString()
const message = (id: string, timestamp: string): MessageInfo =>
  ({ id, timestamp, chat_jid: 'x', content: id }) as MessageInfo

describe('chat labels', () => {
  it('describes the kind of chat', () => {
    expect(chatSubtitle({ jid: '6281248553128@s.whatsapp.net' })).toBe('+62 812-4855-3128')
    expect(chatSubtitle({ jid: '120363000000000001@g.us' })).toBe('Grup')
    expect(chatSubtitle({ jid: '123@newsletter' })).toBe('Saluran')
    expect(chatSubtitle({ jid: '123@lid' })).toBe('Kontak (LID)')
  })

  it('keeps an avatar tone stable per seed', () => {
    expect(avatarTone('abc')).toBe(avatarTone('abc'))
    expect(avatarTone('abc')).toBeGreaterThanOrEqual(0)
    expect(avatarTone('abc')).toBeLessThan(6)
  })
})

describe('time labels', () => {
  it('formats the chat list time like WhatsApp', () => {
    expect(formatChatTime(at(15, 9), now)).toMatch(/^09[.:]05$/)
    expect(formatChatTime(at(14), now)).toBe('Kemarin')
    expect(formatChatTime(at(11), now)).toBe('Rabu')
    expect(formatChatTime(at(2), now)).toBe('02/11/2026')
    expect(formatChatTime('0001-01-01T00:00:00Z', now)).toBe('')
  })

  it('labels day separators', () => {
    expect(dayLabel(at(15), now)).toBe('Hari ini')
    expect(dayLabel(at(14), now)).toBe('Kemarin')
    expect(dayLabel(at(2), now)).toBe('2 November 2026')
    expect(sameDay(at(2, 1), at(2, 23))).toBe(true)
    expect(sameDay(at(2), at(3))).toBe(false)
  })
})

describe('message paging', () => {
  it('merges pages oldest first without duplicates', () => {
    const latest = [message('c', at(15, 10)), message('b', at(15, 9))]
    const older = [message('b', at(15, 9)), message('a', at(14))]
    expect(mergeMessages(older, latest).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('returns the oldest timestamp as the next cursor only for a full page', () => {
    const page = [message('c', at(15, 10)), message('a', at(14)), message('b', at(15, 9))]
    expect(olderCursor(page, 3)).toBe(at(14))
    expect(olderCursor(page, 30)).toBeUndefined()
  })
})

describe('chat titles and summaries', () => {
  it('titles unnamed chats with the formatted number', async () => {
    const { chatTitle, chatCaption } = await import('@/features/chat/chat-format')
    const unnamed = { jid: '6281100000000@s.whatsapp.net', name: '' }
    expect(chatTitle(unnamed)).toBe('+62 811-0000-0000')
    expect(chatCaption(unnamed)).toBe('Nomor belum bernama')
    const named = { jid: '6281100000000@s.whatsapp.net', name: 'Kevin' }
    expect(chatTitle(named)).toBe('Kevin')
    expect(chatCaption(named)).toBe('+62 811-0000-0000')
    expect(chatTitle({ jid: 'x@g.us', name: 'x@g.us' })).toBe('x@g.us')
    expect(chatCaption({ jid: 'status@broadcast', name: 'Status' })).toBe('')
    expect(chatCaption({ jid: 'status@broadcast', name: '' })).toBe('')
  })

  it('summarises media messages in Indonesian', async () => {
    const { messageSummary } = await import('@/features/chat/chat-format')
    expect(messageSummary({ content: '', media_type: 'document', filename: 'invoice.pdf' })).toBe(
      '📄 invoice.pdf',
    )
    expect(messageSummary({ content: '', media_type: 'image', filename: '' })).toBe('Foto')
    expect(messageSummary({ content: 'Halo', media_type: 'image', filename: '' })).toBe('Halo')
  })
})
