import { i18n } from '@/shared/i18n'

/**
 * Ana sayfa metinleri (`home.*`; 01 `ozellikler.md` §4). Sunucu metni kullanılmaz; kişi adı,
 * sayı ve tarih yalnız gerçek veriden gelir (ortak-kurallar §4). Anahtarlar ilk kullanımda
 * vue-i18n ağacına eklenir (`{…}` vue-i18n biçimi).
 */
export const trHome = {
  home: {
    greeting: 'Merhaba {name}',
    kpi: {
      region: 'Görev özeti',
      completion: 'Tamamlanma',
      open: 'Açık görev',
      overdue: 'Gecikmede',
      pending: 'Onay bekleyen',
      completionValue: '%{p}',
      completionNote: '{total} görevin {done}{suffix} bitti',
      openNote: '{n} tanesi zamanında ilerliyor',
      overdueNote: 'Açık görevlerin %{q}{suffix}',
      noTasks: 'Henüz görev yok',
      noOpen: 'Açık görev yok',
      partial: 'Sayılar yüklenen kayıtlar içinde',
      error: 'Görev özeti yüklenemedi',
      selectTitle: 'Kapsam seçin',
      selectText: 'Görev özeti için kenar menüsünden koordinatörlük seçin.',
    },
    quick: {
      title: 'Hızlı işlemler',
      newTask: 'Yeni görev',
      meeting: 'Toplantı oluştur',
      invite: 'Kullanıcı davet et',
      phase: { F2: 'F2’de', F4: 'F4’te' },
      disabled: '{label} — {phase} açılacak',
    },
    recent: {
      title: 'Son işlemler',
      all: 'Tümü',
      allDisabled: 'İşlem geçmişi bu sürümde yok',
      empty: 'Henüz işlem geçmişi yok',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trHome)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type HomeTextKey = Leaves<typeof trHome>

/** `home.*` metni (TR). */
export function homeText(key: HomeTextKey, params: Record<string, string | number> = {}): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
