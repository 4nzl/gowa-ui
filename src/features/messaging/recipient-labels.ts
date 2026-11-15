import { recipientOptions, type RecipientType } from '@/lib/jid'

/** Indonesian labels for the recipient types (with the wire value spelled out where useful). */
export const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
  user: 'Pesan pribadi',
  group: 'Grup',
  newsletter: 'Saluran (newsletter)',
  lid: 'LID (Linked ID)',
  status: 'Status (status@broadcast)',
}

/** recipientOptions in the same order, with Indonesian labels. */
export function localizedRecipientOptions(showStatus: boolean) {
  return recipientOptions
    .filter((option) => showStatus || option.value !== 'status')
    .map((option) => ({ value: option.value, label: RECIPIENT_TYPE_LABELS[option.value] }))
}
