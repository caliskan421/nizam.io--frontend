import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  COORD_SCOPE,
  COUNTS,
  countsHandler,
  DASHBOARD,
  errorEnvelope,
  http,
  json,
  LIST,
  MEMBER_SCOPE,
  mountWith,
  ORIGIN,
  resetAll,
  row,
  sent,
  server,
  settle,
} from '../__tests__/harness'
import TeamKpis from './TeamKpis.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

const values = (wrapper: Awaited<ReturnType<typeof mountWith>>['wrapper']) =>
  wrapper.findAll('[data-kpi-value]').map((v) => v.text())

const ROWS = [
  row('baslanmadi'),
  row('devam_ediyor', { is_overdue: true }),
  row('onaya_sunuldu', { assignee_account_ids: ['acc-2'] }),
  row('iade_edildi', { is_overdue: true, assignee_account_ids: ['acc-2'] }),
  row('tamamlandi', { is_overdue: true }),
]

describe('Koordinatör / Üye KPI (countProgramWorkItems, sunucu sayaçları)', () => {
  it('koordinatör: seçili birim, tek sayaç isteği; liste ve pano istenmez', async () => {
    server.use(countsHandler(ROWS))
    const { wrapper } = await mountWith(TeamKpis, COORD_SCOPE, {
      departmentId: 'd1',
      assignee: null,
    })
    const [request, ...rest] = sent(COUNTS)
    expect(rest).toHaveLength(0)
    expect(request!.query.get('department_id')).toBe('d1')
    expect(request!.query.has('assignee_account_id')).toBe(false)
    expect(request!.query.has('limit')).toBe(false)
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(sent(LIST)).toHaveLength(0)
    expect(sent(DASHBOARD)).toHaveLength(0)
    // 5 görev, 1 bitti → %20; açık 4; geciken 2 (tamamlanmış geç görev sayılmaz); onayda 1.
    expect(values(wrapper)).toEqual(['%20', '4', '2', '1'])
    expect(wrapper.find('[data-kpi-partial]').exists()).toBe(false)
  })

  it('üye / birleşik rol: assignee_account_id=ben sunucuya gider ("bana atananlar", BE-038)', async () => {
    server.use(countsHandler(ROWS))
    const { wrapper } = await mountWith(TeamKpis, MEMBER_SCOPE, {
      departmentId: 'd1',
      assignee: 'acc-1',
    })
    expect(sent(COUNTS)[0]!.query.getAll('assignee_account_id')).toEqual(['acc-1'])
    // acc-1: baslanmadi, devam_ediyor (geç), tamamlandi → 3 görev, 1 bitti.
    expect(values(wrapper)).toEqual(['%33', '2', '1', '0'])
  })

  it('satır sayısı ne olursa olsun sayılar kesin: "yüklenen kayıtlar içinde" etiketi yok', async () => {
    server.use(countsHandler(ROWS))
    const { wrapper } = await mountWith(TeamKpis, COORD_SCOPE, {
      departmentId: 'd1',
      assignee: null,
    })
    await settle()
    expect(wrapper.find('[data-kpi-partial]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('yüklenen kayıtlar içinde')
    expect(sent(LIST)).toHaveLength(0)
  })

  it('hata → bölge içi "Yeniden dene"', async () => {
    let fail = true
    server.use(
      http.get(`${ORIGIN}${COUNTS}`, () => {
        if (fail) return errorEnvelope('platform.rate_limited', 429)
        return json({
          total: 5,
          by_status: {
            baslanmadi: 1,
            devam_ediyor: 1,
            onaya_sunuldu: 1,
            iade_edildi: 1,
            tamamlandi: 1,
          },
          overdue: 2,
          pending_date_requests: 0,
        })
      }),
    )
    const { wrapper } = await mountWith(TeamKpis, COORD_SCOPE, {
      departmentId: 'd1',
      assignee: null,
    })
    fail = false
    await wrapper.get('[role="alert"] button').trigger('click')
    await settle()
    expect(values(wrapper)).toEqual(['%20', '4', '2', '1'])
  })
})
