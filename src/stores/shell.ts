import { create } from 'zustand'

interface ShellState {
  /**
   * A page shows a full-screen detail view (e.g. an open chat). On mobile the
   * shell then hides its top bar and bottom navigation; the page supplies its
   * own back button. Wider layouts ignore it.
   */
  immersive: boolean
  setImmersive: (immersive: boolean) => void
}

export const useShellStore = create<ShellState>()((set) => ({
  immersive: false,
  setImmersive: (immersive) => set({ immersive }),
}))
