import { i18n } from '@/shared/i18n'

/**
 * Görev tablosu metinleri (`taskList.*`; 03 `ozellikler.md` §2.6–2.7). Sunucu metni
 * kullanılmaz. Anahtarlar ilk kullanımda vue-i18n ağacına eklenir (`{…}` vue-i18n biçimi).
 */
export const trTaskList = {
  taskList: {
    table: 'Görevler',
    column: { gorev: 'görev', durum: 'durum', bitis: 'bitiş', kisi: 'kişi' },
    sortHint: '{column} sütununa göre sırala',
    status: {
      baslanmadi: 'Başlamadı',
      devam_ediyor: 'Devam ediyor',
      onaya_sunuldu: 'Onay bekliyor',
      iade_edildi: 'Geri gönderildi',
      tamamlandi: 'Tamamlandı',
    },
    overdue: '{n} gün gecikti',
    remaining: '{n} gün kaldı',
    request: 'Talep · {day}',
    requestTitle: 'Bitiş {from} → {to} talep edildi',
    unknownPerson: 'Bilinmeyen kişi',
    subtasks: 'Alt görevler',
    subtasksNone: '+ alt',
    subtasksOf: '{title} alt görevleri',
    loading: 'Görevler yükleniyor',
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trTaskList)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TaskListTextKey = Leaves<typeof trTaskList>

/** `taskList.*` metni (TR). */
export function taskListText(
  key: TaskListTextKey,
  params: Record<string, string | number> = {},
): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
