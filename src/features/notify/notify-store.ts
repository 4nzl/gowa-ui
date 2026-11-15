import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { trimSeen, type DeviceWatch, type FreshChat } from '@/features/notify/notify-logic'

export interface NotifyUpdate {
  jid: string
  /** last_message_time now accounted for. */
  seenAt: string
  added: number
  title: string
  at?: string
}

interface NotifyState {
  byDevice: Record<string, DeviceWatch>
  prefs: { toast: boolean; sound: boolean }
  /** The chat open on screen, so it is not announced while the user reads it. */
  open: { deviceId: string; jid: string } | null
  setBaseline: (deviceId: string, watch: DeviceWatch) => void
  apply: (deviceId: string, updates: NotifyUpdate[]) => void
  markSeen: (deviceId: string, jid: string, at?: string) => void
  clearDevice: (deviceId: string) => void
  setOpen: (open: NotifyState['open']) => void
  setPrefs: (prefs: Partial<NotifyState['prefs']>) => void
}

function safeLocalStorage(): Storage {
  try {
    return window.localStorage
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

export const useNotifyStore = create<NotifyState>()(
  persist(
    (set) => ({
      byDevice: {},
      prefs: { toast: true, sound: true },
      open: null,
      setBaseline: (deviceId, watch) =>
        set((state) => ({ byDevice: { ...state.byDevice, [deviceId]: watch } })),
      apply: (deviceId, updates) =>
        set((state) => {
          const current = state.byDevice[deviceId]
          if (!current || updates.length === 0) return state
          const seen = { ...current.seen }
          const fresh: Record<string, FreshChat> = { ...current.fresh }
          for (const update of updates) {
            seen[update.jid] = update.seenAt
            if (update.added > 0) {
              const before = fresh[update.jid]
              fresh[update.jid] = {
                count: (before?.count ?? 0) + update.added,
                title: update.title,
                at: update.at ?? before?.at ?? update.seenAt,
              }
            }
          }
          return {
            byDevice: {
              ...state.byDevice,
              [deviceId]: { ...current, seen: trimSeen(seen), fresh },
            },
          }
        }),
      markSeen: (deviceId, jid, at) =>
        set((state) => {
          const current = state.byDevice[deviceId]
          if (!current) return state
          const fresh = { ...current.fresh }
          const hadFresh = jid in fresh
          delete fresh[jid]
          // Compare as instants: the server and the browser format ISO strings differently.
          const known = Date.parse(current.seen[jid] ?? '') || 0
          const seen =
            at && (Date.parse(at) || 0) > known ? { ...current.seen, [jid]: at } : current.seen
          if (!hadFresh && seen === current.seen) return state
          return { byDevice: { ...state.byDevice, [deviceId]: { ...current, seen, fresh } } }
        }),
      clearDevice: (deviceId) =>
        set((state) => {
          const current = state.byDevice[deviceId]
          if (!current) return state
          return { byDevice: { ...state.byDevice, [deviceId]: { ...current, fresh: {} } } }
        }),
      setOpen: (open) => set({ open }),
      setPrefs: (prefs) => set((state) => ({ prefs: { ...state.prefs, ...prefs } })),
    }),
    {
      name: 'gowa-ui.notify.v1',
      storage: createJSONStorage(safeLocalStorage),
      partialize: (state) => ({ byDevice: state.byDevice, prefs: state.prefs }),
    },
  ),
)

/** Number of new incoming messages for a device (0 when unknown). */
export function useFreshTotal(deviceId: string | null): number {
  return useNotifyStore((state) => {
    if (!deviceId) return 0
    const fresh = state.byDevice[deviceId]?.fresh
    return fresh ? Object.values(fresh).reduce((sum, chat) => sum + chat.count, 0) : 0
  })
}

export function useFreshCount(deviceId: string | null, jid: string): number {
  return useNotifyStore((state) =>
    deviceId ? (state.byDevice[deviceId]?.fresh[jid]?.count ?? 0) : 0,
  )
}
