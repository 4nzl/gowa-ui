import { useQueryClient } from '@tanstack/react-query'
import { setGroupAnnounce } from '@/api/group'
import { Switch } from '@/components/ui/switch'
import { groupScopeKey } from '@/features/group/group-keys'
import { useGroupAction } from '@/features/group/use-group-action'

/** Toggle that applies immediately; it shows the server's last known state. */
export function SetAnnounceForm({
  deviceId,
  groupJid,
  initialAnnounce = false,
}: {
  deviceId: string
  groupJid: string
  initialAnnounce?: boolean
}) {
  const queryClient = useQueryClient()
  const mutation = useGroupAction(setGroupAnnounce, {
    success: 'Izin kirim pesan diperbarui',
    failure: 'Gagal memperbarui izin kirim pesan',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: groupScopeKey(deviceId) }),
  })
  // Show the requested state while saving and after success, until the refetch lands.
  const checked =
    mutation.isPending || mutation.isSuccess
      ? (mutation.variables?.announce ?? initialAnnounce)
      : initialAnnounce

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span className="min-w-0">
        <span className="block text-sm font-medium">Hanya admin yang dapat mengirim pesan</span>
        <span className="text-muted-foreground block text-xs">
          Anggota lain hanya bisa membaca pesan di grup.
        </span>
      </span>
      <Switch
        checked={checked}
        disabled={mutation.isPending}
        onCheckedChange={(announce) => mutation.mutate({ group_id: groupJid, announce })}
      />
    </label>
  )
}
