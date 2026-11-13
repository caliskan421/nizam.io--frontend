import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import { mountWith, unmountAll } from '../__tests__/mount'
import {
  browserSave,
  errorEnvelope,
  http,
  ORIGIN,
  pdf,
  resetHarness,
  sent,
  server,
  standing,
  ticketOk,
} from '../__tests__/harness'
import { reportGate } from '../model/gate'
import MeetingReportButton from './MeetingReportButton.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

let saved: ReturnType<typeof browserSave>
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  saved = browserSave()
  useToast().clear()
})
afterEach(() => {
  unmountAll()
  reportGate.reset()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

const COORD_SCOPE = { programId: 'p1', lens: 'coordinator', departmentId: 'd1' } as const
const props = (departmentIds: string[]) => ({
  meeting: {
    meeting_id: 'm1',
    owner_department_id: departmentIds[0] ?? 'd0',
    departments: departmentIds.map((department_id) => ({ department_id })),
  },
})

async function mountAs(
  who: Parameters<typeof standing>[0],
  departmentIds: string[],
  scope?: typeof COORD_SCOPE,
) {
  server.use(...standing(who))
  const mounted = await mountWith(MeetingReportButton, { props: props(departmentIds), scope })
  await settleQueries(mounted.queryClient)
  await flushPromises()
  return mounted
}

describe('MeetingReportButton (E-13-41…44; 09b/K7)', () => {
  it('ŞY: düğme her zaman (departman listesi boş olsa da) + ipucu + "Önizle" /toplantilar/:id/rapor', async () => {
    const { wrapper } = await mountAs({ admin: true }, [])
    expect(wrapper.get('button').text()).toBe('Toplantı raporu (PDF)')
    expect(wrapper.get('.report-action').attributes('title')).toBe(
      'Künye, gündem ve notların tamamını içeren PDF',
    )
    expect(wrapper.get('[data-action="preview-meeting"]').attributes('href')).toBe(
      '/toplantilar/m1/rapor',
    )
  })

  it('ŞY, K merceğinde de görür (mercek yetki değil, P1)', async () => {
    const { wrapper } = await mountAs(
      { admin: true, rows: [['p1', 'd1', 'koordinator']] },
      ['d9'],
      COORD_SCOPE,
    )
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('[data-action="preview-meeting"]').exists()).toBe(true)
  })

  it('K: sahip/dahil birimini koordine ediyorsa yalnız PDF (önizleme yok, K için 403)', async () => {
    const { wrapper } = await mountAs(
      { rows: [['p1', 'd1', 'koordinator']] },
      ['d2', 'd1'],
      COORD_SCOPE,
    )
    expect(wrapper.get('button').text()).toBe('Toplantı raporu (PDF)')
    expect(wrapper.find('[data-action="preview-meeting"]').exists()).toBe(false)
  })

  it('K: toplantıyla ilgisiz birim → düğme yok; üye → düğme yok', async () => {
    const other = await mountAs({ rows: [['p1', 'd1', 'koordinator']] }, ['d3'], COORD_SCOPE)
    expect(other.wrapper.find('[data-testid="meeting-report"]').exists()).toBe(false)
    unmountAll()
    const member = await mountAs({ rows: [['p1', 'd1', 'uye']] }, ['d1'], COORD_SCOPE)
    expect(member.wrapper.find('[data-testid="meeting-report"]').exists()).toBe(false)
  })

  it('tıklama toplantı PDF biletini üretir ve dosyayı kaydeder', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="toplanti-raporu-7f3a9c2e.pdf"' }),
    )
    const { wrapper, queryClient } = await mountAs({ admin: true }, ['d1'])
    await wrapper.get('button').trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toEqual(['toplanti-raporu-7f3a9c2e.pdf']))
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      method: 'GET',
      path: '/v1/reports/meetings/m1/pdf',
    })
  })

  it('404 reporting.not_found: "Kayıt bulunamadı" bildirimi', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('reporting.not_found', 404)),
    )
    const { wrapper } = await mountAs({ admin: true }, ['d1'])
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(useToast().current.value?.message).toBe('Kayıt bulunamadı.'))
  })

  it('sahip birim de yetkiyi verir (departments boş, owner koordine edilen)', async () => {
    server.use(...standing({ rows: [['p1', 'd1', 'koordinator']] }))
    const mounted = await mountWith(MeetingReportButton, {
      props: { meeting: { meeting_id: 'm1', owner_department_id: 'd1', departments: [] } },
      scope: COORD_SCOPE,
    })
    await settleQueries(mounted.queryClient)
    await flushPromises()
    expect(mounted.wrapper.find('button').exists()).toBe(true)
  })

  it('sözleşme: tek prop meeting; emit yok (gövdeden bağımsız)', () => {
    expect(Object.keys(MeetingReportButton.props ?? {})).toEqual(['meeting'])
    expect(MeetingReportButton.emits ?? []).toEqual([])
  })
})
