import type { GroupParticipant, MyGroup, ParticipantStatus } from '@/api/group'
import { formatPhone } from '@/lib/phone'

/** Strip the @server suffix from a JID for compact display. */
export function shortId(jid: string): string {
  return jid.split('@')[0]
}

/** Split free text into a trimmed list, one entry per line or comma. */
export function parseList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function groupTitle(group: Pick<MyGroup, 'JID' | 'Name'>): string {
  return group.Name?.trim() || shortId(group.JID)
}

export function groupParticipantCount(
  group: Pick<MyGroup, 'Participants' | 'ParticipantCount'>,
): number {
  return group.Participants?.length || group.ParticipantCount || 0
}

export function groupSubtitle(group: Pick<MyGroup, 'Participants' | 'ParticipantCount'>): string {
  return `${groupParticipantCount(group)} anggota`
}

const collator = new Intl.Collator('id', { sensitivity: 'base', numeric: true })

/** Groups whose name or JID contains the search term, sorted by name. */
export function filterGroups<T extends Pick<MyGroup, 'JID' | 'Name'>>(
  groups: readonly T[],
  search: string,
): T[] {
  const term = search.trim().toLowerCase()
  const matches = term
    ? groups.filter(
        (group) =>
          (group.Name ?? '').toLowerCase().includes(term) || group.JID.toLowerCase().includes(term),
      )
    : [...groups]
  return matches.sort(
    (left, right) =>
      collator.compare(groupTitle(left), groupTitle(right)) || left.JID.localeCompare(right.JID),
  )
}

export interface GroupSelection {
  deviceId: string
  jid: string
}

/** A selection made under another device does not carry over to this one. */
export function selectedGroupJid(
  selection: GroupSelection | null,
  deviceId: string | null,
): string | null {
  return selection && selection.deviceId === deviceId ? selection.jid : null
}

/** The identifier GOWA accepts for participant actions. */
export function participantId(participant: Pick<GroupParticipant, 'phone_number' | 'jid'>): string {
  return participant.phone_number || participant.jid
}

export function participantName(
  participant: Pick<GroupParticipant, 'display_name' | 'phone_number' | 'jid'>,
): string {
  return (
    participant.display_name?.trim() ||
    formatPhone(participant.phone_number) ||
    formatPhone(participant.jid) ||
    participant.phone_number ||
    participant.jid
  )
}

export type ParticipantRole = 'owner' | 'admin' | 'member'

export function participantRole(
  participant: Pick<GroupParticipant, 'is_admin' | 'is_super_admin'>,
): ParticipantRole {
  if (participant.is_super_admin) return 'owner'
  if (participant.is_admin) return 'admin'
  return 'member'
}

export const roleLabels: Record<ParticipantRole, string> = {
  owner: 'Pemilik grup',
  admin: 'Admin',
  member: 'Anggota',
}

const ROLE_ORDER: Record<ParticipantRole, number> = { owner: 0, admin: 1, member: 2 }

/** Members matching the search, owner first, then admins, then by name. */
export function filterParticipants<T extends GroupParticipant>(
  participants: readonly T[],
  search: string,
): T[] {
  const term = search.trim().toLowerCase()
  const raw = term.replace(/[^\d]/g, '')
  // Local "08…" numbers are stored internationally as "628…".
  const digits = raw.startsWith('0') ? `62${raw.slice(1)}` : raw
  const matches = term
    ? participants.filter(
        (participant) =>
          participantName(participant).toLowerCase().includes(term) ||
          participant.jid.toLowerCase().includes(term) ||
          (digits.length > 0 && (participant.phone_number ?? '').includes(digits)),
      )
    : [...participants]
  return matches.sort(
    (left, right) =>
      ROLE_ORDER[participantRole(left)] - ROLE_ORDER[participantRole(right)] ||
      collator.compare(participantName(left), participantName(right)),
  )
}

export function participantsCsvName(groupJid: string): string {
  return `${shortId(groupJid)}-anggota.csv`
}

const DAY_SECONDS = 86_400
const HOUR_SECONDS = 3_600

/** WhatsApp offers 24h / 7d / 90d, but render whatever the API reports. */
export function formatTimer(seconds: number): string {
  if (seconds >= DAY_SECONDS) return `${Math.round(seconds / DAY_SECONDS)} hari`
  if (seconds >= HOUR_SECONDS) return `${Math.round(seconds / HOUR_SECONDS)} jam`
  return `${seconds} detik`
}

export function memberAddLabel(mode: string | undefined): string {
  if (mode === 'admin_add') return 'Hanya admin'
  if (mode === 'all_member_add') return 'Semua anggota'
  return mode || 'Tidak diketahui'
}

export function addressingLabel(mode: string | undefined): string {
  if (mode === 'lid') return 'LID'
  if (mode === 'pn') return 'Nomor telepon'
  return mode || 'Bawaan'
}

/** GOWA reports per-participant results ("success" / "error"); keep the failures. */
export function failedStatuses(
  statuses: readonly ParticipantStatus[] | null | undefined,
): ParticipantStatus[] {
  return (statuses ?? []).filter((status) => !!status.status && status.status !== 'success')
}
