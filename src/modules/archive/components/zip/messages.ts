import { i18n } from '@/shared/i18n'
import { trArchive } from '@/shared/i18n/tr/archive'

/** `archive.zip.*` alt ağacı (tek kök ağaç `trArchive`; KESİN 24). */
export const trZip = trArchive.archive.zip

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type ZipTextKey = Leaves<typeof trZip>

/** `archive.zip.*` metni (TR). */
export function zipText(key: ZipTextKey): string {
  return i18n.global.t(`archive.zip.${key}`)
}
