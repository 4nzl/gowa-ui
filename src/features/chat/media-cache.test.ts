import { describe, expect, it } from 'vitest'
import {
  MEDIA_CACHE_LIMIT,
  forgetCachedMedia,
  mediaCacheKey,
  readCachedMedia,
  writeCachedMedia,
} from '@/features/chat/media-cache'

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size
    },
  }
}

describe('media path cache', () => {
  it('scopes entries by server, device and message', () => {
    const storage = memoryStorage()
    const key = mediaCacheKey('http://a', 'dev-1', 'msg')
    writeCachedMedia(key, { path: 'statics/media/x.jpg', filename: 'x.jpg' }, storage, 1)
    expect(readCachedMedia(key, storage)?.path).toBe('statics/media/x.jpg')
    expect(readCachedMedia(mediaCacheKey('http://a', 'dev-2', 'msg'), storage)).toBeNull()
    expect(readCachedMedia(mediaCacheKey('http://b', 'dev-1', 'msg'), storage)).toBeNull()
  })

  it('forgets a path that stopped loading', () => {
    const storage = memoryStorage()
    writeCachedMedia('k', { path: 'p', filename: 'f' }, storage)
    forgetCachedMedia('k', storage)
    expect(readCachedMedia('k', storage)).toBeNull()
  })

  it('evicts the oldest entries beyond the limit', () => {
    const storage = memoryStorage()
    for (let index = 0; index <= MEDIA_CACHE_LIMIT; index++) {
      writeCachedMedia(`k${index}`, { path: `p${index}`, filename: 'f' }, storage, index)
    }
    expect(readCachedMedia('k0', storage)).toBeNull()
    expect(readCachedMedia(`k${MEDIA_CACHE_LIMIT}`, storage)?.path).toBe(`p${MEDIA_CACHE_LIMIT}`)
  })

  it('survives corrupt storage', () => {
    const storage = memoryStorage()
    storage.setItem('gowa-ui.media-paths.v1', '{not json')
    expect(readCachedMedia('k', storage)).toBeNull()
  })
})
