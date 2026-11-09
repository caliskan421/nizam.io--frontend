/**
 * Alt görev ekran metinleri (`subtasks.*`; 03 `ozellikler.md` §2.8, §3-B/C, §5). Sunucu
 * `message` alanı gösterilmez: yazma sonucu metinleri `shared/ui/confirm` (`notifyOutcome`,
 * hata kodu → `errors.*`) üretir. E-03-30: yalnız "Kişi ve tarih isteğe bağlıdır." (P5 — alt
 * görev kanıt/zorunluluk kuralı sözleşmede yok, BE-006).
 */
import { i18n } from '@/shared/i18n'
import { trSubtasks } from '@/shared/i18n/tr/work'

export { trSubtasks }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type SubtaskTextKey = Leaves<typeof trSubtasks>

/** `subtasks.*` metni (TR). */
export function subtaskText(
  key: SubtaskTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}
