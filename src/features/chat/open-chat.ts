import type { ChatInfo } from '@/api/chat'

/** Router state that makes /chats open a conversation on arrival. */
export interface OpenChatState {
  openChat: { jid: string; name?: string }
}

/** `navigate('/chats', { state: openChatState(jid, name) })` opens that chat. */
export function openChatState(jid: string, name = ''): OpenChatState {
  return { openChat: { jid, name } }
}

export function readOpenChat(state: unknown): OpenChatState['openChat'] | null {
  const candidate = (state as Partial<OpenChatState> | null)?.openChat
  return candidate && typeof candidate.jid === 'string' && candidate.jid ? candidate : null
}

/** Minimal ChatInfo for a chat opened by JID; the thread refreshes it from chat_info. */
export function placeholderChat(jid: string, name = ''): ChatInfo {
  return {
    jid,
    name,
    last_message_time: '',
    ephemeral_expiration: 0,
    created_at: '',
    updated_at: '',
    archived: false,
  }
}
