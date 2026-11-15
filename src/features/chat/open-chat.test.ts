import { describe, expect, it } from 'vitest'
import { openChatState, placeholderChat, readOpenChat } from '@/features/chat/open-chat'

describe('open chat deep link', () => {
  it('round-trips through router state', () => {
    expect(readOpenChat(openChatState('628@s.whatsapp.net', 'Kevin'))).toEqual({
      jid: '628@s.whatsapp.net',
      name: 'Kevin',
    })
  })

  it('ignores unrelated or empty state', () => {
    expect(readOpenChat(null)).toBeNull()
    expect(readOpenChat({ other: 1 })).toBeNull()
    expect(readOpenChat({ openChat: { jid: '' } })).toBeNull()
  })

  it('builds a placeholder chat', () => {
    expect(placeholderChat('x@g.us').jid).toBe('x@g.us')
  })
})
