import { i18n } from '@/shared/i18n'

/**
 * `shared/ui` bileşenlerinin kendi metinleri (`ui.*`). Ekran metni bileşene prop olarak gelir;
 * burada yalnız bileşenin kendi denetimlerinin erişim adları ve nötr yer tutucular durur.
 * Anahtarlar ilk kullanımda vue-i18n ağacına eklenir (i18n dizini başka uygulayıcıda).
 */
export const trUi = {
  ui: {
    modal: { close: 'Kapat' },
    chip: { remove: 'Kaldır' },
    toast: { dismiss: 'Bildirimi kapat' },
    error: { requestId: 'İstek kimliği', retry: 'Yeniden dene' },
    placeholder: { empty: 'Henüz veri yok', soon: 'Yakında' },
    stub: { hint: 'Yakında: sunucu desteği bekleniyor' },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trUi)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type UiTextKey = Leaves<typeof trUi>

/** `ui.*` metni (TR). */
export function uiText(key: UiTextKey): string {
  ensureMerged()
  return i18n.global.t(key)
}
