import { useMemo, useState } from 'react'
import { Lock, Megaphone, RefreshCw, Search, X } from 'lucide-react'
import type { MyGroup } from '@/api/group'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChatAvatar } from '@/features/chat/chat-avatar'
import { filterGroups, groupSubtitle, groupTitle } from '@/features/group/group-display'
import { toApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'

function GroupRow({
  group,
  selected,
  onSelect,
}: {
  group: MyGroup
  selected: boolean
  onSelect: () => void
}) {
  const title = groupTitle(group)
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'flex min-h-[72px] w-full items-center gap-3 px-3 text-left transition-colors',
          'focus-visible:ring-ring outline-none focus-visible:ring-2 focus-visible:ring-inset',
          selected ? 'bg-accent' : 'hover:bg-accent/60',
        )}
      >
        <ChatAvatar jid={group.JID} name={title} className="size-12 text-lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 border-b py-3">
          <span className="truncate text-[15.5px] font-medium">{title}</span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-[13.5px]">
            <span className="truncate">{groupSubtitle(group)}</span>
            {group.IsAnnounce && (
              <Megaphone
                className="size-3.5 shrink-0"
                aria-label="Hanya admin yang dapat mengirim pesan"
              />
            )}
            {group.IsLocked && (
              <Lock
                className="size-3.5 shrink-0"
                aria-label="Hanya admin yang dapat mengubah info grup"
              />
            )}
          </span>
        </span>
      </button>
    </li>
  )
}

/** Searchable list of the device's groups; data comes from the page's query. */
export function GroupList({
  groups,
  isLoading,
  isFetching,
  error,
  onRetry,
  selectedJid,
  onSelect,
}: {
  groups: readonly MyGroup[] | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  onRetry: () => void
  selectedJid: string | null
  onSelect: (group: MyGroup) => void
}) {
  const [search, setSearch] = useState('')
  const visible = useMemo(() => filterGroups(groups ?? [], search), [groups, search])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-3 pb-2">
        <label className="bg-muted flex h-10 items-center gap-2 rounded-full px-3.5">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama grup atau JID"
            aria-label="Cari grup"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {search && (
            <button type="button" aria-label="Hapus pencarian" onClick={() => setSearch('')}>
              <X className="text-muted-foreground size-4" />
            </button>
          )}
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <ul role="status" aria-label="Memuat grup">
            {[0, 1, 2, 3].map((index) => (
              <li key={index} className="flex min-h-[72px] items-center gap-3 px-3">
                <Skeleton className="size-12 rounded-full" />
                <span className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </span>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-destructive text-sm">
              Gagal memuat grup: {toApiError(error).message}
            </p>
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="size-4" />
              Coba lagi
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            {groups && groups.length > 0
              ? 'Tidak ada grup yang cocok.'
              : 'Belum ada grup. Buat grup baru atau gabung lewat tautan undangan.'}
          </p>
        ) : (
          <ul>
            {visible.map((group) => (
              <GroupRow
                key={group.JID}
                group={group}
                selected={group.JID === selectedJid}
                onSelect={() => onSelect(group)}
              />
            ))}
          </ul>
        )}
      </div>
      <p className="text-muted-foreground flex items-center justify-between gap-2 border-t px-4 py-2 text-xs">
        <span>
          {groups
            ? search.trim()
              ? `${visible.length} dari ${groups.length} grup`
              : `${groups.length} grup`
            : 'Memuat…'}
        </span>
        {isFetching && !isLoading && <span>Memperbarui…</span>}
      </p>
    </div>
  )
}
