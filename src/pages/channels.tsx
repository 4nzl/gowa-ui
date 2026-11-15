import { Compass, Newspaper } from 'lucide-react'
import { ActionCard } from '@/components/shared/action-card'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChannelDirectory } from '@/features/newsletter/channel-directory'
import { ChannelLookupForm } from '@/features/newsletter/channel-lookup-form'
import { LiveUpdatesList } from '@/features/newsletter/live-updates'
import { NewsletterList } from '@/features/newsletter/newsletter-list'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'

export default function ChannelsPage() {
  const device = useSelectedDevice()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Saluran"
        description="Saluran yang diikuti, direktori saluran, isi postingan, dan statistiknya."
      />

      {!device ? (
        <DeviceGuard />
      ) : (
        <Tabs defaultValue="following">
          <TabsList>
            <TabsTrigger value="following">
              <Newspaper className="size-4" />
              Diikuti
            </TabsTrigger>
            <TabsTrigger value="discover">
              <Compass className="size-4" />
              Temukan
            </TabsTrigger>
          </TabsList>
          <TabsContent value="following" className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
            <ActionCard title="Saluran diikuti" description="Saluran yang diikuti perangkat ini.">
              <NewsletterList />
            </ActionCard>
            <ActionCard
              title="Live updates"
              description="Langganan penghitung yang terus diperbarui GOWA sampai dihentikan atau server restart."
            >
              <LiveUpdatesList />
            </ActionCard>
          </TabsContent>
          <TabsContent value="discover" className="grid items-start gap-4 lg:grid-cols-2">
            <ActionCard
              title="Cari saluran"
              description="Jelajahi direktori saluran WhatsApp atau cari berdasarkan nama."
            >
              <ChannelDirectory />
            </ActionCard>
            <ActionCard
              title="Lihat detail saluran"
              description="Ambil detail saluran dari ID atau tautan undangan tanpa mengikutinya."
            >
              <ChannelLookupForm />
            </ActionCard>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
