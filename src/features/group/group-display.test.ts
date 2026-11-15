import { describe, expect, it } from 'vitest'
import {
  failedStatuses,
  filterGroups,
  filterParticipants,
  formatTimer,
  groupParticipantCount,
  groupTitle,
  memberAddLabel,
  parseList,
  participantId,
  participantName,
  participantRole,
  participantsCsvName,
  selectedGroupJid,
} from '@/features/group/group-display'
import type { GroupParticipant } from '@/api/group'

const group = (JID: string, Name: string) => ({ JID, Name })

describe('groups list helpers', () => {
  const groups = [
    group('3@g.us', 'zebra'),
    group('1@g.us', 'Alpha Team'),
    group('2@g.us', ''),
    group('4@g.us', 'alpha'),
  ]

  it('sorts by name without regard to case, unnamed groups by their ID', () => {
    expect(filterGroups(groups, '').map((item) => item.JID)).toEqual([
      '2@g.us',
      '4@g.us',
      '1@g.us',
      '3@g.us',
    ])
  })

  it('filters by name or JID and does not mutate the input', () => {
    expect(filterGroups(groups, ' ALPHA ').map((item) => item.JID)).toEqual(['4@g.us', '1@g.us'])
    expect(filterGroups(groups, '3@g').map((item) => item.JID)).toEqual(['3@g.us'])
    expect(groups[0].JID).toBe('3@g.us')
  })

  it('titles unnamed groups with the short JID', () => {
    expect(groupTitle(group('12036@g.us', '  '))).toBe('12036')
  })

  it('counts members from the list, falling back to ParticipantCount', () => {
    expect(groupParticipantCount({ Participants: [], ParticipantCount: 7 })).toBe(7)
    expect(groupParticipantCount({ Participants: null as never, ParticipantCount: 0 })).toBe(0)
  })

  it('drops a selection made under another device', () => {
    const selection = { deviceId: 'dev-a', jid: '1@g.us' }
    expect(selectedGroupJid(selection, 'dev-a')).toBe('1@g.us')
    expect(selectedGroupJid(selection, 'dev-b')).toBeNull()
    expect(selectedGroupJid(null, 'dev-a')).toBeNull()
  })
})

const member = (extra: Partial<GroupParticipant>): GroupParticipant => ({
  jid: '628111@s.whatsapp.net',
  phone_number: '628111',
  is_admin: false,
  is_super_admin: false,
  ...extra,
})

describe('participant helpers', () => {
  const owner = member({
    jid: 'o@lid',
    phone_number: '',
    display_name: 'Zed',
    is_admin: true,
    is_super_admin: true,
  })
  const admin = member({
    jid: 'a@s.whatsapp.net',
    phone_number: '6281234567890',
    display_name: 'Budi',
    is_admin: true,
  })
  const plain = member({
    jid: 'p@s.whatsapp.net',
    phone_number: '6289876543210',
    display_name: 'Ani',
  })

  it('puts the owner first, then admins, then members by name', () => {
    expect(filterParticipants([plain, admin, owner], '')).toEqual([owner, admin, plain])
  })

  it('matches names, JIDs and phone digits', () => {
    expect(filterParticipants([plain, admin, owner], 'bud')).toEqual([admin])
    expect(filterParticipants([plain, admin, owner], '0812-3456')).toEqual([admin])
    expect(filterParticipants([plain, admin, owner], 'o@lid')).toEqual([owner])
  })

  it('labels and identifies participants', () => {
    expect(participantRole(owner)).toBe('owner')
    expect(participantRole(admin)).toBe('admin')
    expect(participantRole(plain)).toBe('member')
    expect(participantName(member({ display_name: '', phone_number: '6285820301617' }))).toBe(
      '+62 858-2030-1617',
    )
    expect(participantId(owner)).toBe('o@lid')
    expect(participantId(admin)).toBe('6281234567890')
  })
})

describe('misc helpers', () => {
  it('parses comma- and line-separated lists', () => {
    expect(parseList('6281, 6282\n\n 6283 ,')).toEqual(['6281', '6282', '6283'])
  })

  it('formats disappearing timers in Indonesian', () => {
    expect(formatTimer(86_400)).toBe('1 hari')
    expect(formatTimer(604_800)).toBe('7 hari')
    expect(formatTimer(7_200)).toBe('2 jam')
    expect(formatTimer(30)).toBe('30 detik')
  })

  it('labels member-add modes and CSV names', () => {
    expect(memberAddLabel('admin_add')).toBe('Hanya admin')
    expect(memberAddLabel(undefined)).toBe('Tidak diketahui')
    expect(participantsCsvName('12036@g.us')).toBe('12036-anggota.csv')
  })
})

describe('participant statuses', () => {
  it('keeps only the entries that did not succeed', () => {
    const ok = { participant: 'a', status: 'success', message: 'Action success' }
    const bad = { participant: 'b', status: 'error', message: 'Failed to add participant' }
    expect(failedStatuses([ok, bad])).toEqual([bad])
    expect(failedStatuses(null)).toEqual([])
  })
})
