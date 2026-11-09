// O2 entegrasyon testleri (W48): GERÇEK `TasksPage` + GERÇEK alt bileşenler (panel, yeni görev,
// durum menüsü, alt görev bloğu, dosyalar, notlar) + modülün ÜRETİM rota kaydı (`workRoutes`,
// `createAppRouter`'ın tükettiği kayıt; `app/` içe aktarımı sınır kuralıyla yasak) + bellek
// geçmişi + GERÇEK Teleport + uygulama yuvaları (`UiToast`, `ConfirmHost`). Ağ: görev
// harness'ının MSW sunucusu üstünde durumlu sahte görev backend'i (istekler kaydedilir).
import { QueryClient, useQueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, onScopeDispose } from 'vue'
import { createMemoryHistory, createRouter, RouterView, type Router } from 'vue-router'

import { purgeScopedQueries } from '@/shared/scope/lifecycle'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'
import { UiToast, useToast } from '@/shared/ui'
import { ConfirmHost, useConfirm } from '@/shared/ui/confirm'

import {
  errorEnvelope,
  http,
  json,
  ORIGIN,
  resetHarness,
  workItem,
} from '../../../../model/__tests__/harness'
import type { WorkItemDetail, WorkItemFile, WorkItemSubtask } from '../../../../model/types'
import { workRoutes } from '../../../../routes'
import { standingHandlers, type StandingFixture } from '../page-harness'

export const ME = 'acc-1'

/** Durumlu sahte görev backend'i: görevler, dosyalar, alt görevler (görev kimliğine göre). */
export interface FakeWork {
  items: WorkItemDetail[]
  files: Map<string, WorkItemFile[]>
  subtasks: Map<string, WorkItemSubtask[]>
  /** `listMembers` satırları (rol dizeleri test dosyalarında yazılır, K1 lint). */
  members: unknown[]
}

export function fakeWork(items: WorkItemDetail[], members: unknown[] = []): FakeWork {
  return { items, files: new Map(), subtasks: new Map(), members }
}

const notFound = () => errorEnvelope('work.item_not_found', 404)

function readHandlers(db: FakeWork) {
  const find = (id: unknown) => db.items.find((i) => i.work_item_id === id)
  return [
    http.get(`${ORIGIN}/v1/program/work-items`, ({ request }) => {
      const department = new URL(request.url).searchParams.get('department_id')
      return json({ items: db.items.filter((i) => !department || i.department_id === department) })
    }),
    http.get(`${ORIGIN}/v1/work-items/:id`, ({ params }) => {
      const item = find(params.id)
      return item ? json(item) : notFound()
    }),
    http.get(`${ORIGIN}/v1/work-items/:id/files`, ({ params }) =>
      find(params.id) ? json({ files: db.files.get(String(params.id)) ?? [] }) : notFound(),
    ),
    http.get(`${ORIGIN}/v1/work-items/:id/subtasks`, ({ params }) =>
      json({ subtasks: db.subtasks.get(String(params.id)) ?? [] }),
    ),
    http.get(`${ORIGIN}/v1/work-items/:id/notes`, () => json({ notes: [], total: 0 })),
    http.get(`${ORIGIN}/v1/departments/:id/members`, () => json({ members: db.members } as never)),
  ]
}

function writeHandlers(db: FakeWork) {
  return [
    http.post(`${ORIGIN}/v1/work-items`, async ({ request }) => {
      const body = (await request.json()) as Record<string, string>
      const created = workItem({
        work_item_id: `w-new-${db.items.length + 1}`,
        title: body.title,
        department_id: request.headers.get('X-Nizamio-Department') ?? '',
      })
      db.items.push(created)
      return json(created, 201)
    }),
    // Çok parçalı gövde burada okunmaz (jsdom `File` + Node fetch); başlık + sorgu denetlenir.
    http.post(`${ORIGIN}/v1/work-items/:id/files`, ({ params, request }) => {
      const id = String(params.id)
      const list = db.files.get(id) ?? []
      const file: WorkItemFile = {
        file_id: `f-${list.length + 1}`,
        work_item_id: id,
        display_name: 'kanit.pdf',
        content_type: 'application/pdf',
        size_bytes: 3,
        tag: new URL(request.url).searchParams.get('tag') as WorkItemFile['tag'],
        uploaded_by_account_id: ME,
        uploaded_by_full_name: 'Ayşe',
      }
      db.files.set(id, [...list, file])
      return json({ ...file, created_at: '2026-11-09T08:00:00Z' }, 201)
    }),
    http.delete(`${ORIGIN}/v1/work-items/:id`, ({ params }) => {
      db.items = db.items.filter((i) => i.work_item_id !== params.id)
      return json({ status: 'deleted' })
    }),
    http.post(`${ORIGIN}/v1/work-items/:id/transitions`, () =>
      errorEnvelope('work.attachment_required', 422),
    ),
  ]
}

