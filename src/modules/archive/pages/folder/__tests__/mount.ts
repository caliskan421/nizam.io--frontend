// 07 sayfa testleri: GERÇEK API istemcisi + MSW (arşiv harness'ı), gerçek Pinia kapsam deposu,
// TanStack Query ve bellek router'ı. Komşu W bileşenleri (FilePreview, UploadDialog,
// FolderZipButton) GERÇEKTİR (zincir: o2-w124 @ 49ee71b); taslak yok.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { i18n } from '@/shared/i18n'
import { pageCrumb } from '@/shared/navigation/page-crumb'
import { settleQueries } from '@/shared/http/__tests__/settle'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import { archiveFile, folder, http, json, ORIGIN } from '../../../model/__tests__/harness'
import ArchiveFolderPage from '../../ArchiveFolderPage.vue'

export { archiveFile, folder }

const mounted: VueWrapper[] = []

export interface Mounted {
  wrapper: VueWrapper
  router: Router
  queryClient: QueryClient
  store: ReturnType<typeof useScopeStore>
  settle: () => Promise<void>
}

export async function mountPage(path: string, selection: ScopeSelection): Promise<Mounted> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(selection)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0, retry: false }, mutations: { retry: false } },
  })
  const empty = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: empty },
      { path: '/gorevler', name: 'work.tasks', component: empty },
      { path: '/arsiv', name: 'archive.folders', component: empty },
      { path: '/arsiv/:klasorId', name: 'archive.folder', component: empty },
    ],
  })
  await router.push(path)
  const wrapper = mount(ArchiveFolderPage, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router, i18n] },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  const settle = () => settleQueries(queryClient)
  await settle()
  return { wrapper, router, queryClient, store, settle }
}

export function unmountAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
}

export const crumb = () => pageCrumb.value

// --- sahte sunucu ------------------------------------------------------------------------------

export interface Backend {
  folders?: object[]
  tasks?: object[]
  /** `include_empty=true` istendiğinde dosyalı görevlere eklenen dosyasız görevler (BE-121). */
  emptyTasks?: object[]
  files?: object[]
  /** Sayfa başına dosya (imleç testi): verilirse `next_cursor` üretilir. */
  pageSize?: number
  filesStatus?: number
  /** `programArchiveTasks`/`archiveTasks` yanıtına `X-Result-Truncated: true` ekle. */
  truncated?: boolean
}

const DEFAULT_TASKS = [
  { work_item_id: 'w1', title: 'Gölgelendirme çalışmaları', department_id: 'd1', file_count: 2 },
  { work_item_id: 'w2', title: 'İklimlendirme hesapları', department_id: 'd1', file_count: 3 },
]

/**
 * Arşiv okuma uçları, S3 (`/v1/records/archive/*`; koordinatör/üye) ve S2 (`/v1/program/archive/*`;
 * yönetici). S2 `department_id` süzgecini görev/dosya satırının `department_id`'siyle uygular.
 */
function foldersHandler(b: Backend) {
  return () => {
    const cards = b.folders ?? [folder({ folder_id: 'd1', file_count: (b.files ?? []).length })]
    const files = cards.reduce(
      (sum, c) => sum + ((c as { file_count?: number }).file_count ?? 0),
      0,
    )
    return json({
      folders: cards,
      totals: { file_count: files, task_count: 0, total_bytes: 0, last_uploaded_at: null },
    })
  }
}

function tasksHandler(b: Backend) {
  return ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const department = url.searchParams.get('department_id')
    const base = b.tasks ?? DEFAULT_TASKS
    const withEmpty = url.searchParams.get('include_empty') === 'true'
    const list = withEmpty ? [...base, ...(b.emptyTasks ?? [])] : base
    const tasks = list.filter(
      (t) => department === null || (t as { department_id: string }).department_id === department,
    )
    return json({ tasks }, 200, b.truncated ? { 'X-Result-Truncated': 'true' } : {})
  }
}

function attachmentsHandler(b: Backend) {
  return ({ request }: { request: Request }) => {
    if (b.filesStatus && b.filesStatus !== 200)
      return json(
        { code: 'platform.internal', message: 'x', request_id: 'r', fields: [] },
        b.filesStatus,
      )
    const url = new URL(request.url)
    const taskId = url.searchParams.get('work_item_id')
    const tag = url.searchParams.get('tag')
    const department = url.searchParams.get('department_id')
    let list = (b.files ?? []).filter(
      (f) =>
        (!taskId || (f as { work_item_id: string }).work_item_id === taskId) &&
        (!tag || (f as { tag: string }).tag === tag) &&
        (!department || (f as { department_id: string }).department_id === department),
    )
    const total = list.length
    const size = b.pageSize
    const start = Number(url.searchParams.get('cursor') ?? 0)
    if (!size) return json({ files: list, total })
    const next = start + size < list.length ? String(start + size) : undefined
    list = list.slice(start, start + size)
    return json({ files: list, total, ...(next ? { next_cursor: next } : {}) })
  }
}

/**
 * Arşiv okuma uçları, S3 (`/v1/records/archive/*`; koordinatör/üye) ve S2 (`/v1/program/archive/*`;
 * yönetici). S2 `department_id` süzgecini görev/dosya satırının `department_id`'siyle uygular.
 */
export function archiveBackend(b: Backend = {}) {
  return [
    http.get(`${ORIGIN}/v1/records/archive/folders`, foldersHandler(b)),
    http.get(`${ORIGIN}/v1/program/archive/folders`, foldersHandler(b)),
    http.get(`${ORIGIN}/v1/records/archive/tasks`, tasksHandler(b)),
    http.get(`${ORIGIN}/v1/program/archive/tasks`, tasksHandler(b)),
    http.get(`${ORIGIN}/v1/records/archive/attachments`, attachmentsHandler(b)),
    http.get(`${ORIGIN}/v1/program/archive/attachments`, attachmentsHandler(b)),
    // FilePreview yan okuması (alt görev adı).
    http.get(`${ORIGIN}/v1/work-items/:id/subtasks`, () => json({ subtasks: [] })),
  ]
}

export const manyFiles = (n: number, over: object = {}) =>
  Array.from({ length: n }, (_, i) =>
    archiveFile({
      file_id: `f${i + 1}`,
      display_name: `dosya-${i + 1}.pdf`,
      work_item_id: i % 2 === 0 ? 'w1' : 'w2',
      ...over,
    }),
  )
