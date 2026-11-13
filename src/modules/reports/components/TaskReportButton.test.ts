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
import TaskReportButton from './TaskReportButton.vue'

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

async function mountAs(
  who: Parameters<typeof standing>[0],
  departmentId: string,
  scope?: typeof COORD_SCOPE,
) {
  server.use(...standing(who))
  const mounted = await mountWith(TaskReportButton, {
    props: { item: { work_item_id: 't1', department_id: departmentId } },
    scope,
  })
  await settleQueries(mounted.queryClient)
  await flushPromises()
  return mounted
}

describe('TaskReportButton (E-13-55/56; 03 ve K3 paneli)', () => {
  it('ŞY ve görevin koordinatörü görür; başka birim koordinatörü ve üye görmez', async () => {
    const admin = await mountAs({ admin: true }, 'd1')
    expect(admin.wrapper.get('button').text()).toBe('Görev raporu (PDF)')
    unmountAll()
    const own = await mountAs({ rows: [['p1', 'd1', 'koordinator']] }, 'd1', COORD_SCOPE)
    expect(own.wrapper.find('button').exists()).toBe(true)
    unmountAll()
    const other = await mountAs({ rows: [['p1', 'd1', 'koordinator']] }, 'd2', COORD_SCOPE)
    expect(other.wrapper.find('[data-testid="task-report"]').exists()).toBe(false)
    unmountAll()
    const member = await mountAs({ rows: [['p1', 'd1', 'uye']] }, 'd1', COORD_SCOPE)
    expect(member.wrapper.find('[data-testid="task-report"]').exists()).toBe(false)
  })

  it('web önizlemesi yok: bağlantı çizilmez (E-13-57)', async () => {
    const { wrapper } = await mountAs({ admin: true }, 'd1')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('tıklama görev PDF biletini üretir ve kaydeder', async () => {
    server.use(
      ticketOk(),
      pdf({ 'Content-Disposition': 'attachment; filename="gorev-raporu-3c1d88aa.pdf"' }),
    )
    const { wrapper, queryClient } = await mountAs({ admin: true }, 'd1')
    await wrapper.get('button').trigger('click')
    await settleQueries(queryClient)
    await vi.waitFor(() => expect(saved.clicked).toEqual(['gorev-raporu-3c1d88aa.pdf']))
    expect(sent('POST', '/v1/download-tickets')[0]?.body).toMatchObject({
      path: '/v1/reports/tasks/t1/pdf',
    })
  })

  it('403 reporting.not_authorized: düğme hata kartı gösterir (yetki olguları yeniden okunur)', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('reporting.not_authorized', 403)),
    )
    const { wrapper } = await mountAs({ admin: true }, 'd1')
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
  })

  it('404 reporting.not_found: "Kayıt bulunamadı" bildirimi', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('reporting.not_found', 404)),
    )
    const { wrapper } = await mountAs({ admin: true }, 'd1')
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() => expect(useToast().current.value?.message).toBe('Kayıt bulunamadı.'))
  })

  it('sözleşme: tek prop item; emit yok', () => {
    expect(Object.keys(TaskReportButton.props ?? {})).toEqual(['item'])
    expect(TaskReportButton.emits ?? []).toEqual([])
  })
})
