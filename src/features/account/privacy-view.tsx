import { getPrivacy } from '@/api/user'
import { Skeleton } from '@/components/ui/skeleton'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { toApiError } from '@/lib/api-error'
import { usePrivateQuery } from '@/lib/private-query'
import { PRIVACY_ROWS, privacyLabel } from '@/features/account/account-sections'

export function PrivacyView() {
  const device = useSelectedDevice()
  const { data, isLoading, error } = usePrivateQuery({
    queryKey: ['privacy', device],
    queryFn: getPrivacy,
    enabled: !!device,
  })

  if (isLoading) return <Skeleton className="h-32" />
  if (error)
    return (
      <p className="text-destructive text-sm">Gagal memuat privasi: {toApiError(error).message}</p>
    )
  if (!data) return null

  return (
    <dl>
      {PRIVACY_ROWS.map((row) => (
        <div
          key={row.key}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-b-0"
        >
          <dt className="text-muted-foreground text-sm">{row.label}</dt>
          <dd className="text-sm font-medium" title={data[row.key] || undefined}>
            {privacyLabel(row.key, data[row.key])}
          </dd>
        </div>
      ))}
    </dl>
  )
}
