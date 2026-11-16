// W176 O3 senaryo 5 (kırıcı fark, KESİN 36; ADR-0041): v0.23 sunucusu görevin biriminde koordinatör
// olmayan şirket yöneticisini `TransitionResult.actor = sirket_yoneticisi` ile aktör sayar; istemci
// matrisi DEĞİŞMEDİ ("yönetici tek başına aktör değildir", E-03-44; karar bekler). Canlıda:
//  - koordinatör olmayan ŞY'nin görev panelinde durum yalnız salt okunur etikettir, geçiş isteği yok;
//  - aynı ŞY aynı birimin koordinatörüyse (olgu; mercek ≠ yetki, P1) menü açılır, geçiş uygulanır ve
//    istek gövdesi aktör taşımaz: aktör sunucuda hesaplanır, istemci yanıttaki aktörü yetki kararına
//    katmaz (`SERVER_ACTOR_TO_CLIENT` yalnız bildirim sözlüğüdür).
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'

import {
  $,
  boot,
  click,
  createBackend,
  idle,
  PEOPLE,
  seedTimeline,
  teardown,
  toasts,
  until,
} from './harness'

const ADMIN = { email: PEOPLE.admin.email, scope: { programId: 'p1', lens: 'admin' as const } }
const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

/** w1 (Mekanik d1, Ayşe): geçmiş bitişli açık görev → geciken. */
function seed(adminCoordinates: boolean): void {
  seedTimeline(backend.db)
  if (!adminCoordinates) {
    backend.db.memberships = backend.db.memberships.filter(
      (m) => m.account_id !== PEOPLE.admin.account_id,
    )
  }
  backend.db.items.find((i) => i.work_item_id === 'w1')!.end_on = '2026-11-05'
}
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seed(true)
  await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
  await until(() => $('[data-testid="wf-status-trigger"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => backend.reset())
afterEach(() => teardown())
afterAll(() => backend.server.close())

const overdueBadge = () => $('.side-badge:not(.side-badge--dates)')?.textContent?.trim() ?? null

it('koordinatör olmayan ŞY: durum salt okunur etiket (pin öncesi davranış korunur), geçiş isteği yok', async () => {
  seed(false)
  const app = await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
  await until(() => $('[data-testid="status-readonly"]'), 'salt okunur durum etiketi')
  await idle(app.queryClient)
  expect($('[data-testid="wf-status-trigger"]')).toBeNull()
  expect(backend.sent('POST', '/v1/work-items/w1/transitions')).toHaveLength(0)
})

it('birimin koordinatörü olan ŞY: geçiş uygulanır, hata yok, geciken rozeti düşer; istek gövdesi aktör taşımaz', async () => {
  seed(true)
  const app = await boot({ ...ADMIN, path: '/gorevler?gorev=w1' })
  await until(() => overdueBadge() === '1', 'geciken rozeti')
  await click('[data-testid="wf-status-trigger"]')
  await click('[data-to="tamamlandi"]')
  await until(() => overdueBadge() === null, 'rozet düştü')
  await idle(app.queryClient)
  const sent = backend.sent('POST', '/v1/work-items/w1/transitions')
  expect(sent).toHaveLength(1)
  expect(sent[0]!.body).toEqual(expect.not.objectContaining({ actor: expect.anything() }))
  expect(backend.db.items.find((i) => i.work_item_id === 'w1')!.status).toBe('tamamlandi')
  expect(toasts()).not.toMatch(/hata|başarısız|yapılamadı/i)
})
