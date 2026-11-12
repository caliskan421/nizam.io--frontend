/**
 * Silinen kayıtlar ekran metinleri (`deletedRecords.*`; tek statik ağaç
 * `shared/i18n/tr/deleted-records.ts`). Sunucu `message` alanı gösterilmez.
 */
import { i18n } from '@/shared/i18n'
import type { trDeletedRecords } from '@/shared/i18n/tr/deleted-records'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** Anahtarlar `deletedRecords.` öneki olmadan (`page.title`, `confirm.purgeBody` …). */
export type DeletedTextKey = Leaves<(typeof trDeletedRecords)['deletedRecords']>

export function deletedText(
  key: DeletedTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(`deletedRecords.${key}`, params)
}
