import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  groupInfoKey,
  groupListKey,
  groupParticipantsKey,
  groupScopeKey,
} from '@/features/group/group-keys'
import { scopedQueryKey } from '@/lib/private-query'

const JID = '120363000000000000@g.us'

describe('group query keys', () => {
  it('include the device in every key', () => {
    expect(groupListKey('dev-a')).toEqual(['groups', 'dev-a', 'list'])
    expect(groupInfoKey('dev-a', JID)).toEqual(['groups', 'dev-a', 'info', JID])
    expect(groupParticipantsKey('dev-a', JID)).toEqual(['groups', 'dev-a', 'participants', JID])
  })

  it('keep the same group on two devices in separate cache entries', () => {
    expect(groupInfoKey('dev-a', JID)).not.toEqual(groupInfoKey('dev-b', JID))
    expect(groupParticipantsKey('dev-a', JID)).not.toEqual(groupParticipantsKey('dev-b', JID))
  })

  it('invalidate only the matching device, even with the connection id appended', async () => {
    const client = new QueryClient()
    const keys = [
      scopedQueryKey(groupListKey('dev-a'), 'conn-1'),
      scopedQueryKey(groupInfoKey('dev-a', JID), 'conn-1'),
      scopedQueryKey(groupParticipantsKey('dev-a', JID), 'conn-1'),
      scopedQueryKey(groupInfoKey('dev-b', JID), 'conn-1'),
    ]
    for (const key of keys) client.setQueryData(key, { ok: true })

    await client.invalidateQueries({ queryKey: groupScopeKey('dev-a') })

    const invalidated = (key: readonly unknown[]) =>
      client.getQueryCache().find({ queryKey: key, exact: true })?.state.isInvalidated
    expect(keys.slice(0, 3).map(invalidated)).toEqual([true, true, true])
    expect(invalidated(keys[3])).toBe(false)
  })
})
