import { describe, expect, it } from 'vitest'
import {
  baselineFor,
  changedChats,
  incomingAfter,
  isWatchable,
  titleWithCount,
  totalFresh,
  trimSeen,
} from '@/features/notify/notify-logic'
import type { ChatInfo, MessageInfo } from '@/api/chat'

const chat = (jid: string, last: string): ChatInfo =>
  ({ jid, name: jid, last_message_time: last }) as ChatInfo
const msg = (id: string, at: string, mine = false): MessageInfo =>
  ({ id, timestamp: at, is_from_me: mine }) as MessageInfo

const T0 = '2026-11-15T10:00:00Z'
const T1 = '2026-11-15T10:05:00Z'
const T2 = '2026-11-15T10:06:00Z'

describe('notify logic', () => {
  it('ignores channels and status updates', () => {
    expect(isWatchable('628@s.whatsapp.net')).toBe(true)
    expect(isWatchable('1203@g.us')).toBe(true)
    expect(isWatchable('status@broadcast')).toBe(false)
    expect(isWatchable('1203@newsletter')).toBe(false)
  })

  it('treats existing history as seen at baseline', () => {
    const watch = baselineFor([chat('a', T0)], T0)
    expect(changedChats([chat('a', T0)], watch)).toEqual([])
  })

  it('finds chats with newer messages and chats that appeared after the baseline', () => {
    const watch = baselineFor([chat('a', T0)], T0)
    const changed = changedChats(
      [chat('a', T1), chat('b', T2), chat('status@broadcast', T2)],
      watch,
    )
    expect(changed.map((item) => [item.chat.jid, item.since])).toEqual([
      ['a', T0],
      ['b', T0],
    ])
  })

  it('counts only incoming messages strictly after the cursor', () => {
    const result = incomingAfter([msg('old', T0), msg('mine', T1, true), msg('new', T2)], T0)
    expect(result.map((message) => message.id)).toEqual(['new'])
  })

  it('sums fresh counts and formats the tab title', () => {
    expect(
      totalFresh({
        baselineAt: T0,
        seen: {},
        fresh: { a: { count: 2, title: 'A', at: T1 }, b: { count: 1, title: 'B', at: T2 } },
      }),
    ).toBe(3)
    expect(totalFresh(undefined)).toBe(0)
    expect(titleWithCount('GOWA', 0)).toBe('GOWA')
    expect(titleWithCount('GOWA', 3)).toBe('(3) GOWA')
    expect(titleWithCount('GOWA', 150)).toBe('(99+) GOWA')
  })

  it('bounds the seen map keeping the most recent chats', () => {
    const seen = { a: T0, b: T1, c: T2 }
    expect(Object.keys(trimSeen(seen, 2)).sort()).toEqual(['b', 'c'])
  })
})
