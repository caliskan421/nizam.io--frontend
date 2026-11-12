// 07 sayfa testleri: GERÇEK API istemcisi + MSW (arşiv harness'ı), gerçek Pinia kapsam deposu,
// TanStack Query ve bellek router'ı. Komşu W bileşenleri (FilePreview W124, UploadDialog W125,
// FolderZipButton W126) sözleşme adlarıyla TASLAKLANIR (KESİN 16; O3/W127 entegrasyon girdisi).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, type VNode } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { pageCrumb } from '@/shared/navigation/page-crumb'
import { settleQueries } from '@/shared/http/__tests__/settle'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import { archiveFile, folder, http, json, ORIGIN } from '../../../model/__tests__/harness'
import ArchiveFolderPage from '../../ArchiveFolderPage.vue'

export { archiveFile, folder }

/** Taslakların gözlediği prop'lar (sözleşme: `components/index.ts`). */
interface Observed {
  file: { file_id: string; work_item_id: string }
  position: number
  total: number | null
  target: { departmentId: string }
  taskTitle: string | null
  tasks: unknown
  defaultTaskId: string | null
  folder: { folder_id: string }
}

/** Komşu W bileşeninin sözleşme adlı taslağı; props `render` ile gözlem özniteliklerine yazılır. */
function stub(
  name: string,
  props: string[],
  emits: string[],
  render: (p: Observed, emit: (event: string, ...args: unknown[]) => void) => VNode,
) {
  return defineComponent({
    name,
    props: Object.fromEntries(props.map((p) => [p, { type: null }])),
    emits,
    setup:
      (p, { emit }) =>
      () =>
        render(p as unknown as Observed, emit as (event: string, ...args: unknown[]) => void),
  })
}

const button = (act: string, onClick: () => void) => h('button', { 'data-act': act, onClick }, act)

/** TASLAK: FilePreview (W124) — props `data-*` ile gözlenir. */
export const FilePreviewStub = stub(
  'FilePreview',
  ['file', 'position', 'total', 'hasMore', 'target', 'taskTitle'],
  ['close', 'previous', 'next', 'deleted', 'renamed', 'openTask'],
  (p, emit) =>
    h('aside', { 'data-testid': 'preview', 'data-file': p.file.file_id }, [
      h('span', { 'data-testid': 'preview-pos' }, `${p.position}/${p.total ?? 'n+'}`),
      h('span', { 'data-testid': 'preview-dept' }, p.target.departmentId),
      h('span', { 'data-testid': 'preview-task' }, p.taskTitle ?? ''),
      button('close', () => emit('close')),
      button('previous', () => emit('previous')),
      button('next', () => emit('next')),
      button('deleted', () => emit('deleted', p.file.file_id)),
      button('task', () => emit('openTask', p.file.work_item_id)),
    ]),
)

/** TASLAK: UploadDialog (W125). */
export const UploadDialogStub = stub(
  'UploadDialog',
  ['tasks', 'defaultTaskId'],
  ['close', 'uploaded'],
  (p, emit) =>
    h('div', { 'data-testid': 'upload-dialog', 'data-default': String(p.defaultTaskId) }, [
      h('span', { 'data-testid': 'upload-tasks' }, JSON.stringify(p.tasks)),
      button('close', () => emit('close')),
    ]),
)

/** TASLAK: FolderZipButton (W126). */
export const FolderZipStub = stub('FolderZipButton', ['target', 'folder'], [], (p) =>
  h('button', { 'data-testid': 'zip', 'data-folder': p.folder.folder_id }, 'zip'),
)

export const STUBS = {
  FilePreview: FilePreviewStub,
  UploadDialog: UploadDialogStub,
  FolderZipButton: FolderZipStub,
}

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
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router], stubs: STUBS },
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
  files?: object[]
  /** Sayfa başına dosya (imleç testi): verilirse `next_cursor` üretilir. */
  pageSize?: number
  workItems?: object[]
  workNext?: string
  filesStatus?: number
}

export function archiveBackend(b: Backend = {}) {
  const files = b.files ?? []
  return [
    http.get(`${ORIGIN}/v1/records/archive/folders`, () =>
      json({ folders: b.folders ?? [folder({ folder_id: 'd1', file_count: files.length })] }),
    ),
    http.get(`${ORIGIN}/v1/records/archive/tasks`, () =>
      json({
        tasks: b.tasks ?? [
          { work_item_id: 'w1', title: 'Gölgelendirme çalışmaları', file_count: 2 },
          { work_item_id: 'w2', title: 'İklimlendirme hesapları', file_count: 3 },
        ],
      }),
    ),
    http.get(`${ORIGIN}/v1/records/archive/attachments`, ({ request }) => {
      if (b.filesStatus && b.filesStatus !== 200)
        return json(
          { code: 'platform.internal', message: 'x', request_id: 'r', fields: [] },
          b.filesStatus,
        )
      const url = new URL(request.url)
      const taskId = url.searchParams.get('work_item_id')
      const tag = url.searchParams.get('tag')
      let list = files.filter(
        (f) =>
          (!taskId || (f as { work_item_id: string }).work_item_id === taskId) &&
          (!tag || (f as { tag: string }).tag === tag),
      )
      const size = b.pageSize
      const start = Number(url.searchParams.get('cursor') ?? 0)
      if (size) {
        const next = start + size < list.length ? String(start + size) : undefined
        list = list.slice(start, start + size)
        return json({ files: list, ...(next ? { next_cursor: next } : {}) })
      }
      return json({ files: list })
    }),
    http.get(`${ORIGIN}/v1/program/work-items`, () =>
      json({ items: b.workItems ?? [], ...(b.workNext ? { next_cursor: b.workNext } : {}) }),
    ),
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
