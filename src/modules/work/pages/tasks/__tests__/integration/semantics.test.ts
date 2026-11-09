// W48 madde 2 ve 7 — birleşmiş ağacın erişilebilirlik yapısı (tablo row > cell, iç içe
// landmark yok) ve faz görünürlüğü (F3/F5 devre dışı + faz notu) GERÇEK bileşenlerle.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { server, subtask, workItem } from '../../../../model/__tests__/harness'
import type { StandingFixture } from '../page-harness'
import { backendHandlers, body, fakeWork, mountApp, panelTab, settle, unmountApps } from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => unmountApps())
afterAll(() => server.close())

const COORD: StandingFixture = {
  companyAdmin: true,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}
const pending = { request_id: 'r1', new_start_on: '2026-11-01', new_end_on: '2026-11-20' }

function items() {
  return [
    workItem({
      work_item_id: 'w1',
      department_id: 'd1',
      subtask_counts: { total: 1, done: 0 },
    }),
    workItem({ work_item_id: 'w2', department_id: 'd1', pending_date_request: pending }),
  ]
}

async function openWithSubtasks() {
  const db = fakeWork(items())
  db.subtasks.set('w1', [subtask()])
  server.use(...backendHandlers(COORD, db))
  const ctx = await mountApp(
    { programId: 'p1', lens: 'coordinator', departmentId: 'd1' },
    '/gorevler?gorev=w1',
  )
  body().findAll<HTMLButtonElement>('.rp-subtog')[0]!.element.click()
  await settle(ctx.queryClient)
  return ctx
}

const LANDMARK =
  'main, aside, nav, header, footer, form[aria-label], form[aria-labelledby], ' +
  'section[aria-label], section[aria-labelledby], [role="region"], [role="complementary"], ' +
  '[role="navigation"], [role="main"]'

/** En yakın rollü ata (kendisi hariç). */
function roleParent(el: Element): string | null {
  return el.parentElement?.closest('[role]')?.getAttribute('role') ?? null
}

describe('W48 · erişilebilirlik ağacı (gerçek bileşenler)', () => {
  it('tablo: row yalnız table altında, cell yalnız row altında; alt görev bloğu tek row > tek cell', async () => {
    await openWithSubtasks()
    const table = body().find('[role="table"]').element
    const rows = [...table.querySelectorAll('[role="row"]')]
    expect(rows.length).toBe(4) // başlık + iki görev + açık alt görev bloğu
    for (const row of rows) expect(roleParent(row)).toBe('table')
    for (const cell of table.querySelectorAll('[role="cell"], [role="columnheader"]')) {
      expect(roleParent(cell)).toBe('row')
    }
    const block = table.querySelector('[data-testid="subtask-block"]')!
    expect(block.getAttribute('role')).toBe('row')
    expect(block.querySelectorAll(':scope > [role="cell"]')).toHaveLength(1)
  })

  it('panel: yerleşim kabı rolsüz; tek bölge (adlı section), içinde landmark yok — her sekmede', async () => {
    const ctx = await openWithSubtasks()
    const aside = body().find('.rp-aside').element
    expect(aside.getAttribute('role')).toBeNull()
    expect(aside.tagName).toBe('DIV')
    const panel = aside.querySelector('[data-testid="work-detail"]')!
    expect([...aside.querySelectorAll(LANDMARK)]).toEqual([panel])
    expect(panel.getAttribute('aria-labelledby')).toBeTruthy()
    for (const tab of ['Alt görevler', 'Dosyalar', 'Notlar', 'Özet']) {
      panelTab(tab).click()
      await settle(ctx.queryClient)
      expect([...panel.querySelectorAll(LANDMARK)], tab).toEqual([])
      expect(panel.querySelectorAll('[role="tabpanel"]'), tab).toHaveLength(1)
    }
  })
})

describe('W48 · faz görünürlüğü (§5)', () => {
  it('Zaman çizelgesi canlı (F3); tarih talebi düğmeleri devre dışı "F3’te"; Arşiv bağlantısı "F5’te"', async () => {
    const ctx = await openWithSubtasks()
    const timeline = body().find('[data-testid="tasks-view-timeline"]')
    expect(timeline.attributes('disabled')).toBeUndefined()
    expect(timeline.attributes('data-phase')).toBeUndefined()
    const review = body().findAll('[data-phase="F3"]')
    expect(review.length).toBeGreaterThan(0)
    for (const button of review) expect(button.attributes('disabled')).toBeDefined()

    const dateRequest = body().find('[data-action="date-request"]')
    expect(dateRequest.attributes('disabled')).toBeDefined()
    expect(dateRequest.attributes('aria-label')).toContain('F3’te')

    panelTab('Dosyalar').click()
    await settle(ctx.queryClient)
    const archive = body().find('[data-testid="files-archive-link"]')
    expect(archive.attributes('disabled')).toBeDefined()
    expect(archive.attributes('title')).toContain('F5')
  })
})
