import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  http,
  json,
  ORIGIN,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import { $, formsHarness, resetForms, setValue, type WhoSeed } from './__tests__/forms-harness'
import NewTaskDialog from './NewTaskDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const COORD: WhoSeed = { rows: [{ departmentId: 'd1', role: 'koordinator' }] }
const members = [
  { account_id: 'acc-1', full_name: 'Ayşe', membership_id: 'm1', role: 'uye', status: 'active' },
  { account_id: 'acc-2', full_name: 'Bora', membership_id: 'm2', role: 'uye', status: 'active' },
]

async function open(scope = COORD_SCOPE, who: WhoSeed = COORD) {
  server.use(http.get(`${ORIGIN}/v1/departments/:id/members`, () => json({ members })))
  const h = formsHarness(scope, who)
  h.departments([
    { id: 'd1', name: 'Yazılım' },
    { id: 'd2', name: 'Elektronik' },
  ])
  const wrapper = h.mount(NewTaskDialog, { open: true, departmentId: 'd1' })
  await h.flush()
  return { h, wrapper }
}

describe('NewTaskDialog (E-03-57, P3)', () => {
  it('kapalıyken pencere yok; açılınca sözleşme alanları', async () => {
    const h = formsHarness(COORD_SCOPE, COORD)
    h.mount(NewTaskDialog, { open: false })
    expect($('[role="dialog"]')).toBeNull()
    resetForms()

    await open()
    expect($('[role="dialog"]')?.getAttribute('aria-labelledby')).toBeTruthy()
    for (const name of [
      'title',
      'departmentId',
      'assignee',
      'startOn',
      'endOn',
      'priority',
      'description',
    ]) {
      expect($(`[name="${name}"]`), name).not.toBeNull()
    }
    expect(($('[name="evidence"]') as HTMLInputElement).checked).toBe(true)
    expect(($('[name="priority"]') as HTMLSelectElement).value).toBe('orta')
    expect(($('[name="startOn"]') as HTMLInputElement).type).toBe('date')
  })

  it('koordinatörde ek atananlar alanı; yöneticide tek atama alanı', async () => {
    await open()
    expect($('[data-testid="wf-extra"]')?.textContent).toContain('Bora')
    setValue('[name="assignee"]', 'acc-1')
    await nextTick()
    expect($('[data-testid="wf-extra"]')?.textContent).not.toContain('Ayşe')
    resetForms()

    await open(ADMIN_SCOPE, { companyAdmin: true })
    expect($('[name="assignee"]')).not.toBeNull()
    expect($('[data-testid="wf-extra"]')).toBeNull()
  })

  it('gönder → created + kapanış; tek POST', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () => json(workItem({ work_item_id: 'w9' }), 201)),
    )
    const { wrapper } = await open()
    setValue('[name="title"]', 'Rapor')
    setValue('[name="startOn"]', '2026-11-10')
    setValue('[name="endOn"]', '2026-11-12')
    await nextTick()
    $('[data-testid="wf-submit"]')!.click()
    await vi.waitFor(() => expect(wrapper.emitted('created')).toBeTruthy())

    expect(sent('POST', '/v1/work-items')).toHaveLength(1)
    expect(wrapper.emitted('created')?.[0]?.[0]).toMatchObject({ work_item_id: 'w9' })
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('doğrulama hatası alanın altında; istek yok', async () => {
    await open()
    $('[data-testid="wf-submit"]')!.click()
    await vi.waitFor(() => expect(document.body.textContent).toContain('Başlık gerekli.'))
    expect($('[name="title"]')?.getAttribute('aria-invalid')).toBe('true')
    expect(sent('POST', '/v1/work-items')).toHaveLength(0)
  })

  it('gönderim sürerken pencere kapatılamaz', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, async () => {
        await gate
        return json(workItem(), 201)
      }),
    )
    const { wrapper } = await open()
    setValue('[name="title"]', 'Rapor')
    setValue('[name="startOn"]', '2026-11-10')
    setValue('[name="endOn"]', '2026-11-12')
    await nextTick()
    $('[data-testid="wf-submit"]')!.click()
    await vi.waitFor(() =>
      expect(($('[data-testid="wf-submit"]') as HTMLButtonElement).disabled).toBe(true),
    )
    expect($('.t-modal__head button')).toBeNull()
    expect(wrapper.emitted('update:open')).toBeUndefined()
    release()
    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
  })

  it('görev açabileceği koordinatörlük yoksa uyarı ve gönder kapalı', async () => {
    await open(COORD_SCOPE, { rows: [{ departmentId: 'd1', role: 'uye' }] })
    expect($('[data-testid="wf-no-department"]')).not.toBeNull()
    expect(($('[data-testid="wf-submit"]') as HTMLButtonElement).disabled).toBe(true)
  })
})
