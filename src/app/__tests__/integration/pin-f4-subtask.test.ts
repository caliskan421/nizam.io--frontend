import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'

import { $, boot, byText, click, createBackend, seedTimeline, teardown, until } from './harness'
import { ORIGIN } from './fake-org'
import { ADMIN_ADMIN, ganttReady, rowEl, tp } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...ADMIN_ADMIN, path: '/gorevler?gorev=w1' })
  await until(() => $('[data-testid="work-detail"] [data-testid="wf-delete"]'), 'ısınma')
  teardown()
}, 30000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

it('alt görev yazımı sonrası Gantt satırı kapatılıp açıldığında özet günceldir', async () => {
  backend.server.use(
    http.patch(`${ORIGIN}/v1/work-items/w1/subtasks/s2`, async ({ request }) => {
      const body = (await request.json()) as { done: boolean }
      const subtask = backend.db.subtasks.w1!.find((s) => s.subtask_id === 's2')!
      subtask.done = body.done
      return HttpResponse.json(subtask)
    }),
  )
  const app = await boot({ ...ADMIN_ADMIN, path: '/zaman-cizelgesi' })
  await ganttReady()
  await click(
    () => rowEl('w1')?.querySelector<HTMLElement>('[data-testid="subtask-toggle"]') ?? null,
  )
  await until(() => tp('subtask-chip')?.textContent?.trim() === '1/3', 'ilk Gantt özeti')
  await app.router.push('/gorevler?gorev=w1')
  await click(() => byText('[role="tab"]', 'Alt görevler'))
  await click('[data-testid="subtask-s2"] [data-testid="subtask-done"]')
  await until(
    () => $('[data-testid="subtask-count"]')?.textContent?.trim() === '2/3',
    'güncel sayaç',
  )
  expect(backend.sent('PATCH', '/v1/work-items/w1/subtasks/s2')).toHaveLength(1)
  await app.router.push('/zaman-cizelgesi')
  await ganttReady()
  await click(
    () => rowEl('w1')?.querySelector<HTMLElement>('[data-testid="subtask-toggle"]') ?? null,
  )
  await until(() => tp('subtask-chip')?.textContent?.trim() === '2/3', 'Gantt özeti')
  await click(
    () => rowEl('w1')?.querySelector<HTMLElement>('[data-testid="subtask-toggle"]') ?? null,
  )
  await click(
    () => rowEl('w1')?.querySelector<HTMLElement>('[data-testid="subtask-toggle"]') ?? null,
  )
  await until(() => tp('subtask-chip')?.textContent?.trim() === '2/3', 'yeniden açılan özet')
})