/** Standing (S1) + program departmanları + sahte görev backend'i. */
export function backendHandlers(standing: StandingFixture, db: FakeWork) {
  return [...standingHandlers(standing), ...readHandlers(db), ...writeHandlers(db)]
}

export interface AppContext {
  wrapper: VueWrapper
  router: Router
  store: ReturnType<typeof useScopeStore>
  queryClient: QueryClient
}

const mounted: VueWrapper[] = []

/**
 * Kök = uygulama kabuğunun bu ekrana dokunan kısmı (`AppShell`): kapsam değişiminde kapsamlı
 * sorgular iptal edilip düşer (yaşam döngüsü dinleyicisi, sayfadan ÖNCE kaydolur) + sayfa
 * (`RouterView`) + bildirim ve onay yuvaları.
 */
const Root = defineComponent({
  setup() {
    const client = useQueryClient()
    onScopeDispose(useScopeStore().onChange(() => purgeScopedQueries(client)))
    return () => [h(RouterView), h(UiToast), h(ConfirmHost)]
  },
})

/** Uygulamayı `path` üzerinde, `selection` kapsamıyla bağlar ve ilk okumaları bekler. */
export async function mountApp(selection: ScopeSelection, path = '/gorevler'): Promise<AppContext> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useScopeStore()
  store.commit(selection)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { render: () => null } }, ...workRoutes],
  })
  await router.push(path)
  const wrapper = mount(Root, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }], router] },
    attachTo: document.body,
  })
  mounted.push(wrapper)
  await settle(queryClient)
  return { wrapper, router, store, queryClient }
}

/**
 * Sorgu ve yazmalar yerleşene dek olay döngüsünü sınırlı sayıda döndürür (gerçek zamanlayıcı
 * yok): art arda birkaç boş tur beklenir (yazma sonucu → bileşen tepkisi → yeniden okuma).
 */
export async function settle(client: QueryClient, turns = 80): Promise<void> {
  let idle = 0
  for (let i = 0; i < turns; i += 1) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
    idle = client.isFetching() === 0 && client.isMutating() === 0 ? idle + 1 : 0
    if (idle >= 3) return
  }
  throw new Error('sorgular yerleşmedi')
}

/** Belge gövdesi (ışınlanan pencere içeriği dahil). */
export function body(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

/** Görünür metniyle düğme (gövde genelinde). */
export function button(text: string): HTMLButtonElement {
  const found = [...document.body.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === text,
  )
  if (!found) throw new Error(`düğme yok: ${text}`)
  return found
}

/** Panel sekmesi (etiket önekiyle; sayı ekli olabilir). */
export function panelTab(label: string): HTMLElement {
  const found = [...document.body.querySelectorAll<HTMLElement>('[role="tab"]')].find((t) =>
    t.textContent?.trim().startsWith(label),
  )
  if (!found) throw new Error(`sekme yok: ${label}`)
  return found
}

export function setValue(selector: string, value: string): void {
  const el = document.body.querySelector<HTMLInputElement | HTMLSelectElement>(selector)
  if (!el) throw new Error(`öğe yok: ${selector}`)
  el.value = value
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'))
}

/** Her test sonunda: uygulama sökülür, kuyruklar ve harness sıfırlanır. */
export function unmountApps(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  useConfirm().clear()
  useToast().clear()
  resetHarness()
  document.body.innerHTML = ''
}
