import { useState } from 'react'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { Download, Eye, Forward, Loader2, RefreshCw } from 'lucide-react'
import {
  downloadNewsletterMedia,
  getNewsletterMessageUpdates,
  getNewsletterMessages,
  type NewsletterMessage,
  type NewsletterMessagesResponse,
} from '@/api/newsletter'
import { PaneSection } from '@/components/layout/list-detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { useAppInfo } from '@/hooks/use-app-info'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { toApiError } from '@/lib/api-error'
import { formatBytes, formatDate } from '@/lib/format'
import { trackedQueryFn } from '@/lib/private-query'
import { rerootServerUrl } from '@/lib/url'
import { useConnection } from '@/stores/connection'

const PAGE_SIZE = 20

/** Recent posts of a channel with their counters, inline in the detail pane. */
export function ChannelFeed({ newsletterId }: { newsletterId: string }) {
  const device = useSelectedDevice()
  const connectionId = useConnection((state) => state.connectionId)
  const queryClient = useQueryClient()
  const queryKey = ['newsletter-messages', device, newsletterId, connectionId]

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      trackedQueryFn(connectionId, () =>
        getNewsletterMessages({ newsletter_id: newsletterId, count: PAGE_SIZE, before: pageParam }),
      )(),
    enabled: !!device && connectionId !== null,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) =>
      last.data.length < PAGE_SIZE
        ? undefined
        : Math.min(...last.data.map((message) => message.server_id)),
  })

  const messages = (query.data?.pages.flatMap((page) => page.data) ?? []).sort(
    (a, b) => b.server_id - a.server_id,
  )

  const refresh = useActionMutation(
    (_: void) => {
      // message-updates only takes a lower bound and returns at most 100, so aim it
      // at the newest 100 posts rather than paging blindly.
      const newest = messages.slice(0, 100)
      return getNewsletterMessageUpdates({
        newsletter_id: newsletterId,
        after: Math.max(1, newest[newest.length - 1].server_id - 1),
        // The maximum, so posts newer than the loaded ones can't crowd out loaded rows.
        count: 100,
      })
    },
    {
      successMessage: (result) => `Penghitung ${result.data.length} postingan diperbarui`,
      // Written into the cached pages, so a later refetch replaces them with newer counts.
      onSuccess: (result) => {
        const updates = new Map(result.data.map((message) => [message.server_id, message]))
        queryClient.setQueryData<InfiniteData<NewsletterMessagesResponse>>(
          queryKey,
          (data) =>
            data && {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                data: page.data.map((message) => {
                  const update = updates.get(message.server_id)
                  return update
                    ? {
                        ...message,
                        views_count: update.views_count,
                        forwards_count: update.forwards_count,
                        reaction_counts: update.reaction_counts,
                      }
                    : message
                }),
              })),
            },
        )
      },
    },
  )

  return (
    <PaneSection
      title="Postingan"
      description="Postingan terbaru beserta jumlah dilihat, diteruskan, dan reaksi."
      actions={
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={refresh.isPending || messages.length === 0}
          onClick={() => refresh.mutate()}
        >
          {refresh.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Perbarui penghitung
        </Button>
      }
    >
      {query.isLoading && <Skeleton className="h-40" />}
      {query.error && (
        <p className="text-destructive text-sm">
          Gagal memuat postingan: {toApiError(query.error).message}
        </p>
      )}
      {query.isSuccess && messages.length === 0 && (
        <p className="text-muted-foreground text-sm">Belum ada postingan terbaru.</p>
      )}

      <ul className="flex flex-col divide-y">
        {messages.map((message) => (
          <MessageRow key={message.server_id} newsletterId={newsletterId} message={message} />
        ))}
      </ul>

      {query.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
            Muat lebih lama
          </Button>
        </div>
      )}
    </PaneSection>
  )
}

function MessageRow({
  newsletterId,
  message,
}: {
  newsletterId: string
  message: NewsletterMessage
}) {
  const reactions = Object.entries(message.reaction_counts ?? {})

  return (
    <li className="flex flex-col gap-1.5 py-3">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-mono">#{message.server_id}</span>
        {message.type && <Badge variant="outline">{message.type}</Badge>}
        {message.timestamp && <span>{formatDate(message.timestamp)}</span>}
      </div>
      {message.text && <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>}
      {message.type === 'media' && (
        <NewsletterMedia newsletterId={newsletterId} serverId={message.server_id} />
      )}
      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
        {message.views_count > 0 && (
          <span
            className="flex items-center gap-1"
            title="Dilihat (hanya dilaporkan ke admin)"
            aria-label={`${message.views_count} dilihat`}
          >
            <Eye className="size-3.5" />
            {message.views_count}
          </span>
        )}
        <span
          className="flex items-center gap-1"
          title="Diteruskan"
          aria-label={`${message.forwards_count} diteruskan`}
        >
          <Forward className="size-3.5" />
          {message.forwards_count}
        </span>
        {reactions.map(([emoji, count]) => (
          <span key={emoji} title="Reaksi">
            {emoji} {count}
          </span>
        ))}
      </div>
    </li>
  )
}

function NewsletterMedia({ newsletterId, serverId }: { newsletterId: string; serverId: number }) {
  const [open, setOpen] = useState(false)
  const device = useSelectedDevice()
  const baseUrl = useConnection((state) => state.baseUrl)
  const connectionId = useConnection((state) => state.connectionId)
  const { data: info } = useAppInfo()

  const query = useQuery({
    queryKey: ['newsletter-media', device, newsletterId, serverId, connectionId],
    queryFn: trackedQueryFn(connectionId, () => downloadNewsletterMedia(newsletterId, serverId)),
    enabled: open && !!device && connectionId !== null,
    staleTime: Infinity,
    retry: false,
  })

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
        <Download className="size-3.5" />
        Unduh media
      </Button>
    )
  }

  if (query.isLoading)
    return (
      <Loader2
        className="text-muted-foreground size-4 animate-spin"
        role="status"
        aria-label="Memuat…"
      />
    )

  if (query.isError || !query.data) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-destructive text-xs">
          {query.error ? toApiError(query.error).message : 'Gagal mengunduh media'}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Coba lagi
        </Button>
      </div>
    )
  }

  const src = rerootServerUrl(baseUrl ?? '', query.data.file_path, info?.base_path ?? '')
  const type = query.data.media_type

  return type === 'image' || type === 'sticker' ? (
    <img src={src} alt={query.data.filename} className="max-h-64 self-start rounded-md" />
  ) : type === 'video' || type === 'video_note' ? (
    <video src={src} controls className="max-h-64 self-start rounded-md" />
  ) : type === 'audio' ? (
    <audio src={src} controls />
  ) : (
    <a href={src} target="_blank" rel="noreferrer" className="text-primary text-sm underline">
      {query.data.filename || 'Unduh berkas'} · {formatBytes(query.data.file_size)}
    </a>
  )
}
