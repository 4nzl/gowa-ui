import { describe, expect, it } from 'vitest'
import { deviceHeaders } from '@/api/request'

describe('deviceHeaders', () => {
  it('sets an encoded X-Device-Id for a device ID', () => {
    expect(deviceHeaders('qa slot')).toEqual({ headers: { 'X-Device-Id': 'qa%20slot' } })
  })

  it('leaves scoping to the interceptor when no device is given', () => {
    expect(deviceHeaders(undefined)).toEqual({})
    expect(deviceHeaders('')).toEqual({})
  })

  it('ignores the mutation context TanStack Query passes as a second argument', () => {
    // Regression: sendText handed to useMutation sent "X-Device-Id: [object Object]".
    expect(deviceHeaders({ client: {}, meta: undefined })).toEqual({})
  })
})
