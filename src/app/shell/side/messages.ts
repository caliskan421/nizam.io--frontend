import { i18n } from '@/shared/i18n'

/**
 * Kenar menüsü metinleri (`side.*`; 00-ortak `ozellikler.md` §4 etiket sözlüğü). Sunucu metni
 * kullanılmaz. Anahtarlar ilk kullanımda vue-i18n ağacına eklenir. `{…}` yer tutucuları
 * vue-i18n biçimindedir.
 */
export const trSide = {
  side: {
    // P9: ürün adı sabittir; `instanceProfile.display_name` kullanılmaz.
    brand: 'RoketPortal',
    collapse: 'Menüyü daralt',
    expand: 'Menüyü genişlet',
    mainMenu: 'Ana menü',
    closeMenu: 'Menüyü kapat',
    card: {
      program: 'Program',
      lens: 'Rol',
      department: 'Koordinatörlük',
      programName: 'Program: {name}',
      lensName: 'Rol: {name}',
      departmentName: 'Koordinatörlük: {name}',
      choose: 'Seçin',
    },
    menu: {
      program: 'Program seç',
      lens: 'Rol seç',
      department: 'Koordinatörlük seç',
      season: '{year} sezonu',
      truncated: 'Liste kısaltıldı',
      coordinatorHead: 'Koordinatör olduğun birimler',
      memberHead: 'Üye olduğun birimler',
    },
    lens: { admin: 'Admin', coordinator: 'Koordinatör', member: 'Üye' },
    group: { takip: 'Takip', icerik: 'İçerik', yonetim: 'Yönetim' },
    phase: { F0: 'F0’da', F1: 'F1’de', F2: 'F2’de', F3: 'F3’te', F4: 'F4’te' },
    disabled: '{title} — {phase} açılacak',
    badge: {
      overdue: '{n} geciken görev',
      dates: '{n} tarih değişikliği talebi bekliyor',
    },
    logout: 'Çıkış yap',
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trSide)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type SideTextKey = Leaves<typeof trSide>

/** `side.*` metni (TR). */
export function sideText(key: SideTextKey, params: Record<string, string | number> = {}): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
