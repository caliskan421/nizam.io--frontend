/**
 * 08 istemci araması ve sıralaması (E-08-13, E-08-16; 08 `backend.md` §4). Arama alanları:
 * programdaki ad (`display_name`), `code` ve rapor satırındaki koordinatör adları (üye adları
 * liste ekranında yok — birim başına `listMembers` fan-out olur). Katlama `tr` yerel ayarıyla
 * (İ/i, I/ı). Sıra ada göre `Intl.Collator('tr')`; küme `joinCoordinatorships`'ten artan gelir.
 */
import type { CoordinatorshipView } from '../../model/types'
import type { SortDirection } from './url-state'

export function foldTr(text: string): string {
  return text.toLocaleLowerCase('tr-TR').trim()
}

function haystack(view: CoordinatorshipView): string {
  const names = view.stat?.coordinators.map((p) => p.full_name) ?? []
  return foldTr([view.displayName, view.code ?? '', ...names].join(' '))
}

/** Aranan metin görünür alanlardan birinde geçiyor mu (boş arama her şeyi eşler). */
export function matchesSearch(view: CoordinatorshipView, needle: string): boolean {
  const folded = foldTr(needle)
  return folded === '' || haystack(view).includes(folded)
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

/** Süzülmüş ve sıralanmış küme (girdi değişmez). */
export function visibleCoordinatorships(
  views: readonly CoordinatorshipView[],
  search: string,
  direction: SortDirection,
): CoordinatorshipView[] {
  const sign = direction === 'azalan' ? -1 : 1
  return views
    .filter((v) => matchesSearch(v, search))
    .sort((a, b) => sign * collator.compare(a.displayName, b.displayName))
}
