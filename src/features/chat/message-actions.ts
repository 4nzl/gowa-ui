import type { MessageInfo } from '@/api/chat'

/** WhatsApp lets senders edit a message for 15 minutes; GOWA itself does not check. */
export const EDIT_WINDOW_MS = 15 * 60_000
/** WhatsApp's "delete for everyone" window (about 2.5 days); GOWA itself does not check. */
export const REVOKE_WINDOW_MS = 60 * 60 * 60_000

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const

function age(message: Pick<MessageInfo, 'timestamp'>, now: number): number {
  const sent = new Date(message.timestamp).getTime()
  return Number.isNaN(sent) ? Number.POSITIVE_INFINITY : now - sent
}

function isRealMessage(message: Pick<MessageInfo, 'media_type'>): boolean {
  return message.media_type !== 'call'
}

/** Own text messages, inside WhatsApp's edit window. */
export function canEdit(
  message: Pick<MessageInfo, 'is_from_me' | 'media_type' | 'content' | 'timestamp'>,
  now = Date.now(),
): boolean {
  return (
    message.is_from_me &&
    !message.media_type &&
    Boolean(message.content?.trim()) &&
    age(message, now) <= EDIT_WINDOW_MS
  )
}

/** Own messages, inside WhatsApp's delete-for-everyone window. */
export function canRevoke(
  message: Pick<MessageInfo, 'is_from_me' | 'media_type' | 'timestamp'>,
  now = Date.now(),
): boolean {
  return message.is_from_me && isRealMessage(message) && age(message, now) <= REVOKE_WINDOW_MS
}

export function canReact(message: Pick<MessageInfo, 'media_type'>): boolean {
  return isRealMessage(message)
}

/** Read receipts only make sense for messages someone else sent. */
export function canMarkRead(message: Pick<MessageInfo, 'is_from_me' | 'media_type'>): boolean {
  return !message.is_from_me && isRealMessage(message)
}

export function canMarkPlayed(message: Pick<MessageInfo, 'is_from_me' | 'media_type'>): boolean {
  return !message.is_from_me && (message.media_type === 'ptt' || message.media_type === 'audio')
}

/** The emoji this device reacted with, if any. */
export function myReaction(message: Pick<MessageInfo, 'reactions'>): string | null {
  return message.reactions?.find((reaction) => reaction.is_from_me)?.emoji || null
}
