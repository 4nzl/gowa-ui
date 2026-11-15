import { describe, expect, it } from 'vitest'
import {
  RECENT_WINDOW_MS,
  clampIndex,
  draftProblem,
  groupStatuses,
  initialStatusIndex,
  isRecent,
  posterJid,
  posterName,
  statusCount,
  statusCursor,
} from '@/features/status/status-format'
import type { MessageInfo } from '@/api/chat'

const now = new Date('2026-11-15T12:00:00Z').getTime()
const hoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString()
const status = (
  id: string,
  sender: string,
  timestamp: string,
  extra: Partial<MessageInfo> = {},
): MessageInfo =>
  ({
    id,
    chat_jid: 'status@broadcast',
    sender_jid: sender,
    timestamp,
    content: '',
    media_type: 'image',
    is_from_me: false,
    ...extra,
  }) as MessageInfo

const ANI = '6281111111111@s.whatsapp.net'
const BUDI = '6282222222222@s.whatsapp.net'
const LID = '123456789@lid'

describe('poster identity', () => {
  it('drops the device suffix so a poster groups once', () => {
    expect(posterJid('6281111111111:12@s.whatsapp.net')).toBe(ANI)
    expect(posterJid(LID)).toBe(LID)
    expect(posterJid('weird')).toBe('weird')
  })

  it('names a poster by display name, then number, then JID', () => {
    expect(posterName(ANI, ' Ani ')).toBe('Ani')
    expect(posterName(ANI, '')).toBe('+62 811-1111-1111')
    expect(posterName(ANI, ANI)).toBe('+62 811-1111-1111')
    expect(posterName(LID)).toBe(LID)
  })
})

describe('groupStatuses', () => {
  const messages = [
    status('a3', ANI, hoursAgo(1), { sender_display_name: 'Ani' }),
    status('b1', BUDI, hoursAgo(30)),
    status('a1', '6281111111111:3@s.whatsapp.net', hoursAgo(50)),
    status('l1', LID, hoursAgo(5), { media_type: '' }),
    status('a2', ANI, hoursAgo(10)),
    status('b2', BUDI, hoursAgo(26), { sender_display_name: 'Budi' }),
  ]

  it('groups by sender and orders each poster oldest first', () => {
    const { recent } = groupStatuses(messages, now)
    const ani = recent.find((poster) => poster.jid === ANI)
    expect(ani?.statuses.map((message) => message.id)).toEqual(['a1', 'a2', 'a3'])
    expect(ani?.name).toBe('Ani')
    expect(ani?.latest).toBe(hoursAgo(1))
  })

  it('splits posters at 24 hours and orders by newest status', () => {
    const { recent, older } = groupStatuses(messages, now)
    expect(recent.map((poster) => poster.jid)).toEqual([ANI, LID])
    expect(older.map((poster) => poster.jid)).toEqual([BUDI])
    expect(older[0].name).toBe('Budi')
    expect(older[0].recent).toBe(false)
  })

  it('ignores duplicate copies from overlapping pages', () => {
    const { recent } = groupStatuses([...messages, messages[0]], now)
    expect(recent[0].statuses).toHaveLength(3)
  })

  it('returns empty sections for no statuses', () => {
    expect(groupStatuses([], now)).toEqual({ recent: [], older: [] })
  })

  it('treats the window as exclusive and bad timestamps as old', () => {
    expect(isRecent(new Date(now - RECENT_WINDOW_MS + 1).toISOString(), now)).toBe(true)
    expect(isRecent(new Date(now - RECENT_WINDOW_MS).toISOString(), now)).toBe(false)
    expect(isRecent('not a date', now)).toBe(false)
  })
})

describe('viewer position', () => {
  it('opens at the first recent status, else the newest', () => {
    const list = [
      status('1', ANI, hoursAgo(40)),
      status('2', ANI, hoursAgo(20)),
      status('3', ANI, hoursAgo(2)),
    ]
    expect(initialStatusIndex(list, now)).toBe(1)
    expect(initialStatusIndex(list.slice(0, 1), now)).toBe(0)
    expect(initialStatusIndex([status('x', ANI, hoursAgo(90)), list[0]], now)).toBe(1)
    expect(initialStatusIndex([], now)).toBe(0)
  })

  it('clamps into range', () => {
    expect(clampIndex(-1, 3)).toBe(0)
    expect(clampIndex(5, 3)).toBe(2)
    expect(clampIndex(1, 3)).toBe(1)
    expect(clampIndex(4, 0)).toBe(0)
  })
})

describe('statusCursor', () => {
  const page = [
    status('n', ANI, hoursAgo(1)),
    status('o', ANI, hoursAgo(80)),
    status('m', BUDI, hoursAgo(5)),
  ]

  it('returns the oldest timestamp of a full page', () => {
    expect(statusCursor(page, undefined, 3)).toBe(hoursAgo(80))
  })

  it('stops on a partial page or a cursor that does not move', () => {
    expect(statusCursor(page, undefined, 4)).toBeUndefined()
    expect(statusCursor(page, hoursAgo(80), 3)).toBeUndefined()
  })
})

describe('labels and drafts', () => {
  it('counts statuses', () => {
    expect(statusCount(1)).toBe('1 status')
    expect(statusCount(12)).toBe('12 status')
  })

  it('explains what a draft still needs', () => {
    expect(draftProblem('text', '  ', null)).toMatch(/teks/)
    expect(draftProblem('text', 'Halo', null)).toBeNull()
    expect(draftProblem('image', '', null)).toMatch(/foto/)
    expect(draftProblem('video', '', null)).toMatch(/video/)
    expect(draftProblem('video', '', new File(['x'], 'a.mp4'))).toBeNull()
  })
})
