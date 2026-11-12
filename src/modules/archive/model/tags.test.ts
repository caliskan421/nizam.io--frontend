import { describe, expect, it } from 'vitest'

import { TOKENS } from '@/shared/tokens/tokens.gen'

import {
  ARCHIVE_TAGS,
  NEUTRAL_TAG_TONE,
  TAG_LABELS,
  TAG_TONES,
  isArchiveTag,
  tagView,
} from './tags'

describe('P34 etiket sözlüğü', () => {
  it('kapalı küme sözleşme sırasında ve Türkçe adlarla', () => {
    expect(ARCHIVE_TAGS).toEqual(['ister', 'plan', 'girdi', 'analiz', 'cikti', 'sonuc'])
    expect(ARCHIVE_TAGS.map((tag) => TAG_LABELS[tag])).toEqual([
      'İster',
      'Plan',
      'Girdi',
      'Analiz',
      'Çıktı',
      'Sonuç',
    ])
  })

  it('tasarımdaki serbest etiket adları kullanılmaz', () => {
    const labels = Object.values(TAG_LABELS).join('|')
    for (const banned of ['Saha görselleri', 'Sonuç dosyası', 'Güncel durum verisi']) {
      expect(labels).not.toContain(banned)
    }
  })

  it('her etiket gerçek bir token rengine bağlı; renkler tekil', () => {
    const tones = ARCHIVE_TAGS.map((tag) => TAG_TONES[tag])
    for (const tone of [...tones, NEUTRAL_TAG_TONE]) expect(Object.hasOwn(TOKENS, tone)).toBe(true)
    expect(new Set(tones).size).toBe(tones.length)
    expect(tones).not.toContain(NEUTRAL_TAG_TONE)
  })

  it('bilinmeyen etiket nötr gösterilir ve süzgece uygun sayılmaz', () => {
    expect(tagView('sonuc')).toEqual({ label: 'Sonuç', tone: TAG_TONES.sonuc, known: true })
    expect(tagView('saha')).toEqual({ label: 'saha', tone: NEUTRAL_TAG_TONE, known: false })
    expect(isArchiveTag('saha')).toBe(false)
    expect(isArchiveTag(undefined)).toBe(false)
  })
})
