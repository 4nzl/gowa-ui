import { listDevices } from '@/api/devices'
import { usePrivateQuery } from '@/lib/private-query'
import { useConnection } from '@/stores/connection'

/** GOWA pushes no WebSocket event for connect/disconnect, so the devices page polls. */
export const DEVICE_POLL_MS = 15_000

export function useDevices(options: { poll?: boolean } = {}) {
  const status = useConnection((state) => state.status)
  return usePrivateQuery({
    queryKey: ['devices'],
    queryFn: listDevices,
    enabled: status === 'connected',
    ...(options.poll ? { refetchInterval: DEVICE_POLL_MS } : {}),
  })
}
