import { i18n } from '@/shared/i18n'

/**
 * Ayrıntı paneli metinleri (`workDetail.*`; 03 `ozellikler.md` E-03-41…56). Sunucu `message`
 * alanı kullanılmaz (hata metni kod → `errors.*`). Anahtarlar ilk kullanımda vue-i18n ağacına
 * eklenir.
 */
export const trWorkDetail = {
  workDetail: {
    panel: 'Görev ayrıntısı',
    loading: 'Görev yükleniyor',
    close: 'Paneli kapat',
    // useWorkItemTarget null (Admin merceği, görev yüklenen listede yok): istek atılmaz.
    scopeUnknown: 'Görevin kapsamı bilinmiyor; görevi listeden açın.',
    tabs: {
      label: 'Görev ayrıntısı sekmeleri',
      summary: 'Özet',
      subtasks: 'Alt görevler',
      files: 'Dosyalar',
      notes: 'Notlar',
    },
    summary: {
      assignee: 'Atanan',
      creator: 'Oluşturan',
      created: 'Tanımlandı',
      range: 'Tarih aralığı',
      evidence: 'Kanıt dosyası',
      evidenceNone: 'Yok',
      // E-03-50: Arşiv (06/07) F5; bağlantı devre dışı + faz notu (P2, §5).
      archiveLater: 'Arşivde bu görevin klasörü F5’te açılacak',
      unknownPerson: 'Bilinmeyen kişi',
      none: '—',
    },
    timeline: {
      title: 'ilerleme',
      created: 'Görev tanımlandı',
      start: 'Planlanan başlangıç',
      endPassed: 'Plan bitişi geçti',
      overdue: '{n} gündür gecikmede',
      completed: 'Görev tamamlandı',
      today: 'bugün',
      // E-03-51, BE-007: etkinlik geçmişi (audit) yok — nötr yer tutucu, sahte akış yok (§4).
      activity: 'Etkinlik geçmişi henüz gösterilemiyor.',
    },
    status: {
      readonly: 'salt okunur',
      label: 'Durum',
      baslanmadi: 'Başlamadı',
      devam_ediyor: 'Devam ediyor',
      onaya_sunuldu: 'Onay bekliyor',
      iade_edildi: 'Geri gönderildi',
      tamamlandi: 'Tamamlandı',
    },
    actions: {
      label: 'Görev eylemleri',
      upload: 'Kanıt dosyası yükle',
      remind: 'Atanana hatırlat',
      // E-03-54: uç var, akış F3 (P5, §5) — faz notu, stub değil.
      dateRequest: 'Tarih değişikliği iste (F3’te)',
      copy: 'Kopyala',
      copied: 'Görev bağlantısı panoya kopyalandı.',
      copyFailed: 'Görev bağlantısı kopyalanamadı.',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trWorkDetail)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type WorkDetailTextKey = Leaves<typeof trWorkDetail>

/** `workDetail.*` metni (TR). */
export function detailText(
  key: WorkDetailTextKey,
  params: Record<string, string | number> = {},
): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
