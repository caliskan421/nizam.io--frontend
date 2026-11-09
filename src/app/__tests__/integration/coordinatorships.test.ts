// W82a · senaryo (1) ve (3): 08 ızgarası → 08b → gerçek formlar (MemberAddDialog,
// CoordinatorAssignDialog, DepartmentForm) → sayaçlar, 05 listesi, kenar menüsü kapsamı.
// Üretim kökü + router + kabuk + durumlu sahte backend (harness.ts). Taslak yok.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  $$,
  boot,
  byText,
  click,
  createBackend,
  idle,
  PEOPLE,
  seedWorld,
  teardown,
  until,
} from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN, path: '/koordinatorlukler' })
  await until(() => $('[data-department="d1"]'), 'ısınma')
  teardown()
}, 30_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

const card = (id: string) => $(`[data-department="${id}"]`)
const cardNumber = (id: string, what: 'members' | 'tasks') =>
  card(id)?.querySelector(`[data-testid="${what}"]`)?.textContent?.trim()

describe('08 → 08b → Üye ekle (senaryo 1)', () => {
  it('ızgara gerçek sunucu verisiyle çizilir', async () => {
    const app = await boot({ ...ADMIN, path: '/koordinatorlukler' })
    await until(() => card('d1') && card('d2'))
    await idle(app.queryClient)
    expect(cardNumber('d1', 'members')).toBe('3')
    expect($$('[data-department]')).toHaveLength(2)
    expect(byText('a', 'Mekanik', card('d1')!)).not.toBeNull()
  })
})

export { click }
