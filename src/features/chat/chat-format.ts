import { formatPhone } from '@/lib/phone'
import type { ChatInfo, MessageInfo } from '@/api/chat'

export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us')
}

/** Second line of a chat row: the formatted number, or what kind of chat it is. */
export function chatSubtitle(chat: Pick<ChatInfo, 'jid'>): string {
  if (isGroupJid(chat.jid)) return 'Grup'
  if (chat.jid.endsWith('@newsletter')) return 'Saluran'
  if (chat.jid === 'status@broadcast') return 'Status'
  if (chat.jid.endsWith('@lid')) return 'Kontak (LID)'
  return formatPhone(chat.jid) ?? chat.jid
}

/** Chat title: the saved/push name, else the formatted number, else the raw JID. */
export function chatTitle(chat: Pick<ChatInfo, 'jid' | 'name'>): string {
  const name = chat.name?.trim()
  if (name && name !== chat.jid) return name
  if (chat.jid === 'status@broadcast') return 'Status'
  return formatPhone(chat.jid) ?? chat.jid
}

/** Second line under a chat title; empty when the title already is the number. */
export function chatCaption(chat: Pick<ChatInfo, 'jid' | 'name'>): string {
  const subtitle = chatSubtitle(chat)
  if (subtitle !== chatTitle(chat)) return subtitle
  // Only a plain number earns this caption; "Status", groups and channels keep their kind.
  return formatPhone(chat.jid) === subtitle ? 'Nomor belum bernama' : ''
}

const MEDIA_LABELS: Record<string, string> = {
  image: 'Foto',
  video: 'Video',
  ptv: 'Video',
  audio: 'Audio',
  ptt: 'Pesan suara',
  document: 'Dokumen',
  sticker: 'Stiker',
  contact: 'Kontak',
  location: 'Lokasi',
  call: 'Panggilan',
}

/** Text standing in for a message in quotes and previews. */
export function messageSummary(
  message: Pick<MessageInfo, 'content' | 'media_type' | 'filename'>,
): string {
  if (message.content?.trim()) return message.content
  if (message.media_type === 'document' && message.filename) return `📄 ${message.filename}`
  return MEDIA_LABELS[message.media_type] ?? (message.media_type || 'Pesan')
}

/** Stable 0–5 tone so a contact keeps its avatar colour across renders and reloads. */
export function avatarTone(seed: string): number {
  let hash = 0
  for (let index = 0; index < seed.length; index++) hash = (hash * 31 + seed.charCodeAt(index)) | 0
  return Math.abs(hash) % 6
}

const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('id-ID', { weekday: 'long' })
const shortDate = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const longDate = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function daysAgo(date: Date, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
}

function parse(iso: string): Date | null {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) || date.getTime() <= 0 ? null : date
}

/** "14.05", "Kemarin", "Senin" or "02/11/2026", like the WhatsApp chat list. */
export function formatChatTime(iso: string, now = new Date()): string {
  const date = parse(iso)
  if (!date) return ''
  const days = daysAgo(date, now)
  if (days <= 0) return time.format(date)
  if (days === 1) return 'Kemarin'
  if (days < 7) return weekday.format(date)
  return shortDate.format(date)
}

/** Time inside a bubble ("14.05"). */
export function formatBubbleTime(iso: string): string {
  const date = parse(iso)
  return date ? time.format(date) : ''
}

/** Day separator in a thread: "Hari ini", "Kemarin" or "2 November 2026". */
export function dayLabel(iso: string, now = new Date()): string {
  const date = parse(iso)
  if (!date) return ''
  const days = daysAgo(date, now)
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Kemarin'
  return longDate.format(date)
}

export function sameDay(left: string, right: string): boolean {
  const a = parse(left)
  const b = parse(right)
  return a !== null && b !== null && startOfDay(a) === startOfDay(b)
}

/** Union of message pages, oldest first, without duplicates (later copies win). */
export function mergeMessages(...pages: readonly (readonly MessageInfo[])[]): MessageInfo[] {
  const byId = new Map<string, MessageInfo>()
  for (const page of pages) for (const message of page) byId.set(message.id, message)
  return [...byId.values()].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime() ||
      left.id.localeCompare(right.id),
  )
}

/**
 * Cursor for the next older page: the oldest timestamp in `page`. GOWA's
 * end_time is inclusive, so the boundary message comes back again and is
 * deduplicated by mergeMessages.
 */
export function olderCursor(page: readonly MessageInfo[], pageSize: number): string | undefined {
  if (page.length < pageSize) return undefined
  let oldest: MessageInfo | undefined
  for (const message of page) {
    if (!oldest || new Date(message.timestamp) < new Date(oldest.timestamp)) oldest = message
  }
  return oldest?.timestamp
}

/** Images and stickers up to this size load on sight; larger media waits for a tap. */
export const AUTO_LOAD_MAX_BYTES = 5 * 1024 * 1024

export function autoLoads(message: Pick<MessageInfo, 'media_type' | 'file_length'>): boolean {
  const visual = message.media_type === 'image' || message.media_type === 'sticker'
  return visual && (!message.file_length || message.file_length <= AUTO_LOAD_MAX_BYTES)
}
