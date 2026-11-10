import { nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSelectionReveal } from './use-panel-reveal'

// Yerleşim jsdom'da ölçülmez: panel ve çubuk kutuları elle verilir.
function rect(left: number, top: number, right: number, bottom: number): DOMRect {
  return { left, top, right, bottom, width: right - left, height: bottom - top } as DOMRect
}

function setup(position: 'absolute' | 'static', panelRect: DOMRect, barRect: DOMRect) {
  const board = document.createElement('div')
  board.innerHTML =
    '<div class="gantt__scroller"><svg><g class="gantt-bar" data-work-item="w1"></g></svg></div>' +
    '<div class="timeline-dock"><section data-testid="timeline-panel" tabindex="-1"></section></div>'
  document.body.append(board)
  const panel = board.querySelector<HTMLElement>('[data-testid="timeline-panel"]')!
  const gantt = board.querySelector<HTMLElement>('.gantt__scroller')!
  const bar = board.querySelector('.gantt-bar')!
  panel.style.position = position
  board.getBoundingClientRect = () => rect(0, 0, 1440, 2400)
  panel.getBoundingClientRect = () => panelRect
  bar.getBoundingClientRect = () => barRect
  const scrollIntoView = vi.fn()
  const ganttScrollBy = vi.fn()
  panel.scrollIntoView = scrollIntoView
  gantt.scrollBy = ganttScrollBy
  const selected = ref<string | null>(null)
  const reveal = useSelectionReveal(ref(board), () => selected.value)
  const select = async (id: string, arm: boolean) => {
    if (arm) reveal.arm()
    selected.value = id
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return { board, panel, scrollIntoView, ganttScrollBy, select }
}

let scrollBy: ReturnType<typeof vi.fn>
beforeEach(() => {
  scrollBy = vi.fn()
  window.scrollBy = scrollBy as unknown as typeof window.scrollBy
  const page = document.documentElement
  Object.defineProperty(document, 'scrollingElement', { configurable: true, value: page })
  Object.defineProperty(page, 'scrollHeight', { configurable: true, value: 2000 })
  Object.defineProperty(page, 'clientHeight', { configurable: true, value: 900 })
})
afterEach(() => {
  document.body.innerHTML = ''
})

describe('seçimde panel görünür alana getirilir (K-1, K-3)', () => {
  it('dar ekran: panel Gantt altında → panele kaydırılır ve odak panele taşınır', async () => {
    const t = setup('static', rect(0, 1480, 390, 1795), rect(0, 700, 300, 724))
    await t.select('w1', true)
    expect(t.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'nearest' }))
    expect(document.activeElement).toBe(t.panel)
  })

  it('derin bağlantı (kullanıcı eylemi yok): kaydırma ve odak çalma yok', async () => {
    const t = setup('static', rect(0, 1480, 390, 1795), rect(0, 700, 300, 724))
    await t.select('w1', false)
    expect(t.scrollIntoView).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(t.panel)
  })

  it('geniş ekran: çubuk panelin altında kalıyorsa sayfa kaydırılır; çakışma yoksa dokunmaz', async () => {
    const hit = setup('absolute', rect(1059, 585, 1399, 884), rect(900, 700, 1200, 724))
    await hit.select('w1', true)
    expect(scrollBy).toHaveBeenCalled()
    expect(hit.scrollIntoView).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(hit.panel)
    scrollBy.mockClear()
    document.body.innerHTML = ''
    const clear = setup('absolute', rect(1059, 585, 1399, 884), rect(100, 300, 400, 324))
    await clear.select('w1', true)
    expect(scrollBy).not.toHaveBeenCalled()
    expect(clear.ganttScrollBy).not.toHaveBeenCalled()
  })
})

describe('CX-P-Ö-05: kaydırma sonrası tutamaç panelin altına girmez', () => {
  it('derin bağlantıyla açılan seçimde kullanıcı çubuğu panelin altına kaydırırsa durunca çubuk dışarı alınır', async () => {
    const bar = rect(100, 300, 400, 324)
    const t = setup('absolute', rect(1059, 585, 1399, 884), bar)
    await t.select('w1', false)
    expect(t.ganttScrollBy).not.toHaveBeenCalled()
    // Kullanıcı Gantt'ı kaydırdı: bitiş tutamacı artık panelin altında.
    t.board.querySelector('.gantt-bar')!.getBoundingClientRect = () => rect(900, 700, 1200, 724)
    t.board.querySelector('.gantt__scroller')!.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => setTimeout(resolve, 260))
    // Çubuk panelin üstünde kaldığından en küçük hareket sayfa kaydırmasıdır.
    expect(scrollBy).toHaveBeenCalled()
    expect(t.ganttScrollBy).not.toHaveBeenCalled()
  })

  it('seçim kalkınca dinleyiciler bırakılır (kaydırma artık ölçmez)', async () => {
    const t = setup('absolute', rect(1059, 585, 1399, 884), rect(100, 300, 400, 324))
    await t.select('w1', false)
    const ref2 = t.board.querySelector('.gantt__scroller')!
    t.board.querySelector('.gantt-bar')!.getBoundingClientRect = () => rect(900, 700, 1200, 724)
    ;(t as unknown as { board: HTMLElement }).board.remove()
    ref2.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => setTimeout(resolve, 260))
    expect(t.ganttScrollBy).not.toHaveBeenCalled()
  })

  it('derin bağlantıda yüzen panel çubuğu örtüyorsa çubuk dışarı alınır (odak çalınmaz)', async () => {
    const t = setup('absolute', rect(1059, 585, 1399, 884), rect(900, 700, 1200, 724))
    await t.select('w1', false)
    expect(scrollBy).toHaveBeenCalled()
    expect(document.activeElement).not.toBe(t.panel)
  })
})
