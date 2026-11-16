import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  COORD,
  folder,
  folderBody,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  s3Requests,
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

const task = (id: string, department = 'd7') => ({
  work_item_id: id,
  title: `Görev ${id}`,
  department_id: department,
  file_count: 1,
})
const programTasks = (tasks: object[], truncated = false) =>
  http.get(`${ORIGIN}/v1/program/archive/tasks`, () =>
    json({ tasks }, 200, truncated ? { 'X-Result-Truncated': 'true' } : {}),
  )
const programFolders = http.get(`${ORIGIN}/v1/program/archive/folders`, () =>
  json(folderBody(folder({ folder_id: 'd7' }))),
)

function setup(route: string | null, selection = ADMIN) {
  const h = harness(selection)
  const { result } = h.run(() => {
    const context = useArchiveContext(route)
    return { context, tasks: useArchiveTaskFolders(context) }
  })
  return { h, ...result }
}

describe('yönetici görev klasörleri: programArchiveTasks?department_id (S2, BE-072)', () => {
  it("görevler klasörün department_id süzgeciyle S2'den okunur; kesişim ve work-items okuması yok", async () => {
    server.use(...standing({ admin: true }), programFolders, programTasks([task('w1'), task('w2')]))
    const { h, tasks } = setup('d7')
    await settleQueries(h.queryClient)
    expect(tasks.folders.value.tasks.map((t) => t.work_item_id)).toEqual(['w1', 'w2'])
    expect(tasks.folders.value).toMatchObject({ truncated: false, ready: true })
    const call = sent('GET', '/v1/program/archive/tasks')[0]!
    expect(call.query.get('department_id')).toBe('d7')
    expect(call.query.has('include_empty')).toBe(false)
    // S2: yalnız program başlığı; departman başlığı gönderilmez.
    expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(call.headers.get('X-Nizamio-Department')).toBeNull()
    // Eski yol yok (P33 geçici yolu): `listProgramWorkItems` kesişimi ve S3 görev listesi çağrılmaz.
    expect(sent('GET', '/v1/program/work-items')).toHaveLength(0)
    expect(s3Requests()).toHaveLength(0)
  })

  it('sunucu listeyi kesince (X-Result-Truncated) truncated olgusu', async () => {
    server.use(...standing({ admin: true }), programFolders, programTasks([task('w1')], true))
    const { h, tasks } = setup('d7')
    await settleQueries(h.queryClient)
    expect(tasks.folders.value.truncated).toBe(true)
  })

  it('klasör doğrulanmadan görev okuması başlamaz; olmayan klasörde hiç açılmaz', async () => {
    server.use(
      ...standing({ admin: true }),
      http.get(`${ORIGIN}/v1/program/archive/folders`, () => json(folderBody())),
      programTasks([task('w1')]),
    )
    const { h, tasks } = setup('d7')
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/program/archive/tasks')).toHaveLength(0)
    expect(tasks.folders.value).toEqual({ tasks: [], truncated: false, ready: false })
  })

  it('ilk okuma hatası: failure + yeniden dene; veri gelince hata kalkar', async () => {
    let fail = true
    server.use(
      ...standing({ admin: true }),
      programFolders,
      http.get(`${ORIGIN}/v1/program/archive/tasks`, () =>
        fail ? json({ code: 'platform.internal' }, 500) : json({ tasks: [task('w1')] }),
      ),
    )
    const { h, tasks } = setup('d7')
    await settleQueries(h.queryClient)
    expect(tasks.failure.value).toMatchObject({ source: 'tasks' })
    fail = false
    tasks.retry()
    await settleQueries(h.queryClient)
    expect(tasks.failure.value).toBeNull()
    expect(tasks.folders.value.tasks).toHaveLength(1)
  })
})

describe('koordinatör görev klasörleri', () => {
  it('doğrudan archiveTasks (S3, başlıktaki departman); S2 okunmaz', async () => {
    server.use(
      ...standing({ rows: [['p1', 'd1', 'koordinator']] }),
      http.get(`${ORIGIN}/v1/records/archive/folders`, () => json(folderBody(folder()))),
      http.get(`${ORIGIN}/v1/records/archive/tasks`, () =>
        json({ tasks: [task('w1', 'd1'), task('w2', 'd1')] }),
      ),
    )
    const { h, tasks } = setup('d1', COORD)
    await settleQueries(h.queryClient)
    expect(tasks.folders.value).toEqual({
      tasks: [task('w1', 'd1'), task('w2', 'd1')],
      truncated: false,
      ready: true,
    })
    expect(sent('GET', '/v1/records/archive/tasks')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd1',
    )
    expect(sent('GET', '/v1/program/archive/tasks')).toHaveLength(0)
  })
})
