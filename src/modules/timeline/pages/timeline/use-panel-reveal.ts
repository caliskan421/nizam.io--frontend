/**
 * Satır/çubuk seçimi sonrası panelin görünür alanda olması (F3 doğrulaması K-1, K-3; mantık
 * `panel-reveal.ts`). YALNIZ kullanıcı seçimi tetikler (`arm()`): derin bağlantıyla (`secili`)
 * açılışta kaydırma ve odak çalma yok. Kaydırma `prefers-reduced-motion`'a uyar.
 * (05'in `use-panel-reveal.ts`'i yan yana/alt alta yerleşimi ayırır; burada yüzen panel de var,
 * bu yüzden ayrı tutuldu.)
 */
import { nextTick, watch, type Ref } from 'vue'

import { GEOMETRY } from '../../model/timeline'
import { revealMove, type Box } from './panel-reveal'

const ARM_MS = 2000

const box = (el: Element): Box => {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
}

function scrollParentOf(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if (/(auto|scroll)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node
  }
  return null
}

function reduced(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Dar ekran: panel Gantt'ın altında akar → panele kaydır + odak (panel `tabindex="-1"`). */
function revealStacked(panel: HTMLElement): void {
  panel.scrollIntoView?.({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' })
  panel.focus({ preventScroll: true })
}

/** Geniş ekran: seçili çubuk yüzen panelin altında kalmasın (tutamaçlar dahil). */
function revealFloating(panel: HTMLElement, board: HTMLElement, id: string): void {
  const bar = board.querySelector(`.gantt-bar[data-work-item="${CSS.escape(id)}"]`)
  const gantt = board.querySelector<HTMLElement>('.gantt__scroller')
  if (!bar || !gantt) return
  const parent = scrollParentOf(board)
  const frame = parent ? box(parent) : { left: 0, top: 0, right: 0, bottom: 0 }
  const scrolling = parent ?? document.scrollingElement
  const room = scrolling ? scrolling.scrollHeight - scrolling.clientHeight - scrolling.scrollTop : 0
  // Panel görünür alanın altına `bottom` kadar içeriden yapışır (kenet sticky bottom:0).
  const inset = parseFloat(getComputedStyle(panel).bottom) || 0
  const height = panel.getBoundingClientRect().height
  const viewBottom = parent ? Math.min(frame.bottom, innerHeight) : innerHeight
  const move = revealMove(box(bar), box(panel), {
    gap: GEOMETRY.hitW / 2,
    room,
    top: frame.top + GEOMETRY.rowH,
    stickyTop: viewBottom - inset - height,
    natTop: board.getBoundingClientRect().bottom - inset - height,
  })
  const behavior = reduced() ? 'auto' : 'smooth'
  if (move.scrollY !== 0) {
    if (parent) parent.scrollBy({ top: move.scrollY, behavior })
    else window.scrollBy({ top: move.scrollY, behavior })
  }
  if (move.scrollX !== 0) gantt.scrollBy({ left: move.scrollX, behavior })
}

/** Panel taze görevi okuyana dek (yüksekliği değişir) kısa süre bekler; ölçüm yerleşik boyutla yapılır. */
async function settled(panel: HTMLElement): Promise<void> {
  for (let i = 0; i < 30 && panel.getAttribute('aria-busy') === 'true'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
}

/**
 * Panel açıldıktan sonra içerik gelince (dosya sayısı, bekleyen talep kutusu) yüksekliği büyür ve
 * üstü yukarı kayar; kısa bir pencerede her boyut değişiminde çubuk yeniden korunur.
 */
function watchGrowth(panel: HTMLElement, again: () => void): void {
  if (typeof ResizeObserver === 'undefined') return
  const observer = new ResizeObserver(again)
  observer.observe(panel)
  setTimeout(() => observer.disconnect(), ARM_MS)
}

export function useSelectionReveal(
  board: Ref<HTMLElement | null>,
  selectedId: () => string | null,
) {
  let armedAt = -Infinity
  watch(
    selectedId,
    async (id) => {
      if (id === null || performance.now() - armedAt > ARM_MS) return
      armedAt = -Infinity
      await nextTick()
      const root = board.value
      const panel = root?.querySelector<HTMLElement>('[data-testid="timeline-panel"]')
      if (!root || !panel || panel.getBoundingClientRect().height === 0) return // ölçüm yok (jsdom)
      await settled(panel)
      const floating = getComputedStyle(panel).position === 'absolute'
      if (!floating) return revealStacked(panel)
      revealFloating(panel, root, id)
      watchGrowth(panel, () => revealFloating(panel, root, id))
    },
    { flush: 'post' },
  )
  return { arm: () => void (armedAt = performance.now()) }
}
