import { describe, expect, it } from 'vitest'

import {
  ARCHIVE_KINDS,
  PREVIEW_MAX_BYTES,
  canPreview,
  formatBytes,
  isArchiveKind,
  isPreviewableImage,
  mimeCategoryOf,
  typeBadge,
} from './mime'

describe('tur segmenti → mime_category (E-06-07)', () => {
  it('yalnız Tümü/Görsel/Belge; PDF ayrı gönderilmez', () => {
    expect(ARCHIVE_KINDS).toEqual(['tumu', 'gorsel', 'belge'])
    expect(mimeCategoryOf('tumu')).toBeNull()
    expect(mimeCategoryOf(undefined)).toBeNull()
    expect(mimeCategoryOf('gorsel')).toBe('gorsel')
    expect(mimeCategoryOf('belge')).toBe('belge')
    expect(isArchiveKind('pdf')).toBe(false)
    expect(isArchiveKind('belge')).toBe(true)
  })
})

describe('content_type → tür rozeti', () => {
  it.each([
    ['image/png', 'IMG'],
    ['application/pdf', 'PDF'],
    ['application/msword', 'DOC'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOC'],
    ['application/vnd.ms-excel', 'XLS'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'XLS'],
    ['text/csv', 'XLS'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'PPT'],
    ['text/plain', 'TXT'],
    ['application/zip', 'ZIP'],
    ['application/x-bilinmeyen', 'DOSYA'],
  ])('%s → %s', (contentType, badge) => {
    expect(typeBadge(contentType)).toBe(badge)
  })
})

describe('önizleme uygunluğu', () => {
  it('yalnız raster görsel ve sınır içinde; SVG/HTML/PDF değil', () => {
    expect(isPreviewableImage('image/png')).toBe(true)
    expect(isPreviewableImage('IMAGE/JPEG; charset=binary')).toBe(true)
    expect(isPreviewableImage('image/svg+xml')).toBe(false)
    expect(isPreviewableImage('text/html')).toBe(false)
    expect(isPreviewableImage('application/pdf')).toBe(false)
    expect(canPreview({ content_type: 'image/webp', size_bytes: 10 })).toBe(true)
    expect(canPreview({ content_type: 'image/webp', size_bytes: PREVIEW_MAX_BYTES + 1 })).toBe(
      false,
    )
  })
})

describe('boyut biçimi', () => {
  it('ondalık virgül, bir basamak', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1,5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5,0 MB')
    expect(formatBytes(-1)).toBe('—')
    expect(formatBytes(Number.NaN)).toBe('—')
  })
})
