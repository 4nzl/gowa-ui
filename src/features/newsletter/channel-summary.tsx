import { useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Loader2, Plus } from 'lucide-react'
import { followNewsletter, type NewsletterMetadata } from '@/api/newsletter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { cn } from '@/lib/utils'
import { useFollowedNewsletters } from '@/features/newsletter/channel'
import { channelDetails, channelName } from '@/features/newsletter/channel-filters'

export function ChannelAvatar({
  channel,
  className,
}: {
  channel: NewsletterMetadata
  className?: string
}) {
  return <ChatAvatar jid={channel.id} name={channelName(channel)} className={className} />
}

/** Channel name with the verified tick and a non-active state badge. */
export function ChannelTitle({ channel }: { channel: NewsletterMetadata }) {
  const state = channel.state?.type
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate">{channelName(channel)}</span>
      {channel.thread_metadata?.verification === 'verified' && (
        <BadgeCheck className="text-primary size-4 shrink-0" aria-label="Terverifikasi" />
      )}
      {state && state !== 'active' && (
        <Badge variant="destructive" className="shrink-0">
          {state}
        </Badge>
      )}
    </span>
  )
}

/** A row in the followed or directory list. */
export function ChannelRow({
  channel,
  selected,
  followed,
  onSelect,
}: {
  channel: NewsletterMetadata
  selected: boolean
  followed?: boolean
  onSelect: () => void
}) {
  const details = channelDetails(channel)
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex min-h-[72px] w-full items-center gap-3 px-3 text-left transition-colors',
          'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
          selected ? 'bg-accent' : 'hover:bg-accent/60',
        )}
      >
        <ChannelAvatar channel={channel} className="size-12 text-lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
          <span className="flex items-center justify-between gap-2">
            <span className="min-w-0 text-[15.5px] font-medium">
              <ChannelTitle channel={channel} />
            </span>
            {followed && (
              <Badge variant="secondary" className="shrink-0">
                Diikuti
              </Badge>
            )}
          </span>
          <span className="text-muted-foreground truncate text-[13.5px]">
            {details || channel.id.split('@')[0]}
          </span>
        </span>
      </button>
    </li>
  )
}

export function FollowButton({ newsletterId }: { newsletterId: string }) {
  const queryClient = useQueryClient()
  const followed = useFollowedNewsletters()
  const follow = useActionMutation(followNewsletter, {
    successMessage: 'Saluran diikuti',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['newsletters'] }),
  })

  if (followed.data?.data?.some((item) => item.id === newsletterId)) {
    return <Badge variant="secondary">Diikuti</Badge>
  }

  return (
    <Button size="sm" disabled={follow.isPending} onClick={() => follow.mutate(newsletterId)}>
      {follow.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Ikuti
    </Button>
  )
}
