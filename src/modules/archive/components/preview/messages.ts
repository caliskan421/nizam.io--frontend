/**
 * Önizleme ve dosya eylemleri metinleri (`archive.preview.*`, `archive.actions.*`; W124). Ağaç
 * `trArchive`'dedir (tek kök); sunucu `message` alanı gösterilmez (hata metni `errorText`).
 */
import { i18n } from '@/shared/i18n'
import type { trArchive } from '@/shared/i18n/tr/archive'

type Tree = (typeof trArchive)['archive']
type Leaves<T, P extends string> = { [K in keyof T & string]: `${P}.${K}` }[keyof T & string]

export type PreviewTextKey =
  Leaves<Tree['preview'], 'archive.preview'> | Leaves<Tree['actions'], 'archive.actions'>

export function previewText(key: PreviewTextKey, params?: Record<string, string | number>): string {
  return params ? i18n.global.t(key, params) : i18n.global.t(key)
}
