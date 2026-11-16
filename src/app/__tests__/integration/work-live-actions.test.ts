// W176 O3 (W175 girdisi: `DetailActions.test` saplamalı): 03 görev panelinin eylem satırı GERÇEK
// bileşenlerle — kabuk, router, `TaskReportButton` (reports), `DateRequestForm` (timeline), hatırlat
// (BE-008) — durumlu sahte sunucu ile. Birim testteki `CHILD_STUBS`/`FORM_STUB`/`REPORT_STUB`
// yerini bu entegrasyon karşılar (TASLAK kapanışı).
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest'

import { ORIGIN } from './fake-org'
import {
  $,
  boot,
  click,
  createBackend,
  idle,
  seedTimeline,
  teardown,
  toasts,
  until,
} from './harness'
import { COORD } from './timeline-support'

const backend = createBackend({ coordinator: 'koordinator', member: 'uye' })

beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  seedTimeline(backend.db)
  await boot({ ...COORD, path: '/gorevler?gorev=w1' })
  await until(() => $('[data-action="remind"]'), 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  backend.reset()
  seedTimeline(backend.db)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

it('Hatırlat: görevin kendi kapsamıyla anahtarsız POST; "n kişiye gönderildi" bildirimi; gerçek rapor düğmesi yanında', async () => {
  backend.server.use(
    http.post(`${ORIGIN}/v1/work-items/w1/remind`, () =>
      HttpResponse.json({ recipient_count: 1 }, { status: 202 }),
    ),
  )
  const app = await boot({ ...COORD, path: '/gorevler?gorev=w1' })
  await until(() => $('[data-action="remind"]'), 'eylem satırı')
  // Gerçek (saplamasız) görev raporu düğmesi aynı satırda.
  expect($('[data-testid="task-report"]')).not.toBeNull()
  await click('[data-action="remind"]')
  await until(() => toasts().includes('hatırlatma'), 'bildirim')
  await idle(app.queryClient)
  const [sent] = backend.sent('POST', '/v1/work-items/w1/remind')
  expect(backend.sent('POST', '/v1/work-items/w1/remind')).toHaveLength(1)
  expect(sent!.headers.get('X-Nizamio-Program')).toBe('p1')
  expect(sent!.headers.get('X-Nizamio-Department')).toBe('d1')
  expect(sent!.headers.get('Idempotency-Key')).toBeNull()
  expect(toasts()).toContain('1 kişiye hatırlatma gönderildi.')
})

it('Tarih değişikliği iste: gerçek form açılır; Esc kapatır, odak düğmeye döner', async () => {
  const app = await boot({ ...COORD, path: '/gorevler?gorev=w1' })
  const trigger = await until(() => $('[data-action="date-request"]'), 'tarih talebi düğmesi')
  trigger.focus()
  await click('[data-action="date-request"]')
  await until(() => $('[role="dialog"] [data-testid="tp-request-current"]'), 'gerçek form')
  const target = (document.activeElement as HTMLElement | null) ?? $('[role="dialog"]')!
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await until(() => !$('[role="dialog"]'), 'form kapandı')
  await idle(app.queryClient)
  expect(backend.sent('POST', '/v1/work-items/w1/date-requests')).toHaveLength(0)
  expect(document.activeElement).toBe($('[data-action="date-request"]'))
})
