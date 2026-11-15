import { useMemo, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import type { NewsletterMetadata } from '@/api/newsletter'
import { toApiError } from '@/lib/api-error'
import { useFollowedNewsletters } from '@/features/newsletter/channel'
import { filterChannels } from '@/features/newsletter/channel-filters'
import { ChannelRow } from '@/features/newsletter/channel-summary'

/** List-pane body for the "Diikuti" tab: followed channels with a local search. */
export function NewsletterList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (channel: NewsletterMetadata) => void
}) {
  const { data, isLoading, error } = useFollowedNewsletters()
  const [query, setQuery] = useState('')
  const all = useMemo(() => data?.data ?? [], [data])
  const visible = useMemo(() => filterChannels(all, query), [all, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 pb-2">
        <label className="bg-muted flex h-10 items-center gap-2 rounded-full px-3.5">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari saluran diikuti"
            aria-label="Cari saluran diikuti"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery('')}>
              <X className="text-muted-foreground size-4" />
            </button>
          )}
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="flex justify-center p-6" role="status" aria-label="Memuat saluran">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive p-6 text-center text-sm">
            Gagal memuat saluran: {toApiError(error).message}
          </p>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            {query
              ? 'Tidak ada saluran yang cocok.'
              : 'Belum mengikuti saluran. Buka Temukan untuk mencari saluran.'}
          </p>
        ) : (
          <ul>
            {visible.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                selected={channel.id === selectedId}
                onSelect={() => onSelect(channel)}
              />
            ))}
          </ul>
        )}
      </div>
      {!isLoading && !error && (
        <p className="text-muted-foreground border-t px-4 py-2 text-xs">
          {all.length} saluran diikuti
        </p>
      )}
    </div>
  )
}
