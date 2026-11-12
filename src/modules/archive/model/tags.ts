/**
 * P34 etiket sözlüğü: kapalı küme (`attachFile.tag` enum'u) Türkçe ad + sabit token rengi.
 * Tasarımdaki "Saha görselleri" vb. adlar kullanılmaz; serbest etiket oluşturma yoktur (BE-024).
 * `FileListItem.tag` şemada serbest dizgedir: bilinmeyen etiket nötr gösterilir ve süzgece
 * gönderilmez (sunucu küme dışını 422 `records.tag_invalid` ile reddeder).
 */
import type { TokenName } from '@/shared/tokens/tokens.gen'

import type { ArchiveTag } from './types'

/** Sözleşme sırası (`ister, plan, girdi, analiz, cikti, sonuc`). */
export const ARCHIVE_TAGS: readonly ArchiveTag[] = [
  'ister',
  'plan',
  'girdi',
  'analiz',
  'cikti',
  'sonuc',
]

export const TAG_LABELS: Readonly<Record<ArchiveTag, string>> = {
  ister: 'İster',
  plan: 'Plan',
  girdi: 'Girdi',
  analiz: 'Analiz',
  cikti: 'Çıktı',
  sonuc: 'Sonuç',
}

/** Etiket noktası/rozeti rengi: yalnız token adı (kullanan `cssVar` ile çözer). */
export const TAG_TONES: Readonly<Record<ArchiveTag, TokenName>> = {
  ister: 'avatar-3',
  plan: 'avatar-4',
  girdi: 'violet',
  analiz: 'avatar-6',
  cikti: 'avatar-5',
  sonuc: 'accent-text',
}

/** Bilinmeyen etiketin nötr rengi. */
export const NEUTRAL_TAG_TONE: TokenName = 'ink-muted'

export function isArchiveTag(value: unknown): value is ArchiveTag {
  return typeof value === 'string' && (ARCHIVE_TAGS as readonly string[]).includes(value)
}

export interface TagView {
  /** Bilinen etiket: Türkçe ad; bilinmeyen: ham değer (kullanıcıya olduğu gibi, nötr). */
  label: string
  tone: TokenName
  known: boolean
}

export function tagView(tag: string): TagView {
  if (isArchiveTag(tag)) return { label: TAG_LABELS[tag], tone: TAG_TONES[tag], known: true }
  return { label: tag, tone: NEUTRAL_TAG_TONE, known: false }
}
