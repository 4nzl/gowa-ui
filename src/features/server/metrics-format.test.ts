import { describe, expect, it } from 'vitest'
import { formatCount, formatUptime } from '@/features/server/metrics-format'

describe('formatUptime', () => {
  it('uses Indonesian units', () => {
    expect(formatUptime(0)).toBe('0 menit')
    expect(formatUptime(7 * 60 + 30)).toBe('7 menit')
    expect(formatUptime(2 * 3600 + 5 * 60)).toBe('2 jam 5 menit')
    expect(formatUptime(3 * 86400 + 4 * 3600 + 59)).toBe('3 hari 4 jam')
  })

  it('clamps negative and fractional input', () => {
    expect(formatUptime(-5)).toBe('0 menit')
    expect(formatUptime(119.9)).toBe('1 menit')
  })
})

describe('formatCount', () => {
  it('groups thousands the Indonesian way', () => {
    expect(formatCount(1234567)).toBe('1.234.567')
  })
})

describe('formatCount with missing values', () => {
  it('shows a dash instead of crashing', () => {
    expect(formatCount(undefined)).toBe('—')
    expect(formatCount(null)).toBe('—')
  })
})
