import { afterEach, describe, expect, it, vi } from 'vitest'
import { createConnectionId } from '@/lib/connection-id'

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('createConnectionId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the native randomUUID in a secure context', () => {
    const randomUUID = vi.fn(() => '00000000-0000-4000-8000-000000000000' as const)
    vi.stubGlobal('crypto', { randomUUID, getRandomValues: vi.fn() })
    expect(createConnectionId()).toBe('00000000-0000-4000-8000-000000000000')
    expect(randomUUID).toHaveBeenCalledOnce()
  })

  it('builds a UUID v4 from getRandomValues when randomUUID is missing', () => {
    const native = globalThis.crypto
    const getRandomValues = vi.fn(native.getRandomValues.bind(native))
    vi.stubGlobal('crypto', { getRandomValues })

    const first = createConnectionId()
    const second = createConnectionId()

    expect(first).toMatch(uuidV4)
    expect(second).toMatch(uuidV4)
    expect(first).not.toBe(second)
    expect(getRandomValues).toHaveBeenCalledTimes(2)
  })

  it('sets the version and variant bits regardless of the random bytes', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint8Array) => array.fill(0xff),
    })
    expect(createConnectionId()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
  })
})
