/**
 * 01f Gantt bağımlılık okları (E-13-28; REPORTING-K22): kaynak SUNUCUNUN `gantt_edges`'i —
 * `work_item_id` görevi `depends_on_id` görevi bitmeden ilerleyemez; ok görsel olarak ÖN GÖREV
 * (`depends_on_id`) → BAĞIMLI (`work_item_id`) yönündedir. İstemci kenar türetmez, kısaltmaz.
 *
 * Geometri, ekranda GÖRÜNEN çubuklara bağlıdır (uydurma koordinat yok): ok ön görev çubuğunun
 * sağ ucundan (kuyruk dahil) bağımlı çubuğun sol ucuna gider. Yatay konum eksen yüzdesidir (çubuklarla
 * aynı birim); dikey konum sabit satır yüksekliğinin katıdır: satır = grup başlığı ya da görev
 * (`rowIndex`), merkez `rowIndex + 0.5`. Yalnız iki ucu da bilinen, tek ve çizilebilir (çubuklu)
 * satırlara bağlanan kenarlar çizilir; kendine, eksik, yinelenen ya da belirsiz (aynı görev kimliği
 * iki satırda) uçlu kenarlar atlanır. O(V+E).
 */
import type { GanttBar, GanttGroup, GanttTaskRow } from './gantt'

export interface EdgeInput {
  work_item_id: string
  depends_on_id: string
}

export interface GanttEdge {
  key: string
  /** Ön görev (ok başı) ve bağımlı görev (ok ucu) satır etiketleri; opak kimlik değil. */
  fromName: string
  toName: string
  fromRow: number
  toRow: number
  /** Ön görev çubuğunun sağ ucu / bağımlı çubuğun sol ucu (eksen yüzdesi). */
  x1: number
  x2: number
}

export interface GanttEdgeLayout {
  /** Grup başlıkları dahil toplam satır sayısı (ok katmanı yüksekliği). */
  rowCount: number
  edges: GanttEdge[]
}

const barEnd = (bar: GanttBar): number =>
  bar.tail ? bar.tail.left + bar.tail.width : bar.left + bar.width

function rowName(row: GanttTaskRow): string {
  return row.label === '—' ? row.title : `${row.label} ${row.title}`
}

interface Placed {
  row: GanttTaskRow
  index: number
}

function placeRows(groups: readonly GanttGroup[]): {
  placed: Map<string, Placed>
  ambiguous: Set<string>
  rowCount: number
} {
  const placed = new Map<string, Placed>()
  const ambiguous = new Set<string>()
  let index = 0
  for (const group of groups) {
    index += 1
    for (const row of group.rows) {
      if (placed.has(row.id)) ambiguous.add(row.id)
      else placed.set(row.id, { row, index })
      index += 1
    }
  }
  return { placed, ambiguous, rowCount: index }
}

export function ganttEdges(
  groups: readonly GanttGroup[],
  edges: readonly EdgeInput[] | null | undefined,
): GanttEdgeLayout {
  const { placed, ambiguous, rowCount } = placeRows(groups)
  const seen = new Set<string>()
  const out: GanttEdge[] = []
  for (const edge of edges ?? []) {
    const from = edge.depends_on_id
    const to = edge.work_item_id
    const key = `${from}\u0000${to}`
    if (from === to || seen.has(key) || ambiguous.has(from) || ambiguous.has(to)) continue
    const a = placed.get(from)
    const b = placed.get(to)
    if (!a?.row.bar || !b?.row.bar) continue
    seen.add(key)
    out.push({
      key,
      fromName: rowName(a.row),
      toName: rowName(b.row),
      fromRow: a.index,
      toRow: b.index,
      x1: barEnd(a.row.bar),
      x2: b.row.bar.left,
    })
  }
  return { rowCount, edges: out }
}

export interface EdgeSegment {
  /** Eksen yüzdesi (sol), yüzde genişlik / satır cinsinden üst ve yükseklik. */
  x: number
  w: number
  row: number
  rows: number
}

export interface EdgeRoute {
  /** Gerçek çıkış: ön görev çubuğunun (kuyruk dahil) sağ ucu, kendi satırının ortası. */
  origin: { x: number; row: number }
  horizontal: EdgeSegment
  vertical: EdgeSegment
  /** Ok ucu: bağımlı çubuğun sol ucu ortası; yön son parçanın yönüdür. */
  tip: { x: number; row: number; dir: 'right' | 'down' | 'up' }
}

/**
 * İleri ok (bağımlı, ön görevin bitişinden sonra başlıyor): ön görev ucundan dikey, bağımlı satırda
 * yatay, ucu sağa. Çakışan/geri ok (bağımlı ön görev bitmeden başlıyor): ön görev satırında geriye
 * yatay, bağımlı başlangıcında dikey; ucu satır yönüne (aşağı/yukarı) bakar.
 */
export function edgeRoute(edge: GanttEdge): EdgeRoute {
  const from = edge.fromRow + 0.5
  const to = edge.toRow + 0.5
  const top = Math.min(from, to)
  const span = Math.abs(to - from)
  const origin = { x: edge.x1, row: from }
  if (edge.x2 > edge.x1) {
    return {
      origin,
      horizontal: { x: edge.x1, w: edge.x2 - edge.x1, row: to, rows: 0 },
      vertical: { x: edge.x1, w: 0, row: top, rows: span },
      tip: { x: edge.x2, row: to, dir: 'right' },
    }
  }
  return {
    origin,
    horizontal: { x: edge.x2, w: edge.x1 - edge.x2, row: from, rows: 0 },
    vertical: { x: edge.x2, w: 0, row: top, rows: span },
    tip: { x: edge.x2, row: to, dir: to > from ? 'down' : 'up' },
  }
}
