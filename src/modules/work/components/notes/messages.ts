/**
 * Notlar sekmesi metinleri (`work.notes.*`; E-03-62). Hata metinleri burada değildir: kod →
 * `errors.*` (`shared/i18n`), sunucu `message` alanı gösterilmez. Yazar adı ve not içeriği
 * sunucu verisidir; burada örnek veri yok (ortak-kurallar §4).
 */
import { i18n } from '@/shared/i18n'

export const trNotes = {
  work: {
    notes: {
      list: 'Notlar',
      loading: 'Notlar yükleniyor…',
      empty: 'Henüz not yok',
      emptyWriter: 'Göreve ilk notu siz ekleyin.',
      composer: 'Not yaz',
      placeholder: 'Göreve not yaz…',
      add: 'Not ekle',
      editor: 'Notu düzenle',
      save: 'Kaydet',
      cancel: 'Vazgeç',
      edit: 'Düzenle',
      remove: 'Sil',
      edited: 'düzenlendi',
      unknownAuthor: 'Adı bilinmeyen kişi',
      field: 'Not',
      confirmTitle: 'Not silinsin mi?',
      confirmBody: 'Not bu görevden kaldırılır.',
      confirmAccept: 'Notu sil',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trNotes)
  merged = true
}

export type NotesTextKey = keyof typeof trNotes.work.notes

/** `work.notes.*` metni (TR). */
export function notesText(key: NotesTextKey): string {
  ensureMerged()
  return i18n.global.t(`work.notes.${key}`)
}

/**
 * Not zamanı: kurulum saat dilimiyle (`instanceProfile.timezone`) "1 Kas 2026 11:00". Dilim
 * bilinmiyor ya da geçersizse tarayıcının dilimi; tarih okunamazsa boş (uydurma yok).
 */
export function formatNoteTime(iso: string, timeZone: string | null | undefined): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  try {
    return new Intl.DateTimeFormat('tr-TR', { ...options, timeZone: timeZone ?? undefined }).format(
      date,
    )
  } catch {
    return new Intl.DateTimeFormat('tr-TR', options).format(date)
  }
}
