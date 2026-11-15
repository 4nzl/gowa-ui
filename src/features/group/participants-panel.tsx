import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Loader2,
  MoreVertical,
  Search,
  ShieldMinus,
  ShieldPlus,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  addParticipants,
  demoteParticipants,
  exportParticipantsCsv,
  listParticipants,
  promoteParticipants,
  removeParticipants,
  type GroupParticipant,
  type ParticipantStatus,
} from '@/api/group'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PaneSection } from '@/components/layout/list-detail'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { ConfirmDialog } from '@/features/group/confirm-dialog'
import {
  failedStatuses,
  filterParticipants,
  parseList,
  participantId,
  participantName,
  participantRole,
  participantsCsvName,
  roleLabels,
} from '@/features/group/group-display'
import { groupParticipantsKey, groupScopeKey } from '@/features/group/group-keys'
import { toApiError } from '@/lib/api-error'
import { formatPhone } from '@/lib/phone'
import { usePrivateQuery } from '@/lib/private-query'

type RowAction = 'promote' | 'demote' | 'remove'

const ACTION_DONE: Record<RowAction, string> = {
  promote: 'dijadikan admin',
  demote: 'tidak lagi admin',
  remove: 'dikeluarkan dari grup',
}

function reportStatuses(statuses: ParticipantStatus[] | null | undefined, success: string) {
  const failed = failedStatuses(statuses)
  if (failed.length === 0) {
    toast.success(success)
    return
  }
  toast.warning(
    `${failed.length} nomor gagal diproses: ${failed
      .map((status) => formatPhone(status.participant) ?? status.participant)
      .join(', ')}`,
  )
}

