// W82a · senaryo (9): W81 dönem aktarımı — önizle → aktar (ortak onay) → `['programs']`, aktarım
// geçmişi ve kapsam (standing) yeniden okunur; hedef programda bağ, ekip ve görevler görünür.
// Gerçek ProgramsPage + TransferPanel + TransferItems + kabuk + sahte backend.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import {
  $,
  byText,
  boot,
  click,
  createBackend,
  fill,
  idle,
  PEOPLE,
  seedWorld,
  switchScope,
  teardown,
  toasts,
  until,
} from './harness'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedWorld(backend.db)
  await boot({ ...ADMIN, path: '/programlar' })
  await until(() => $('[data-testid="pg-transfer"]'), 'ısınma')
  teardown()
}, 30_000)
beforeEach(() => {
  backend.reset()
  seedWorld(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('dönem aktarımı (senaryo 9)', () => {
  it('önizle → aktar → programlar, geçmiş ve standing yenilenir; hedef programda görünür', async () => {
    const app = await boot({ ...ADMIN, path: '/programlar' })
    await fill('[data-testid="pg-transfer"] select[name="target"]', 'p2')
    await fill('[data-testid="pg-transfer"] select[name="department"]', 'd1')
    await click('[data-testid="pg-select-all"]')
    await until(() => $('[data-testid="pg-selected-count"]')?.textContent?.includes('2'), 'seçim')
    await click('[data-testid="pg-preview"]:not([disabled])')
    await until(() => $('[data-testid="pg-preview-card"]'), 'önizleme')
    expect(backend.sent('POST', '/v1/program-transfers')).toHaveLength(0)

    await idle(app.queryClient)
    const before = {
      programs: backend.sent('GET', '/v1/programs').length,
      standing: backend.sent('GET', '/v1/me/departments').length,
      history: backend.sent('GET', '/v1/program-transfers').length,
    }
    await click('[data-testid="pg-execute"]:not([disabled])')
    await click(() => $('[data-testid="confirm-dialog"] [data-testid="confirm-accept"]'))
    await until(() => !$('[data-testid="confirm-dialog"]'), 'onay kapanır')
    await until(() => toasts() !== '', 'sonuç bildirimi')
    const [execute] = backend.sent('POST', '/v1/program-transfers')
    expect(execute!.headers.get('Idempotency-Key')).toBeTruthy()
    expect(execute!.body).toMatchObject({
      preview_fingerprint: 'fp-w1-w2',
      target_program_id: 'p2',
    })

    await idle(app.queryClient)
    expect(backend.sent('GET', '/v1/programs').length).toBeGreaterThan(before.programs)
    expect(backend.sent('GET', '/v1/me/departments').length).toBeGreaterThan(before.standing)
    expect(backend.sent('GET', '/v1/program-transfers').length).toBeGreaterThan(before.history)
    await until(() => $('[data-testid="pg-history"] [data-transfer]'), 'geçmiş satırı')

    await switchScope('Program', 'Teknofest 2027')
    await until(() => app.scope.programId === 'p2', 'kapsam p2')
    await app.router.push('/koordinatorlukler')
    await until(() => $('[data-department="d1"]'), 'hedef programda Mekanik bağı')
    await click(() => byText('nav a', 'Görevler'))
    await until(
      () => $('[data-work-item="w1"]') && $('[data-work-item="w2"]'),
      'aktarılan görevler',
    )
  })
})
