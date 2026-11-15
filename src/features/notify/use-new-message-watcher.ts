import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getChatMessages, listChats } from '@/api/chat'
import { chatTitle, messageSummary } from '@/features/chat/chat-format'
import { senderDisplayName } from '@/features/chat/display-name'
import { openChatState } from '@/features/chat/open-chat'
import { playChime } from '@/features/notify/chime'
import { baselineFor, changedChats, incomingAfter } from '@/features/notify/notify-logic'
import { useNotifyStore, type NotifyUpdate } from '@/features/notify/notify-store'
import { trackedQueryFn } from '@/lib/private-query'
import { useConnection } from '@/stores/connection'
import { useDeviceStore } from '@/stores/device'

export const WATCH_POLL_MS = 15_000
const WATCH_CHATS = 30
/** Chats fetched per poll when many changed at once; the rest catch up next poll. */
const MAX_FETCH_PER_POLL = 5

function pageVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}

/**
 * Polls the newest chats and records incoming messages that arrived since this
 * browser last looked, then announces them (toast + chime). Mount once, in the
 * app shell.
 */
export function useNewMessageWatcher() {
  const deviceId = useDeviceStore((state) => state.selectedDeviceId)
  const connectionId = useConnection((state) => state.connectionId)
  const navigate = useNavigate()
  const running = useRef(false)

  const query = useQuery({
    queryKey: ['notify-watch', deviceId, connectionId],
    queryFn: trackedQueryFn(connectionId, () =>
      listChats({ limit: WATCH_CHATS }, deviceId as string),
    ),
    enabled: deviceId !== null && connectionId !== null,
    refetchInterval: WATCH_POLL_MS,
    // Keep counting in a background tab so the title shows "(N) GOWA".
    refetchIntervalInBackground: true,
    retry: false,
  })

  useEffect(() => {
    const chats = query.data?.data
    if (!chats || !deviceId || running.current) return
    const store = useNotifyStore.getState()
    const watch = store.byDevice[deviceId]
    if (!watch) {
      store.setBaseline(deviceId, baselineFor(chats, new Date().toISOString()))
      return
    }
    const changed = changedChats(chats, watch).slice(0, MAX_FETCH_PER_POLL)
    if (changed.length === 0) return

    running.current = true
    const scope = { deviceId, connectionId }
    void (async () => {
      const updates: NotifyUpdate[] = []
      const announced: { jid: string; title: string; text: string; count: number }[] = []
      for (const { chat, since } of changed) {
        try {
          const page = await getChatMessages(chat.jid, { start_time: since, limit: 20 }, deviceId)
          const incoming = incomingAfter(page.data, since)
          const open = useNotifyStore.getState().open
          const reading = open?.deviceId === deviceId && open.jid === chat.jid && pageVisible()
          const title = chatTitle(chat)
          const newest = incoming[incoming.length - 1]
          updates.push({
            jid: chat.jid,
            seenAt: chat.last_message_time,
            added: reading ? 0 : incoming.length,
            title,
            at: newest?.timestamp,
          })
          if (!reading && newest) {
            const prefix =
              chat.jid.endsWith('@g.us') && newest.sender_jid
                ? `${senderDisplayName(newest)}: `
                : ''
            announced.push({
              jid: chat.jid,
              title,
              text:
                newest.media_type === 'call' ? 'Panggilan masuk' : prefix + messageSummary(newest),
              count: incoming.length,
            })
          }
        } catch {
          // Leave this chat for the next poll.
        }
      }
      running.current = false
      const now = {
        deviceId: useDeviceStore.getState().selectedDeviceId,
        connectionId: useConnection.getState().connectionId,
      }
      if (now.deviceId !== scope.deviceId || now.connectionId !== scope.connectionId) return
      useNotifyStore.getState().apply(deviceId, updates)

      if (announced.length === 0) return
      const prefs = useNotifyStore.getState().prefs
      if (prefs.sound) playChime()
      if (!prefs.toast) return
      if (announced.length === 1) {
        const [only] = announced
        toast(
          only.count > 1
            ? `${only.count} pesan baru dari ${only.title}`
            : `Pesan baru dari ${only.title}`,
          {
            description: only.text.slice(0, 140),
            action: {
              label: 'Buka',
              onClick: () => navigate('/chats', { state: openChatState(only.jid, only.title) }),
            },
          },
        )
      } else {
        const total = announced.reduce((sum, item) => sum + item.count, 0)
        toast(`${total} pesan baru dari ${announced.length} chat`, {
          description: announced
            .map((item) => item.title)
            .join(', ')
            .slice(0, 140),
          action: { label: 'Lihat', onClick: () => navigate('/chats') },
        })
      }
    })()
  }, [query.data, query.dataUpdatedAt, deviceId, connectionId, navigate])
}
