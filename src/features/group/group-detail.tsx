import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, LogOut, MoreVertical, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { getGroupInfo, leaveGroup, type MyGroup } from '@/api/group'
import { DetailPaneBody, DetailPaneHeader, PaneSection } from '@/components/layout/list-detail'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { ConfirmDialog } from '@/features/group/confirm-dialog'
import { groupSubtitle, groupTitle } from '@/features/group/group-display'
import { groupInfoKey, groupScopeKey } from '@/features/group/group-keys'
import { GroupOverview } from '@/features/group/info-form'
import { InviteLinkForm } from '@/features/group/invite-link-form'
import { ParticipantRequests } from '@/features/group/participant-requests'
import { ParticipantsPanel } from '@/features/group/participants-panel'
import { SetAnnounceForm } from '@/features/group/set-announce-form'
import { SetLockedForm } from '@/features/group/set-locked-form'
import { SetNameForm } from '@/features/group/set-name-form'
import { SetPhotoForm } from '@/features/group/set-photo-form'
import { SetTopicForm } from '@/features/group/set-topic-form'
import { toApiError } from '@/lib/api-error'
import { copyText } from '@/lib/clipboard'
import { usePrivateQuery } from '@/lib/private-query'

type Tab = 'info' | 'participants' | 'settings'

export function GroupDetail({
  deviceId,
  groupJid,
  group,
  onBack,
  onLeft,
}: {
  deviceId: string
  groupJid: string
  /** The row from `/user/my/groups`, if the list already has it. */
  group: MyGroup | undefined
  onBack: () => void
  onLeft: () => void
}) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('info')
  const [confirmLeave, setConfirmLeave] = useState(false)

  const info = usePrivateQuery({
    queryKey: groupInfoKey(deviceId, groupJid),
    queryFn: () => getGroupInfo({ group_id: groupJid }),
    enabled: !!groupJid,
  })

  const source = info.data ?? group
  const title = source ? groupTitle(source) : groupTitle({ JID: groupJid, Name: '' })
  const name = info.data?.Name ?? group?.Name ?? ''
  const topic = info.data?.Topic ?? group?.Topic ?? ''
  const announce = info.data?.IsAnnounce ?? group?.IsAnnounce ?? false
  const locked = info.data?.IsLocked ?? group?.IsLocked ?? false

  const refresh = () => queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) })

  const leave = useMutation({
    mutationFn: () => leaveGroup({ group_id: groupJid }),
    onSuccess: () => {
      toast.success(`Anda telah keluar dari ${title}`)
      setConfirmLeave(false)
      onLeft()
      void refresh()
    },
    onError: (error) => toast.error(`Gagal keluar dari grup: ${toApiError(error).message}`),
  })

  const copyJid = async () => {
    if (await copyText(groupJid)) toast.success('JID grup tersalin')
    else toast.error('Gagal menyalin JID')
  }

  const leaveSection = (
    <PaneSection
      tone="danger"
      title="Keluar dari grup"
      description="Perangkat ini tidak lagi menerima pesan grup. Untuk bergabung lagi diperlukan tautan undangan atau ditambahkan oleh admin."
    >
      <Button
        variant="outline"
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmLeave(true)}
      >
        <LogOut className="size-4" />
        Keluar dari grup
      </Button>
    </PaneSection>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DetailPaneHeader
        onBack={onBack}
        backLabel="Kembali ke daftar grup"
        leading={<ChatAvatar jid={groupJid} name={title} className="size-10" />}
        title={title}
        subtitle={source ? groupSubtitle(source) : groupJid}
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Muat ulang grup"
              disabled={info.isFetching}
              onClick={() => void refresh()}
            >
              <RefreshCw className={info.isFetching ? 'size-4 animate-spin' : 'size-4'} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu grup">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void copyJid()}>
                  <Copy className="size-4" /> Salin JID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setConfirmLeave(true)}>
                  <LogOut className="size-4" /> Keluar dari grup
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <DetailPaneBody>
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-3">
          <TabsList className="w-full">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="participants">Anggota</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="flex flex-col gap-3">
            <GroupOverview info={info.data} isLoading={info.isLoading} error={info.error} />
            <PaneSection
              title="Tautan undangan"
              description="Hanya admin yang dapat melihat dan menyetel ulang tautan undangan."
            >
              <InviteLinkForm groupJid={groupJid} />
            </PaneSection>
          </TabsContent>

          <TabsContent value="participants" className="flex flex-col gap-3">
            <ParticipantsPanel deviceId={deviceId} groupJid={groupJid} />
            <PaneSection
              title="Permintaan bergabung"
              description="Pemohon yang menunggu persetujuan admin untuk bergabung."
            >
              <ParticipantRequests deviceId={deviceId} groupJid={groupJid} />
            </PaneSection>
          </TabsContent>

          <TabsContent value="settings" className="flex flex-col gap-3">
            <PaneSection title="Nama grup">
              <SetNameForm key={name} deviceId={deviceId} groupJid={groupJid} initialName={name} />
            </PaneSection>
            <PaneSection title="Deskripsi">
              <SetTopicForm
                key={topic}
                deviceId={deviceId}
                groupJid={groupJid}
                initialTopic={topic}
              />
            </PaneSection>
            <PaneSection
              title="Foto grup"
              description="Pilih gambar untuk mengganti foto grup, atau hapus foto yang ada."
            >
              <SetPhotoForm deviceId={deviceId} groupJid={groupJid} />
            </PaneSection>
            <PaneSection title="Izin">
              <div className="flex flex-col divide-y">
                <SetAnnounceForm
                  key={`announce:${announce}`}
                  deviceId={deviceId}
                  groupJid={groupJid}
                  initialAnnounce={announce}
                />
                <SetLockedForm
                  key={`locked:${locked}`}
                  deviceId={deviceId}
                  groupJid={groupJid}
                  initialLocked={locked}
                />
              </div>
            </PaneSection>
            {leaveSection}
          </TabsContent>
        </Tabs>
      </DetailPaneBody>

      <ConfirmDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        title={`Keluar dari ${title}?`}
        description="Perangkat ini dikeluarkan dari grup. Untuk bergabung lagi diperlukan tautan undangan baru atau ditambahkan kembali oleh admin."
        confirmLabel="Keluar dari grup"
        pending={leave.isPending}
        onConfirm={() => leave.mutate()}
      />
    </div>
  )
}
