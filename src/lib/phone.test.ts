import { describe, expect, it } from 'vitest'
import { formatPhone, phoneDigits } from '@/lib/phone'

describe('phoneDigits', () => {
  it('strips the device suffix and server from a user JID', () => {
    expect(phoneDigits('6285820301617:5@s.whatsapp.net')).toBe('6285820301617')
    expect(phoneDigits('6285820301617@s.whatsapp.net')).toBe('6285820301617')
  })

  it('accepts bare and formatted phone numbers', () => {
    expect(phoneDigits('6285820301617')).toBe('6285820301617')
    expect(phoneDigits('+62 858-2030-1617')).toBe('6285820301617')
  })

  it('rejects groups, LIDs and empty values', () => {
    expect(phoneDigits('120363000000000001@g.us')).toBeNull()
    expect(phoneDigits('123456789@lid')).toBeNull()
    expect(phoneDigits('')).toBeNull()
    expect(phoneDigits(undefined)).toBeNull()
  })
})

describe('formatPhone', () => {
  it('groups Indonesian numbers', () => {
    expect(formatPhone('6285820301617:5@s.whatsapp.net')).toBe('+62 858-2030-1617')
    expect(formatPhone('6281248553128')).toBe('+62 812-4855-3128')
    expect(formatPhone('628123456789')).toBe('+62 812-3456-789')
  })

  it('leaves other countries ungrouped', () => {
    expect(formatPhone('14155550123')).toBe('+14155550123')
  })

  it('returns null when there is no phone', () => {
    expect(formatPhone('120363000000000001@g.us')).toBeNull()
  })
})
