let context: AudioContext | null = null

/**
 * A short two-tone chime generated with Web Audio (no audio asset to bundle).
 * Browsers only allow sound after the user has interacted with the page; until
 * then this silently does nothing.
 */
export function playChime(): void {
  try {
    const Audio =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Audio) return
    context ??= new Audio()
    if (context.state === 'suspended') void context.resume()
    const start = context.currentTime
    for (const [offset, frequency] of [
      [0, 880],
      [0.12, 1320],
    ] as const) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start + offset)
      gain.gain.exponentialRampToValueAtTime(0.12, start + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.22)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(start + offset)
      oscillator.stop(start + offset + 0.25)
    }
  } catch {
    // Sound is a nicety; never break the app over it.
  }
}
