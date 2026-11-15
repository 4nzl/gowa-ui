import type { ChatInfo, MessageInfo } from '@/api/chat'
import { dayLabel } from '@/features/chat/chat-format'

/** Newest chats scanned per refresh; GOWA has no call-history endpoint. */
export const CALL_SCAN_CHATS = 40
/** Parallel per-chat message requests while scanning. */
export const CALL_SCAN_CONCURRENCY = 3
/** Calls fetched per chat (the newest matches of the "Incoming call" search). */
export const CALL_SCAN_PER_CHAT = 20
/** Text GOWA stores as the content of a synthetic call message. */
export const CALL_SEARCH_TEXT = 'Incoming call'

/** The API returns call_metadata, which MessageInfo does not declare yet. */
export type CallMessage = MessageInfo & { call_metadata?: unknown }

export interface CallMetadata {
  callId: string
  autoRejected: boolean
  remotePlatform?: string
  remoteVersion?: string
  groupJid?: string
}

export interface CallRecord {
  /** Unique across chats: `<chat JID>|<message id>`. */
  key: string
  messageId: string
  chatJid: string
  chatName: string
  senderJid: string
  timestamp: string
  callId: string
  autoRejected: boolean
  remotePlatform?: string
  remoteVersion?: string
  groupJid?: string
}

function text(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

/**
 * call_metadata as GOWA stores it: a JSON string such as
 * {"call_id":"…","auto_rejected":true,"remote_platform":"android"}. Accepts an
 * already-parsed object too; anything unreadable yields null.
 */
export function parseCallMetadata(raw: unknown): CallMetadata | null {
  let value: unknown = raw
  if (typeof raw === 'string') {
    if (!raw.trim()) return null
    try {
      value = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const autoRejected = record.auto_rejected
  return {
    callId: text(record.call_id) ?? '',
    autoRejected: autoRejected === true || autoRejected === 'true',
    remotePlatform: text(record.remote_platform),
    remoteVersion: text(record.remote_version),
    groupJid: text(record.group_jid),
  }
}

export function isCallMessage(message: Pick<MessageInfo, 'media_type'>): boolean {
  return message.media_type === 'call'
}

/** Call ID from metadata, else from the synthetic message id "call:<CallID>". */
function callIdFrom(message: CallMessage, metadata: CallMetadata | null): string {
  if (metadata?.callId) return metadata.callId
  return message.id.startsWith('call:') ? message.id.slice('call:'.length) : ''
}

/** Call records from one chat's messages; non-call messages are skipped. */
export function callsFromMessages(
  chat: Pick<ChatInfo, 'jid' | 'name'>,
  messages: readonly CallMessage[],
): CallRecord[] {
  return messages.filter(isCallMessage).map((message) => {
    const metadata = parseCallMetadata(message.call_metadata)
    const chatJid = message.chat_jid || chat.jid
    return {
      key: `${chatJid}|${message.id}`,
      messageId: message.id,
      chatJid,
      chatName: chat.name ?? '',
      senderJid: message.sender_jid || chatJid,
      timestamp: message.timestamp,
      callId: callIdFrom(message, metadata),
      autoRejected: metadata?.autoRejected ?? false,
      remotePlatform: metadata?.remotePlatform,
      remoteVersion: metadata?.remoteVersion,
      groupJid: metadata?.groupJid,
    }
  })
}

function millis(iso: string): number {
  const value = new Date(iso).getTime()
  return Number.isNaN(value) ? 0 : value
}

/** Newest first; ties keep a stable order by key. */
export function sortCalls(calls: readonly CallRecord[]): CallRecord[] {
  return [...calls].sort(
    (left, right) =>
      millis(right.timestamp) - millis(left.timestamp) || left.key.localeCompare(right.key),
  )
}

/** Union of per-chat scan results without duplicates (later copies win), newest first. */
export function mergeCallResults(...batches: readonly (readonly CallRecord[])[]): CallRecord[] {
  const byKey = new Map<string, CallRecord>()
  for (const batch of batches) for (const call of batch) byKey.set(call.key, call)
  return sortCalls([...byKey.values()])
}

export interface CallDayGroup {
  label: string
  calls: CallRecord[]
}

/** Consecutive day sections ("Hari ini", "Kemarin", "2 November 2026") of sorted calls. */
export function groupCallsByDay(calls: readonly CallRecord[], now = new Date()): CallDayGroup[] {
  const groups: CallDayGroup[] = []
  for (const call of sortCalls(calls)) {
    const label = dayLabel(call.timestamp, now) || 'Tanpa tanggal'
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.calls.push(call)
    else groups.push({ label, calls: [call] })
  }
  return groups
}

export function callStatusLabel(call: Pick<CallRecord, 'autoRejected'>): string {
  return call.autoRejected ? 'Ditolak otomatis' : 'Panggilan masuk'
}

/** "Android · 2.24.1" from whichever of platform/version GOWA recorded. */
export function callPlatformLabel(
  call: Pick<CallRecord, 'remotePlatform' | 'remoteVersion'>,
): string {
  return [call.remotePlatform, call.remoteVersion].filter(Boolean).join(' · ')
}

export interface ScanProgress {
  done: number
  total: number
}

/**
 * Runs `scanChat` over `chats` with at most `concurrency` requests in flight,
 * reporting progress after each chat. Stops starting new chats once
 * `isCancelled` returns true and then throws, so a stale scan never resolves.
 * A failing chat is counted as scanned and skipped; the scan only fails when
 * every chat failed.
 */
export async function scanChatsForCalls(
  chats: readonly Pick<ChatInfo, 'jid' | 'name'>[],
  scanChat: (chat: Pick<ChatInfo, 'jid' | 'name'>) => Promise<CallRecord[]>,
  options: {
    concurrency?: number
    onProgress?: (progress: ScanProgress) => void
    isCancelled?: () => boolean
  } = {},
): Promise<{ calls: CallRecord[]; scanned: number; failed: number }> {
  const concurrency = Math.max(1, options.concurrency ?? CALL_SCAN_CONCURRENCY)
  const cancelled = options.isCancelled ?? (() => false)
  const results: CallRecord[][] = []
  let next = 0
  let done = 0
  let failed = 0
  let firstError: unknown
  options.onProgress?.({ done, total: chats.length })

  const worker = async () => {
    while (next < chats.length) {
      if (cancelled()) return
      const chat = chats[next++]
      try {
        results.push(await scanChat(chat))
      } catch (error) {
        failed++
        firstError ??= error
      }
      if (cancelled()) return
      done++
      options.onProgress?.({ done, total: chats.length })
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, chats.length) }, worker))
  if (cancelled()) throw new DOMException('Pemindaian panggilan dibatalkan', 'AbortError')
  if (chats.length > 0 && failed === chats.length) throw firstError
  return { calls: mergeCallResults(...results), scanned: done, failed }
}
