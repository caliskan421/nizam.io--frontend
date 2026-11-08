import { i18n } from '@/shared/i18n'

/**
 * Onay ve yazma sonucu bildirim metinleri (`confirm.*`). Protokol metinleri (`mutation.*`,
 * `src/shared/i18n/tr/mutation.ts`) burada tekrar edilmez, oradan okunur. Sunucu `message`
 * alanı kullanıcıya gösterilmez; tek istisna 409 `organization.confirmation_required`
 * zarfındaki görev BAŞLIKLARIDIR (veri; `shared/errors/confirmation.ts`).
 */
export const trConfirm = {
  confirm: {
    cancel: 'Vazgeç',
    impact: {
      items: 'Atamadan düşecek görevler',
      // MembershipChange: `unassigned_tasks` devredilen aktif atama sayısı (ORGANIZATION-K18).
      result: 'İşlem tamamlandı; {n} görevdeki atama devredildi.',
    },
    conflict: {
      fields: 'Değişen alanlar',
      // ortak-kurallar §7, K5: alan alan seçim diyaloğu F1'de.
      later: 'Alan alan karşılaştırma F1’de açılacak; şimdilik kaydı yenileyip yeniden düzenleyin.',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trConfirm)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type ConfirmTextKey = Leaves<typeof trConfirm>

/** `confirm.*` metni (TR). */
export function confirmText(
  key: ConfirmTextKey,
  params: Record<string, string | number> = {},
): string {
  ensureMerged()
  return i18n.global.t(key, params)
}

/** Yazma protokolü metni (`mutation.*`; anahtar `outcomeMessage()`'tan ya da eylem adı). */
export function mutationText(key: string, params: Record<string, number> = {}): string {
  return i18n.global.t(key, params)
}
