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
 * Çubuğu panelden kurtaran en küçük hareket. Panel görünür alana YAPIŞIK olduğundan sayfa
 * kayınca panelin konumu da değişir: kaydırma sonrası panel üstü = min(doğal üst − s, yapışık üst);
 * çubuk da s kadar yukarı çıkar. Bu yüzden gereken kaydırma `bar.bottom + gap − stickyTop`
 * (yalnız çubuk doğal panel üstünün de üstündeyse mümkün). Olmuyorsa (sayfa daha kayamıyor ya da
 * çubuk üst sınırı aşar) Gantt yatay kaydırılır: çubuk panelin soluna alınır.
 *
 *  - `room`: sayfanın aşağı kayabileceği en çok miktar; `top`: çubuğun üst sınırı
 *  - `stickyTop`: panelin görünür alana yapışıkken üst kenarı; `natTop`: yapışmasız (kap altı) üst kenarı
 */
export function revealMove(
  bar: Box,
  panel: Box,
  options: { gap: number; room: number; top: number; stickyTop: number; natTop: number },
): RevealMove {
  const { gap, room, top, stickyTop, natTop } = options
  if (!intersects(bar, panel, gap)) return { scrollY: 0, scrollX: 0 }
  const need = Math.max(0, Math.ceil(bar.bottom + gap - stickyTop))
  if (bar.bottom + gap <= natTop && need <= room && bar.top - need >= top) {
    return { scrollY: need, scrollX: 0 }
  }
  return { scrollY: 0, scrollX: Math.max(0, Math.ceil(bar.right + gap - panel.left)) }
}
