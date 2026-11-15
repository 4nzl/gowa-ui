import { useQueryClient } from '@tanstack/react-query'
import { setGroupLocked } from '@/api/group'
import { Switch } from '@/components/ui/switch'
import { groupScopeKey } from '@/features/group/group-keys'
import { useGroupAction } from '@/features/group/use-group-action'

/** Toggle that applies immediately; it shows the server's last known state. */
export function SetLockedForm({
  deviceId,
  groupJid,
  initialLocked = false,
}: {
  deviceId: string
  groupJid: string
  initialLocked?: boolean
}) {
  const queryClient = useQueryClient()
  const mutation = useGroupAction(setGroupLocked, {
    success: 'Izin ubah info grup diperbarui',
    failure: 'Gagal memperbarui izin ubah info grup',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) }),
  })
  // Show the requested state while saving and after success, until the refetch lands.
  const checked =
    mutation.isPending || mutation.isSuccess
      ? (mutation.variables?.locked ?? initialLocked)
      : initialLocked

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span className="min-w-0">
        <span className="block text-sm font-medium">Hanya admin yang dapat mengubah info grup</span>
        <span className="text-muted-foreground block text-xs">
          Nama, deskripsi, foto, dan setelan grup hanya bisa diubah admin.
        </span>
      </span>
      <Switch
        checked={checked}
        disabled={mutation.isPending}
        onCheckedChange={(locked) => mutation.mutate({ group_id: groupJid, locked })}
      />
    </label>
  )
}
