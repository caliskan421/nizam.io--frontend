import { i18n } from '@/shared/i18n'

/**
 * Görev listesi sayfa metinleri (`tasksPage.*`; 03 `ozellikler.md` §2.2–2.5, §2.8). Sunucu
 * metni kullanılmaz. Anahtarlar ilk kullanımda vue-i18n ağacına eklenir (`{…}` vue-i18n biçimi).
 * "Yüklenen kayıtlar içinde" etiketi imleç bitmemişken her sayacın yanında (ortak-kurallar §10).
 */
export const trTasksPage = {
  tasksPage: {
    title: 'Görevler',
    summary: {
      tasks: '{n} görev',
      tasksPartial: '{n}+ görev',
      departments: '{n} koordinatörlük',
      people: '{n} kişi',
    },
    partial: 'yüklenen kayıtlar içinde',
    view: {
      label: 'Görünüm',
      list: 'Liste',
      timeline: 'Zaman çizelgesi',
      timelineSoon: 'Zaman çizelgesi — F3’te açılacak',
    },
    create: 'Yeni görev',
    tabs: {
      label: 'Kayıtlı görünümler',
      tumu: 'Tümü',
      baslanmadi: 'Başlamadı',
      devam_ediyor: 'Devam ediyor',
      geciken: 'Geciken',
      onaya_sunuldu: 'Onay bekleyen',
      iade_edildi: 'Geri gönderildi',
      tamamlandi: 'Tamamlanan',
    },
    requests: {
      filterLabel: 'Tarih talebi filtresi',
      filter: 'Tarih talebi',
      band: 'Bekleyen tarih değişikliği talepleri',
      bandTitle: '{n} tarih değişikliği talebi onay bekliyor',
      review: 'Talepleri incele',
      reviewSoon: 'Talepleri incele — F3’te açılacak',
    },
    search: {
      label: 'Görev ara',
      placeholder: 'Başlık, kimlik veya kişi…',
    },
    person: {
      label: 'Kişi',
      stub: 'Kişi süzgeci henüz kullanılamıyor',
    },
    department: {
      label: 'Koordinatörlük',
      menu: 'Koordinatörlük seç',
      all: 'Tüm koordinatörlükler',
    },
    pager: {
      complete: '{n} görev',
      partial: '{n} görev yüklendi · daha fazlası var',
      more: 'Daha fazla yükle',
      loadingMore: 'Yükleniyor…',
    },
    empty: {
      title: 'Bu kapsamda görev yok',
      text: 'Seçili program ve koordinatörlükte henüz görev tanımlanmamış.',
      filteredTitle: 'Süzgeçlerle eşleşen görev yok',
      filteredText: 'Arama ya da süzgeçleri değiştirip yeniden deneyin.',
      clear: 'Süzgeçleri temizle',
    },
    error: 'Görevler yüklenemedi',
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trTasksPage)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TasksPageTextKey = Leaves<typeof trTasksPage>

/** `tasksPage.*` metni (TR). */
export function tasksText(
  key: TasksPageTextKey,
  params: Record<string, string | number> = {},
): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
