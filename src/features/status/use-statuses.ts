import { useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getChatMessages } from '@/api/chat'
import { mergeMessages } from '@/features/chat/chat-format'
import {
  STATUS_JID,
  STATUS_PAGE_SIZE,
  groupStatuses,
  statusCursor,
} from '@/features/status/status-format'
import { connectionPlaceholder, trackedQueryFn } from '@/lib/private-query'
import { useConnection } from '@/stores/connection'

/** No event announces new statuses; a minute is fresh enough for stories. */
const STATUS_POLL_MS = 60_000

export function statusQueryKey(deviceId: string, part: string, connectionId: string | null) {
  return ['chat-messages', deviceId, STATUS_JID, 'status', part, connectionId] as const
}

/**
 * Statuses stored in status@broadcast: the newest page polled every minute,
 * plus older pages fetched on demand with the end_time cursor.
 */
export function useStatuses(deviceId: string) {
  const connectionId = useConnection((state) => state.connectionId)
  const [anchor, setAnchor] = useState<string | undefined>()

  const latest = useQuery({
    queryKey: statusQueryKey(deviceId, 'latest', connectionId),
    queryFn: trackedQueryFn(connectionId, () =>
      getChatMessages(STATUS_JID, { limit: STATUS_PAGE_SIZE }, deviceId),
    ),
    enabled: connectionId !== null,
    refetchInterval: STATUS_POLL_MS,
    placeholderData:
      connectionPlaceholder<Awaited<ReturnType<typeof getChatMessages>>>(connectionId),
  })

  const older = useInfiniteQuery({
    queryKey: [...statusQueryKey(deviceId, 'older', connectionId), anchor],
    initialPageParam: anchor ?? '',
    queryFn: ({ pageParam }) =>
      trackedQueryFn(connectionId, () =>
        getChatMessages(
          STATUS_JID,
          { limit: STATUS_PAGE_SIZE, end_time: pageParam || undefined },
          deviceId,
        ),
      )(),
    getNextPageParam: (lastPage, _pages, lastParam) => statusCursor(lastPage.data, lastParam),
    enabled: connectionId !== null && anchor !== undefined,
  })

  const latestPage = latest.data?.data
  const messages = useMemo(
    () => mergeMessages(...(older.data?.pages.map((page) => page.data) ?? []), latestPage ?? []),
    [older.data, latestPage],
  )
  // Re-split on every poll so a status leaves "Terbaru" once it is 24 h old.
  const checkedAt = latest.dataUpdatedAt
  const sections = useMemo(
    () => groupStatuses(messages, checkedAt || Date.now()),
    [messages, checkedAt],
  )

  const firstCursor = latestPage ? statusCursor(latestPage) : undefined
  const hasMore = anchor === undefined ? firstCursor !== undefined : older.hasNextPage
  const loadingMore = older.isFetching && !older.isRefetching

  const loadMore = () => {
    if (anchor === undefined) {
      if (firstCursor) setAnchor(firstCursor)
    } else if (older.hasNextPage && !older.isFetchingNextPage) {
      void older.fetchNextPage()
    }
  }

  return {
    sections,
    checkedAt,
    total: messages.length,
    isLoading: latest.isLoading,
    error: latest.error ?? older.error,
    refetch: () => void latest.refetch(),
    hasMore,
    loadingMore,
    loadMore,
  }
}
