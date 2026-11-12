import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN,
  COORD,
  ORIGIN,
  errorEnvelope,
  folder,
  http,
  resetHarness,
  sent,
  server,
  standing,
} from '../model/__tests__/harness'
import { archiveBackend, manyFiles, mountPage, unmountAll } from './folder/__tests__/mount'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const K = standing({ rows: [['p1', 'd1', 'koordinator']] })
const A = standing({ admin: true })
const ATTACHMENTS = `${ORIGIN}/v1/records/archive/attachments`
const click = (w: { find: (s: string) => { trigger: (e: string) => Promise<void> } }, id: string) =>
  w.find(`[data-testid="preview-${id}"]`).trigger('click')

/** İkinci sayfa (`cursor=2`) yanıtını `release()` çağrılana dek bekleten sahte sunucu. */
function gatedSecondPage(files: object[]) {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  server.use(
    http.get(ATTACHMENTS, async ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor')
      if (cursor !== '2') return undefined
      await gate
      return Response.json({ files: files.slice(2, 4), next_cursor: '4' })
    }),
  )
  return release
}

describe('önizleme: bekleyen sayfa yanıtı seçim nesline bağlı (CX-F5-Ö-01)', () => {
  const files = manyFiles(6)

  it('Sonraki → sayfa beklerken kapat → yanıt gelince panel kapalı, ?dosya yok, odak kartta', async () => {
    server.use(...K, ...archiveBackend({ files, pageSize: 2 }))
    const release = gatedSecondPage(files)
    const { wrapper, router, settle } = await mountPage('/arsiv/d1?dosya=f2', COORD)
    await click(wrapper, 'next')
    await vi.waitFor(() =>
      expect(
        sent('GET', '/v1/records/archive/attachments').map((r) => r.query.get('cursor')),
      ).toContain('2'),
    )
    await click(wrapper, 'close')
    await flushPromises() // sayfa yanıtı bekleniyor: ağ yerleşmesi (settle) beklenemez
    expect(router.currentRoute.value.query.dosya).toBeUndefined()
    release()
    await vi.waitFor(() => expect(wrapper.findAll('[data-file-id]').length).toBeGreaterThan(2))
    await settle()
    expect(router.currentRoute.value.query.dosya).toBeUndefined()
    expect(wrapper.find('[data-testid="file-preview"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('[data-file-id="f2"]').element)
  })

  it('Sonraki → sayfa beklerken süzgeç değişir → eski devam ?dosya yazmaz', async () => {
    server.use(...K, ...archiveBackend({ files, pageSize: 2 }))
    const release = gatedSecondPage(files)
    const { wrapper, router, settle } = await mountPage('/arsiv/d1?dosya=f2', COORD)
    await click(wrapper, 'next')
    await vi.waitFor(() =>
      expect(
        sent('GET', '/v1/records/archive/attachments').map((r) => r.query.get('cursor')),
      ).toContain('2'),
    )
    await router.replace({ query: { etiket: 'sonuc' } })
    await settle()
    release()
    await settle()
    expect(router.currentRoute.value.query.dosya).toBeUndefined()
    expect(wrapper.find('[data-testid="file-preview"]').exists()).toBe(false)
  })
})

describe('yönetici görev kesişimi: iki kaynağın hatası birlikte (CX-F5-Ö-02)', () => {
  const FOLDERS = [folder({ folder_id: 'd7', name: 'Altyapı', file_count: 9 })]
  const TASKS = [{ work_item_id: 'w1', title: 'Gölgelendirme', file_count: 2 }]
  const WORK = [{ work_item_id: 'w1', department_id: 'd7', title: 'w1' }]
  const backend = () =>
    archiveBackend({ folders: FOLDERS, tasks: TASKS, files: manyFiles(2), workItems: WORK })

  for (const [source, path] of [
    ['archiveTasks', `${ORIGIN}/v1/records/archive/tasks`],
    ['listProgramWorkItems', `${ORIGIN}/v1/program/work-items`],
  ] as const) {
    it(`${source} başarısız: iskelet biter, hata + Yeniden dene; yeniden denemeyle liste gelir; dosya isteği yok`, async () => {
      server.use(...A, ...backend())
      let failing = true
      server.use(
        http.get(path, () => (failing ? errorEnvelope('platform.internal', 500) : undefined)),
      )
      const { wrapper, settle } = await mountPage('/arsiv/d7?gorev=w1', ADMIN)
      await vi.waitFor(() =>
        expect(wrapper.find('[data-testid="task-folders-error"]').exists()).toBe(true),
      )
      expect(wrapper.find('.arch-tasks__skel').exists()).toBe(false)
      expect(wrapper.find('[data-testid="task-folders"]').exists()).toBe(false)
      expect(sent('GET', '/v1/records/archive/attachments')).toHaveLength(0)
      failing = false
      await wrapper.find('[data-testid="task-folders-error"] button').trigger('click')
      await vi.waitFor(() => expect(wrapper.find('[data-task-id="w1"]').exists()).toBe(true))
      await settle()
      expect(wrapper.find('[data-testid="task-folders-error"]').exists()).toBe(false)
      expect(sent('GET', '/v1/records/archive/attachments')).toHaveLength(1)
    })
  }
})
