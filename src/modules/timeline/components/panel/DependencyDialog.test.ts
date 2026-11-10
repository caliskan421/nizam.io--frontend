import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import {
  COORD_SCOPE,
  errorEnvelope,
  gantt,
  ganttTask,
  http,
  json,
  ORIGIN,
  sent,
  server,
} from '../../__tests__/harness'
import { $, panelHarness, resetPanel } from './__tests__/panel-harness'
import DependencyDialog from './DependencyDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetPanel)
afterAll(() => server.close())

const DEPS = '/v1/work-items/w1/dependencies'
const GANTT = '/v1/work-items/gantt'
const task = ganttTask({ work_item_id: 'w1', title: 'Rapor' })
const others = [
  ganttTask({ work_item_id: 'w2', title: 'Tasarım' }),
  ganttTask({ work_item_id: 'w3', title: 'Kurulum' }),
]

function render(mode: 'add' | 'remove', edges: object[] = []) {
  server.use(
    http.get(`${ORIGIN}${GANTT}`, () => json(gantt({ tasks: [task, ...others] }))),
    http.get(`${ORIGIN}${DEPS}`, () => json({ dependencies: edges, dependents: [] })),
  )
  const h = panelHarness(COORD_SCOPE, { rows: [['d2', 'koordinator']] })
  const wrapper = h.mount(DependencyDialog, { mode, task, open: true })
  return { h, wrapper }
}

describe('Bağımlılık ekle (addDependency; E-03C-66)', () => {
  it('adaylar açık Gantt yanıtından, kendisi ve mevcut ön görevler hariç', async () => {
    const { h } = render('add', [
      { dependency_id: 'e1', work_item_id: 'w1', depends_on_work_item_id: 'w2' },
    ])
    await settleQueries(h.queryClient)
    const options = [...document.querySelectorAll('select[name="predecessor"] option')]
      .map((o) => o.textContent)
      .filter((t) => t !== 'Görev seçin')
    expect(options).toEqual(['Kurulum'])
  })

  it('seçmeden Ekle kilitli; seçince BAĞIMLI görevin kapsamıyla POST; başarıda bildirim + kapanış', async () => {
    server.use(
      http.post(`${ORIGIN}${DEPS}`, () =>
        json({ dependency_id: 'e9', work_item_id: 'w1', depends_on_work_item_id: 'w3' }, 201),
      ),
    )
    const { h, wrapper } = render('add')
    await settleQueries(h.queryClient)
    const submit = $('[data-testid="tp-dep-submit"]') as HTMLButtonElement
    expect(submit.disabled).toBe(true)
    const select = $('select[name="predecessor"]') as HTMLSelectElement
    select.value = 'w3'
    select.dispatchEvent(new Event('change'))
    await flushPromises()
    submit.click()
    await settleQueries(h.queryClient)
    const [req] = sent('POST', DEPS)
    expect(req!.body).toEqual({ depends_on_work_item_id: 'w3' })
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(useToast().current.value?.message).toBe('Bağımlılık eklendi.')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('409 work.dependency_cycle: kod metni satır içi, pencere açık, tek istek (kör tekrar yok)', async () => {
    server.use(http.post(`${ORIGIN}${DEPS}`, () => errorEnvelope('work.dependency_cycle', 409)))
    const { h, wrapper } = render('add')
    await settleQueries(h.queryClient)
    const select = $('select[name="predecessor"]') as HTMLSelectElement
    select.value = 'w2'
    select.dispatchEvent(new Event('change'))
    await flushPromises()
    ;($('[data-testid="tp-dep-submit"]') as HTMLButtonElement).click()
    await settleQueries(h.queryClient)
    expect($('[data-testid="tp-dep-error"]')!.textContent).toBe('Bu bağımlılık döngü oluşturur.')
    expect(sent('POST', DEPS)).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })
})

describe('Bağımlılığı kaldır (removeDependency; E-03C-66)', () => {
  const edges = [{ dependency_id: 'e1', work_item_id: 'w1', depends_on_work_item_id: 'w2' }]

  it('ön görevler başlıklarıyla listelenir; başka kapsamdaki görev adı uydurulmaz', async () => {
    const { h } = render('remove', [
      ...edges,
      { dependency_id: 'e2', work_item_id: 'w1', depends_on_work_item_id: 'zz' },
    ])
    await settleQueries(h.queryClient)
    const rows = [
      ...document.querySelectorAll('[data-testid="tp-dep-list"] li > span:first-child'),
    ].map((e) => e.textContent)
    expect(rows).toEqual(['Tasarım', 'Başka kapsamdaki görev'])
  })

  it('Kaldır → DELETE depId; başarıda bildirim; ön görev yoksa boş durum', async () => {
    server.use(http.delete(`${ORIGIN}${DEPS}/e1`, () => new Response(null, { status: 204 })))
    const { h } = render('remove', edges)
    await settleQueries(h.queryClient)
    $('[data-testid="tp-dep-remove"]')!.click()
    await settleQueries(h.queryClient)
    expect(sent('DELETE', `${DEPS}/e1`)).toHaveLength(1)
    expect(useToast().current.value?.message).toBe('Bağımlılık kaldırıldı.')
  })

  it('ön görev yoksa boş durum metni', async () => {
    const { h } = render('remove')
    await settleQueries(h.queryClient)
    expect($('[data-testid="tp-dep-empty"]')!.textContent).toBe('Bu görevin ön görevi yok.')
  })
})
