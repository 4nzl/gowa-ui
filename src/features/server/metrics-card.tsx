import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { appMetrics } from '@/api/app'
import { PaneSection } from '@/components/layout/list-detail'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCount, formatUptime } from '@/features/server/metrics-format'
import { toApiError } from '@/lib/api-error'
import { formatBytes } from '@/lib/format'
import { usePrivateQuery } from '@/lib/private-query'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-right font-mono text-sm [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

/** Server health from GET /app/metrics, polled every 30 s while connected. */
export function MetricsCard() {
  const status = useConnection((state) => state.status)
  const { data, isLoading, error, refetch, isFetching } = usePrivateQuery({
    queryKey: ['app-metrics'],
    queryFn: appMetrics,
    enabled: status === 'connected',
    refetchInterval: 30_000,
    retry: false,
  })

  const memory = data?.system.memory
  const fs = data?.system.filesystem

  return (
    <PaneSection
      title="Kesehatan server"
      description="Dilaporkan GET /app/metrics, diperbarui tiap 30 detik."
      actions={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Muat ulang metrik"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
        </Button>
      }
    >
      {isLoading && <Skeleton className="h-32" />}
      {error && (
        <p className="text-muted-foreground text-sm">
          {toApiError(error).status === 404
            ? 'Server ini belum menyediakan /app/metrics (perlu rilis GOWA yang lebih baru).'
            : `Metrik gagal dimuat: ${toApiError(error).message}`}
        </p>
      )}
      {/* A failed poll keeps the last data; hide it rather than show stale numbers. */}
      {!error && data && memory && fs && (
        <dl>
          <Row label="Waktu aktif">{formatUptime(data.system.uptime_seconds)}</Row>
          <Row label="Perangkat (tersambung / login / total)">
            {data.devices.connected} / {data.devices.logged_in} / {data.devices.total}
          </Row>
          <Row label="Penyimpanan sesi">{data.session_store}</Row>
          {memory.process_rss_bytes !== null ? (
            <Row label="Memori (proses)">{formatBytes(memory.process_rss_bytes)}</Row>
          ) : (
            <Row label="Memori (runtime Go)">{formatBytes(memory.runtime_sys_bytes)}</Row>
          )}
          {memory.container_bytes !== null && (
            <Row label="Memori (kontainer)">
              {formatBytes(memory.container_bytes)}
              {memory.container_limit_bytes !== null &&
                ` dari ${formatBytes(memory.container_limit_bytes)}`}
            </Row>
          )}
          {Object.entries(data.system.folders).map(([name, folder]) => (
            <Row key={name} label={`Disk: ${name}`}>
              {formatBytes(folder.bytes)} · {formatCount(folder.files)} berkas
            </Row>
          ))}
          {fs.free_bytes !== null && fs.total_bytes !== null && (
            <Row label="Ruang kosong volume">
              {formatBytes(fs.free_bytes)} dari {formatBytes(fs.total_bytes)}
            </Row>
          )}
          <Row label="Goroutine">{formatCount(memory.goroutines)}</Row>
          <Row label="Versi Go">{data.system.go_version}</Row>
        </dl>
      )}
    </PaneSection>
  )
}
