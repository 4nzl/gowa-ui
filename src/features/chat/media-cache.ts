/**
 * Remembers where GOWA stored a message's downloaded media.
 *
 * GOWA's /message/:id/download fetches from the WhatsApp CDN and writes a new
 * file on every call, so reopening a chat must reuse the earlier file instead
 * of downloading again. Entries are scoped by server + device + message and
 * capped; a path that no longer loads is dropped by the caller.
 */
const STORAGE_KEY = 'gowa-ui.media-paths.v1'
export const MEDIA_CACHE_LIMIT = 500

export interface CachedMedia {
  path: string
  filename: string
  savedAt: number
}

type CacheShape = Record<string, CachedMedia>

export function mediaCacheKey(baseUrl: string, deviceId: string, messageId: string): string {
  return `${baseUrl}|${deviceId}|${messageId}`
}

function load(storage: Storage | null): CacheShape {
  if (!storage) return {}
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as unknown
    return parsed && typeof parsed === 'object' ? (parsed as CacheShape) : {}
  } catch {
    return {}
  }
}

function save(storage: Storage | null, cache: CacheShape) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Storage full or blocked: the cache is an optimisation only.
  }
}

function defaultStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readCachedMedia(key: string, storage = defaultStorage()): CachedMedia | null {
  return load(storage)[key] ?? null
}

export function writeCachedMedia(
  key: string,
  media: Omit<CachedMedia, 'savedAt'>,
  storage = defaultStorage(),
  now = Date.now(),
) {
  const cache = load(storage)
  cache[key] = { ...media, savedAt: now }
  const keys = Object.keys(cache)
  if (keys.length > MEDIA_CACHE_LIMIT) {
    keys
      .sort((left, right) => cache[left].savedAt - cache[right].savedAt)
      .slice(0, keys.length - MEDIA_CACHE_LIMIT)
      .forEach((stale) => delete cache[stale])
  }
  save(storage, cache)
}

export function forgetCachedMedia(key: string, storage = defaultStorage()) {
  const cache = load(storage)
  if (!(key in cache)) return
  delete cache[key]
  save(storage, cache)
}
