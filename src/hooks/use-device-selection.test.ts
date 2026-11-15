import { describe, expect, it } from 'vitest'
import { resolveDeviceSelection } from '@/hooks/use-device-selection'

describe('resolveDeviceSelection', () => {
  it('keeps a selection that still exists', () => {
    expect(resolveDeviceSelection(['a', 'b'], 'b', false)).toBe('b')
  })

  it('clears a vanished selection instead of moving to another device', () => {
    expect(resolveDeviceSelection(['a', 'b'], 'gone', true)).toBeNull()
    expect(resolveDeviceSelection(['only'], 'gone', true)).toBeNull()
  })

  it('auto-picks only the single device on the first load of a session', () => {
    expect(resolveDeviceSelection(['only'], null, true)).toBe('only')
    expect(resolveDeviceSelection(['only'], null, false)).toBeNull()
  })

  it('never auto-picks when several devices exist', () => {
    expect(resolveDeviceSelection(['a', 'b'], null, true)).toBeNull()
  })

  it('returns null when there are no devices', () => {
    expect(resolveDeviceSelection([], null, true)).toBeNull()
  })
})
