import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  COORD,
  archiveFile,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import { PREVIEW_MAX_BYTES } from '../model/mime'
import type { ArchiveFile } from '../model/types'
import { useFilePreview, usePreviewDetails } from './preview'

const created: string[] = []
const revoked: string[] = []

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  created.length = 0
  revoked.length = 0
  Object.assign(URL, {
    createObjectURL: () => {
      const url = `blob:onizleme-${created.length + 1}`
      created.push(url)
      return url
    },
    revokeObjectURL: (url: string) => revoked.push(url),
  })
})
afterEach(() => resetHarness())
afterAll(() => server.close())

const target = { programId: 'p1', departmentId: 'd7' }
const image = (over: object = {}) =>
  archiveFile({
    file_id: 'f1',
    content_type: 'image/png',
    display_name: 'foto.png',
    ...over,
  }) as ArchiveFile
const png = (id = 'f1') =>
  http.get(`${ORIGIN}/v1/files/${id}/download`, () =>
    HttpResponse.arrayBuffer(new Uint8Array([137, 80, 78, 71]).buffer, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    }),
  )

describe('görsel önizleme (blob: URL)', () => {
  it('downloadFile gövdesi dosyanın departman başlığıyla okunur, blob: URL üretilir', async () => {
    server.use(png())
    const h = harness(ADMIN)
    const file = ref<ArchiveFile | null>(image())
    const { result } = h.run(() => useFilePreview(target, file))
    await settleQueries(h.queryClient)
    expect(result.url.value).toBe('blob:onizleme-1')
    const [req] = sent('GET', '/v1/files/f1/download')
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d7')
  })

  it('dosya değişince eski URL serbest bırakılır; yenisi üretilir', async () => {
    server.use(png('f1'), png('f2'))
    const h = harness(COORD)
    const file = ref<ArchiveFile | null>(image())
    const { result } = h.run(() => useFilePreview(target, file))
    await settleQueries(h.queryClient)
    file.value = image({ file_id: 'f2' })
    await settleQueries(h.queryClient)
    expect(result.url.value).toBe('blob:onizleme-2')
    expect(revoked).toContain('blob:onizleme-1')
  })

  it('seçim kalkınca URL serbest bırakılır ve null olur', async () => {
    server.use(png())
    const h = harness(COORD)
    const file = ref<ArchiveFile | null>(image())
    const { result } = h.run(() => useFilePreview(target, file))
    await settleQueries(h.queryClient)
    file.value = null
    await settleQueries(h.queryClient)
    expect(result.url.value).toBeNull()
    expect(revoked).toEqual(['blob:onizleme-1'])
  })

  it('bileşen sökülünce URL serbest bırakılır (sızıntı yok)', async () => {
    server.use(png())
    const h = harness(COORD)
    const { result, app } = h.run(() => useFilePreview(target, image()))
    await settleQueries(h.queryClient)
    expect(created).toHaveLength(1)
    app.unmount()
    expect(revoked).toEqual(['blob:onizleme-1'])
    expect(result.url.value).toBeNull()
  })

  it.each([
    ['PDF', { content_type: 'application/pdf' }],
    ['SVG (denetimsiz gömme yok)', { content_type: 'image/svg+xml' }],
    ['HTML', { content_type: 'text/html' }],
    ['sınırı aşan görsel', { size_bytes: PREVIEW_MAX_BYTES + 1 }],
  ])('%s önizlenmez: istek yok, URL yok', async (_name, over) => {
    const h = harness(COORD)
    const { result } = h.run(() => useFilePreview(target, image(over)))
    await settleQueries(h.queryClient)
    expect(result.url.value).toBeNull()
    expect(sent('GET', '/v1/files/f1/download')).toHaveLength(0)
  })

  it('hedef yokken istek yok', async () => {
    const h = harness(ADMIN)
    const { result } = h.run(() => useFilePreview(null, image()))
    await settleQueries(h.queryClient)
    expect(result.url.value).toBeNull()
    expect(sent('GET', '/v1/files/f1/download')).toHaveLength(0)
  })

  it('404 records.file_not_found: URL yok, hata durumu', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/files/f1/download`, () =>
        errorEnvelope('records.file_not_found', 404),
      ),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useFilePreview(target, image()))
    await settleQueries(h.queryClient)
    expect(result.url.value).toBeNull()
    expect(result.query.isError.value).toBe(true)
    expect(created).toHaveLength(0)
  })
})

describe('yükleyen adı ve alt görev adı (yalnız seçili dosya için)', () => {
  const fileRow = {
    file_id: 'f1',
    work_item_id: 'w1',
    display_name: 'a.png',
    content_type: 'image/png',
    size_bytes: 3,
    tag: 'plan',
    uploaded_by_account_id: 'u1',
    uploaded_by_full_name: 'Ayşe Yılmaz',
  }

  it('listWorkItemFiles ile yükleyen adı; listWorkItemSubtasks ile alt görev adı', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/files`, () => json({ files: [fileRow] })),
      http.get(`${ORIGIN}/v1/work-items/w1/subtasks`, () =>
        json({ subtasks: [{ subtask_id: 's1', title: 'Taslak' }], total: 1 }),
      ),
    )
    const h = harness(ADMIN)
    const { result } = h.run(() => usePreviewDetails(target, image({ subtask_id: 's1' })))
    await settleQueries(h.queryClient)
    expect(result.uploaderName.value).toBe('Ayşe Yılmaz')
    expect(result.subtaskTitle.value).toBe('Taslak')
    expect(sent('GET', '/v1/work-items/w1/files')[0]!.headers.get('X-Nizamio-Department')).toBe(
      'd7',
    )
    expect(sent('GET', '/v1/work-items/w1/subtasks')).toHaveLength(1)
  })

  it('yükleyen adı null ise nötr; alt görev yoksa alt görev isteği atılmaz', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/files`, () =>
        json({ files: [{ ...fileRow, uploaded_by_full_name: null }] }),
      ),
    )
    const h = harness(COORD)
    const { result } = h.run(() => usePreviewDetails(target, image()))
    await settleQueries(h.queryClient)
    expect(result.uploaderName.value).toBeNull()
    expect(result.subtaskTitle.value).toBeNull()
    expect(sent('GET', '/v1/work-items/w1/subtasks')).toHaveLength(0)
  })

  it('403 work.not_assigned alt görev okumasında nötr (hata ekranı değil)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1/files`, () => json({ files: [fileRow] })),
      http.get(`${ORIGIN}/v1/work-items/w1/subtasks`, () =>
        errorEnvelope('work.not_assigned', 403),
      ),
    )
    const h = harness(COORD)
    const { result } = h.run(() => usePreviewDetails(target, image({ subtask_id: 's1' })))
    await settleQueries(h.queryClient)
    expect(result.subtaskTitle.value).toBeNull()
    expect(result.uploaderName.value).toBe('Ayşe Yılmaz')
  })

  it('seçili dosya yokken hiçbir yan okuma yok', async () => {
    const h = harness(COORD)
    h.run(() => usePreviewDetails(target, null))
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/work-items/w1/files')).toHaveLength(0)
  })
})
