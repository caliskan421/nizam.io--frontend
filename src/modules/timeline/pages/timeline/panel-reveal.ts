/**
 * Seçili görev panelinin görünür alana getirilmesi (F3 doğrulaması K-1, K-3). Saf geometri;
 * DOM ölçümü ve kaydırma `use-panel-reveal.ts`'te.
 *
 *  - Geniş ekran: panel görünür alanın sağ altına yapışık yüzer (`.timeline-dock`); seçili çubuk
 *    (tutamaçlarıyla) panelin altında kalıyorsa önce sayfa kaydırılarak çubuk panelin ÜSTÜNE
 *    alınır, olmuyorsa Gantt yatay kaydırılarak panelin SOLUNA alınır.
 *  - Dar ekran: panel Gantt'ın altında akar; seçimde panele kaydırılır ve odak panele taşınır.
 */
export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

export function intersects(a: Box, b: Box, gap = 0): boolean {
  return (
    a.left < b.right + gap &&
    a.right + gap > b.left &&
    a.top < b.bottom + gap &&
    a.bottom + gap > b.top
  )
}

export interface RevealMove {
  /** Sayfa dikey kaydırması (+ = aşağı; çubuk yukarı çıkar). */
  scrollY: number
  /** Gantt yatay kaydırması (+ = sağa; çubuk sola çıkar). */
  scrollX: number
}

/**
 * Çubuğu panelden kurtaran en küçük hareket. `room`: sayfanın aşağı kayabileceği en çok miktar;
 * `top`: çubuğun üst sınırı (görünür alanın üstü). Çakışma yoksa hareket yok.
 */
export function revealMove(
  bar: Box,
  panel: Box,
  options: { gap: number; room: number; top: number },
): RevealMove {
  const { gap, room, top } = options
  if (!intersects(bar, panel, gap)) return { scrollY: 0, scrollX: 0 }
  const dy = Math.ceil(bar.bottom + gap - panel.top)
  if (dy <= room && bar.top - dy >= top) return { scrollY: dy, scrollX: 0 }
  // Dikey yetmiyor: olabildiğince kaydır, kalanını yatayda çöz (çubuk panelin soluna).
  const scrollY = Math.max(0, Math.min(dy, room, bar.top - top))
  const moved: Box = { ...bar, top: bar.top - scrollY, bottom: bar.bottom - scrollY }
  const scrollX = intersects(moved, panel, gap) ? Math.ceil(bar.right + gap - panel.left) : 0
  return { scrollY, scrollX }
}
