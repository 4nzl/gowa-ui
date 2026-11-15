import { listNewsletters } from '@/api/user'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { usePrivateQuery } from '@/lib/private-query'

export { channelName } from '@/features/newsletter/channel-filters'

/** Channels the selected device follows; also decides Ikuti vs Diikuti. */
export function useFollowedNewsletters() {
  const device = useSelectedDevice()
  return usePrivateQuery({
    queryKey: ['newsletters', device],
    queryFn: listNewsletters,
    enabled: !!device,
  })
}
