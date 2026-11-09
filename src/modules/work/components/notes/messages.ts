/**
 * Notlar sekmesi metinleri (`work.notes.*`; E-03-62). Hata metinleri burada değildir: kod →
 * `errors.*` (`shared/i18n`), sunucu `message` alanı gösterilmez. Yazar adı ve not içeriği
 * sunucu verisidir; burada örnek veri yok (ortak-kurallar §4).
 */
import { i18n } from '@/shared/i18n'
import { trNotes } from '@/shared/i18n/tr/work'

export { trNotes }

export type NotesTextKey = keyof typeof trNotes.work.notes

/** `work.notes.*` metni (TR). */
export function notesText(key: NotesTextKey): string {
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
