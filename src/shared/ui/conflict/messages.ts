import { i18n } from '@/shared/i18n'

/**
 * Alan alan çakışma seçimi metinleri (`conflict.*`; K5, istemci-akislari §8 "Düzenleme
 * sürümü"). Alan adları ekranın kendi etiketleridir (çağıran çevirir); değerler kaydın
 * kendisidir. Sunucu `message` alanı gösterilmez.
 */
export const trConflict = {
  conflict: {
    title: 'Değişiklikler çakıştı',
    description:
      'Siz düzenlerken kayıt başka biri tarafından değiştirildi. Her alan için kalacak değeri seçin.',
    mine: 'Benim değerim',
    theirs: 'Güncel değer',
    choice: '{field}: kalacak değer',
    empty: '(boş)',
    submit: 'Seçimle kaydet',
    cancel: 'Vazgeç',
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trConflict)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type ConflictTextKey = Leaves<typeof trConflict>

/** `conflict.*` metni (TR). */
export function conflictText(key: ConflictTextKey, params: Record<string, string> = {}): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
