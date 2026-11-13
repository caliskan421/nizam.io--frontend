import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  mountWith,
  resetAll,
  server,
  standingHandlers,
  type StandingFixture,
} from '../__tests__/harness'
import { useHomeScope } from './use-home-scope'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

const Probe = defineComponent({
  setup() {
    const scope = useHomeScope()
    return () =>
      h('output', {
        'data-source': scope.kpiSource.value,
        'data-actions': scope.actions.value.map((a) => a.key).join(','),
      })
  },
})

const probe = async (fixture: StandingFixture, scope = ADMIN_SCOPE) => {
  server.use(...standingHandlers(fixture))
  const { wrapper } = await mountWith(Probe, scope)
  return wrapper.get('output')
}

describe('ana sayfa kapsam olguları ve KPI kaynağı', () => {
  it('yönetici + Admin merceği → pano; eylemler yetkiden (rapor dahil)', async () => {
    const out = await probe({ companyAdmin: true, rows: [] })
    expect(out.attributes('data-source')).toBe('dashboard')
    expect(out.attributes('data-actions')).toBe('newTask,meeting,invite,report')
  })

  it('yönetici K merceğinde → birim sayaçları, eylemler aynı (mercek ≠ yetki, P1)', async () => {
    const out = await probe(
      { companyAdmin: true, rows: [{ department_id: 'd1', role: 'koordinator' }] },
      COORD_SCOPE,
    )
    expect(out.attributes('data-source')).toBe('team')
    expect(out.attributes('data-actions')).toBe('newTask,meeting,invite,report')
  })

  it('koordinatör: birim sayaçları, rapor kutucuğu yok; yönetici olmayan Admin merceği → seçim', async () => {
    const fixture = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'koordinator' }] }
    const coordinator = await probe(fixture, COORD_SCOPE)
    expect(coordinator.attributes('data-source')).toBe('team')
    expect(coordinator.attributes('data-actions')).toBe('newTask,meeting,invite')
    resetAll()
    const nonAdmin = await probe(fixture, ADMIN_SCOPE)
    expect(nonAdmin.attributes('data-source')).toBe('select')
  })
})
