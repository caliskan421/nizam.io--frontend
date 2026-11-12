import { i18n } from '@/shared/i18n'
import type { trArchive } from '@/shared/i18n/tr/archive'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** 07 dalları (`archive.folder|tree|tasks|files.*`), `archive.` öneki olmadan. */
export type FolderTextKey = Extract<
  Leaves<(typeof trArchive)['archive']>,
  `${'folder' | 'tree' | 'tasks' | 'files' | 'shared' | 'type'}.${string}`
>

/** 07 metni (TR; statik ağaç `shared/i18n/tr/archive.ts`). */
export function folderText(key: FolderTextKey, params: Record<string, string | number> = {}) {
  return i18n.global.t(`archive.${key}`, params)
}
