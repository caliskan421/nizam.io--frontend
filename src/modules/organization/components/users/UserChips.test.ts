import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { http, json, ORIGIN, resetHarness, server } from '../../__tests__/harness'
import { baseHandlers, mountWith, unmountAll } from './__tests__/users-harness'
import UserChips from './UserChips.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const label = (departmentId: string) => ({ programId: 'p1', departmentId, role: 'member' as const })

describe('UserChips (E-05-32/33)', () => {
  it('çözülemeyen birim çizilmez; eklenecek birim kalmadıysa K7 yönlendirmesi', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/program/departments`, () =>
        json({ departments: [{ department_id: 'd1', display_name: 'Mekanik' }] }),
      ),
      ...baseHandlers(),
    )
    const { wrapper } = await mountWith(UserChips, {
      accountId: 'u1',
      labels: [label('d1'), label('silinmis')],
    })
    expect(wrapper.findAll('[data-chip]').map((c) => c.attributes('data-chip'))).toEqual(['d1'])
    await wrapper.get('[data-testid="chip-add"]').trigger('click')
    const none = wrapper.get('[data-testid="chip-add-none"]')
    expect(none.text()).toContain('eklenebilecek koordinatörlük yok')
    expect(none.get('a').attributes('href')).toBe('/koordinatorlukler')
  })
})
