/** K1 KPI notları (E-K1-09/11): kod eklenmiş metinler; saf fonksiyonlar. */
import { homeText } from '../messages'
import type { UnitSummary } from './summary'

/** "En uzunu ‹n› gün · ‹kod›" (küme kısmiyse "≥"); gecikme yoksa "Yok". */
export function longestNote(s: UnitSummary): string {
  if (s.longestOverdue === null) return homeText('home.k1.notes.none')
  const params = { n: s.longestOverdue, code: s.longestCode }
  if (s.partial) {
    return homeText(
      s.longestCode ? 'home.k1.notes.longestAtLeastCode' : 'home.k1.notes.longestAtLeast',
      params,
    )
  }
  return homeText(s.longestCode ? 'home.k1.notes.longestCode' : 'home.k1.notes.longest', params)
}

/** Tek iade: "‹kod› · ‹atanan›"; birden çok: sayı; yok: "Yok". */
export function returnedNote(s: UnitSummary): string {
  const note = s.returnedNote
  if (note.kind === 'none') return homeText('home.k1.notes.none')
  if (note.kind === 'one' && (note.code || note.names.length > 0)) {
    return [note.code, note.names.join(', ')].filter(Boolean).join(' · ')
  }
  return homeText('home.k1.notes.returnedMany', { n: s.returned })
}
