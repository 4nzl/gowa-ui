import type { ScheduleStatus } from '@/api/schedule'

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  active: 'Menunggu',
  running: 'Berjalan',
  paused: 'Dijeda',
  completed: 'Selesai',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
}

export const SCHEDULE_STATUS_FILTERS: { value: ScheduleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  ...(Object.keys(SCHEDULE_STATUS_LABELS) as ScheduleStatus[]).map((value) => ({
    value,
    label: SCHEDULE_STATUS_LABELS[value],
  })),
]

const RECURRENCE_LABELS: Record<string, string> = {
  once: 'Sekali',
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
}

/** Indonesian label for a recurrence; unknown values from newer servers pass through. */
export function recurrenceLabel(value: string) {
  return RECURRENCE_LABELS[value] ?? value
}

/**
 * The eleven kinds a scheduled send can be, in the order the compose forms
 * present them. Values are the server's message_type.
 */
export const SCHEDULE_MESSAGE_TYPES: { value: string; label: string }[] = [
  { value: 'text', label: 'Teks' },
  { value: 'image', label: 'Gambar' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'file', label: 'Dokumen' },
  { value: 'sticker', label: 'Stiker' },
  { value: 'contact', label: 'Kontak' },
  { value: 'link', label: 'Tautan' },
  { value: 'location', label: 'Lokasi' },
  { value: 'poll', label: 'Polling' },
  { value: 'forward', label: 'Teruskan' },
]

export function messageTypeLabel(value: string) {
  return SCHEDULE_MESSAGE_TYPES.find((type) => type.value === value)?.label ?? value
}
