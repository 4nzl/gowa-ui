import { listContacts } from '@/api/user'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { usePrivateQuery } from '@/lib/private-query'

/** Contacts synced to the selected device (`/user/my/contacts`). */
export function useContacts() {
  const device = useSelectedDevice()
  return usePrivateQuery({
    queryKey: ['contacts', device],
    queryFn: listContacts,
    enabled: !!device,
  })
}
