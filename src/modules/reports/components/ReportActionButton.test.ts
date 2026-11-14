import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n } from '@/shared/i18n'
import { settleQueries } from '@/shared/http/__tests__/settle'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import {
  browserSave,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  pdf,
  resetHarness,
  sent,
  server,
  ticketOk,
} from '../__tests__/harness'
import { reportGate } from '../model/gate'
import ReportActionButton from './ReportActionButton.vue'

let saved: ReturnType<typeof browserSave>
const mounted: VueWrapper[] = []

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
  useToast().clear()
})
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
  reportGate.reset()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

function mountButton(props: Record<string, unknown>, slots: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const queryClient = new QueryClient()
  const wrapper = mount(ReportActionButton, {
    props: props as never,
    slots,
    global: { plugins: [pinia, i18n, [VueQueryPlugin, { queryClient }]] },
  })
  mounted.push(wrapper)
  return { wrapper, queryClient }
}

describe('ReportActionButton sözleşmesi (derlenmiş props/emits)', () => {
  it('props: kind, targetId, memberIds, disabledReason (+ W138: variant, size); emits: done, failed', () => {
    const options = ReportActionButton as unknown as {
      props: Record<string, unknown>
      emits: string[] | Record<string, unknown>
    }
    expect(Object.keys(options.props).sort()).toEqual(
      ['disabledReason', 'kind', 'memberIds', 'size', 'targetId', 'variant'].sort(),
    )
    const emits = Array.isArray(options.emits) ? options.emits : Object.keys(options.emits)
    expect(emits.sort()).toEqual(['done', 'failed'])
  })
})

describe('durum makinesi', () => {
  it('hazır → hazırlanıyor (İptal) → indirildi; done(fileName) yayınlanır', async () => {
    let release!: () => void
    const open = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await open
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      pdf({ 'Content-Disposition': 'attachment; filename="donem-raporu-2026-11-13.pdf"' }),
    )
    const { wrapper, queryClient } = mountButton({ kind: 'season' })
    expect(wrapper.text()).toContain('Dönem sonu raporu (PDF)')
    expect(wrapper.attributes('data-state')).toBe('ready')
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('preparing'))
    expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Hazırlanıyor…')
    expect(wrapper.text()).toContain('İptal')
    release()
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('downloaded'))
    expect(wrapper.emitted('done')).toEqual([['donem-raporu-2026-11-13.pdf']])
    expect(saved.clicked).toEqual(['donem-raporu-2026-11-13.pdf'])
    expect(wrapper.find('[role="status"]').text()).toContain('indirildi')
  })

  it('başka bir rapor sürerken kilitli; devre dışı', async () => {
    const lease = reportGate.acquire()!
    const { wrapper } = mountButton({ kind: 'task', targetId: 't1' })
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('locked'))
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Bu sırada diğer rapor düğmeleri kilitli')
    await wrapper.find('button').trigger('click')
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
    lease.release()
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('ready'))
  })

  it('kilitliyken ekranın kendi etiketi (yuva) korunur (W142 KUSUR 1)', async () => {
    const lease = reportGate.acquire()!
    const { wrapper } = mountButton({ kind: 'season' }, { default: 'PDF indir' })
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('locked'))
    expect(wrapper.find('button').text()).toBe('PDF indir')
    lease.release()
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('ready'))
    expect(wrapper.find('button').text()).toBe('PDF indir')
  })

  it('429 Retry-After: hata + "Bekleyin (N s)" sayacı; failed(kod) yayınlanır', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
        errorEnvelope('reporting.export_in_progress', 429, { 'Retry-After': '1' }),
      ),
    )
    const { wrapper } = mountButton({ kind: 'meeting', targetId: 'm1' })
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('cooldown'))
    expect(wrapper.text()).toContain('Bekleyin (1 s)')
    const card = wrapper.find('[role="alert"]')
    expect(card.text()).toContain('Zaten bir rapor hazırlanıyor')
    expect(card.text()).toContain('429 · reporting.export_in_progress')
    expect(wrapper.emitted('failed')).toEqual([['reporting.export_in_progress']])
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('503 capacity_full: sayaç yok, "Yeniden dene" etiketi, tıklanabilir', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('reporting.capacity_full', 503)),
    )
    const { wrapper } = mountButton({ kind: 'season' })
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('failed'))
    expect(wrapper.find('button').text()).toBe('Yeniden dene')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
    const card = wrapper.find('[role="alert"]')
    expect(card.text()).toContain('Sunucu şu an yoğun, biraz sonra tekrar deneyin')
    expect(card.text()).toContain('503 · reporting.capacity_full')
    expect(card.text()).not.toMatch(/\d+ ?(sn|saniye)/)
  })

  it('disabledReason: devre dışı, istek yok, gerekçe title', async () => {
    const { wrapper } = mountButton({ kind: 'season', disabledReason: 'yakında' })
    expect(wrapper.attributes('data-state')).toBe('disabled')
    expect(wrapper.find('button').attributes('title')).toBe('yakında')
    await wrapper.find('button').trigger('click')
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })

  it('iş yükü etiketi seçimle değişir; yuva etiketi geçersiz kılar', () => {
    const none = mountButton({ kind: 'workload', memberIds: [] })
    expect(none.wrapper.text()).toBe('İş yükü raporu (PDF)')
    const some = mountButton({ kind: 'workload', memberIds: ['a', 'b', 'c'] })
    expect(some.wrapper.text()).toBe('Seçilenlerin iş yükü (PDF) · 3')
    const custom = mountButton({ kind: 'workload', memberIds: ['a'] }, { default: 'Kişisel rapor' })
    expect(custom.wrapper.text()).toBe('Kişisel rapor')
  })

  it('sahip sökülürse uçuştaki eylem iptal edilir: bildirim ve kayıt yok, kilit açılır', async () => {
    let release!: () => void
    const open = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await open
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      pdf(),
    )
    const { wrapper } = mountButton({ kind: 'season' })
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(reportGate.busy.value).toBe(true))
    wrapper.unmount()
    expect(reportGate.busy.value).toBe(false)
    release()
    await flushPromises()
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(saved.clicked).toEqual([])
    expect(useToast().current.value).toBeNull()
  })
})

