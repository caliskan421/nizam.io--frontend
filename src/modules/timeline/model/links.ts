/**
 * Bağımlılık okları (W92; saf). P19: oklar yalnız iki ucu da GÖRÜNÜR görevler arasındadır —
 * yani her iki ucun da bir görev satırı vardır (kapalı grubun ya da süzgeç dışı görevin ucuna
 * ok, saplama bile çizilmez) ve çubuğu çizilebilir. Ok dizini satır numaralarıyla kurulur;
 * kaydırmada `links` taranmaz, pencereye değen oklar ikili aramayla bulunur
 * (`gantt-secimi.md` §7 `links.ts`).
 */
import type { GanttLayout } from './rows'
import type { GanttLink } from './types'

export interface LinkRef {
  id: string
  sourceId: string
  targetId: string
  crossDepartment: boolean
  sourceRow: number
  targetRow: number
  minRow: number
  maxRow: number
}

export interface LinkIndex {
  /** `minRow`'a göre sıralı. */
  refs: readonly LinkRef[]
  /** `refs[0..i]` içindeki en büyük `maxRow` (azalmaz; ikili arama için). */
  prefixMax: readonly number[]
}

/** İki ucu da görünür satırlı, kendine dönmeyen, tekil bağlardan ok dizini kurar. */
export function buildLinkIndex(links: readonly GanttLink[], layout: GanttLayout): LinkIndex {
  const seen = new Set<string>()
  const refs: LinkRef[] = []
  for (const link of links) {
    if (link.source === link.target || seen.has(link.dependency_id)) continue
    const sourceRow = layout.indexByKey.get(link.source)
    const targetRow = layout.indexByKey.get(link.target)
    if (sourceRow === undefined || targetRow === undefined) continue
    if (layout.rows[sourceRow]?.kind !== 'task' || layout.rows[targetRow]?.kind !== 'task') continue
    seen.add(link.dependency_id)
    refs.push({
      id: link.dependency_id,
      sourceId: link.source,
      targetId: link.target,
      crossDepartment: link.cross_department,
      sourceRow,
      targetRow,
      minRow: Math.min(sourceRow, targetRow),
      maxRow: Math.max(sourceRow, targetRow),
    })
  }
  refs.sort((a, b) => a.minRow - b.minRow || a.maxRow - b.maxRow || a.id.localeCompare(b.id))
  const prefixMax: number[] = []
  let max = -1
  for (const ref of refs) {
    max = Math.max(max, ref.maxRow)
    prefixMax.push(max)
  }
  return { refs, prefixMax }
}

/** `[first, last]` satır penceresine değen oklar (dikey aralığı pencereyle kesişenler). */
export function linksInWindow(index: LinkIndex, first: number, last: number): LinkRef[] {
  if (last < first || index.refs.length === 0) return []
  // prefixMax azalmaz: ilk `maxRow >= first` konumu ikili aramayla.
  let lo = 0
  let hi = index.prefixMax.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (index.prefixMax[mid]! >= first) hi = mid
    else lo = mid + 1
  }
  const out: LinkRef[] = []
  for (let i = lo; i < index.refs.length; i++) {
    const ref = index.refs[i]!
    if (ref.minRow > last) break
    if (ref.maxRow >= first) out.push(ref)
  }
  return out
}

export interface LinkPoints {
  /** Ön görev çubuğunun sağ kenarı ve orta çizgisi. */
  sx: number
  sy: number
  /** Bağımlı görev çubuğunun sol kenarı ve orta çizgisi. */
  tx: number
  ty: number
  /** Satırlar arası yatay koridorun y konumu (kıvrımlı yönlendirme için). */
  laneY: number
}

/**
 * Bitiş → başlangıç oku: ön görev bitiminden `gap` kadar sağa, dikey, bağımlı görev başlangıcına.
 * Bağımlı görev ön görev bitmeden başlıyorsa (geri dönüş) satırlar arası koridordan dolaşır.
 */
export function linkPath(points: LinkPoints, gap: number): string {
  const { sx, sy, tx, ty, laneY } = points
  if (tx >= sx + 2 * gap) return `M${sx},${sy} H${sx + gap} V${ty} H${tx}`
  return `M${sx},${sy} H${sx + gap} V${laneY} H${tx - gap} V${ty} H${tx}`
}

/** Geri dönüş yönlendirmesinin koridoru: bağımlı görev satırının üst (ya da alt) sınırı. */
export function laneFor(
  sourceRow: { y: number; height: number },
  targetRow: { y: number; height: number },
): number {
  if (targetRow.y > sourceRow.y) return targetRow.y
  if (targetRow.y < sourceRow.y) return targetRow.y + targetRow.height
  return targetRow.y
}
