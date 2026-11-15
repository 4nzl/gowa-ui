import type { ChatInfo, MessageInfo } from '@/api/chat'

/**
 * In-app "new message" tracking. GOWA has no message events over the WebSocket
 * and stores no read state, so the dashboard polls the chat list and compares
 * each chat's last_message_time with what this browser last saw. "Baru" means
 * new since this browser last opened the chat, not WhatsApp's unread state.
 */

export interface FreshChat {
  count: number
  title: string
  /** Newest incoming message time counted so far. */
  at: string
}

export interface DeviceWatch {
  /** When this browser started watching the device; chats first seen later count from here. */
  baselineAt: string
  /** Per chat: the last_message_time already accounted for. */
  seen: Record<string, string>
  fresh: Record<string, FreshChat>
}

/** Channels, status updates and broadcast lists never raise a notification. */
export function isWatchable(jid: string): boolean {
  return !jid.endsWith('@newsletter') && !jid.endsWith('@broadcast')
}

function time(iso: string | undefined): number {
  const value = iso ? new Date(iso).getTime() : Number.NaN
  return Number.isNaN(value) ? 0 : value
}

export function baselineFor(chats: readonly ChatInfo[], now: string): DeviceWatch {
  const seen: Record<string, string> = {}
  for (const chat of chats) if (chat.last_message_time) seen[chat.jid] = chat.last_message_time
  return { baselineAt: now, seen, fresh: {} }
}

/** Chats whose last message is newer than what was accounted for, with the time to count from. */
export function changedChats(
  chats: readonly ChatInfo[],
  watch: DeviceWatch,
): { chat: ChatInfo; since: string }[] {
  const out: { chat: ChatInfo; since: string }[] = []
  for (const chat of chats) {
    if (!isWatchable(chat.jid)) continue
    const since = watch.seen[chat.jid] ?? watch.baselineAt
    if (time(chat.last_message_time) > time(since)) out.push({ chat, since })
  }
  return out
}

/** Incoming messages strictly after `since` (start_time is inclusive on the server). */
export function incomingAfter(messages: readonly MessageInfo[], since: string): MessageInfo[] {
  const from = time(since)
  return messages
    .filter((message) => !message.is_from_me && time(message.timestamp) > from)
    .sort((left, right) => time(left.timestamp) - time(right.timestamp))
}

export function totalFresh(watch: DeviceWatch | undefined): number {
  if (!watch) return 0
  return Object.values(watch.fresh).reduce((sum, chat) => sum + chat.count, 0)
}

/** Keeps the seen map bounded: most recent entries win. */
export function trimSeen(seen: Record<string, string>, limit = 500): Record<string, string> {
  const entries = Object.entries(seen)
  if (entries.length <= limit) return seen
  return Object.fromEntries(entries.sort((a, b) => time(b[1]) - time(a[1])).slice(0, limit))
}

export function titleWithCount(base: string, count: number): string {
  return count > 0 ? `(${count > 99 ? '99+' : count}) ${base}` : base
}
