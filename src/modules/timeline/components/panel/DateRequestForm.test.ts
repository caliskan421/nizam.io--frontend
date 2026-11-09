import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import {
  COORD_SCOPE,
  errorEnvelope,
  http,
  HttpResponse,
  json,
  ORIGIN,
  sent,
  server,
  workItem,
} from '../../__tests__/harness'
import { $, panelHarness, resetPanel, setValue } from './__tests__/panel-harness'
import DateRequestForm from './DateRequestForm.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetPanel)
afterAll(() => server.close())

const ITEM = '/v1/work-items/w1'
const REQUESTS = '/v1/date-change-requests'
const created = { request_id: 'r1', work_item_id: 'w1', status: 'pending' }

const props = {
  open: true,
  workItemId: 'w1',
  target: { programId: 'p1', departmentId: 'd2' },
  startOn: '2026-11-01',
  endOn: '2026-11-10',
}

function render(over: Record<string, unknown> = {}) {
  server.use(http.get(`${ORIGIN}${ITEM}`, () => json(workItem())))
  const h = panelHarness(COORD_SCOPE, { rows: [['d2', 'koordinator']] })
  const wrapper = h.mount(DateRequestForm, { ...props, ...over })
  return { h, wrapper }
}

/** Gönder'e basar; yazma uçuştayken (kilit testleri) `settle: false`. */
async function submit(h: ReturnType<typeof panelHarness>, settle = true): Promise<void> {
  $('[data-testid="tp-request-submit"]')!.click()
  await flushPromises()
  if (settle) await settleQueries(h.queryClient)
}

