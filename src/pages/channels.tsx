import { useState } from 'react'
import { Newspaper, Radio } from 'lucide-react'
import type { NewsletterMetadata } from '@/api/newsletter'
import {
  DetailPaneBody,
  DetailPaneHeader,
  EmptyPane,
  ListDetailLayout,
  ListPaneHeader,
  PaneSection,
} from '@/components/layout/list-detail'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChannelDetail } from '@/features/newsletter/channel-detail'
import { ChannelDirectory } from '@/features/newsletter/channel-directory'
import { CHANNEL_TABS, type ChannelTab } from '@/features/newsletter/channel-filters'
import { ChannelLookupDialog } from '@/features/newsletter/channel-lookup-form'
import { LiveUpdatesList } from '@/features/newsletter/live-updates'
import { NewsletterList } from '@/features/newsletter/newsletter-list'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'
import { cn } from '@/lib/utils'

type Selection =
  | { deviceId: string; kind: 'channel'; channel: NewsletterMetadata }
  | { deviceId: string; kind: 'live' }

export default function ChannelsPage() {
  const device = useSelectedDevice()
  const [tab, setTab] = useState<ChannelTab>('following')
  const [stored, setSelection] = useState<Selection | null>(null)
  // A selection made on another device never leaks into this one.
  const selection = stored && stored.deviceId === device ? stored : null
  const selectedId = selection?.kind === 'channel' ? selection.channel.id : null

  if (!device) {
    return (
      <div className="tab:p-6 mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto p-4">
        <PageHeader
          title="Saluran"
          description="Saluran yang diikuti, direktori saluran, isi postingan, dan statistiknya."
        />
        <DeviceGuard />
      </div>
    )
  }

  const openChannel = (channel: NewsletterMetadata) =>
    setSelection({ deviceId: device, kind: 'channel', channel })
  const openLive = () => setSelection({ deviceId: device, kind: 'live' })
  const close = () => setSelection(null)

  return (
    <ListDetailLayout
      listLabel="Daftar saluran"
      detailLabel="Detail saluran"
      detailOpen={selection !== null}
      list={
        <>
          <ListPaneHeader
            title="Saluran"
            actions={
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'size-10 rounded-full',
                        selection?.kind === 'live' && 'bg-accent',
                      )}
                      aria-label="Pembaruan langsung"
                      onClick={openLive}
                    >
                      <Radio className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Pembaruan langsung</TooltipContent>
                </Tooltip>
                <ChannelLookupDialog key={device} onFound={openChannel} />
              </>
            }
          />
          <div className="px-3 pb-2.5">
            <div
              role="tablist"
              aria-label="Jenis daftar saluran"
              className="bg-muted grid grid-cols-2 gap-1 rounded-full p-1"
            >
              {CHANNEL_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                    'focus-visible:ring-ring outline-none focus-visible:ring-2',
                    tab === item.id
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {/* Both stay mounted so switching tabs keeps the directory results. */}
          <div className={cn('flex min-h-0 flex-1 flex-col', tab !== 'following' && 'hidden')}>
            <NewsletterList key={device} selectedId={selectedId} onSelect={openChannel} />
          </div>
          <div className={cn('flex min-h-0 flex-1 flex-col', tab !== 'discover' && 'hidden')}>
            <ChannelDirectory key={device} selectedId={selectedId} onSelect={openChannel} />
          </div>
        </>
      }
      detail={
        selection?.kind === 'channel' ? (
          <ChannelDetail
            key={`${device}:${selection.channel.id}`}
            channel={selection.channel}
            onBack={close}
          />
        ) : selection?.kind === 'live' ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <DetailPaneHeader
              title="Pembaruan langsung"
              subtitle="Langganan penghitung pada perangkat aktif"
              onBack={close}
              backLabel="Kembali ke daftar saluran"
            />
            <DetailPaneBody>
              <PaneSection
                title="Langganan berjalan"
                description="Penghitung yang terus diperbarui GOWA sampai dihentikan atau server restart."
              >
                <LiveUpdatesList key={device} onOpen={openChannel} />
              </PaneSection>
            </DetailPaneBody>
          </div>
        ) : (
          <EmptyPane
            icon={Newspaper}
            title="Pilih saluran"
            hint="Buka saluran dari daftar Diikuti atau Temukan untuk melihat info, postingan, dan statistiknya."
            action={
              <Button variant="outline" onClick={openLive}>
                <Radio className="size-4" />
                Lihat pembaruan langsung
              </Button>
            }
          />
        )
      }
    />
  )
}
