import { CircleUserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import { useDevices } from '@/hooks/use-devices'
import { formatPhone } from '@/lib/phone'

/** Own avatar, push name and number of the selected device. */
export function MyProfileCard() {
  const deviceId = useSelectedDevice()
  const { data: devices } = useDevices()
  const device = devices?.find((item) => item.id === deviceId)
  const avatar = useDeviceAvatar(device)
  const number = formatPhone(device?.phone_number || device?.jid) ?? device?.jid

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <Avatar className="size-28">
        {avatar.data?.url && <AvatarImage src={avatar.data.url} alt="Foto profil saya" />}
        <AvatarFallback>
          {avatar.isLoading ? (
            <Skeleton className="size-full rounded-full" />
          ) : (
            <CircleUserRound className="text-muted-foreground size-14" strokeWidth={1.4} />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-lg font-semibold">
          {device?.display_name || 'Nama tampilan belum diatur'}
        </p>
        <p className="text-muted-foreground truncate text-sm">{number || 'Belum dipasangkan'}</p>
      </div>
    </div>
  )
}
