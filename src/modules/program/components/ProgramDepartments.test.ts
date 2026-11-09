import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  $,
  ADMIN_SCOPE,
  click,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import ProgramDepartments from './ProgramDepartments.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

describe('seçili programın departmanları', () => {
  it('önbellekteki liste (kabukla aynı anahtar); "Departman bağla" olayı', async () => {
    const h = harness(ADMIN_SCOPE)
    h.departments([
      { id: 'd1', name: 'Roket' },
      { id: 'd2', name: 'İHA' },
    ])
    const wrapper = h.mount(ProgramDepartments, { canLink: true })
    await h.flush()
    expect($('[data-testid="pg-dept-count"]')?.textContent).toBe('2 departman')
    expect($('[data-department="d2"]')?.textContent?.trim()).toBe('İHA')
    click('[data-testid="pg-link"]')
    expect(wrapper.emitted('link')).toHaveLength(1)
  })

  it('program seçili değilse istek yok, yalnız not', async () => {
    const h = harness({ programId: null, lens: null, departmentId: null })
    h.mount(ProgramDepartments, { canLink: true })
    await h.flush()
    expect(document.body.textContent).toContain('kenar menüsünden bir program seçin')
    expect(sent('GET', '/v1/program/departments')).toHaveLength(0)
    expect($('[data-testid="pg-link"]')).toBeNull()
  })

  it('okuma hatası → yeniden dene; boş liste notu', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program/departments`, () => errorEnvelope('program.not_found', 404)),
    )
    const h = harness(ADMIN_SCOPE)
    h.mount(ProgramDepartments, { canLink: false })
    await vi.waitFor(() => expect(document.body.textContent).toContain('Departmanlar yüklenemedi'))
    server.use(http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: [] })))
    click('.ui-error button')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Bu programa bağlı departman yok.'),
    )
  })
})
