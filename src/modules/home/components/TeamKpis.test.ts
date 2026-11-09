import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  COORD_SCOPE,
  DASHBOARD,
  errorEnvelope,
  http,
  json,
  LIST,
  listHandler,
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

describe('Koordinatör / Üye KPI (listProgramWorkItems, istemci sayımı)', () => {
  it('koordinatör: seçili birim, tek liste isteği (limit 200); pano istenmez', async () => {
    server.use(listHandler(ROWS))
    const { wrapper } = await mountWith(TeamKpis, COORD_SCOPE, {
      departmentId: 'd1',
      assignee: null,
    })
    const [request, ...rest] = sent(LIST)
    expect(rest).toHaveLength(0)
    expect(request!.query.get('department_id')).toBe('d1')
    expect(request!.query.get('limit')).toBe('200')
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(sent(DASHBOARD)).toHaveLength(0)
    // 5 görev, 1 bitti → %20; açık 4; geciken 2 (tamamlanmış geç görev sayılmaz); onayda 1.
    expect(values(wrapper)).toEqual(['%20', '4', '2', '1'])
    expect(wrapper.find('[data-kpi-partial]').exists()).toBe(false)
  })

  it('üye / birleşik rol: yalnız "bana atananlar" sayılır', async () => {
    server.use(listHandler(ROWS))
    const { wrapper } = await mountWith(TeamKpis, MEMBER_SCOPE, {
      departmentId: 'd1',
      assignee: 'acc-1',
    })
    // acc-1: baslanmadi, devam_ediyor (geç), tamamlandi → 3 görev, 1 bitti.
    expect(values(wrapper)).toEqual(['%33', '2', '1', '0'])
  })

  it('imleç bitmemiş → "yüklenen kayıtlar içinde"; sonraki sayfa kendiliğinden çekilmez', async () => {
    server.use(listHandler(ROWS, 'imlec-2'))
    const { wrapper } = await mountWith(TeamKpis, COORD_SCOPE, {
      departmentId: 'd1',
      assignee: null,
    })
    expect(wrapper.get('[data-kpi-partial]').text()).toBe('Sayılar yüklenen kayıtlar içinde')
    await settle()
    expect(sent(LIST)).toHaveLength(1)
  })

  it('hata → bölge içi "Yeniden dene"', async () => {
    let fail = true
    server.use(
      http.get(`${ORIGIN}${LIST}`, () =>
        fail ? errorEnvelope('platform.rate_limited', 429) : json({ items: ROWS }),
      ),
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
