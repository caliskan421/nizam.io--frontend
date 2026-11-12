import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  COORD,
  archiveFile,
  folder,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  s3Requests,
  sent,
  server,
} from '../model/__tests__/harness'
import {
  useArchiveAttachments,
  useArchiveFolders,
  useArchiveTasks,
  useArchiveUploaders,
} from './queries'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetHarness())
afterAll(() => server.close())

const coordTarget = { programId: 'p1', departmentId: 'd1' }
const adminTarget = { programId: 'p1', departmentId: 'd7' }

function archiveHandlers() {
  return [
    http.get(`${ORIGIN}/v1/records/archive/folders`, () => json({ folders: [folder()] })),
    http.get(`${ORIGIN}/v1/records/archive/tasks`, () =>
      json({ tasks: [{ work_item_id: 'w1', title: 'Rapor', file_count: 2 }] }),
    ),
    http.get(`${ORIGIN}/v1/records/archive/uploaders`, () => json({ uploaders: ['a1', 'a2'] })),
  ]
}

describe('S3 başlıkları (başlıksız istek yok)', () => {
  it('koordinatör/üye: program + departman başlığı hedeften (seçili kapsam)', async () => {
    server.use(...archiveHandlers())
    const h = harness(COORD)
    const { result } = h.run(() => ({
      folders: useArchiveFolders(coordTarget),
      tasks: useArchiveTasks(coordTarget),
      uploaders: useArchiveUploaders(coordTarget),
    }))
    await settleQueries(h.queryClient)
    expect(result.folders.data.value?.folders).toHaveLength(1)
    expect(result.tasks.data.value?.tasks[0]?.title).toBe('Rapor')
    expect(result.uploaders.data.value?.uploaders).toEqual(['a1', 'a2'])
    const calls = s3Requests()
    expect(calls).toHaveLength(3)
    for (const call of calls) {
      expect(call.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(call.headers.get('X-Nizamio-Department')).toBe('d1')
    }
  })

  it('yönetici: departman başlığı rotadaki klasörden, kapsam deposu departmansız kalır (P33)', async () => {
    server.use(...archiveHandlers())
    const h = harness(ADMIN)
    const { result } = h.run(() => useArchiveFolders(adminTarget))
    await settleQueries(h.queryClient)
    expect(result.data.value?.folders).toHaveLength(1)
    expect(sent('GET', '/v1/records/archive/folders')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd7',
    )
    expect(h.store.snapshot.departmentId).toBeNull()
  })

  it('hedef yokken sorgu etkinleşmez (S3 isteği çıkmaz)', async () => {
    server.use(...archiveHandlers())
    const h = harness(ADMIN)
    const { result } = h.run(() => ({
      folders: useArchiveFolders(null),
      tasks: useArchiveTasks(() => null),
      files: useArchiveAttachments(null, {}),
    }))
    await settleQueries(h.queryClient)
    expect(result.folders.fetchStatus.value).toBe('idle')
    expect(result.tasks.fetchStatus.value).toBe('idle')
    expect(result.files.query.fetchStatus.value).toBe('idle')
    expect(s3Requests()).toHaveLength(0)
  })

  it('etkinleştirme bayrağı kapalıyken istek yok, açılınca tek istek', async () => {
    server.use(...archiveHandlers())
    const h = harness(COORD)
    const open = ref(false)
    const { result } = h.run(() => useArchiveTasks(coordTarget, open))
    await settleQueries(h.queryClient)
    expect(s3Requests()).toHaveLength(0)
    open.value = true
    await settleQueries(h.queryClient)
    expect(result.data.value?.tasks).toHaveLength(1)
    expect(s3Requests()).toHaveLength(1)
  })
})

describe('anahtarlar kapsamlı ve klasörle ayrışır', () => {
  it('yönetici klasörleri ayrı önbellek girdisi; query-keys.ts fabrikasından', async () => {
    server.use(...archiveHandlers())
    const h = harness(ADMIN)
    const a = ref({ programId: 'p1', departmentId: 'd7' })
    h.run(() => useArchiveFolders(a))
    await settleQueries(h.queryClient)
    a.value = { programId: 'p1', departmentId: 'd8' }
    await settleQueries(h.queryClient)
    const keyOf = (department: string) =>
      queryKeys.archive.list({ ...h.store.snapshot, departmentId: department }, 'folders', {})
    expect(h.queryClient.getQueryData(keyOf('d7'))).toBeDefined()
    expect(h.queryClient.getQueryData(keyOf('d8'))).toBeDefined()
    expect(
      sent('GET', '/v1/records/archive/folders').map((r) => r.headers.get('X-Nizamio-Department')),
    ).toEqual(['d7', 'd8'])
  })
})

describe('archiveAttachments — imleç, süzgeç, "n+"', () => {
  function pages() {
    return http.get(`${ORIGIN}/v1/records/archive/attachments`, ({ request }) => {
      const url = new URL(request.url)
      const cursor = url.searchParams.get('cursor')
      if (cursor === null) {
        return json({ files: [archiveFile({ file_id: 'f1' })], next_cursor: 'c2' })
      }
      return json({ files: [archiveFile({ file_id: 'f2' })] })
    })
  }

  it('süzgeçler sunucu adlarıyla; sonraki sayfa aynı süzgeçle imleç gönderir; n+ olgusu', async () => {
    server.use(pages())
    const h = harness(COORD)
    const filters = ref({
      tag: 'plan' as const,
      kind: 'belge' as const,
      search: 'rapor',
      sort: 'name' as const,
    })
    const { result } = h.run(() => useArchiveAttachments(coordTarget, filters))
    await settleQueries(h.queryClient)
    expect(result.files.value.map((f) => f.file_id)).toEqual(['f1'])
    expect(result.hasMore.value).toBe(true)
    const [first] = sent('GET', '/v1/records/archive/attachments')
    expect(Object.fromEntries(first!.query)).toEqual({
      tag: 'plan',
      mime_category: 'belge',
      search: 'rapor',
      sort: 'name',
      limit: '50',
    })
    await result.loadMore()
    await settleQueries(h.queryClient)
    expect(result.files.value.map((f) => f.file_id)).toEqual(['f1', 'f2'])
    expect(result.hasMore.value).toBe(false)
    const second = sent('GET', '/v1/records/archive/attachments')[1]!
    expect(second.query.get('cursor')).toBe('c2')
    expect(second.query.get('tag')).toBe('plan')
  })

  it('süzgeç değişince imleç sıfırlanır: yeni süzgeç imleçsiz ilk sayfadan başlar', async () => {
    server.use(pages())
    const h = harness(COORD)
    const filters = ref<{ tag?: 'plan' | 'girdi' }>({ tag: 'plan' })
    const { result } = h.run(() => useArchiveAttachments(coordTarget, filters))
    await settleQueries(h.queryClient)
    await result.loadMore()
    await settleQueries(h.queryClient)
    expect(result.files.value).toHaveLength(2)
    filters.value = { tag: 'girdi' }
    await settleQueries(h.queryClient)
    const calls = sent('GET', '/v1/records/archive/attachments')
    expect(calls.at(-1)!.query.get('tag')).toBe('girdi')
    expect(calls.at(-1)!.query.get('cursor')).toBeNull()
    expect(result.files.value.map((f) => f.file_id)).toEqual(['f1'])
  })

  it('loadMore devam yokken istek atmaz', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/records/archive/attachments`, () => json({ files: [archiveFile()] })),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useArchiveAttachments(coordTarget, {}))
    await settleQueries(h.queryClient)
    expect(result.hasMore.value).toBe(false)
    await result.loadMore()
    expect(sent('GET', '/v1/records/archive/attachments')).toHaveLength(1)
  })
})
