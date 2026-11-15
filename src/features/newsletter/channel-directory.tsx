import { useState, type FormEvent } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Compass, Loader2, Search, X } from 'lucide-react'
import {
  searchNewsletterDirectory,
  type DirectoryParams,
  type DirectoryView,
  type NewsletterMetadata,
} from '@/api/newsletter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSelectedDevice } from '@/hooks/use-device-guard'
import { toApiError } from '@/lib/api-error'
import { trackedQueryFn } from '@/lib/private-query'
import { useConnection } from '@/stores/connection'
import { useFollowedNewsletters } from '@/features/newsletter/channel'
import {
  ANY_CATEGORY,
  DIRECTORY_CATEGORIES,
  DIRECTORY_VIEWS,
  directoryParams,
} from '@/features/newsletter/channel-filters'
import { ChannelRow } from '@/features/newsletter/channel-summary'

/** List-pane body for the "Temukan" tab: directory browse/search with cursor paging. */
export function ChannelDirectory({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (channel: NewsletterMetadata) => void
}) {
  const device = useSelectedDevice()
  const connectionId = useConnection((state) => state.connectionId)
  const followed = useFollowedNewsletters()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<DirectoryView>('RECOMMENDED')
  const [countries, setCountries] = useState('')
  const [category, setCategory] = useState(ANY_CATEGORY)
  const [params, setParams] = useState<DirectoryParams | null>(null)
  const searching = search.trim() !== ''

  const query = useInfiniteQuery({
    queryKey: ['newsletter-directory', device, params, connectionId],
    queryFn: ({ pageParam }) =>
      trackedQueryFn(connectionId, () =>
        searchNewsletterDirectory({ ...params, cursor: pageParam }),
      )(),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    enabled: !!device && !!params && connectionId !== null,
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setParams(directoryParams({ search, view, countries, category }))
  }

  const channels = query.data?.pages.flatMap((page) => page.data ?? []) ?? []
  const followedIds = new Set(followed.data?.data?.map((item) => item.id))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form className="flex flex-col gap-2.5 border-b px-3 pb-3" onSubmit={onSubmit}>
        <label className="bg-muted flex h-10 items-center gap-2 rounded-full px-3.5">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama saluran (opsional)"
            aria-label="Cari nama saluran"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {search && (
            <button type="button" aria-label="Hapus pencarian" onClick={() => setSearch('')}>
              <X className="text-muted-foreground size-4" />
            </button>
          )}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground text-xs">Daftar</Label>
            <Select
              value={view}
              onValueChange={(value) => setView(value as DirectoryView)}
              disabled={searching}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIRECTORY_VIEWS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-muted-foreground text-xs">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_CATEGORY}>Semua kategori</SelectItem>
                {DIRECTORY_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Label htmlFor="directory-countries" className="text-muted-foreground text-xs">
              Negara
            </Label>
            <Input
              id="directory-countries"
              className="h-8"
              placeholder="ID, BR"
              pattern="\s*[A-Za-z]{2}([\s,]+[A-Za-z]{2})*[\s,]*"
              title="Kode negara dua huruf dipisah koma, mis. ID, BR"
              value={countries}
              onChange={(event) => setCountries(event.target.value)}
              disabled={searching}
              required={!searching}
            />
          </div>
          <Button type="submit" disabled={query.isFetching}>
            {query.isFetching && !query.isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : searching ? (
              <Search className="size-4" />
            ) : (
              <Compass className="size-4" />
            )}
            {searching ? 'Cari' : 'Jelajahi'}
          </Button>
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!params ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Cari saluran berdasarkan nama, atau pilih daftar dan negara lalu tekan Jelajahi.
          </p>
        ) : query.isLoading ? (
          <div className="flex justify-center p-6" role="status" aria-label="Memuat direktori">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : query.error ? (
          <p className="text-destructive p-6 text-center text-sm">
            Gagal memuat direktori: {toApiError(query.error).message}
          </p>
        ) : channels.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Tidak ada saluran ditemukan.
          </p>
        ) : (
          <ul>
            {channels.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                followed={followedIds.has(channel.id)}
                selected={channel.id === selectedId}
                onSelect={() => onSelect(channel)}
              />
            ))}
          </ul>
        )}
        {query.hasNextPage && (
          <div className="flex justify-center py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
              Muat lainnya
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
