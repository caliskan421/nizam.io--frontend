/**
 * Görev modülünün veri katmanı metinleri (`work.*`). Sunucu `message` alanı kullanıcıya
 * gösterilmez; hata metni kod → `errors.*` (`shared/i18n`). Ekran metinleri bileşen
 * sahiplerinindir (O2b); burada yalnız veri katmanının ürettiği sonuç cümleleri durur.
 */
import type { CompositeOutcome } from '@/shared/http/mutation'
import { i18n } from '@/shared/i18n'

export const trWork = {
  work: {
    create: {
      // ortak-kurallar §7, CX-S-03: ilk yanıtın gerçek durumu söylenir; ilk atanan korunur.
      partial: 'Görev oluşturuldu, ek atama yapılamadı.',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trWork)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type WorkTextKey = Leaves<typeof trWork>

/** `work.*` metni (TR). */
export function workText(key: WorkTextKey): string {
  ensureMerged()
  return i18n.global.t(key)
}

/**
 * Yeni görev bileşik sonucunun ek metni: `partial` → "Görev oluşturuldu, ek atama
 * yapılamadı."; diğerlerinde `null` (birincil hata çağıranda `outcomeText` ile gösterilir).
 */
export function createPartialText(outcome: CompositeOutcome<unknown, unknown, unknown>) {
  return outcome.kind === 'partial' ? workText('work.create.partial') : null
}
