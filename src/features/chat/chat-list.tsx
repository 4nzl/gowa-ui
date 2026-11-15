import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2, Search, X } from 'lucide-react'
import { listChats, type ChatInfo } from '@/api/chat'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { chatCaption, chatTitle, formatChatTime, isGroupJid } from '@/features/chat/chat-format'
import { chatListQueryKey } from '@/features/chat/device-scope'
import { toApiError } from '@/lib/api-error'
import { trackedQueryFn } from '@/lib/private-query'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'
import { useNotifyStore } from '@/features/notify/notify-store'
import type { FreshChat } from '@/features/notify/notify-logic'

const NO_FRESH: Record<string, FreshChat> = {}

const PAGE_SIZE = 30
/** New chats and reordering only show up by asking again; GOWA has no chat-list event. */
const LIST_POLL_MS = 30_000

export type ChatFilter = 'all' | 'groups' | 'media' | 'archived'

const FILTERS: { id: ChatFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'groups', label: 'Grup' },
  { id: 'media', label: 'Ada media' },
  { id: 'archived', label: 'Arsip' },
]

export function ChatList({
  deviceId,
  selectedJid,
  onSelect,
}: {
  deviceId: string
  selectedJid: string | null
  onSelect: (chat: ChatInfo) => void
}) {
  const connectionId = useConnection((state) => state.connectionId)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ChatFilter>('all')
  // New-since-last-opened counts from the in-app notifier (not WhatsApp read state).
  const fresh = useNotifyStore((state) => state.byDevice[deviceId]?.fresh ?? NO_FRESH)
  const bottomSentinel = useRef<HTMLLIElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const query = useInfiniteQuery({
    queryKey: chatListQueryKey(
      deviceId,
      { search, hasMedia: filter === 'media', archived: filter === 'archived' },
      connectionId,
    ),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      trackedQueryFn(connectionId, () =>
        listChats(
          {
            search: search || undefined,
            has_media: filter === 'media' || undefined,
            archived: filter === 'archived' || undefined,
            limit: PAGE_SIZE,
            offset: pageParam,
          },
          deviceId,
        ),
      )(),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.data.length, 0)
      return loaded < lastPage.pagination.total && lastPage.data.length > 0 ? loaded : undefined
    },
    enabled: connectionId !== null,
    refetchInterval: LIST_POLL_MS,
  })

  const chats = useMemo(() => {
    const seen = new Set<string>()
    const all = (query.data?.pages ?? []).flatMap((page) => page.data)
    return all.filter((chat) => {
      if (seen.has(chat.jid)) return false
      seen.add(chat.jid)
      return filter !== 'groups' || isGroupJid(chat.jid)
    })
  }, [query.data, filter])

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    const root = scroller.current
    const target = bottomSentinel.current
    if (!root || !target || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { root, rootMargin: '200px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, chats.length])

  const total = query.data?.pages[0]?.pagination.total ?? 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-3 pb-1">
        <label className="bg-muted flex h-10 items-center gap-2 rounded-full px-3.5">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama atau nomor"
            aria-label="Cari chat"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {searchInput && (
            <button type="button" aria-label="Hapus pencarian" onClick={() => setSearchInput('')}>
              <X className="text-muted-foreground size-4" />
            </button>
          )}
        </label>
        <div
          role="tablist"
          aria-label="Filter chat"
          className="flex gap-1.5 overflow-x-auto py-2.5"
        >
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                filter === item.id
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {query.isLoading ? (
          <div className="flex justify-center p-6" role="status" aria-label="Memuat chat">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : query.isError ? (
          <p className="text-destructive p-6 text-center text-sm">
            Chat gagal dimuat: {toApiError(query.error).message}
          </p>
        ) : chats.length === 0 && !hasNextPage ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            {search ? 'Tidak ada chat yang cocok.' : 'Belum ada chat.'}
          </p>
        ) : (
          <ul>
            {chats.map((chat) => {
              const name = chatTitle(chat)
              const selected = selectedJid === chat.jid
              return (
                <li key={chat.jid}>
                  <button
                    type="button"
                    onClick={() => onSelect(chat)}
                    aria-current={selected ? 'true' : undefined}
                    className={cn(
                      'flex min-h-[72px] w-full items-center gap-3 px-3 text-left transition-colors',
                      'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
                      selected ? 'bg-accent' : 'hover:bg-accent/60',
                    )}
                  >
                    <ChatAvatar jid={chat.jid} name={name} className="size-12 text-lg" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[15.5px] font-medium">{name}</span>
                        <time
                          className={cn(
                            'shrink-0 text-xs',
                            fresh[chat.jid] ? 'text-primary font-medium' : 'text-muted-foreground',
                          )}
                        >
                          {formatChatTime(chat.last_message_time)}
                        </time>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground truncate text-[13.5px]">
                          {chat.archived && filter !== 'archived' ? 'Diarsipkan · ' : ''}
                          {chatCaption(chat)}
                        </span>
                        {fresh[chat.jid] ? (
                          <span
                            className="bg-live min-w-5 shrink-0 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold text-[#073e29]"
                            aria-label={`${fresh[chat.jid].count} pesan baru`}
                          >
                            {fresh[chat.jid].count > 99 ? '99+' : fresh[chat.jid].count}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
            <li ref={bottomSentinel} className="h-px" aria-hidden />
            {isFetchingNextPage && (
              <li className="flex justify-center py-3" role="status" aria-label="Memuat chat lain">
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              </li>
            )}
          </ul>
        )}
      </div>
      <p className="text-muted-foreground border-t px-4 py-2 text-xs">
        {filter === 'groups' ? `${chats.length} grup dimuat dari ${total} chat` : `${total} chat`}
      </p>
    </div>
  )
}
