/** Uptime in Indonesian units: "3 hari 4 jam", "2 jam 5 menit", "7 menit". */
export function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  if (days) return `${days} hari ${hours} jam`
  if (hours) return `${hours} jam ${minutes} menit`
  return `${minutes} menit`
}

export function formatCount(value: number | null | undefined): string {
  // Older or newer servers may omit a counter; never crash the settings page over it.
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('id-ID') : '—'
}
