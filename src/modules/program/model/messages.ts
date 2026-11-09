/**
 * Program yönetimi ekran metinleri (`program.*`; tek statik ağaç `shared/i18n/tr/program.ts`,
 * `shared/i18n/index.ts`'e kayıtlı). Sunucu `message` alanı gösterilmez; hata metni kod →
 * `errors.*` (`shared/i18n` `errorText`).
 */
import { i18n } from '@/shared/i18n'
import type { trProgram } from '@/shared/i18n/tr/program'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** Anahtarlar `program.` öneki olmadan (`page.title`, `transfer.preview` …). */
export type ProgramTextKey = Leaves<(typeof trProgram)['program']>

export function programText(
  key: ProgramTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(`program.${key}`, params)
}

const UNITS = ['b', 'kb', 'mb', 'gb'] as const

/** Bayt → okunur boyut (1024 tabanı, tek ondalık; TR ondalık ayırıcı). */
export function formatBytes(bytes: number): string {
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  const n = unit === 0 ? String(Math.round(value)) : value.toFixed(1).replace('.', ',')
  return programText(`size.${UNITS[unit]!}`, { n })
}
