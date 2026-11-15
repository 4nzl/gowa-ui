import { formatBytes } from '@/lib/format'
import type { AppInfo } from '@/api/types'

export type AttachmentKind = 'image' | 'video' | 'audio' | 'document'
export type PickMode = 'media' | 'document' | 'audio'

/**
 * How a picked file is sent. "Foto & Video" sends images and videos as media;
 * anything else picked there, and everything picked as "Dokumen", goes as a file.
 */
export function attachmentKind(file: Pick<File, 'type'>, mode: PickMode): AttachmentKind {
  if (mode === 'document') return 'document'
  if (mode === 'audio') return file.type.startsWith('audio/') ? 'audio' : 'document'
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

export function maxBytesFor(
  kind: AttachmentKind,
  info: Partial<AppInfo> | undefined,
): number | null {
  const limit =
    kind === 'image'
      ? info?.max_image_size
      : kind === 'video'
        ? info?.max_video_size
        : info?.max_file_size
  return typeof limit === 'number' && limit > 0 ? limit : null
}

/** A message for the user when the server would reject the file, else null. */
export function attachmentError(
  file: Pick<File, 'size'>,
  kind: AttachmentKind,
  info: Partial<AppInfo> | undefined,
): string | null {
  if (file.size === 0) return 'Berkas kosong tidak dapat dikirim.'
  const limit = maxBytesFor(kind, info)
  if (limit !== null && file.size > limit) {
    return `Ukuran berkas ${formatBytes(file.size)} melebihi batas server ${formatBytes(limit)}.`
  }
  return null
}

export const KIND_LABELS: Record<AttachmentKind, string> = {
  image: 'Foto',
  video: 'Video',
  audio: 'Audio',
  document: 'Dokumen',
}
