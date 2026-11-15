/**
 * Query keys for the Groups module. Every key starts with the device scope
 * (['groups', deviceId]) so one device's cached groups, info, or members can
 * never answer for another device. usePrivateQuery appends the connection id,
 * so these keys still prefix-match the cached entries for invalidation.
 */
export function groupScopeKey(deviceId: string) {
  return ['groups', deviceId] as const
}

export function groupListKey(deviceId: string) {
  return [...groupScopeKey(deviceId), 'list'] as const
}

export function groupInfoKey(deviceId: string, groupJid: string) {
  return [...groupScopeKey(deviceId), 'info', groupJid] as const
}

export function groupParticipantsKey(deviceId: string, groupJid: string) {
  return [...groupScopeKey(deviceId), 'participants', groupJid] as const
}
