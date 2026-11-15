import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, History, Loader2, PhoneIncoming, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { getChatMessages, requestChatHistory, type ChatInfo, type MessageInfo } from '@/api/chat'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import {
  chatCaption,
  chatTitle,
  dayLabel,
  formatBubbleTime,
  isGroupJid,
  mergeMessages,
  messageSummary,
  olderCursor,
  sameDay,
} from '@/features/chat/chat-format'
import { ChatControls } from '@/features/chat/chat-controls'
import { chatMessagesQueryKey } from '@/features/chat/device-scope'
import { senderDisplayName } from '@/features/chat/display-name'
import { FormattedText } from '@/features/chat/formatted-text'
import { MessageMedia } from '@/features/chat/message-media'
import { MessageMenu } from '@/features/chat/message-menu'
import { MessageComposer } from '@/features/composer/message-composer'
import { toApiError } from '@/lib/api-error'
import { connectionPlaceholder, trackedQueryFn } from '@/lib/private-query'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'

const PAGE_SIZE = 30
/** No WebSocket event for new messages exists, so an open chat polls its newest page. */
const LATEST_POLL_MS = 5_000
// The phone answers a history request later, through history sync.
const HISTORY_POLL_MS = 3_000
const HISTORY_POLL_WINDOW_MS = 30_000
const NEAR_BOTTOM_PX = 120

const SENDER_TONES = [
  'text-[#1f7aec]',
  'text-[#d6336c]',
  'text-[#0b8a6f]',
  'text-[#c25e00]',
  'text-[#7c4dff]',
  'text-[#00838f]',
]

function repliedToId(message: MessageInfo): string | undefined {
  if (!message.context_metadata) return undefined
  try {
    return (JSON.parse(message.context_metadata) as { replied_to_id?: string }).replied_to_id
  } catch {
    return undefined
  }
}

