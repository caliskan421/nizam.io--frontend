// Programa departman bağla (DepartmentLinkDialog + useDepartmentLink): yalnız bağlı olmayan
// katalog departmanları; "ekibi şu sezondan kopyala" kaynağı gövdeye; ad çakışması alana.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'

import {
  $,
  ADMIN_SCOPE,
  bodyOf,
  click,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  setValue,
  toasts,
} from '../__tests__/harness'
import DepartmentLinkDialog from './DepartmentLinkDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

function open() {
  const h = harness(ADMIN_SCOPE)
  h.departments([{ id: 'd1', name: 'Roket' }])
  h.queryClient.setQueryData(queryKeys.catalog.departments(), {
    departments: [
      { department_id: 'd1', name: 'Roket', kind: 'koordinatorluk' },
      { department_id: 'd2', name: 'Yazılım', code: 'YZL', kind: 'koordinatorluk' },
    ],
  })
  server.use(http.get(`${ORIGIN}/v1/departments`, () => json({ departments: [] })))
  const wrapper = h.mount(DepartmentLinkDialog, { open: true, programName: 'Teknofest 2026' })
  return { h, wrapper }
}

const optionValues = (selector: string) =>
  [...(($(selector) as HTMLSelectElement | null)?.options ?? [])].map((o) => o.value)

describe('programa departman bağla', () => {
  it('seçenekler: bağlı olmayan departmanlar; kopya kaynağı diğer programlar', async () => {
    const { h } = open()
    await h.flush()
    expect(optionValues('[name="department"]')).toEqual(['', 'd2'])
    expect(optionValues('[name="copyFrom"]')).toEqual(['', 'p2'])
    expect(document.body.textContent).toContain('Teknofest 2026 programına')
  })

  it('departman zorunlu; ad 2–120: geçersizse istek yok', async () => {
    const { h } = open()
    click('[data-testid="pg-link-submit"]')
    await h.flush()
    expect(document.body.textContent).toContain('Departman seçin.')
    await setValue('[name="department"]', 'd2')
    await setValue('[name="displayName"]', 'Y')
    click('[data-testid="pg-link-submit"]')
    await h.flush()
    expect(document.body.textContent).toContain('Ad 2–120 karakter olmalı.')
    expect(sent('POST', '/v1/program/departments')).toHaveLength(0)
  })

  it('kopya kaynağıyla bağlar: program başlığı + copy_members_from_program_id; kopya sayısı bildirilir', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/program/departments`, () =>
        json(
          {
            program_id: 'p1',
            department_id: 'd2',
            display_name: 'Yazılım',
            copied_member_count: 4,
          },
          201,
        ),
      ),
      http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: [] })),
      http.get(`${ORIGIN}/v1/me`, () => json({})),
    )
    const { wrapper } = open()
    await setValue('[name="department"]', 'd2')
    await setValue('[name="copyFrom"]', 'p2')
    click('[data-testid="pg-link-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('linked')).toEqual([['d2']]))
    const [req] = sent('POST', '/v1/program/departments')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    await vi.waitFor(() =>
      expect(bodyOf(req)).toEqual({ department_id: 'd2', copy_members_from_program_id: 'p2' }),
    )
    expect(toasts()).toContain('Departman bağlandı; 4 ekip satırı kopyalandı.')
  })

  it('409 link_name_exists → ad alanı; 422 copy_source_not_linked → kopya alanı', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/program/departments`, () =>
        errorEnvelope('program.department_link_name_exists', 409),
      ),
    )
    const { wrapper } = open()
    await setValue('[name="department"]', 'd2')
    await setValue('[name="displayName"]', 'Roket')
    click('[data-testid="pg-link-submit"]')
    await vi.waitFor(() =>
      expect($('[name="displayName"]')?.getAttribute('aria-invalid')).toBe('true'),
    )
    server.use(
      http.post(`${ORIGIN}/v1/program/departments`, () =>
        errorEnvelope('program.copy_source_not_linked', 422),
      ),
    )
    await setValue('[name="displayName"]', '')
    await setValue('[name="copyFrom"]', 'p2')
    click('[data-testid="pg-link-submit"]')
    await vi.waitFor(() =>
      expect($('[name="copyFrom"]')?.getAttribute('aria-invalid')).toBe('true'),
    )
    expect(wrapper.emitted('linked')).toBeUndefined()
  })
})
