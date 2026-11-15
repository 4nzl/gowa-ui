import { describe, expect, it } from 'vitest'
import {
  SCHEDULE_MESSAGE_TYPES,
  SCHEDULE_STATUS_FILTERS,
  SCHEDULE_STATUS_LABELS,
  messageTypeLabel,
  recurrenceLabel,
} from './schedule-labels'

describe('schedule labels', () => {
  it('offers "all" plus every status as a filter', () => {
    expect(SCHEDULE_STATUS_FILTERS.map((filter) => filter.value)).toEqual([
      'all',
      'active',
      'running',
      'paused',
      'completed',
      'failed',
      'cancelled',
    ])
    expect(SCHEDULE_STATUS_LABELS.paused).toBe('Dijeda')
    expect(SCHEDULE_STATUS_LABELS.cancelled).toBe('Dibatalkan')
  })

  it('translates recurrence and passes unknown values through', () => {
    expect(recurrenceLabel('weekly')).toBe('Mingguan')
    expect(recurrenceLabel('yearly')).toBe('yearly')
  })

  it('keeps the eleven schedulable message types unique', () => {
    const values = SCHEDULE_MESSAGE_TYPES.map((type) => type.value)
    expect(values).toHaveLength(11)
    expect(new Set(values).size).toBe(11)
    expect(messageTypeLabel('file')).toBe('Dokumen')
    expect(messageTypeLabel('mystery')).toBe('mystery')
  })
})
