import { useCallback, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getChatMessages, listChats } from '@/api/chat'
import {
  CALL_SCAN_CHATS,
  CALL_SCAN_CONCURRENCY,
  CALL_SCAN_PER_CHAT,
  CALL_SEARCH_TEXT,
  callsFromMessages,
  scanChatsForCalls,
  type CallMessage,
  type ScanProgress,
} from '@/features/call/call-history'
import { trackedQueryFn } from '@/lib/private-query'
import { useConnection } from '@/stores/connection'
import { useDeviceStore } from '@/stores/device'

export function callHistoryQueryKey(deviceId: string, connectionId: string | null) {
  return ['calls', deviceId, CALL_SCAN_CHATS, connectionId] as const
}

/**
 * Incoming-call history for a device. GOWA keeps no call log; each incoming
 * call is a synthetic "Incoming call" message (media_type "call") in the
 * caller's chat, so this scans the newest chats for those messages.
 */
export function useCallHistory(deviceId: string) {
  const connectionId = useConnection((state) => state.connectionId)
  const queryKey = callHistoryQueryKey(deviceId, connectionId)
  const scope = queryKey.join('|')
  const [progress, setProgress] = useState<(ScanProgress & { scope: string }) | null>(null)
  const runId = useRef(0)

  const queryFn = useCallback(
    ({ signal }: { signal: AbortSignal }) => {
      const run = ++runId.current
      const isCancelled = () =>
        signal.aborted ||
        run !== runId.current ||
        useConnection.getState().connectionId !== connectionId ||
        useDeviceStore.getState().selectedDeviceId !== deviceId
      const report = (next: ScanProgress) => {
        if (!isCancelled()) setProgress({ ...next, scope })
      }
      return trackedQueryFn(connectionId, async () => {
        const chats = await listChats({ limit: CALL_SCAN_CHATS, offset: 0 }, deviceId)
        const list = chats.data ?? []
        const result = await scanChatsForCalls(
          list,
          async (chat) => {
            const page = await getChatMessages(
              chat.jid,
              { search: CALL_SEARCH_TEXT, limit: CALL_SCAN_PER_CHAT },
              deviceId,
            )
            return callsFromMessages(chat, (page.data ?? []) as CallMessage[])
          },
          { concurrency: CALL_SCAN_CONCURRENCY, onProgress: report, isCancelled },
        )
        return { ...result, totalChats: chats.pagination?.total ?? list.length }
      })()
    },
    [connectionId, deviceId, scope],
  )

  const query = useQuery({
    queryKey,
    queryFn,
    enabled: connectionId !== null,
    staleTime: 60_000,
    retry: false,
  })

  return {
    query,
    progress: query.isFetching && progress?.scope === scope ? progress : null,
  }
}
