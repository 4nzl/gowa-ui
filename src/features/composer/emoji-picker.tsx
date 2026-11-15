import { useMemo, useState } from 'react'
import { Clock, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  EMOJI_CATEGORIES,
  pushRecentEmoji,
  readRecentEmojis,
  searchEmojis,
} from '@/features/composer/emoji-data'
import { cn } from '@/lib/utils'

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState(readRecentEmojis)
  const [tab, setTab] = useState(() => (readRecentEmojis().length ? 'recent' : 'smileys'))
  const results = useMemo(() => searchEmojis(query), [query])

  const pick = (emoji: string) => {
    setRecent(pushRecentEmoji(emoji))
    onPick(emoji)
  }

  const visible = query.trim()
    ? results
    : tab === 'recent'
      ? recent
      : (EMOJI_CATEGORIES.find((category) => category.id === tab)?.emojis.map(([e]) => e) ?? [])
  const title = query.trim()
    ? 'Hasil pencarian'
    : tab === 'recent'
      ? 'Terakhir dipakai'
      : EMOJI_CATEGORIES.find((category) => category.id === tab)?.label

  return (
    <div className="flex w-[min(352px,calc(100vw-24px))] flex-col gap-2">
      <label className="bg-muted flex h-9 items-center gap-2 rounded-full px-3">
        <Search className="text-muted-foreground size-4 shrink-0" />
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari emoji"
          aria-label="Cari emoji"
          className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </label>
      <div role="tablist" aria-label="Kategori emoji" className="flex gap-0.5 overflow-x-auto">
        {recent.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'recent' && !query}
            aria-label="Terakhir dipakai"
            onClick={() => {
              setTab('recent')
              setQuery('')
            }}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-lg',
              tab === 'recent' && !query ? 'bg-accent' : 'hover:bg-accent/60',
            )}
          >
            <Clock className="text-muted-foreground size-4" />
          </button>
        )}
        {EMOJI_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={tab === category.id && !query}
            aria-label={category.label}
            title={category.label}
            onClick={() => {
              setTab(category.id)
              setQuery('')
            }}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-lg text-lg',
              tab === category.id && !query ? 'bg-accent' : 'hover:bg-accent/60',
            )}
          >
            {category.icon}
          </button>
        ))}
      </div>
      <p className="text-muted-foreground px-1 text-xs font-medium">{title}</p>
      <div
        role="grid"
        aria-label={title}
        className="grid h-56 auto-rows-min grid-cols-8 gap-0.5 overflow-y-auto max-[390px]:grid-cols-7"
      >
        {visible.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={emoji}
            onClick={() => pick(emoji)}
            className="hover:bg-accent grid aspect-square place-items-center rounded-lg text-2xl leading-none"
          >
            {emoji}
          </button>
        ))}
        {visible.length === 0 && (
          <p className="text-muted-foreground col-span-full py-6 text-center text-sm">
            Emoji tidak ditemukan.
          </p>
        )}
      </div>
    </div>
  )
}
