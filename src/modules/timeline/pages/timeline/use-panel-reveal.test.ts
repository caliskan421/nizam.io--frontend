import { effectScope, nextTick, ref } from 'vue'
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
  const scope = effectScope()
  const reveal = scope.run(() => useSelectionReveal(ref(board), () => selected.value))!
  const select = async (id: string, arm: boolean) => {
    if (arm) reveal.arm()
    selected.value = id
    await nextTick()
    await vi.advanceTimersByTimeAsync(250)
  }
  return { board, panel, scrollIntoView, ganttScrollBy, select, selected, scope }
}

let scrollBy: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.useFakeTimers()
  scrollBy = vi.fn()
  window.scrollBy = scrollBy as unknown as typeof window.scrollBy
  const page = document.documentElement
  Object.defineProperty(document, 'scrollingElement', { configurable: true, value: page })
  Object.defineProperty(page, 'scrollHeight', { configurable: true, value: 2000 })
  Object.defineProperty(page, 'clientHeight', { configurable: true, value: 900 })
})
afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
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
    await vi.advanceTimersByTimeAsync(260)
    // Çubuk panelin üstünde kaldığından en küçük hareket sayfa kaydırmasıdır.
    expect(scrollBy).toHaveBeenCalled()
    expect(t.ganttScrollBy).not.toHaveBeenCalled()
  })

  it.each(['selection', 'scope'] as const)(
    '%s temizliği bağlı DOM üzerinde ölçümü ve iki eksenli kaydırmayı durdurur',
    async (kind) => {
      const t = setup('absolute', rect(1059, 585, 1399, 884), rect(100, 300, 400, 324))
      await t.select('w1', false)
      const measure = vi.spyOn(t.panel, 'getBoundingClientRect')
      if (kind === 'selection') {
        t.selected.value = null
        await nextTick()
      } else t.scope.stop()
      measure.mockClear()
      t.board.querySelector('.gantt__scroller')!.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
      await vi.advanceTimersByTimeAsync(260)
      expect(measure).not.toHaveBeenCalled()
      expect(scrollBy).not.toHaveBeenCalled()
      expect(t.ganttScrollBy).not.toHaveBeenCalled()
    },
  )

  it('temizlik öncesi kuyruğa giren ResizeObserver geri çağrısı ölçüm yapmaz', async () => {
    let callback: ResizeObserverCallback | undefined
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          callback = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    try {
      const t = setup('absolute', rect(1059, 585, 1399, 884), rect(100, 300, 400, 324))
      await t.select('w1', false)
      expect(callback).toBeDefined()
      t.scope.stop()
      const measure = vi.spyOn(t.panel, 'getBoundingClientRect')
      callback!([], {} as ResizeObserver)
      expect(measure).not.toHaveBeenCalled()
      expect(scrollBy).not.toHaveBeenCalled()
      expect(t.ganttScrollBy).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('bekleyen içerik yerleşirken seçim değişirse eski seçim ölçülmez', async () => {
    const t = setup('absolute', rect(1059, 585, 1399, 884), rect(900, 700, 1200, 724))
    t.panel.setAttribute('aria-busy', 'true')
    t.selected.value = 'w1'
    await nextTick()
    await nextTick()
    t.selected.value = null
    await nextTick()
    t.panel.removeAttribute('aria-busy')
    await vi.advanceTimersByTimeAsync(250)
    expect(scrollBy).not.toHaveBeenCalled()
    expect(t.ganttScrollBy).not.toHaveBeenCalled()
    t.scope.stop()
  })

  it('derin bağlantıda yüzen panel çubuğu örtüyorsa çubuk dışarı alınır (odak çalınmaz)', async () => {
    const t = setup('absolute', rect(1059, 585, 1399, 884), rect(900, 700, 1200, 724))
    await t.select('w1', false)
    expect(scrollBy).toHaveBeenCalled()
    expect(document.activeElement).not.toBe(t.panel)
  })
})
