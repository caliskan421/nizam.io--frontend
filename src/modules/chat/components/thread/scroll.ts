/**
 * Kaydırma kararları (saf): yeni mesajda otomatik kaydırma YALNIZ en alttayken; üste eski sayfa
 * eklenince görünür konum korunur (yükseklik farkı kadar kaydırılır). Ölçüler elemandan okunur;
 * karar burada olduğundan jsdom'da (ölçü yok) birim olarak sınanır.
 */
export interface ScrollSnapshot {
  top: number
  height: number
  client: number
  firstSeq: number | null
  lastSeq: number | null
}

/** "En altta" toleransı (alt kenara bu kadar yakın). */
export const BOTTOM_SLACK = 48
/** Üst kenara bu orandan yakınsa daha eski sayfa istenir (istemci yüksekliğine göre). */
export const TOP_LOAD_RATIO = 0.5

export function atBottom(s: Pick<ScrollSnapshot, 'top' | 'height' | 'client'>): boolean {
  return s.height - s.top - s.client <= BOTTOM_SLACK
}

export function nearTop(s: Pick<ScrollSnapshot, 'top' | 'client'>): boolean {
  return s.top <= s.client * TOP_LOAD_RATIO
}

export type ScrollPlan = { kind: 'keep' } | { kind: 'bottom' } | { kind: 'shift'; by: number }

/** Pencere değişti: eski ve yeni ölçüden kaydırma kararı. */
export function planScroll(before: ScrollSnapshot, after: ScrollSnapshot): ScrollPlan {
  if (before.firstSeq === null || after.firstSeq === null) return { kind: 'keep' }
  if (after.firstSeq < before.firstSeq) return { kind: 'shift', by: after.height - before.height }
  const grew = (after.lastSeq ?? 0) > (before.lastSeq ?? 0)
  return grew && atBottom(before) ? { kind: 'bottom' } : { kind: 'keep' }
}
