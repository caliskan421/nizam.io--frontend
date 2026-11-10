import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  gantt,
  ganttTask,
  http,
  json,
  MEMBER_SCOPE,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../__tests__/harness'
import { GanttView } from '../components'
import {
  ADMIN,
  ADMIN_GANTT,
  COORD_GANTT,
  ganttHandler,
  MEMBER_GANTT,
  mountPage,
  standingHandlers,
  type StandingFixture,
  unmountPages,
} from './timeline/__tests__/page-harness'
import TimelinePage from './TimelinePage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  vi.useRealTimers()
  unmountPages()
  resetHarness()
})
afterAll(() => server.close())

const TASK = ganttTask({
  work_item_id: 'w1',
  title: 'Asfalt',
  department_id: 'd1',
  start_on: '2026-06-16',
  end_on: '2026-08-31',
})
const EXTEND = '/v1/work-items/w1/extend'
const REQUEST = '/v1/date-change-requests'
const COORDINATOR: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}
const MEMBER: StandingFixture = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'uye' }],
}

async function setup(path: string, fixture: StandingFixture, scope: typeof ADMIN_SCOPE) {
  server.use(
    ...standingHandlers(fixture),
    ganttHandler(path, gantt({ tasks: [TASK] })),
    http.post(`${ORIGIN}${EXTEND}`, () => json({ cascade_count: 0, new_end_on: '2026-09-04' })),
    http.post(`${ORIGIN}${REQUEST}`, () => json({ request_id: 'r1' } as never, 201)),
  )
  const ctx = await mountPage(TimelinePage, scope)
  vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] })
  const view = ctx.wrapper.findComponent(GanttView)
  const drop = () =>
    view.vm.$emit('edge-drag', { workItemId: 'w1', edge: 'end', phase: 'drop', day: '2026-09-04' })
  const elapse = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms)
    await vi.advanceTimersByTimeAsync(50)
  }
  return { ctx, view, drop, elapse }
}

describe('Zaman çizelgesi — tarih sürükleme bağlantısı (W95)', () => {
  it('Admin: tutamaçlı görev; bırakma → bildirim; 5 sn sonra TEK extend isteği', async () => {
    const { ctx, view, drop, elapse } = await setup(ADMIN_GANTT, ADMIN, ADMIN_SCOPE)
    expect([...(view.props('draggableIds') as Set<string>)]).toEqual(['w1'])
    drop()
    await elapse(10)
    expect(ctx.wrapper.find('[data-testid="date-change-snack"]').text()).toContain(
      'Asfalt süresi 4 gün uzatıldı',
    )
    expect(ctx.wrapper.get('[data-testid="timeline-date-announce"]').text()).toContain(
      'bitiş 04 Eyl',
    )
    await elapse(4000)
    expect(sent('POST', EXTEND)).toHaveLength(0)
    await elapse(1100)
    expect(sent('POST', EXTEND)).toHaveLength(1)
    expect(sent('POST', EXTEND)[0]?.body).toEqual({ days: 4 })
  })

  it('İptal et → istek 0, bildirim kalkar', async () => {
    const { ctx, drop, elapse } = await setup(ADMIN_GANTT, ADMIN, ADMIN_SCOPE)
    drop()
    await elapse(10)
    await ctx.wrapper.get('.rp-snack__undo').trigger('click')
    expect(ctx.wrapper.find('[data-testid="date-change-snack"]').exists()).toBe(false)
    await elapse(10_000)
    expect(sent('POST', EXTEND)).toHaveLength(0)
  })

  it('Koordinatör: talep (requestDateChange) + "onaya gider"', async () => {
    const { ctx, drop, elapse } = await setup(COORD_GANTT, COORDINATOR, COORD_SCOPE)
    drop()
    await elapse(10)
    expect(ctx.wrapper.get('[data-testid="date-change-snack"]').text()).toContain(
      'Değişiklik onaya gider',
    )
    await elapse(5100)
    expect(sent('POST', REQUEST)).toHaveLength(1)
    expect(sent('POST', REQUEST)[0]?.body).toEqual({
      work_item_id: 'w1',
      new_start_on: '2026-06-16',
      new_end_on: '2026-09-04',
    })
    expect(sent('POST', EXTEND)).toHaveLength(0)
  })

  it('Üye: tutamaç yok, bırakma olayı bildirim/istek doğurmaz', async () => {
    const { ctx, view, drop, elapse } = await setup(MEMBER_GANTT, MEMBER, MEMBER_SCOPE)
    expect((view.props('draggableIds') as Set<string>).size).toBe(0)
    drop()
    await elapse(10_000)
    expect(ctx.wrapper.find('[data-testid="date-change-snack"]').exists()).toBe(false)
    expect(sent('POST', EXTEND)).toHaveLength(0)
    expect(sent('POST', REQUEST)).toHaveLength(0)
  })
})