describe('DateRequestForm (E-03C-64; 03 E-03-54/63 ile aynı form)', () => {
  it('açılışta tarihler gg.aa.yyyy dolu; geçerli aralık taze görevden okunur (görevin kendi kapsamıyla)', async () => {
    const { h } = render()
    await settleQueries(h.queryClient)
    expect(($('input[name="start"]') as HTMLInputElement).value).toBe('01.11.2026')
    expect(($('input[name="end"]') as HTMLInputElement).value).toBe('10.11.2026')
    expect($('[data-testid="tp-request-current"]')!.textContent).toContain(
      '01.11.2026 → 10.11.2026',
    )
    const [read] = sent('GET', ITEM)
    expect(read!.headers.get('X-Nizamio-Department')).toBe('d2')
  })

  it('kapalıyken görev okunmaz', async () => {
    const { h } = render({ open: false })
    await settleQueries(h.queryClient)
    expect(sent('GET', ITEM)).toHaveLength(0)
    expect($('[role="dialog"]')).toBeNull()
  })

  it('geçersiz tarih ve ters sıra istek atmadan hata gösterir; değişmeyen tarih de gitmez', async () => {
    const { h } = render()
    await settleQueries(h.queryClient)
    setValue('input[name="start"]', '31.02.2026')
    await submit(h)
    expect($('[role="dialog"]')!.textContent).toContain('gg.aa.yyyy biçiminde')
    setValue('input[name="start"]', '20.11.2026')
    await submit(h)
    expect($('[role="dialog"]')!.textContent).toContain('Bitiş, başlangıçtan önce olamaz.')
    setValue('input[name="start"]', '01.11.2026')
    await submit(h)
    expect($('[data-testid="tp-request-error"]')!.textContent).toBe('Tarihler değişmedi.')
    expect(sent('POST', REQUESTS)).toHaveLength(0)
  })

  it('gönderim: iki tarih + isteğe bağlı gerekçe; görevin kendi başlıkları; başarıda sent + kapanış + bildirim', async () => {
    server.use(http.post(`${ORIGIN}${REQUESTS}`, () => json(created, 201)))
    const { h, wrapper } = render()
    await settleQueries(h.queryClient)
    setValue('input[name="end"]', '15.11.2026')
    setValue('input[name="reason"]', '  malzeme gecikti ')
    await submit(h)

    const [req] = sent('POST', REQUESTS)
    expect(req!.body).toEqual({
      work_item_id: 'w1',
      new_start_on: '2026-11-01',
      new_end_on: '2026-11-15',
      reason: 'malzeme gecikti',
    })
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.headers.get('X-Requested-With')).not.toBeNull()
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(wrapper.emitted('sent')).toEqual([['r1']])
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(useToast().current.value?.message).toBe('Tarih talebi gönderildi.')
  })

  it('gerekçe boşsa gövdede yok', async () => {
    server.use(http.post(`${ORIGIN}${REQUESTS}`, () => json(created, 201)))
    const { h } = render()
    await settleQueries(h.queryClient)
    setValue('input[name="end"]', '15.11.2026')
    await submit(h)
    expect(Object.keys(sent('POST', REQUESTS)[0]!.body as object)).not.toContain('reason')
  })

  it('istek sürerken Gönder kilitli ve pencere kapanmaz: çift gönderim yok (anahtarsız uç)', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}${REQUESTS}`, async () => {
        await gate
        return json(created, 201)
      }),
    )
    const { h } = render()
    await settleQueries(h.queryClient)
    setValue('input[name="end"]', '15.11.2026')
    await submit(h, false)
    const button = $('[data-testid="tp-request-submit"]') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    button.click()
    await flushPromises()
    expect(sent('POST', REQUESTS)).toHaveLength(1)
    release()
    await settleQueries(h.queryClient)
    expect(sent('POST', REQUESTS)).toHaveLength(1)
  })

  it('409 work.date_request_pending_exists: kendi iletisi, görev yeniden okunur, pencere açık kalır', async () => {
    server.use(
      http.post(`${ORIGIN}${REQUESTS}`, () =>
        errorEnvelope('work.date_request_pending_exists', 409),
      ),
    )
    const { h, wrapper } = render()
    await settleQueries(h.queryClient)
    setValue('input[name="end"]', '15.11.2026')
    const reads = sent('GET', ITEM).length
    await submit(h)
    expect($('[data-testid="tp-request-error"]')!.textContent).toContain(
      'bekleyen bir tarih talebi zaten var',
    )
    expect(sent('GET', ITEM).length).toBeGreaterThan(reads)
    expect(wrapper.emitted('sent')).toBeUndefined()
    expect($('[role="dialog"]')).not.toBeNull()
  })

  it('sunucu iletisi gösterilmez: hata kodu → i18n (422 date_request_invalid)', async () => {
    server.use(
      http.post(`${ORIGIN}${REQUESTS}`, () => errorEnvelope('work.date_request_invalid', 422)),
    )
    const { h } = render()
    await settleQueries(h.queryClient)
    setValue('input[name="end"]', '15.11.2026')
    await submit(h)
    const text = $('[data-testid="tp-request-error"]')!.textContent
    expect(text).toBe('Tarih talebi geçersiz.')
    expect(document.body.textContent).not.toContain('sunucu iletisi')
  })

  it('sonuç bilinmiyor (ağ hatası): kör tekrar yok, taslak ve pencere korunur, kalıcı bildirim', async () => {
    server.use(http.post(`${ORIGIN}${REQUESTS}`, () => HttpResponse.error()))
    const { h, wrapper } = render()
    await settleQueries(h.queryClient)
    setValue('input[name="end"]', '15.11.2026')
    await submit(h)
    expect(sent('POST', REQUESTS)).toHaveLength(1)
    expect(($('input[name="end"]') as HTMLInputElement).value).toBe('15.11.2026')
    expect(wrapper.emitted('sent')).toBeUndefined()
    expect(useToast().current.value?.tone).toBe('danger')
  })

  it('sahip gönderim sürerken söküldü: geç sonuç bildirim ve olay üretmez (Ö-07)', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}${REQUESTS}`, async () => {
        await gate
        return json(created, 201)
      }),
    )
    const { h, wrapper } = render()
    await settleQueries(h.queryClient)
    setValue('input[name="end"]', '15.11.2026')
    await submit(h, false)
    wrapper.unmount()
    release()
    await flushPromises()
    await settleQueries(h.queryClient)
    expect(useToast().queue.value).toEqual([])
    expect(wrapper.emitted('sent')).toBeUndefined()
  })

  it('Esc pencereyi kapatır ve odak tetikleyiciye döner', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const { h, wrapper } = render({ open: false })
    await wrapper.setProps({ open: true })
    await settleQueries(h.queryClient)
    $('[role="dialog"]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await flushPromises()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    await wrapper.setProps({ open: false })
    await flushPromises()
    expect(document.activeElement).toBe(trigger)
  })
})
