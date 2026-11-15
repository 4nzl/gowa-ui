import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, RefreshCw, X } from 'lucide-react'
import {
  approveParticipantRequests,
  listParticipantRequests,
  rejectParticipantRequests,
  type ParticipantRequestEntry,
} from '@/api/group'
import { Button } from '@/components/ui/button'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { ConfirmDialog } from '@/features/group/confirm-dialog'
import { failedStatuses, participantName, shortId } from '@/features/group/group-display'
import { groupScopeKey } from '@/features/group/group-keys'
import { useGroupAction } from '@/features/group/use-group-action'
import { formatDate, isZeroTime } from '@/lib/format'
import { formatPhone } from '@/lib/phone'

type Decision = { action: 'approve' | 'reject'; requests: ParticipantRequestEntry[] }

function requestName(request: ParticipantRequestEntry): string {
  return participantName({
    display_name: request.display_name,
    phone_number: request.phone_number,
    jid: request.jid,
  })
}

export function ParticipantRequests({
  deviceId,
  groupJid,
}: {
  deviceId: string
  groupJid: string
}) {
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState<ParticipantRequestEntry[] | null>(null)
  // Requests decided since the last load; hidden without reloading the list.
  const [handled, setHandled] = useState<ReadonlySet<string>>(new Set())

  const load = useGroupAction(listParticipantRequests, {
    success: (requests) =>
      requests.length ? `${requests.length} permintaan bergabung` : 'Tidak ada permintaan',
    failure: 'Gagal memuat permintaan bergabung',
    onSuccess: () => setHandled(new Set()),
  })

  const decide = useGroupAction(
    ({ action, requests }: Decision) =>
      (action === 'approve' ? approveParticipantRequests : rejectParticipantRequests)({
        group_id: groupJid,
        participants: requests.map((request) => request.jid),
      }),
    {
      success: (statuses, vars) => {
        const failed = failedStatuses(statuses).length
        if (failed) return `${failed} permintaan gagal diproses`
        return vars.action === 'approve' ? 'Permintaan disetujui' : 'Permintaan ditolak'
      },
      failure: 'Gagal memproses permintaan',
      onSuccess: (statuses, vars) => {
        setRejectTarget(null)
        const failed = new Set(failedStatuses(statuses).map((status) => status.participant))
        setHandled((previous) => {
          const next = new Set(previous)
          for (const request of vars.requests) if (!failed.has(request.jid)) next.add(request.jid)
          return next
        })
        if (vars.action === 'approve') {
          void queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) })
        }
      },
    },
  )

  const requests = load.data?.filter((request) => !handled.has(request.jid))
  const pendingJids = decide.isPending
    ? new Set(decide.variables?.requests.map((request) => request.jid))
    : new Set<string>()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap justify-end gap-2">
        {requests && requests.length > 1 && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={decide.isPending}
              onClick={() => setRejectTarget(requests)}
            >
              <X className="size-4" />
              Tolak semua
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ action: 'approve', requests })}
            >
              <Check className="size-4" />
              Setujui semua
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant={requests ? 'ghost' : 'default'}
          disabled={load.isPending}
          onClick={() => load.mutate({ group_id: groupJid })}
        >
          {load.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {requests ? 'Muat ulang' : 'Muat permintaan'}
        </Button>
      </div>

      {requests && requests.length === 0 && (
        <p className="text-muted-foreground text-sm">Tidak ada permintaan bergabung.</p>
      )}

      {requests && requests.length > 0 && (
        <ul className="flex flex-col divide-y">
          {requests.map((request) => {
            const name = requestName(request)
            const busy = pendingJids.has(request.jid)
            return (
              <li key={request.jid} className="flex flex-wrap items-center gap-3 py-2.5">
                <ChatAvatar jid={request.jid} name={name} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {formatPhone(request.phone_number) ?? shortId(request.jid)}
                    {!isZeroTime(request.requested_at) && ` · ${formatDate(request.requested_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={decide.isPending}
                    onClick={() => setRejectTarget([request])}
                  >
                    <X className="size-4" />
                    Tolak
                  </Button>
                  <Button
                    size="sm"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ action: 'approve', requests: [request] })}
                  >
                    {busy && decide.variables?.action === 'approve' ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Setujui
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title={
          rejectTarget && rejectTarget.length > 1
            ? `Tolak ${rejectTarget.length} permintaan bergabung?`
            : `Tolak permintaan ${rejectTarget?.[0] ? requestName(rejectTarget[0]) : ''}?`
        }
        description="Pemohon tidak ditambahkan ke grup dan harus mengajukan permintaan lagi bila ingin bergabung."
        confirmLabel="Tolak"
        pending={decide.isPending && decide.variables?.action === 'reject'}
        onConfirm={() =>
          rejectTarget && decide.mutate({ action: 'reject', requests: rejectTarget })
        }
      />
    </div>
  )
}
