import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileText, ImageOff, Loader2, Play, RotateCw } from 'lucide-react'
import { downloadMedia } from '@/api/message'
import { Button } from '@/components/ui/button'
import {
  forgetCachedMedia,
  mediaCacheKey,
  readCachedMedia,
  writeCachedMedia,
} from '@/features/chat/media-cache'
import { autoLoads } from '@/features/chat/chat-format'
import { MediaViewer, type ViewerMedia } from '@/features/chat/media-viewer'
import { useAppInfo } from '@/hooks/use-app-info'
import { assertActiveConnection } from '@/lib/connection-guard'
import { toApiError } from '@/lib/api-error'
import { formatBytes } from '@/lib/format'
import { rerootServerUrl } from '@/lib/url'
import { cn } from '@/lib/utils'
import { useConnection } from '@/stores/connection'
import type { MessageInfo } from '@/api/chat'

const MAX_PARALLEL_DOWNLOADS = 3

// Every GOWA download hits the WhatsApp CDN and writes a file; keep it gentle.
let running = 0
const waiting: (() => void)[] = []
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL_DOWNLOADS) await new Promise<void>((resolve) => waiting.push(resolve))
  running++
  try {
    return await task()
  } finally {
    running--
    waiting.shift()?.()
  }
}

type MediaState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; src: string; filename: string }
  | { status: 'error'; message: string }

function useMessageMedia(message: MessageInfo, deviceId: string) {
  const baseUrl = useConnection((state) => state.baseUrl) ?? ''
  const connectionId = useConnection((state) => state.connectionId)
  const basePath = useAppInfo().data?.base_path ?? ''
  const cacheKey = mediaCacheKey(baseUrl, deviceId, message.id)
  const toSrc = useCallback(
    (path: string) => rerootServerUrl(baseUrl, path, basePath),
    [baseUrl, basePath],
  )
  const [state, setState] = useState<MediaState>(() => {
    const cached = readCachedMedia(cacheKey)
    return cached
      ? { status: 'ready', src: toSrc(cached.path), filename: cached.filename }
      : { status: 'idle' }
  })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const result = await limited(() => {
        assertActiveConnection(connectionId)
        return downloadMedia(message.id, message.chat_jid, deviceId)
      })
      assertActiveConnection(connectionId)
      writeCachedMedia(cacheKey, { path: result.file_path, filename: result.filename })
      setState({ status: 'ready', src: toSrc(result.file_path), filename: result.filename })
    } catch (error) {
      setState({ status: 'error', message: toApiError(error).message })
    }
  }, [cacheKey, connectionId, deviceId, message.chat_jid, message.id, toSrc])

  /** A cached file that no longer loads (deleted on the server): fetch it once more. */
  const reloadAfterBrokenCache = useCallback(() => {
    forgetCachedMedia(cacheKey)
    void load()
  }, [cacheKey, load])

  return { state, load, reloadAfterBrokenCache }
}

function MediaError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-background/60 mt-1 flex items-center gap-2 rounded-lg p-2 text-xs">
      <ImageOff className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground min-w-0 flex-1">
        Media tidak dapat dimuat. Bisa jadi sudah kedaluwarsa di server WhatsApp.
        <span className="sr-only"> {message}</span>
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Coba lagi"
        onClick={onRetry}
      >
        <RotateCw className="size-3.5" />
      </Button>
    </div>
  )
}

