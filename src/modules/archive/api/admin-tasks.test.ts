import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  COORD,
  folder,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  standing,
} from '../model/__tests__/harness'
import { useArchiveTaskFolders } from './admin-tasks'
import { useArchiveContext } from './context'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

function workItem(id: string) {
  return {
    work_item_id: id,
    program_id: 'p1',
    department_id: 'd7',
    title: `Görev ${id}`,
    priority: 'orta',
    status: 'baslanmadi',
    assignees: [],
    assignee_account_ids: [],
    start_on: '2026-11-01',
    end_on: '2026-11-10',
    is_overdue: false,
    days_overdue: 0,
    is_completed_late: false,
    days_late: 0,
    is_completed_early: false,
    days_early: 0,
    completion_evidence_required: false,
    subtask_counts: { total: 0, done: 0 },
    pending_date_request: null,
    created_at: '2026-11-01T08:00:00Z',
    created_by_account_id: 'a',
    created_by_full_name: 'A',
  }
}

const archiveTasks = (...ids: string[]) =>
  http.get(`${ORIGIN}/v1/records/archive/tasks`, () =>
    json({ tasks: ids.map((id) => ({ work_item_id: id, title: `Görev ${id}`, file_count: 1 })) }),
  )
const folders = http.get(`${ORIGIN}/v1/records/archive/folders`, () =>
  json({ folders: [folder({ folder_id: 'd7' })] }),
)

function setup(route: string | null, selection = ADMIN) {
  const h = harness(selection)
  const { result } = h.run(() => {
    const context = useArchiveContext(route)
    return { context, tasks: useArchiveTaskFolders(context) }
  })
  return { h, ...result }
}

describe('yönetici görev klasörleri: archiveTasks ∩ listProgramWorkItems(department_id)', () => {
  it('program geneli archiveTasks klasörün görevleriyle kesişir; liste department_id ile okunur', async () => {
    server.use(
      ...standing({ admin: true }),
      folders,
      archiveTasks('w1', 'w2', 'baska-departman'),
      http.get(`${ORIGIN}/v1/program/work-items`, () =>
        json({ items: [workItem('w1'), workItem('w2')] }),
      ),
    )
    const { h, tasks } = setup('d7')
    await settleQueries(h.queryClient)
    expect(tasks.folders.value.tasks.map((t) => t.work_item_id)).toEqual(['w1', 'w2'])
    expect(tasks.folders.value.truncated).toBe(false)
    expect(tasks.folders.value.ready).toBe(true)
    const listCall = sent('GET', '/v1/program/work-items')[0]!
    expect(listCall.query.get('department_id')).toBe('d7')
    // Görev listesi S2'dir: departman başlığı gönderilmez.
    expect(listCall.headers.get('X-Nizamio-Department')).toBeNull()
  })

  it('görev listesi 200 tavanına çarptıysa (sonraki sayfa var) truncated olgusu', async () => {
    server.use(
      ...standing({ admin: true }),
      folders,
      archiveTasks('w1'),
      http.get(`${ORIGIN}/v1/program/work-items`, () =>
        json({ items: [workItem('w1')], next_cursor: 'sonraki' }),
      ),
    )
    const { h, tasks } = setup('d7')
    await settleQueries(h.queryClient)
    expect(tasks.folders.value.truncated).toBe(true)
    expect(tasks.folders.value.tasks.map((t) => t.work_item_id)).toEqual(['w1'])
  })

  it('klasör doğrulanmadan görev/liste okuması başlamaz; olmayan klasörde hiç açılmaz', async () => {
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () => json({ folders: [] })),
      archiveTasks('w1'),
      http.get(`${ORIGIN}/v1/program/work-items`, () => json({ items: [workItem('w1')] })),
    )
    const { h, tasks } = setup('d7')
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/records/archive/tasks')).toHaveLength(0)
    expect(sent('GET', '/v1/program/work-items')).toHaveLength(0)
    expect(tasks.folders.value).toEqual({ tasks: [], truncated: false, ready: false })
  })

  it('kesişim hazır olmadan görev gösterilmez (program geneli sızıntısı yok)', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      ...standing({ admin: true }),
      folders,
      archiveTasks('w1', 'x'),
      http.get(`${ORIGIN}/v1/program/work-items`, async () => {
        await gate
        return json({ items: [workItem('w1')] })
      }),
    )
    const { h, tasks } = setup('d7')
    await vi.waitFor(() => expect(tasks.tasks.data.value).toBeDefined())
    expect(tasks.folders.value).toEqual({ tasks: [], truncated: false, ready: false })
    release()
    await settleQueries(h.queryClient)
    expect(tasks.folders.value.tasks.map((t) => t.work_item_id)).toEqual(['w1'])
  })
})

describe('koordinatör görev klasörleri', () => {
  it('doğrudan archiveTasks (başlıktaki departman); görev listesi okunmaz', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () => json({ folders: [folder()] })),
      archiveTasks('w1', 'w2'),
    )
    const { h, tasks } = setup('d1', COORD)
    await settleQueries(h.queryClient)
    expect(tasks.folders.value).toEqual({
      tasks: [
        { work_item_id: 'w1', title: 'Görev w1', file_count: 1 },
        { work_item_id: 'w2', title: 'Görev w2', file_count: 1 },
      ],
      truncated: false,
      ready: true,
    })
    expect(sent('GET', '/v1/program/work-items')).toHaveLength(0)
  })
})