function senderTone(jid: string): string {
  let hash = 0
  for (let index = 0; index < jid.length; index++) hash = (hash * 33 + jid.charCodeAt(index)) | 0
  return SENDER_TONES[Math.abs(hash) % SENDER_TONES.length]
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function MessageBubble({
  message,
  quoted,
  deviceId,
  showSender,
  continued,
  onReply,
}: {
  message: MessageInfo
  /** The replied-to message; null when it is not loaded, undefined when not a reply. */
  quoted: MessageInfo | null | undefined
  deviceId: string
  showSender: boolean
  continued: boolean
  onReply: (message: MessageInfo) => void
}) {
  const mine = message.is_from_me
  const hasMedia = Boolean(message.media_type) && message.media_type !== 'call'

  if (message.media_type === 'call') {
    return (
      <div className="my-1.5 flex justify-center">
        <span className="bg-card text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs shadow-xs">
          <PhoneIncoming className="size-3.5" />
          Panggilan masuk · {formatBubbleTime(message.timestamp)}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex',
        mine ? 'justify-end' : 'justify-start',
        continued ? 'mt-0.5' : 'mt-2',
        message.reactions?.length ? 'mb-3' : '',
      )}
    >
      <div
        className={cn(
          'tab:max-w-[min(72%,600px)] group/bubble relative max-w-[min(88%,560px)] min-w-[88px] rounded-lg px-2 pt-1.5 pb-1 text-[14.5px] leading-[1.35] [overflow-wrap:anywhere] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]',
          mine ? 'bg-bubble-out' : 'bg-bubble-in',
          !continued && (mine ? 'rounded-tr-none' : 'rounded-tl-none'),
        )}
      >
        <MessageMenu
          message={message}
          chatJid={message.chat_jid}
          deviceId={deviceId}
          onReply={onReply}
        />
        {showSender && (
          <p
            className={cn(
              'mb-0.5 px-0.5 text-[12.5px] font-medium',
              senderTone(message.sender_jid),
            )}
          >
            {senderDisplayName(message)}
          </p>
        )}
        {quoted !== undefined && (
          <div className="border-primary bg-foreground/5 mb-1 rounded-md border-l-4 px-2 py-1 text-xs">
            {quoted ? (
              <>
                <p className="text-primary font-medium">
                  {quoted.is_from_me ? 'Anda' : senderDisplayName(quoted)}
                </p>
                <p className="text-muted-foreground line-clamp-2">{messageSummary(quoted)}</p>
              </>
            ) : (
              <p className="text-muted-foreground italic">Membalas pesan sebelumnya</p>
            )}
          </div>
        )}
        {hasMedia && <MessageMedia message={message} deviceId={deviceId} />}
        {message.content && (
          <FormattedText text={message.content} className={cn('px-0.5', hasMedia && 'mt-1')} />
        )}
        <span className="text-muted-foreground float-right mt-0.5 ml-3 translate-y-0.5 text-[11px] leading-4">
          {formatBubbleTime(message.timestamp)}
        </span>
        <span className="clear-both block" />
        {message.reactions && message.reactions.length > 0 && (
          <span
            className={cn(
              'bg-card absolute -bottom-3.5 flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs shadow-xs',
              mine ? 'right-2' : 'left-2',
            )}
            title={message.reactions
              .map(
                (reaction) =>
                  `${reaction.emoji} ${reaction.is_from_me ? 'Anda' : reaction.sender_display_name || reaction.sender_jid}`,
              )
              .join('\n')}
          >
            {[...new Set(message.reactions.map((reaction) => reaction.emoji))].join('')}
            {message.reactions.length > 1 && (
              <span className="text-muted-foreground ml-0.5">{message.reactions.length}</span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

export function MessageView({
  chat,
  deviceId,
  onBack,
}: {
  chat: ChatInfo
  deviceId: string
  /** Shows a back button on mobile, where the open chat replaces the chat list. */
  onBack?: () => void
}) {
  const queryClient = useQueryClient()
  const connectionId = useConnection((state) => state.connectionId)
  const scroller = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const topSentinel = useRef<HTMLDivElement>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [mediaOnly, setMediaOnly] = useState(false)
  const search = useDebounced(searchInput.trim(), 350)
  const [anchor, setAnchor] = useState<string | undefined>()
  const [historyPollUntil, setHistoryPollUntil] = useState(0)
  const [historyPending, setHistoryPending] = useState(false)
  const [unseen, setUnseen] = useState(0)
  // Mirrors stickToBottom for rendering: the jump button shows whenever the user scrolled up.
  const [atBottom, setAtBottom] = useState(true)
  const [replyTo, setReplyTo] = useState<MessageInfo | null>(null)
  const stickToBottom = useRef(true)
  const filtering = search !== '' || mediaOnly

  // A new filter starts paging from its own newest page.
  useEffect(() => setAnchor(undefined), [search, mediaOnly])

  const latest = useQuery({
    queryKey: chatMessagesQueryKey(
      deviceId,
      chat.jid,
      { search, mediaOnly, offset: 0 },
      connectionId,
    ),
    queryFn: trackedQueryFn(connectionId, () =>
      getChatMessages(
        chat.jid,
        { search: search || undefined, media_only: mediaOnly || undefined, limit: PAGE_SIZE },
        deviceId,
      ),
    ),
    enabled: connectionId !== null,
    refetchInterval: filtering ? false : LATEST_POLL_MS,
    placeholderData:
      connectionPlaceholder<Awaited<ReturnType<typeof getChatMessages>>>(connectionId),
  })

  const olderPages = useInfiniteQuery({
    queryKey: [
      'chat-messages',
      deviceId,
      chat.jid,
      'older',
      search,
      mediaOnly,
      anchor,
      connectionId,
    ],
    initialPageParam: anchor ?? '',
    queryFn: async ({ pageParam }) => {
      const run = trackedQueryFn(connectionId, () =>
        getChatMessages(
          chat.jid,
          {
            search: search || undefined,
            media_only: mediaOnly || undefined,
            limit: PAGE_SIZE,
            end_time: pageParam,
          },
          deviceId,
        ),
      )
      return run()
    },
    getNextPageParam: (lastPage, _pages, lastParam) => {
      const cursor = olderCursor(lastPage.data, PAGE_SIZE)
      return cursor && cursor !== lastParam ? cursor : undefined
    },
    enabled: connectionId !== null && anchor !== undefined,
    refetchInterval: () => (Date.now() < historyPollUntil ? HISTORY_POLL_MS : false),
  })

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = olderPages
  const latestPage = latest.data?.data
  const messages = useMemo(
    () =>
      mergeMessages(...(olderPages.data?.pages.map((page) => page.data) ?? []), latestPage ?? []),
    [olderPages.data, latestPage],
  )
  const messagesById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  )
  const responseChat = latest.data?.chat_info
  const resolvedChat = responseChat?.jid === chat.jid ? responseChat : chat
  const group = isGroupJid(chat.jid)

  const latestIsPartial = latestPage !== undefined && latestPage.length < PAGE_SIZE
  const reachedOldest =
    latestIsPartial || (anchor !== undefined && olderPages.isSuccess && !olderPages.hasNextPage)
  const loadingOlder = olderPages.isFetching && !olderPages.isRefetching

  // Load older pages when the top of the thread comes into view.
  useEffect(() => {
    const root = scroller.current
    const target = topSentinel.current
    if (!root || !target || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || !latestPage) return
        if (anchor === undefined) {
          const cursor = olderCursor(latestPage, PAGE_SIZE)
          if (cursor) setAnchor(cursor)
        } else if (hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { root, rootMargin: '300px 0px 0px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [anchor, latestPage, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Scroll handling: stay pinned to the bottom when the user is there, keep the
  // reading position when older messages are prepended.
  const previous = useRef({ first: '', last: '', height: 0, top: 0 })
  useLayoutEffect(() => {
    const element = scroller.current
    if (!element || messages.length === 0) return
    const first = messages[0].id
    const last = messages[messages.length - 1].id
    const before = previous.current
    if (!before.last || stickToBottom.current) {
      element.scrollTop = element.scrollHeight
    } else if (first !== before.first && last === before.last) {
      element.scrollTop = before.top + (element.scrollHeight - before.height)
    } else if (last !== before.last) {
      const arrived = messages.findIndex((message) => message.id === before.last)
      const fresh = arrived === -1 ? 1 : messages.length - 1 - arrived
      if (messages[messages.length - 1].is_from_me) element.scrollTop = element.scrollHeight
      else setUnseen((count) => count + fresh)
    }
    previous.current = { first, last, height: element.scrollHeight, top: element.scrollTop }
  }, [messages])

  // Images load after layout; keep the bottom pinned while they grow.
  useEffect(() => {
    const element = scroller.current
    const inner = content.current
    if (!element || !inner || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (stickToBottom.current) element.scrollTop = element.scrollHeight
      previous.current.height = element.scrollHeight
    })
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  const onScroll = () => {
    const element = scroller.current
    if (!element) return
    const near = element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM_PX
    stickToBottom.current = near
    setAtBottom(near)
    if (near && unseen) setUnseen(0)
    previous.current.top = element.scrollTop
    previous.current.height = element.scrollHeight
  }

  const scrollToBottom = () => {
    const element = scroller.current
    if (!element) return
    stickToBottom.current = true
    setUnseen(0)
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
  }

  const askPhoneForHistory = async () => {
    setHistoryPending(true)
    try {
      await requestChatHistory(chat.jid, PAGE_SIZE, deviceId)
      toast.success('Ponsel diminta mengirim pesan lama; pesan muncul setelah ponsel menjawab')
      setHistoryPollUntil(Date.now() + HISTORY_POLL_WINDOW_MS)
      if (anchor === undefined && latestPage?.length) {
        setAnchor(
          olderCursor(latestPage, latestPage.length) ?? latestPage[latestPage.length - 1].timestamp,
        )
      }
      window.setTimeout(() => void latest.refetch(), HISTORY_POLL_MS)
    } catch (error) {
      toast.error(toApiError(error).message)
    } finally {
      setHistoryPending(false)
    }
  }

  const onSent = () => {
    stickToBottom.current = true
    void queryClient.invalidateQueries({ queryKey: ['chat-messages', deviceId, chat.jid] })
    void queryClient.invalidateQueries({ queryKey: ['chats', deviceId] })
  }

  const title = chatTitle(resolvedChat)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="bg-card tab:px-4 flex h-16 shrink-0 items-center gap-2 border-b px-2">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="tab:hidden size-10 shrink-0 rounded-full"
            aria-label="Kembali ke daftar chat"
            onClick={onBack}
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <ChatAvatar jid={chat.jid} name={title} className="size-10" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium">{title}</h2>
          <p className="text-muted-foreground truncate text-xs">{chatCaption(resolvedChat)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn('size-10 shrink-0 rounded-full', searchOpen && 'bg-accent')}
          aria-label="Cari di percakapan"
          aria-pressed={searchOpen}
          onClick={() => {
            setSearchOpen((open) => !open)
            if (searchOpen) {
              setSearchInput('')
              setMediaOnly(false)
            }
          }}
        >
          <Search className="size-5" />
        </Button>
        <ChatControls chat={resolvedChat} deviceId={deviceId} />
      </header>

      {searchOpen && (
        <div className="bg-card tab:px-4 flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <label className="bg-muted flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full px-3">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <input
              autoFocus
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari pesan"
              aria-label="Cari pesan"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {searchInput && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => setSearchInput('')}>
                <X className="text-muted-foreground size-4" />
              </button>
            )}
          </label>
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            <Switch checked={mediaOnly} onCheckedChange={setMediaOnly} />
            Media saja
          </label>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="chat-wallpaper h-full overflow-y-auto overscroll-contain"
          role="log"
          aria-label={`Pesan dengan ${title}`}
          aria-live="polite"
        >
          <div ref={content} className="tab:px-[6%] mx-auto flex max-w-4xl flex-col px-3 py-3">
            <div ref={topSentinel} className="h-px" />
            {loadingOlder && (
              <div
                className="flex justify-center py-2"
                role="status"
                aria-label="Memuat pesan lama"
              >
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
              </div>
            )}
            {reachedOldest && !filtering && (
              <div className="flex justify-center py-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-card/90 rounded-full shadow-xs"
                  disabled={historyPending}
                  onClick={() => void askPhoneForHistory()}
                >
                  {historyPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <History className="size-4" />
                  )}
                  Minta pesan lama dari ponsel
                </Button>
              </div>
            )}

            {latest.isLoading ? (
              <div className="flex justify-center py-10" role="status" aria-label="Memuat pesan">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
              </div>
            ) : latest.isError ? (
              <p className="bg-card text-destructive mx-auto my-6 rounded-lg px-4 py-3 text-sm">
                Pesan gagal dimuat: {toApiError(latest.error).message}
              </p>
            ) : messages.length === 0 ? (
              <p className="bg-card text-muted-foreground mx-auto my-6 rounded-lg px-4 py-3 text-center text-sm shadow-xs">
                {filtering
                  ? 'Tidak ada pesan yang cocok.'
                  : 'Belum ada pesan tersimpan untuk chat ini.'}
              </p>
            ) : (
              messages.map((message, index) => {
                const prev = messages[index - 1]
                const newDay = !prev || !sameDay(prev.timestamp, message.timestamp)
                const continued =
                  !newDay &&
                  prev.is_from_me === message.is_from_me &&
                  prev.sender_jid === message.sender_jid &&
                  prev.media_type !== 'call'
                const replyId = repliedToId(message)
                return (
                  <div key={message.id}>
                    {newDay && (
                      <div className="my-2 flex justify-center">
                        <span className="bg-card text-muted-foreground rounded-lg px-3 py-1 text-xs shadow-xs">
                          {dayLabel(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <MessageBubble
                      message={message}
                      quoted={
                        replyId === undefined ? undefined : (messagesById.get(replyId) ?? null)
                      }
                      deviceId={deviceId}
                      showSender={group && !message.is_from_me && !continued}
                      continued={continued}
                      onReply={setReplyTo}
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {!atBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label={unseen > 0 ? `Ke pesan terbaru, ${unseen} pesan baru` : 'Ke pesan terbaru'}
            title="Ke pesan terbaru"
            className="bg-card text-muted-foreground hover:text-foreground focus-visible:ring-ring animate-in fade-in zoom-in-90 absolute right-4 bottom-4 grid size-11 place-items-center rounded-full border shadow-md outline-none focus-visible:ring-2"
          >
            <ChevronDown className="size-6" />
            {unseen > 0 && (
              <span className="bg-live absolute -top-1.5 -right-1 min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold text-[#073e29]">
                {unseen > 99 ? '99+' : unseen}
              </span>
            )}
          </button>
        )}
      </div>

      <MessageComposer
        chatJid={chat.jid}
        deviceId={deviceId}
        onSent={onSent}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}
