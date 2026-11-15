/**
 * Digits of a WhatsApp user from a JID or phone string:
 * "6285820301617:5@s.whatsapp.net" → "6285820301617". Group, LID and other
 * non-phone JIDs return null.
 */
export function phoneDigits(value: string | null | undefined): string | null {
  if (!value) return null
  const [user, server] = value.split('@')
  if (server !== undefined && server !== 's.whatsapp.net' && server !== 'c.us') return null
  const digits = user.split(':')[0].replace(/[^\d]/g, '')
  return digits.length >= 6 ? digits : null
}

/**
 * Human-readable international number. Indonesian numbers follow the
 * familiar "+62 858-2030-1617" grouping; others get a plain "+<digits>".
 */
export function formatPhone(value: string | null | undefined): string | null {
  const digits = phoneDigits(value)
  if (!digits) return null
  if (!digits.startsWith('62') || digits.length < 10) return `+${digits}`
  const rest = digits.slice(2)
  const groups = [rest.slice(0, 3)]
  for (let index = 3; index < rest.length; index += 4) groups.push(rest.slice(index, index + 4))
  return `+62 ${groups.join('-')}`
}