function VisualMedia({ message, deviceId }: { message: MessageInfo; deviceId: string }) {
  const { state, load, reloadAfterBrokenCache } = useMessageMedia(message, deviceId)
  const holder = useRef<HTMLDivElement>(null)
  const retried = useRef(false)
  const auto = autoLoads(message)
  const sticker = message.media_type === 'sticker'
  const [viewer, setViewer] = useState<ViewerMedia | null>(null)

  useEffect(() => {
    if (!auto || state.status !== 'idle' || !holder.current) return
    if (typeof IntersectionObserver === 'undefined') {
      void load()
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          void load()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(holder.current)
    return () => observer.disconnect()
  }, [auto, load, state.status])

  if (state.status === 'ready') {
    const image = (
      <img
        src={state.src}
        alt={sticker ? 'Stiker' : message.content || message.filename || 'Gambar'}
        loading="lazy"
        onError={() => {
          if (retried.current) return
          retried.current = true
          reloadAfterBrokenCache()
        }}
        className={cn(
          'rounded-md object-cover',
          sticker ? 'size-36 object-contain' : 'max-h-80 w-full max-w-[320px]',
        )}
      />
    )
    if (sticker) return <div className="mt-0.5">{image}</div>
    return (
      <>
        <button
          type="button"
          className="mt-0.5 block cursor-zoom-in"
          aria-label="Lihat foto asli"
          onClick={() =>
            setViewer({
              kind: 'image',
              src: state.src,
              filename: message.filename || state.filename,
              caption: message.content,
            })
          }
        >
          {image}
        </button>
        <MediaViewer media={viewer} onOpenChange={(open) => !open && setViewer(null)} />
      </>
    )
  }

  if (state.status === 'error')
    return <MediaError message={state.message} onRetry={() => void load()} />

  return (
    <div
      ref={holder}
      className={cn(
        'bg-background/50 mt-0.5 grid place-items-center rounded-md',
        sticker ? 'size-36' : 'aspect-[4/3] w-[min(320px,60vw)]',
      )}
    >
      {state.status === 'loading' || auto ? (
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      ) : (
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          <Download className="size-4" />
          Gambar{message.file_length ? ` · ${formatBytes(message.file_length)}` : ''}
        </Button>
      )}
    </div>
  )
}

function TapToLoadMedia({ message, deviceId }: { message: MessageInfo; deviceId: string }) {
  const { state, load } = useMessageMedia(message, deviceId)
  const type = message.media_type
  const size = message.file_length ? formatBytes(message.file_length) : ''
  const isVideo = type === 'video' || type === 'ptv'
  const [viewer, setViewer] = useState<ViewerMedia | null>(null)
  // A tap on an undownloaded video downloads it and then plays it in the viewer.
  const playWhenReady = useRef(false)
  const openVideo = useCallback(
    (src: string, filename: string) =>
      setViewer({
        kind: 'video',
        src,
        filename: message.filename || filename,
        caption: message.content,
      }),
    [message.content, message.filename],
  )

  useEffect(() => {
    if (state.status !== 'ready' || !playWhenReady.current) return
    playWhenReady.current = false
    openVideo(state.src, state.filename)
  }, [openVideo, state])

  if (state.status === 'ready') {
    if (type === 'video' || type === 'ptv') {
      return (
        <>
          <button
            type="button"
            aria-label="Putar video"
            className="relative mt-0.5 block w-full max-w-[320px] overflow-hidden rounded-md bg-black"
            onClick={() => openVideo(state.src, state.filename)}
          >
            <video
              src={state.src}
              preload="metadata"
              muted
              playsInline
              className="max-h-80 w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/20">
              <span className="grid size-14 place-items-center rounded-full bg-black/55 text-white">
                <Play className="ml-0.5 size-7 fill-current" />
              </span>
            </span>
          </button>
          <MediaViewer media={viewer} onOpenChange={(open) => !open && setViewer(null)} />
        </>
      )
    }
    if (type === 'audio' || type === 'ptt') {
      return <audio src={state.src} controls className="mt-1 w-[min(280px,60vw)]" />
    }
    return (
      <a
        href={state.src}
        target="_blank"
        rel="noreferrer"
        className="bg-background/60 mt-1 flex items-center gap-3 rounded-lg p-2.5 hover:underline"
      >
        <FileText className="text-primary size-8 shrink-0" />
        <span className="min-w-0 text-sm [overflow-wrap:anywhere]">
          {message.filename || state.filename || 'Dokumen'}
        </span>
      </a>
    )
  }

  if (state.status === 'error')
    return <MediaError message={state.message} onRetry={() => void load()} />

  const label =
    type === 'video' || type === 'ptv'
      ? 'Video'
      : type === 'audio' || type === 'ptt'
        ? 'Pesan suara'
        : message.filename || 'Dokumen'
  const Icon =
    type === 'video' || type === 'ptv' || type === 'audio' || type === 'ptt' ? Play : FileText

  return (
    <button
      type="button"
      disabled={state.status === 'loading'}
      onClick={() => {
        playWhenReady.current = isVideo
        void load()
      }}
      className="bg-background/60 hover:bg-background/80 mt-1 flex w-full max-w-[320px] items-center gap-3 rounded-lg p-2.5 text-left"
    >
      <span className="bg-primary/12 text-primary grid size-9 shrink-0 place-items-center rounded-full">
        {state.status === 'loading' ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Icon className="size-4" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="text-muted-foreground block text-xs">
          {size ? `${size} · ` : ''}ketuk untuk mengunduh
        </span>
      </span>
    </button>
  )
}

/** Media inside a bubble: images and stickers load on sight, other media on tap. */
export function MessageMedia({ message, deviceId }: { message: MessageInfo; deviceId: string }) {
  return message.media_type === 'image' || message.media_type === 'sticker' ? (
    <VisualMedia message={message} deviceId={deviceId} />
  ) : (
    <TapToLoadMedia message={message} deviceId={deviceId} />
  )
}