export function ParticipantsPanel({ deviceId, groupJid }: { deviceId: string; groupJid: string }) {
  const queryClient = useQueryClient()
  const [newParticipants, setNewParticipants] = useState('')
  const [search, setSearch] = useState('')
  const [removeTarget, setRemoveTarget] = useState<GroupParticipant | null>(null)

  const { data, isLoading, error, refetch } = usePrivateQuery({
    queryKey: groupParticipantsKey(deviceId, groupJid),
    queryFn: () => listParticipants({ group_id: groupJid }),
    enabled: !!groupJid,
  })

  // Members, counts and admin flags also appear in the list and the info tab.
  const invalidate = () => queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) })

  const add = useMutation({
    mutationFn: (participants: string[]) => addParticipants({ group_id: groupJid, participants }),
    onSuccess: (statuses, participants) => {
      reportStatuses(statuses, `${participants.length} anggota ditambahkan`)
      setNewParticipants('')
      void invalidate()
    },
    onError: (mutationError) =>
      toast.error(`Gagal menambahkan anggota: ${toApiError(mutationError).message}`),
  })

  const rowAction = useMutation({
    mutationFn: ({ action, participant }: { action: RowAction; participant: GroupParticipant }) => {
      const payload = { group_id: groupJid, participants: [participantId(participant)] }
      if (action === 'promote') return promoteParticipants(payload)
      if (action === 'demote') return demoteParticipants(payload)
      return removeParticipants(payload)
    },
    onSuccess: (statuses, { action, participant }) => {
      reportStatuses(statuses, `${participantName(participant)} ${ACTION_DONE[action]}`)
      setRemoveTarget(null)
      void invalidate()
    },
    onError: (mutationError) =>
      toast.error(`Gagal memperbarui anggota: ${toApiError(mutationError).message}`),
  })

  const exportCsv = useMutation({
    mutationFn: () => exportParticipantsCsv(groupJid),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = participantsCsvName(groupJid)
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url))
    },
    onError: (mutationError) =>
      toast.error(`Gagal mengekspor CSV: ${toApiError(mutationError).message}`),
  })

  const participants = useMemo(() => data?.participants ?? [], [data])
  const visible = useMemo(() => filterParticipants(participants, search), [participants, search])
  const pendingJid = rowAction.isPending ? rowAction.variables?.participant.jid : undefined

  return (
    <div className="flex flex-col gap-3">
      <PaneSection
        title="Tambah anggota"
        description="Masukkan nomor dengan kode negara, pisahkan dengan koma."
      >
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            const list = parseList(newParticipants)
            if (list.length > 0) add.mutate(list)
          }}
        >
          <Input
            aria-label="Nomor anggota baru"
            placeholder="628xxxxxxxxxx, 628xxxxxxxxxx"
            value={newParticipants}
            onChange={(event) => setNewParticipants(event.target.value)}
          />
          <Button
            type="submit"
            disabled={add.isPending || parseList(newParticipants).length === 0}
            className="shrink-0"
          >
            {add.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Tambah
          </Button>
        </form>
      </PaneSection>

      <PaneSection
        title={data ? `Anggota (${participants.length})` : 'Anggota'}
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={exportCsv.isPending}
            onClick={() => exportCsv.mutate()}
          >
            {exportCsv.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Ekspor CSV
          </Button>
        }
      >
        {participants.length > 5 && (
          <label className="bg-muted mb-2 flex h-10 items-center gap-2 rounded-full px-3.5">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau nomor anggota"
              aria-label="Cari anggota"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {search && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => setSearch('')}>
                <X className="text-muted-foreground size-4" />
              </button>
            )}
          </label>
        )}

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-destructive text-sm">
              Gagal memuat anggota: {toApiError(error).message}
            </p>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Coba lagi
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col gap-2" role="status" aria-label="Memuat anggota">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        )}

        {!isLoading && !error && (
          <ul className="flex flex-col divide-y">
            {visible.map((participant) => {
              const name = participantName(participant)
              const role = participantRole(participant)
              const phone = formatPhone(participant.phone_number) ?? formatPhone(participant.jid)
              return (
                <li key={participant.jid} className="flex min-h-14 items-center gap-3 py-2">
                  <ChatAvatar jid={participant.jid} name={name} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {phone && phone !== name ? phone : participant.jid}
                    </p>
                  </div>
                  {role === 'owner' && (
                    <Badge className="bg-primary/12 text-primary shrink-0 border-transparent">
                      {roleLabels.owner}
                    </Badge>
                  )}
                  {role === 'admin' && (
                    <Badge variant="secondary" className="shrink-0">
                      {roleLabels.admin}
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-full"
                        aria-label={`Tindakan untuk ${name}`}
                        disabled={rowAction.isPending}
                      >
                        {pendingJid === participant.jid ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <MoreVertical className="size-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {role === 'member' && (
                        <DropdownMenuItem
                          onClick={() => rowAction.mutate({ action: 'promote', participant })}
                        >
                          <ShieldPlus className="size-4" /> Jadikan admin
                        </DropdownMenuItem>
                      )}
                      {role === 'admin' && (
                        <DropdownMenuItem
                          onClick={() => rowAction.mutate({ action: 'demote', participant })}
                        >
                          <ShieldMinus className="size-4" /> Hapus status admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setRemoveTarget(participant)}
                      >
                        <UserMinus className="size-4" /> Keluarkan dari grup
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              )
            })}
            {participants.length === 0 && (
              <li className="text-muted-foreground py-6 text-center text-sm">
                Tidak ada anggota yang dikembalikan untuk grup ini.
              </li>
            )}
            {participants.length > 0 && visible.length === 0 && (
              <li className="text-muted-foreground py-6 text-center text-sm">
                Tidak ada anggota yang cocok.
              </li>
            )}
          </ul>
        )}
      </PaneSection>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={`Keluarkan ${removeTarget ? participantName(removeTarget) : 'anggota'}?`}
        description="Anggota ini dikeluarkan dari grup dan harus diundang lagi untuk bergabung kembali."
        confirmLabel="Keluarkan"
        pending={rowAction.isPending && rowAction.variables?.action === 'remove'}
        onConfirm={() =>
          removeTarget && rowAction.mutate({ action: 'remove', participant: removeTarget })
        }
      />
    </div>
  )
}
