import { useMemo, useState } from 'react'
import { CircleUserRound, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { StateDot } from '@/features/devices/state-badge'
import { useDeviceAvatar } from '@/hooks/use-device-avatar'
import {
  deviceSubtitle,
  deviceTitle,
  filterDevices,
  stateLabels,
} from '@/features/devices/device-display'
import { cn } from '@/lib/utils'
import type { RegistryDevice } from '@/api/types'

function DeviceRow({
  device,
  viewed,
  active,
  onView,
}: {
  device: RegistryDevice
  viewed: boolean
  active: boolean
  onView: () => void
}) {
  const avatar = useDeviceAvatar(device)
  return (
    <li>
      <button
        type="button"
        onClick={onView}
        aria-current={viewed ? 'true' : undefined}
        className={cn(
          'flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left transition-colors',
          'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
          viewed ? 'bg-accent' : 'hover:bg-accent/60',
        )}
      >
        <Avatar className="size-12">
          {avatar.data?.url && <AvatarImage src={avatar.data.url} alt="" />}
          <AvatarFallback>
            <CircleUserRound className="text-muted-foreground size-6" />
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{deviceTitle(device)}</span>
            {active && (
              <Badge className="bg-primary/12 text-primary shrink-0 border-transparent">
                Aktif
              </Badge>
            )}
          </span>
          <span className="text-muted-foreground block truncate text-[13px]">
            {deviceSubtitle(device)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5" title={stateLabels[device.state]}>
          <StateDot state={device.state} />
          <span className="sr-only">{stateLabels[device.state]}</span>
        </span>
      </button>
    </li>
  )
}

export function DeviceList({
  devices,
  viewedId,
  activeId,
  onView,
}: {
  devices: readonly RegistryDevice[]
  viewedId: string | null
  activeId: string | null
  onView: (device: RegistryDevice) => void
}) {
  const [query, setQuery] = useState('')
  const visible = useMemo(() => filterDevices(devices, query), [devices, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {devices.length > 3 && (
        <div className="px-3 pb-2">
          <label className="bg-muted flex h-10 items-center gap-2 rounded-full px-3.5">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari perangkat"
              aria-label="Cari perangkat"
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </label>
        </div>
      )}
      <p className="text-muted-foreground px-4 pt-1 pb-2 text-xs font-semibold tracking-wide uppercase">
        Akun WhatsApp
      </p>
      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {visible.map((device) => (
          <DeviceRow
            key={device.id}
            device={device}
            viewed={device.id === viewedId}
            active={device.id === activeId}
            onView={() => onView(device)}
          />
        ))}
        {visible.length === 0 && (
          <li className="text-muted-foreground px-4 py-6 text-sm">
            Tidak ada perangkat yang cocok.
          </li>
        )}
      </ul>
    </div>
  )
}
