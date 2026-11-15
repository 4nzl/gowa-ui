import { olderCursor } from '@/features/chat/chat-format'
import { formatPhone } from '@/lib/phone'
import type { MessageInfo } from '@/api/chat'

/** The chat GOWA stores every received (and sometimes sent) status in. */
export const STATUS_JID = 'status@broadcast'

/** Statuses fetched per request, for the first page and each older page. */
export const STATUS_PAGE_SIZE = 100

/** A status counts as "Terbaru" for this long, like WhatsApp's 24-hour stories. */
export const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000

export interface StatusPoster {
  /** Sender JID without the device suffix, e.g. 628…@s.whatsapp.net or …@lid. */
  jid: string
  name: string
  /** Oldest first. */
  statuses: MessageInfo[]
  /** Timestamp of the newest status. */
  latest: string
  /** Whether the poster has a status inside the recent window. */
  recent: boolean
}

export interface StatusSections {
  recent: StatusPoster[]
  older: StatusPoster[]
}

function time(iso: string): number {
  const value = new Date(iso).getTime()
  return Number.isNaN(value) ? 0 : value
}

/** "628…:12@s.whatsapp.net" → "628…@s.whatsapp.net", so all of a poster's devices group together. */
export function posterJid(senderJid: string): string {
  const [user, server] = senderJid.split('@')
  if (server === undefined) return senderJid
  return `${user.split(':')[0]}@${server}`
}

/** Saved/push name, else the formatted number, else the raw JID. */
export function posterName(jid: string, displayName?: string | null): string {
  const name = displayName?.trim()
  if (name && name !== jid) return name
  return formatPhone(jid) ?? jid
}

export function isRecent(iso: string, now: number, windowMs = RECENT_WINDOW_MS): boolean {
  const value = time(iso)
  return value > 0 && now - value < windowMs
}

/**
 * Group statuses by poster. Each poster's statuses run oldest first; posters
 * are ordered by their newest status, newest first, and split into those with
 * a status in the recent window and the rest.
 */
export function groupStatuses(
  messages: readonly MessageInfo[],
  now: number = Date.now(),
): StatusSections {
  const byPoster = new Map<string, MessageInfo[]>()
  for (const message of messages) {
    const jid = posterJid(message.sender_jid || (message.is_from_me ? 'me' : 'unknown'))
    const list = byPoster.get(jid)
    if (list) list.push(message)
    else byPoster.set(jid, [message])
  }

  const posters: StatusPoster[] = []
  for (const [jid, list] of byPoster) {
    const unique = [...new Map(list.map((message) => [message.id, message])).values()]
    const statuses = unique.sort(
      (left, right) =>
        time(left.timestamp) - time(right.timestamp) || left.id.localeCompare(right.id),
    )
    const newest = statuses[statuses.length - 1]
    const named = [...statuses].reverse().find((message) => message.sender_display_name?.trim())
    posters.push({
      jid,
      name: posterName(jid, named?.sender_display_name),
      statuses,
      latest: newest.timestamp,
      recent: isRecent(newest.timestamp, now),
    })
  }
  posters.sort(
    (left, right) => time(right.latest) - time(left.latest) || left.jid.localeCompare(right.jid),
  )
  return {
    recent: posters.filter((poster) => poster.recent),
    older: posters.filter((poster) => !poster.recent),
  }
}

/**
 * Where the viewer opens: the first status inside the recent window, else the
 * newest one — a poster with months of stored statuses should not start at the oldest.
 */
export function initialStatusIndex(statuses: readonly MessageInfo[], now: number = Date.now()) {
  if (statuses.length === 0) return 0
  const firstRecent = statuses.findIndex((message) => isRecent(message.timestamp, now))
  return firstRecent === -1 ? statuses.length - 1 : firstRecent
}

/** Clamp a viewer position into range after the list changed. */
export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.min(Math.max(index, 0), length - 1)
}

/**
 * end_time cursor for the page before `page`, or undefined when `page` was
 * the last one or would not move the cursor (GOWA's end_time is inclusive).
 */
export function statusCursor(
  page: readonly MessageInfo[],
  previousCursor?: string,
  pageSize: number = STATUS_PAGE_SIZE,
): string | undefined {
  const cursor = olderCursor(page, pageSize)
  return cursor && cursor !== previousCursor ? cursor : undefined
}

/** "12 status" — Indonesian has no plural form. */
export function statusCount(count: number): string {
  return `${count} status`
}

export type StatusKind = 'text' | 'image' | 'video'

export const STATUS_KIND_LABELS: Record<StatusKind, string> = {
  text: 'Teks',
  image: 'Foto',
  video: 'Video',
}

/** A message for the user when the draft cannot be published yet, else null. */
export function draftProblem(kind: StatusKind, text: string, file: File | null): string | null {
  if (kind === 'text') return text.trim() ? null : 'Tulis teks status terlebih dahulu.'
  return file ? null : `Pilih ${kind === 'image' ? 'foto' : 'video'} terlebih dahulu.`
}
