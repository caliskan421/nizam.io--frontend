/**
 * Dosyalar bileşenlerinin ekran metinleri (`workFiles.*`; W46). Sunucu `message` alanı
 * gösterilmez: hata metni kod → `errors.*` (`shared/i18n` `errorText`, `shared/ui/confirm`
 * `outcomeText`).
 */
import { i18n } from '@/shared/i18n'
import { trWorkFiles } from '@/shared/i18n/tr/work'

export { trWorkFiles }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type FilesTextKey = Leaves<typeof trWorkFiles>

/** `workFiles.*` metni (TR). */
export function filesText(key: FilesTextKey, params?: Record<string, string | number>): string {
  return params ? i18n.global.t(key, params) : i18n.global.t(key)
}
