import { i18n } from '@/shared/i18n'

/**
 * Açık durum metinleri (`states.*`; K7, 00-ortak `mekanizma.md` §6). Tasarımda karşılığı yoktur
 * ("tasarımda yok, K7 varsayılanı"); metin istemcidedir, sunucu `message` alanı kullanılmaz.
 * Başlıklar rota kataloğundan (`OPEN_STATES[...].title`) gelir, burada tekrar edilmez.
 */
export const trStates = {
  states: {
    noProgram: {
      admin: 'Görevler ve ekipler bir programa bağlıdır. İlk programı oluşturarak başlayın.',
      other:
        'Erişebildiğiniz bir program bulunmuyor. Yöneticiniz sizi bir programa eklediğinde içerik burada görünecek.',
      action: 'Program oluştur',
    },
    membershipPending: {
      other:
        'Hesabınız henüz bir departmana atanmadı. Yöneticiniz sizi bir departmana eklediğinde içerik burada görünecek.',
    },
    noDepartment: {
      admin: 'Bu programa henüz departman katılmadı. Departman ekleyerek başlayın.',
      other: 'Bu programda size atanmış bir departman bulunmuyor.',
      action: 'Departman ekle',
    },
    // ortak-kurallar §8 (CX-S-10): kısa uyarı.
    logoutUnverified: 'Bu cihazdaki oturum kapatıldı, sunucu doğrulaması alınamadı.',
    selecting: {
      title: 'Kapsam seçin',
      text: 'Devam etmek için kenar menüsünden program, rol ve koordinatörlük seçin.',
    },
    loading: 'Kapsam yükleniyor',
    error: 'Kapsam bilgisi alınamadı',
    phase: { F2: '{action} F2’de açılacak.' },
    // F0 ana sayfa yer tutucusu (01 içeriği F1'de; ortak-kurallar §4: sahte veri yok).
    home: {
      title: 'Ana sayfa F1’de açılacak',
      text: 'Görevleriniz ve pano özeti F1’de burada görünecek.',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trStates)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type StatesTextKey = Leaves<typeof trStates>

/** `states.*` metni (TR). */
export function statesText(
  key: StatesTextKey,
  params: Record<string, string | number> = {},
): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
