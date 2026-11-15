import { useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Copy, Loader2, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { unfollowNewsletter, type NewsletterMetadata } from '@/api/newsletter'
import { DetailPaneBody, DetailPaneHeader, PaneSection } from '@/components/layout/list-detail'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useActionMutation } from '@/hooks/use-action-mutation'
import { copyText } from '@/lib/clipboard'
import { formatDay } from '@/lib/format'
import { useFollowedNewsletters } from '@/features/newsletter/channel'
import { ChannelFeed } from '@/features/newsletter/channel-feed'
import {
  channelName,
  followerLabel,
  inviteLink,
  roleLabel,
} from '@/features/newsletter/channel-filters'
import { ChannelAvatar, ChannelTitle, FollowButton } from '@/features/newsletter/channel-summary'
import { LiveUpdatesSwitch } from '@/features/newsletter/live-updates'

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

function CopyValue({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="font-mono text-xs">{value}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Salin ${label}`}
        onClick={async () =>
          (await copyText(value))
            ? toast.success(`${label} disalin`)
            : toast.error('Browser menolak menyalin teks')
        }
      >
        <Copy className="size-3.5" />
      </Button>
    </span>
  )
}

/** Detail pane for one channel: info, follow state, live updates and its posts. */
export function ChannelDetail({
  channel,
  onBack,
}: {
  channel: NewsletterMetadata
  onBack: () => void
}) {
  const queryClient = useQueryClient()
  const followed = useFollowedNewsletters()
  const [confirmUnfollow, setConfirmUnfollow] = useState(false)
  const isFollowed = followed.data?.data?.some((item) => item.id === channel.id) ?? false
  const name = channelName(channel)
  const meta = channel.thread_metadata
  const description = meta?.description?.text
  const invite = inviteLink(channel)
  const created = Number(meta?.creation_time)
  const role = roleLabel(channel.viewer_metadata?.role)

  const unfollow = useActionMutation(unfollowNewsletter, {
    successMessage: `Berhenti mengikuti ${name}`,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['newsletters'] }),
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DetailPaneHeader
        onBack={onBack}
        backLabel="Kembali ke daftar saluran"
        leading={<ChannelAvatar channel={channel} className="size-10" />}
        title={<ChannelTitle channel={channel} />}
        subtitle={followerLabel(channel) ?? 'Saluran'}
        actions={
          isFollowed ? (
            <Button
              variant="outline"
              size="sm"
              disabled={unfollow.isPending}
              onClick={() => setConfirmUnfollow(true)}
            >
              {unfollow.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserMinus className="size-4" />
              )}
              <span className="max-tab:sr-only">Berhenti mengikuti</span>
            </Button>
          ) : (
            <FollowButton newsletterId={channel.id} />
          )
        }
      />
      <DetailPaneBody>
        <PaneSection title="Info saluran">
          {description && (
            <p className="mb-2 text-sm break-words whitespace-pre-wrap">{description}</p>
          )}
          <dl>
            <InfoRow label="ID saluran">
              <CopyValue value={channel.id} label="ID saluran" />
            </InfoRow>
            {invite && (
              <InfoRow label="Tautan undangan">
                <CopyValue value={invite} label="Tautan undangan" />
              </InfoRow>
            )}
            {followerLabel(channel) && <InfoRow label="Pengikut">{followerLabel(channel)}</InfoRow>}
            {role && <InfoRow label="Peran Anda">{role}</InfoRow>}
            {created > 0 && (
              <InfoRow label="Dibuat">{formatDay(new Date(created * 1000).toISOString())}</InfoRow>
            )}
            <InfoRow label="Verifikasi">
              {meta?.verification === 'verified' ? 'Terverifikasi' : 'Tidak terverifikasi'}
            </InfoRow>
            <InfoRow label="Status">{isFollowed ? 'Diikuti' : 'Belum diikuti'}</InfoRow>
          </dl>
        </PaneSection>

        <PaneSection
          title="Pembaruan langsung"
          description="GOWA terus memperbarui penghitung postingan saluran ini sampai dihentikan atau server restart. Perubahan dikirim sebagai webhook newsletter.message."
          actions={<LiveUpdatesSwitch newsletterId={channel.id} />}
        />

        <ChannelFeed key={channel.id} newsletterId={channel.id} />
      </DetailPaneBody>

      <AlertDialog open={confirmUnfollow} onOpenChange={setConfirmUnfollow}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Berhenti mengikuti {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Saluran ini akan hilang dari daftar Diikuti pada perangkat aktif. Anda bisa
              mengikutinya lagi kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unfollow.mutate(channel.id)}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Berhenti mengikuti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
