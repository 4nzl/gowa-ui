import { describe, expect, it } from 'vitest'
import {
  callPlatformLabel,
  callStatusLabel,
  callsFromMessages,
  groupCallsByDay,
  mergeCallResults,
  parseCallMetadata,
  scanChatsForCalls,
  sortCalls,
  type CallMessage,
  type CallRecord,
} from '@/features/call/call-history'

function message(overrides: Partial<CallMessage>): CallMessage {
  return {
    id: 'call:ABC',
    chat_jid: '6281@s.whatsapp.net',
    sender_jid: '6281@s.whatsapp.net',
    content: 'Incoming call',
    timestamp: '2026-11-15T08:00:00Z',
    is_from_me: false,
    media_type: 'call',
    filename: '',
    url: '',
    file_length: 0,
    ...overrides,
  }
}

function call(key: string, timestamp: string): CallRecord {
  return {
    key,
    messageId: key,
    chatJid: 'x@s.whatsapp.net',
    chatName: '',
    senderJid: 'x@s.whatsapp.net',
    timestamp,
    callId: key,
    autoRejected: false,
  }
}

describe('parseCallMetadata', () => {
  it('reads the JSON string GOWA stores', () => {
    expect(
      parseCallMetadata(
        '{"call_id":"C1","auto_rejected":true,"remote_platform":"android","remote_version":"2.24.1","group_jid":"123@g.us"}',
      ),
    ).toEqual({
      callId: 'C1',
      autoRejected: true,
      remotePlatform: 'android',
      remoteVersion: '2.24.1',
      groupJid: '123@g.us',
    })
  })

  it('accepts an object and drops blank optional fields', () => {
    expect(
      parseCallMetadata({ call_id: 'C2', auto_rejected: false, remote_platform: ' ' }),
    ).toEqual({
      callId: 'C2',
      autoRejected: false,
      remotePlatform: undefined,
      remoteVersion: undefined,
      groupJid: undefined,
    })
  })

  it('returns null for missing or malformed metadata', () => {
    expect(parseCallMetadata(undefined)).toBeNull()
    expect(parseCallMetadata('')).toBeNull()
    expect(parseCallMetadata('{not json')).toBeNull()
    expect(parseCallMetadata('[1]')).toBeNull()
    expect(parseCallMetadata('"text"')).toBeNull()
  })
})

describe('callsFromMessages', () => {
  const chat = { jid: '6281@s.whatsapp.net', name: 'Budi' }

  it('keeps only call messages and maps metadata', () => {
    const calls = callsFromMessages(chat, [
      message({ call_metadata: '{"call_id":"ABC","auto_rejected":true}' }),
      message({ id: 'm1', media_type: '', content: 'Incoming call?' }),
    ])
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      key: '6281@s.whatsapp.net|call:ABC',
      chatName: 'Budi',
      callId: 'ABC',
      autoRejected: true,
    })
  })

  it('falls back to the call ID in the message id', () => {
    const [record] = callsFromMessages(chat, [message({ id: 'call:XYZ', chat_jid: '' })])
    expect(record.callId).toBe('XYZ')
    expect(record.chatJid).toBe(chat.jid)
    expect(record.autoRejected).toBe(false)
  })
})

describe('sorting, merging and grouping', () => {
  it('sorts newest first', () => {
    const sorted = sortCalls([call('a', '2026-11-14T10:00:00Z'), call('b', '2026-11-15T10:00:00Z')])
    expect(sorted.map((item) => item.key)).toEqual(['b', 'a'])
  })

  it('merges batches without duplicates, later copies winning', () => {
    const merged = mergeCallResults(
      [call('a', '2026-11-14T10:00:00Z')],
      [
        { ...call('a', '2026-11-14T10:00:00Z'), autoRejected: true },
        call('b', '2026-11-15T09:00:00Z'),
      ],
    )
    expect(merged.map((item) => item.key)).toEqual(['b', 'a'])
    expect(merged[1].autoRejected).toBe(true)
  })

  it('groups by day label', () => {
    const now = new Date(2026, 10, 15, 12)
    const groups = groupCallsByDay(
      [
        call('old', new Date(2026, 10, 2, 9).toISOString()),
        call('today1', new Date(2026, 10, 15, 8).toISOString()),
        call('yesterday', new Date(2026, 10, 14, 20).toISOString()),
        call('today2', new Date(2026, 10, 15, 10).toISOString()),
      ],
      now,
    )
    expect(groups.map((group) => group.label)).toEqual(['Hari ini', 'Kemarin', '2 November 2026'])
    expect(groups[0].calls.map((item) => item.key)).toEqual(['today2', 'today1'])
  })

  it('labels status and platform', () => {
    expect(callStatusLabel({ autoRejected: true })).toBe('Ditolak otomatis')
    expect(callStatusLabel({ autoRejected: false })).toBe('Panggilan masuk')
    expect(callPlatformLabel({ remotePlatform: 'android', remoteVersion: '2.1' })).toBe(
      'android · 2.1',
    )
    expect(callPlatformLabel({})).toBe('')
  })
})

describe('scanChatsForCalls', () => {
  const chats = Array.from({ length: 7 }, (_, index) => ({ jid: `c${index}`, name: '' }))

  it('limits concurrency, reports progress and merges results', async () => {
    let active = 0
    let peak = 0
    const progress: number[] = []
    const result = await scanChatsForCalls(
      chats,
      async (chat) => {
        active++
        peak = Math.max(peak, active)
        await new Promise((resolve) => setTimeout(resolve, 1))
        active--
        return chat.jid === 'c2' ? [call('x', '2026-11-15T10:00:00Z')] : []
      },
      { concurrency: 3, onProgress: ({ done }) => progress.push(done) },
    )
    expect(peak).toBe(3)
    expect(progress).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(result).toMatchObject({ scanned: 7, failed: 0 })
    expect(result.calls.map((item) => item.key)).toEqual(['x'])
  })

  it('skips failing chats but fails when every chat fails', async () => {
    const partial = await scanChatsForCalls(chats, async (chat) => {
      if (chat.jid === 'c1') throw new Error('boom')
      return []
    })
    expect(partial.failed).toBe(1)
    await expect(
      scanChatsForCalls(chats.slice(0, 2), async () => {
        throw new Error('down')
      }),
    ).rejects.toThrow('down')
  })

  it('stops and rejects once cancelled', async () => {
    let started = 0
    let cancelled = false
    const scan = scanChatsForCalls(
      chats,
      async () => {
        started++
        cancelled = true
        return [call('late', '2026-11-15T10:00:00Z')]
      },
      { concurrency: 1, isCancelled: () => cancelled },
    )
    await expect(scan).rejects.toThrow('dibatalkan')
    expect(started).toBe(1)
  })

  it('resolves empty for no chats', async () => {
    await expect(scanChatsForCalls([], async () => [])).resolves.toEqual({
      calls: [],
      scanned: 0,
      failed: 0,
    })
  })
})
