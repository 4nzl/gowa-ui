import { describe, expect, it } from 'vitest'
import { recipientOptions } from '@/lib/jid'
import { RECIPIENT_TYPE_LABELS, localizedRecipientOptions } from './recipient-labels'

describe('recipient labels', () => {
  it('labels every recipient type', () => {
    for (const option of recipientOptions) {
      expect(RECIPIENT_TYPE_LABELS[option.value]).toBeTruthy()
    }
  })

  it('keeps the order and drops status on request', () => {
    expect(localizedRecipientOptions(true).map((option) => option.value)).toEqual(
      recipientOptions.map((option) => option.value),
    )
    expect(localizedRecipientOptions(false).map((option) => option.value)).not.toContain('status')
  })
})
