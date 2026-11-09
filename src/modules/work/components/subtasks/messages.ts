/**
 * Alt görev ekran metinleri (`subtasks.*`; 03 `ozellikler.md` §2.8, §3-B/C, §5). Sunucu
 * `message` alanı gösterilmez: yazma sonucu metinleri `shared/ui/confirm` (`notifyOutcome`,
 * hata kodu → `errors.*`) üretir. E-03-30: yalnız "Kişi ve tarih isteğe bağlıdır." (P5 — alt
 * görev kanıt/zorunluluk kuralı sözleşmede yok, BE-006).
 */
import { i18n } from '@/shared/i18n'

export const trSubtasks = {
  subtasks: {
    kicker: 'alt görevler',
    head: 'alt görevler · {done}/{total}',
    caption: 'Kişi ve tarih isteğe bağlıdır.',
    rowsLabel: '{title} alt görevleri',
    progress: 'Tamamlanan alt görevler',
    loading: 'Alt görevler yükleniyor…',
    empty: 'Henüz alt görev yok.',
    add: {
      placeholder: 'Alt görev ekle ve Enter’a bas',
      label: '{title} için alt görev ekle',
      submit: 'Ekle',
    },
    row: {
      done: '{title} tamamlandı',
      open: 'Görev detayında aç',
      menu: '{title} seçenekleri',
      titleInput: 'Alt görev başlığı',
      person: 'Kişi',
      personNone: 'Kişi yok',
      unknownPerson: 'Bilinmeyen kişi',
      dateNone: 'Tarih yok',
    },
    date: {
      label: 'Alt görev tarihleri',
      start: 'başlangıç',
      end: 'bitiş',
      clear: 'Tarihi kaldır',
      ok: 'Tamam',
      pair: 'Başlangıç ve bitiş birlikte girilir.',
      order: 'Bitiş, başlangıçtan önce olamaz.',
    },
    menu: {
      required: 'zorunlu alanlar',
      person: 'Kişi ataması',
      dates: 'Tarih aralığı',
      evidence: 'Kanıt dosyası (arşiv)',
      rename: 'Başlığı düzenle',
      remove: 'Alt görevi sil',
    },
    confirm: {
      title: 'Alt görev silinsin mi?',
      body: '“{title}” kalıcı olarak silinir; bağlı dosyalar görevde kalır.',
      ok: 'Sil',
    },
    field: {
      title: 'Başlık',
      assignee: 'Kişi',
      start: 'Başlangıç',
      end: 'Bitiş',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trSubtasks)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type SubtaskTextKey = Leaves<typeof trSubtasks>

/** `subtasks.*` metni (TR). */
export function subtaskText(
  key: SubtaskTextKey,
  params: Record<string, string | number> = {},
): string {
  ensureMerged()
  return i18n.global.t(key, params)
}
