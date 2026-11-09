// "Bu programa ekle" adımı (`department-link.ts`): kısmi başarıdan sonra ad doğrulaması ve 409.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  sent,
  server,
} from '../../__tests__/harness'
import { $, click, formsHarness, resetForms, setValue } from './__tests__/harness'
import DepartmentForm from './DepartmentForm.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

async function partialState() {
  server.use(
    http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: [] })),
    http.post(`${ORIGIN}/v1/departments`, () =>
      json({ department_id: 'dn', name: 'Yazılım', kind: 'koordinatorluk' }, 201),
    ),
    http.post(`${ORIGIN}/v1/program/departments`, () =>
      errorEnvelope('program.department_link_name_exists', 409),
    ),
  )
  const h = formsHarness(ADMIN_SCOPE)
  h.departments([])
  const wrapper = h.mount(DepartmentForm, { open: true })
  await h.flush()
  setValue('[name="name"]', 'Yazılım')
  await nextTick()
  click('[data-testid="of-submit"]')
  await vi.waitFor(() => expect($('[data-testid="of-link"]')).not.toBeNull())
  return { h, wrapper }
}

describe('DepartmentForm — bağ adımı', () => {
  it('programdaki ad 2–120 denetimi; geçersizse istek yok', async () => {
    await partialState()
    setValue('[name="linkDisplayName"]', 'Y')
    await nextTick()
    click('[data-testid="of-link-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Programdaki ad 2–120 karakter olmalı.'),
    )
    expect(sent('POST', '/v1/program/departments')).toHaveLength(1)
  })

  it('409 link_name_exists → ad alanında; pencere açık kalır', async () => {
    const { wrapper } = await partialState()
    setValue('[name="linkDisplayName"]', 'Yazılım')
    await nextTick()
    click('[data-testid="of-link-submit"]')
    await vi.waitFor(() => expect(sent('POST', '/v1/program/departments')).toHaveLength(2))
    await vi.waitFor(() =>
      expect($('[name="linkDisplayName"]')?.getAttribute('aria-invalid')).toBe('true'),
    )
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })
})
