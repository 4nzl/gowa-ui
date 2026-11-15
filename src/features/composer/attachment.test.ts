import { describe, expect, it } from 'vitest'
import { attachmentError, attachmentKind, maxBytesFor } from '@/features/composer/attachment'

const info = { max_image_size: 20_000_000, max_video_size: 100_000_000, max_file_size: 50_000_000 }

describe('attachmentKind', () => {
  it('sends photos and videos from the media picker as media', () => {
    expect(attachmentKind({ type: 'image/jpeg' }, 'media')).toBe('image')
    expect(attachmentKind({ type: 'video/mp4' }, 'media')).toBe('video')
  })

  it('falls back to a document for anything else', () => {
    expect(attachmentKind({ type: 'image/svg+xml' }, 'media')).toBe('document')
    expect(attachmentKind({ type: 'application/pdf' }, 'media')).toBe('document')
    expect(attachmentKind({ type: 'image/jpeg' }, 'document')).toBe('document')
    expect(attachmentKind({ type: 'audio/mpeg' }, 'audio')).toBe('audio')
    expect(attachmentKind({ type: 'text/plain' }, 'audio')).toBe('document')
  })
})

describe('attachment limits', () => {
  it('uses the server limit for each kind', () => {
    expect(maxBytesFor('image', info)).toBe(20_000_000)
    expect(maxBytesFor('video', info)).toBe(100_000_000)
    expect(maxBytesFor('audio', info)).toBe(50_000_000)
    expect(maxBytesFor('image', undefined)).toBeNull()
  })

  it('rejects empty and oversized files with a readable reason', () => {
    expect(attachmentError({ size: 0 }, 'image', info)).toMatch(/kosong/)
    expect(attachmentError({ size: 25_000_000 }, 'image', info)).toMatch(/melebihi batas/)
    expect(attachmentError({ size: 1_000 }, 'image', info)).toBeNull()
    expect(attachmentError({ size: 1_000 }, 'image', undefined)).toBeNull()
  })
})
