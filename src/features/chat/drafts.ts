import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export function draftKey(deviceId: string, chatJid: string): string {
  return `${deviceId}|${chatJid}`
}

interface DraftState {
  drafts: Record<string, string>
  setDraft: (key: string, text: string) => void
  clearDraft: (key: string) => void
}

function safeSessionStorage(): Storage {
  try {
    return window.sessionStorage
  } catch {
    const memory = new Map<string, string>()
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
      removeItem: (key) => void memory.delete(key),
      clear: () => memory.clear(),
      key: () => null,
      length: 0,
    }
  }
}

/**
 * Unsent text per device + chat. Kept in sessionStorage: it survives switching
 * menus and reloads, and disappears with the tab.
 */
export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (key, text) =>
        set((state) => {
          if (!text) {
            if (!(key in state.drafts)) return state
            const rest = { ...state.drafts }
            delete rest[key]
            return { drafts: rest }
          }
          return { drafts: { ...state.drafts, [key]: text } }
        }),
      clearDraft: (key) =>
        set((state) => {
          const rest = { ...state.drafts }
          delete rest[key]
          return { drafts: rest }
        }),
    }),
    { name: 'gowa-ui.drafts.v1', storage: createJSONStorage(safeSessionStorage) },
  ),
)
