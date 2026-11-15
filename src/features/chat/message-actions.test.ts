import { describe, expect, it } from 'vitest'
import {
  EDIT_WINDOW_MS,
  REVOKE_WINDOW_MS,
  canEdit,
  canMarkPlayed,
  canMarkRead,
  canReact,
  canRevoke,
  myReaction,
} from '@/features/chat/message-actions'
import type { MessageInfo } from '@/api/chat'

const now = Date.UTC(2026, 10, 15, 8, 0)
const msg = (patch: Partial<MessageInfo>): MessageInfo =>
  ({
    id: 'm',
    chat_jid: 'c',
    sender_jid: 's',
    content: 'halo',
    timestamp: new Date(now - 60_000).toISOString(),
    is_from_me: true,
    media_type: '',
    reactions: [],
    ...patch,
  }) as MessageInfo

const ago = (ms: number) => new Date(now - ms).toISOString()

describe('message action rules', () => {
  it('edits only own text messages inside the edit window', () => {
    expect(canEdit(msg({}), now)).toBe(true)
    expect(canEdit(msg({ timestamp: ago(EDIT_WINDOW_MS + 1) }), now)).toBe(false)
    expect(canEdit(msg({ is_from_me: false }), now)).toBe(false)
    expect(canEdit(msg({ media_type: 'image' }), now)).toBe(false)
    expect(canEdit(msg({ content: '  ' }), now)).toBe(false)
  })

  it('revokes only own messages inside the delete-for-everyone window', () => {
    expect(canRevoke(msg({ media_type: 'image' }), now)).toBe(true)
    expect(canRevoke(msg({ timestamp: ago(REVOKE_WINDOW_MS + 1) }), now)).toBe(false)
    expect(canRevoke(msg({ is_from_me: false }), now)).toBe(false)
    expect(canRevoke(msg({ media_type: 'call' }), now)).toBe(false)
  })

  it('limits receipts and reactions to fitting messages', () => {
    expect(canMarkRead(msg({ is_from_me: false }))).toBe(true)
    expect(canMarkRead(msg({}))).toBe(false)
    expect(canMarkPlayed(msg({ is_from_me: false, media_type: 'ptt' }))).toBe(true)
    expect(canMarkPlayed(msg({ is_from_me: false, media_type: 'image' }))).toBe(false)
    expect(canReact(msg({ media_type: 'call' }))).toBe(false)
  })

  it('finds this device reaction', () => {
    expect(myReaction(msg({}))).toBeNull()
    expect(
      myReaction(
        msg({
          reactions: [
            { emoji: '😂', sender_jid: 'x', is_from_me: false, timestamp: '' },
            { emoji: '👍', sender_jid: 'me', is_from_me: true, timestamp: '' },
          ],
        }),
      ),
    ).toBe('👍')
  })
})