describe('W138 ek yüzey (trailing yuvası, start(), kartlar)', () => {
  it('trailing yuvası düğmeye bitişik çizilir; start() düğmeyle aynı durumda indirir', async () => {
    server.use(ticketOk(), pdf())
    const { wrapper, queryClient } = mountButton(
      { kind: 'season' },
      { trailing: '<button type="button" data-testid="extra">Bölüm seç…</button>' },
    )
    expect(wrapper.find('.report-action__row [data-testid="extra"]').exists()).toBe(true)
    await (wrapper.vm as unknown as { start: () => Promise<void> }).start()
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('downloaded'))
    expect(saved.clicked).toHaveLength(1)
    expect(wrapper.get('[data-testid="report-card"]').text()).toContain(
      'Rapor indirmeleri kayda geçer (denetim).',
    )
  })

  it('hazırlanırken kart role=status + aria-busy ve "ilerleme yakında" taşır', async () => {
    let release!: () => void
    const open = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await open
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
      pdf(),
    )
    const { wrapper } = mountButton({ kind: 'meeting', targetId: 'm1' })
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.attributes('data-state')).toBe('preparing'))
    const card = wrapper.get('[data-testid="report-card"]')
    expect(card.attributes('aria-busy')).toBe('true')
    expect(card.text()).toContain('ilerleme yakında')
    release()
    await flushPromises()
  })
})

describe('CX-F6-E-01: kayıt/tür/seçim değişince süren kiralama iptal edilir', () => {
  const deferred = () => {
    let release!: () => void
    const open = new Promise<void>((resolve) => (release = resolve))
    return { open, release }
  }

  it("A bileti beklerken B'ye geçiş: tüketim yok, kaydetme/bildirim/olay yok; B bağımsız indirir", async () => {
    const hold = deferred()
    let redeemed = 0
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await hold.open
        return json({
          ticket: 'tk_1',
          url: '/v1/downloads/tk_1',
          expires_at: '2026-11-13T10:01:00Z',
        })
      }),
      http.get(`${ORIGIN}/v1/downloads/:ticket`, () => {
        redeemed += 1
        return new Response(Uint8Array.from([37, 80, 68, 70]), {
          headers: { 'Content-Type': 'application/pdf' },
        })
      }),
    )
    const { wrapper } = mountButton({ kind: 'meeting', targetId: 'a' })
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(sent('POST', '/v1/download-tickets')).toHaveLength(1))
    await wrapper.setProps({ targetId: 'b' })
    hold.release()
    await flushPromises()
    await vi.waitFor(() => expect(wrapper.get('button').attributes('disabled')).toBeUndefined())
    expect(redeemed).toBe(0)
    expect(saved.clicked).toEqual([])
    expect(wrapper.emitted('done')).toBeUndefined()
    expect(wrapper.emitted('failed')).toBeUndefined()
    expect(useToast().current.value).toBeNull()
    expect(wrapper.find('[data-testid="report-card"]').exists()).toBe(false)

    // B'nin bağımsız indirmesi çalışır (kapı serbest, durum temiz).
    server.use(ticketOk(), pdf())
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.emitted('done')).toHaveLength(1))
    expect(saved.clicked).toHaveLength(1)
    expect(sent('POST', '/v1/download-tickets').at(-1)!.body).toEqual({
      method: 'GET',
      path: '/v1/reports/meetings/b/pdf',
    })
  })

  it("A tüketimi beklerken B'ye geçiş: kaydetme ve bildirim yok; B bağımsız indirir", async () => {
    const hold = deferred()
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/:ticket`, async () => {
        await hold.open
        return new Response(Uint8Array.from([37, 80, 68, 70]), {
          headers: { 'Content-Type': 'application/pdf' },
        })
      }),
    )
    const { wrapper } = mountButton({ kind: 'task', targetId: 'a' })
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(sent('GET', '/v1/downloads/tk_1').length).toBeGreaterThan(0))
    await wrapper.setProps({ targetId: 'b' })
    hold.release()
    await flushPromises()
    expect(saved.clicked).toEqual([])
    expect(wrapper.emitted('done')).toBeUndefined()
    expect(useToast().current.value).toBeNull()
    await vi.waitFor(() => expect(wrapper.get('button').attributes('disabled')).toBeUndefined())

    server.use(ticketOk(), pdf())
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.emitted('done')).toHaveLength(1))
    expect(saved.clicked).toHaveLength(1)
  })

  it('aynı içerikli yeni memberIds dizisi iptal ETMEZ; farklı seçim eder', async () => {
    const hold = deferred()
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await hold.open
        return json({
          ticket: 'tk_1',
          url: '/v1/downloads/tk_1',
          expires_at: '2026-11-13T10:01:00Z',
        })
      }),
      pdf(),
    )
    const { wrapper } = mountButton({ kind: 'workload', memberIds: ['x'] })
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(sent('POST', '/v1/download-tickets')).toHaveLength(1))
    await wrapper.setProps({ memberIds: ['x'] })
    hold.release()
    await vi.waitFor(() => expect(wrapper.emitted('done')).toHaveLength(1))
    expect(saved.clicked).toHaveLength(1)
  })
})
