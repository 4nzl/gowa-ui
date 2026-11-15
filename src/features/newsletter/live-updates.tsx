import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import {
  listLiveUpdates,
  subscribeLiveUpdates,
  unsubscribeLiveUpdates,
  type LiveUpdatesSubscription,
  type NewsletterMetadata,
} from '@/api/newsletter'
import { IdText } from '@/components/shared/id-text'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { toApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import { usePrivateQuery } from '@/lib/private-query'
import { useFollowedNewsletters } from '@/features/newsletter/channel'
import { channelName } from '@/features/newsletter/channel-filters'

function useLiveUpdates() {
  const device = useSelectedDevice()
  return usePrivateQuery({
    queryKey: ['newsletter-live-updates', device],
    queryFn: listLiveUpdates,
    enabled: !!device,
    // GOWA renews each subscription about every 90 seconds
    refetchInterval: 30_000,
  })
}

function useStopLiveUpdates() {
  const queryClient = useQueryClient()
  return useActionMutation(unsubscribeLiveUpdates, {
    successMessage: 'Pembaruan langsung dihentikan',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['newsletter-live-updates'] }),
  })
}

export function LiveUpdatesSwitch({ newsletterId }: { newsletterId: string }) {
  const queryClient = useQueryClient()
  const live = useLiveUpdates()
  const stop = useStopLiveUpdates()
  const start = useActionMutation(subscribeLiveUpdates, {
    successMessage: 'Pembaruan langsung aktif',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['newsletter-live-updates'] }),
  })
  const active = live.data?.some((item) => item.newsletter_id === newsletterId) ?? false

  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch
        checked={active}
        disabled={live.isLoading || start.isPending || stop.isPending}
        onCheckedChange={(on) => (on ? start : stop).mutate(newsletterId)}
      />
      Pembaruan langsung
    </label>
  )
}

/** Every running live-updates subscription of the selected device. */
export function LiveUpdatesList({ onOpen }: { onOpen?: (channel: NewsletterMetadata) => void }) {
  const live = useLiveUpdates()
  const followed = useFollowedNewsletters()

  if (live.isLoading) return <Skeleton className="h-16" />
  if (live.error)
    return (
      <p className="text-destructive text-sm">
        Gagal memuat pembaruan langsung: {toApiError(live.error).message}
      </p>
    )

  const items = live.data ?? []
  if (items.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        Belum ada yang berjalan. Aktifkan dari halaman saluran; perubahan penghitung dikirim sebagai
        webhook newsletter.message.
      </p>
    )

  const channels = new Map(followed.data?.data?.map((item) => [item.id, item]))

  return (
    <ul className="flex flex-col divide-y">
      {items.map((item) => (
        <LiveUpdateRow
          key={item.newsletter_id}
          item={item}
          channel={channels.get(item.newsletter_id)}
          onOpen={onOpen}
        />
      ))}
    </ul>
  )
}

function LiveUpdateRow({
  item,
  channel,
  onOpen,
}: {
  item: LiveUpdatesSubscription
  channel?: NewsletterMetadata
  onOpen?: (channel: NewsletterMetadata) => void
}) {
  const stop = useStopLiveUpdates()

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        {channel &&
          (onOpen ? (
            <button
              type="button"
              className="block max-w-full truncate text-left font-medium hover:underline"
              onClick={() => onOpen(channel)}
            >
              {channelName(channel)}
            </button>
          ) : (
            <p className="truncate font-medium">{channelName(channel)}</p>
          ))}
        <IdText value={item.newsletter_id.split('@')[0]} />
        <p className="text-muted-foreground text-xs">
          Diperbarui {formatDate(item.renewed_at)} · berakhir {formatDate(item.expires_at)}
        </p>
        {item.last_error && <p className="text-destructive text-xs">{item.last_error}</p>}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={stop.isPending}
        onClick={() => stop.mutate(item.newsletter_id)}
      >
        {stop.isPending && <Loader2 className="size-4 animate-spin" />}
        Hentikan
      </Button>
    </li>
  )
}
