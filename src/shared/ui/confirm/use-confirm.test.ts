// Etkili işlem onayı: GERÇEK yazma protokolü (`useProtectedMutation`, `removeMember`) + sahte
// backend; iki aşama (409 confirmation_required → pencere → confirm=true) ve genel istemci onayı.
import { QueryClient } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, effectScope, type EffectScope } from 'vue'

import { api as appApi, authSession } from '@/shared/http'
import { createApiClient } from '@/shared/http/client'
import { useProtectedMutation } from '@/shared/http/mutation'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'
import { AuthSession } from '@/shared/session/auth-session'

import { BASE, noopCoordination } from '../../../../tests/support/fake-backend'
import { useToast } from '../use-toast'
import ConfirmHost from './ConfirmHost.vue'
import { unassignedTasks, useConfirm } from './use-confirm'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
/** Onay açan örnek bir etki kapsamına aittir (sahipsiz onay yasak). */
const owners: EffectScope[] = []
function ownedConfirm() {
  const owner = effectScope()
  owners.push(owner)
  return owner.run(() => useConfirm())!
}

afterEach(() => {
  for (const owner of owners.splice(0)) owner.stop()
  server.resetHandlers()
  if (authSession.snapshot.accountId) authSession.clear()
  useConfirm().clear()
  useToast().clear()
  document.body.innerHTML = ''
})
afterAll(() => server.close())

const scope: ScopeSnapshot = { programId: 'p1', departmentId: null }
const api = createApiClient({
  baseUrl: BASE,
  session: new AuthSession({
    baseUrl: BASE,
    fetch: (r) => globalThis.fetch(r),
    coordination: noopCoordination(),
  }),
  scope: () => scope,
})

type Vars = { id: string; accountId: string }

function removeMember() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const effect = effectScope()
  const mutation = effect.run(() =>
    useProtectedMutation<Vars, unknown>({
      operation: 'removeMember',
      queryClient,
      scope: () => scope,
      send: (vars, ctx) =>
        api.DELETE('/v1/departments/{id}/memberships/{accountId}', {
          params: {
            path: vars,
            query: ctx.confirm ? { confirm: 'true' } : {},
            header: ctx.headers,
          },
        }),
    }),
  )!
  return { mutation, stop: () => effect.stop() }
}

const OPTIONS = { title: 'Üye kaldırılsın mı?', confirmLabel: 'Onayla ve devam et' }

describe('etkili işlem onayı (iki aşama)', () => {
  it('409 → görev başlıkları listelenir → onay → confirm=true → sonuç + devredilen atama bildirimi', async () => {
    const confirms: Array<string | null> = []
    server.use(
      http.delete(`${BASE}/v1/departments/dep1/memberships/acc1`, ({ request }) => {
        const confirm = new URL(request.url).searchParams.get('confirm')
        confirms.push(confirm)
        return confirm === 'true'
          ? HttpResponse.json({ membership_id: 'm1', unassigned_tasks: 2, warning: true })
          : HttpResponse.json(
              {
                code: 'organization.confirmation_required',
                message: 'sunucu metni gösterilmez',
                request_id: 'r',
                fields: [
                  { field: 'work_item', code: 'organization.task_title', message: 'Rapor' },
                  { field: 'work_item', code: 'organization.task_title', message: 'Sunum' },
                ],
              },
              { status: 409 },
            )
      }),
    )
    const host = mount(ConfirmHost, { attachTo: document.body })
    const { mutation, stop } = removeMember()
    const first = await mutation.submit({ id: 'dep1', accountId: 'acc1' })
    if (first.kind !== 'confirmation_required') throw new Error(first.kind)

    const pending = ownedConfirm().confirmImpact(first, OPTIONS)
    await flushPromises()
    const dialog = document.querySelector('[data-testid="confirm-dialog"]')!
    expect(dialog.getAttribute('role')).toBe('alertdialog')
    expect(dialog.textContent).toContain('Üye kaldırılsın mı?')
    expect(dialog.textContent).not.toContain('sunucu metni gösterilmez')
    const items = [...document.querySelectorAll('[data-testid="confirm-items"] li')]
    expect(items.map((li) => li.textContent?.trim())).toEqual(['Rapor', 'Sunum'])
    expect(confirms).toEqual([null])

    ;(document.querySelector('[data-testid="confirm-accept"]') as HTMLButtonElement).click()
    await flushPromises()
    const result = await pending
    expect(result?.kind).toBe('success')
    expect(confirms).toEqual([null, 'true'])
    expect(document.querySelector('[data-testid="confirm-dialog"]')).toBeNull()
    expect(useToast().current.value?.message).toBe(
      'İşlem tamamlandı; 2 görevdeki atama devredildi.',
    )
    host.unmount()
    stop()
  })

  it('vazgeç → istek gönderilmez, sonuç null', async () => {
    let calls = 0
    server.use(
      http.delete(`${BASE}/v1/departments/dep1/memberships/acc1`, () => {
        calls += 1
        return HttpResponse.json(
          {
            code: 'organization.confirmation_required',
            message: 'x',
            request_id: 'r',
            fields: [{ field: 'work_item', code: 'organization.task_title', message: 'Rapor' }],
          },
          { status: 409 },
        )
      }),
    )
    const host = mount(ConfirmHost, { attachTo: document.body })
    const { mutation, stop } = removeMember()
    const first = await mutation.submit({ id: 'dep1', accountId: 'acc1' })
    if (first.kind !== 'confirmation_required') throw new Error(first.kind)
    const pending = ownedConfirm().confirmImpact(first, OPTIONS)
    await flushPromises()
    const dialog = document.querySelector('[data-testid="confirm-dialog"]') as HTMLElement
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(await pending).toBeNull()
    expect(calls).toBe(1)
    host.unmount()
    stop()
  })
})

describe('genel istemci onayı', () => {
  it('kabul → start sonucu; vazgeç → null; kuyruk sırayla gösterir', async () => {
    const host = mount(ConfirmHost, { attachTo: document.body })
    const confirm = ownedConfirm()
    const start = () => Promise.resolve('yazıldı')
    const first = confirm.confirmWrite(
      { title: 'Görev silinsin mi?', body: ['Görev listeden kalkar.'], confirmLabel: 'Sil' },
      start,
    )
    const second = confirm.confirmWrite(
      { title: 'İkinci', confirmLabel: 'Tamam', tone: 'primary' },
      start,
    )
    await flushPromises()
    expect(document.body.textContent).toContain('Görev silinsin mi?')
    expect(document.body.textContent).toContain('Görev listeden kalkar.')
    const accept = () => document.querySelector('[data-testid="confirm-accept"]') as HTMLElement
    expect(accept().className).toContain('t-btn--danger')
    accept().click()
    expect(await first).toBe('yazıldı')
    await flushPromises()
    expect(document.body.textContent).toContain('İkinci')
    expect(accept().className).toContain('t-btn--primary')
    confirm.cancel(confirm.current.value!.id)
    expect(await second).toBeNull()
    host.unmount()
  })

  it('sahipsiz onay yasak: etki kapsamı dışında alınan örnek onay açamaz (geliştirme/test hatası)', () => {
    const outside = useConfirm()
    const start = () => Promise.resolve('x')
    expect(() => outside.confirmWrite({ title: 'x', confirmLabel: 'y' }, start)).toThrow(
      /etki kapsamı dışında/,
    )
    expect(outside.current.value).toBeNull()
  })

  it('unassignedTasks yalnız pozitif sayı', () => {
    expect(unassignedTasks({ unassigned_tasks: 3 })).toBe(3)
    expect(unassignedTasks({ unassigned_tasks: 0 })).toBe(0)
    expect(unassignedTasks(null)).toBe(0)
    expect(unassignedTasks({ unassigned_tasks: '2' })).toBe(0)
  })
})

// CX-F1-E-02: onay ilk eylemin kapsamına + oturum nesline bağlı. Tüketici `DeleteTaskAction`
// kalıbıyla aynıdır (önce `confirm`, kabulde YENİ `submit`); GERÇEK `useProtectedMutation`
// (varsayılan kapsam deposu + oturum nesli) + uygulama API istemcisi + MSW; yazma sayılır.
describe('onay yaşam döngüsü (CX-F1-E-02) — sıfır yazma kanıtı', () => {
  const A = { programId: 'p1', lens: 'coordinator', departmentId: 'd1' } as const
  const B = { programId: 'p2', lens: 'coordinator', departmentId: 'd3' } as const
  const login = (accountId: string) => ({
    token: `tok-${accountId}`,
    account_id: accountId,
    expires_at: Math.floor(Date.now() / 1000) + 900,
    force_password_change: false,
  })

  const Consumer = defineComponent({
    props: { queryClient: { type: QueryClient, required: true } },
    setup(props) {
      const { confirmWrite } = useConfirm()
      const remove = useProtectedMutation<{ id: string }, unknown>({
        operation: 'deleteWorkItem',
        queryClient: props.queryClient,
        send: (vars, ctx) =>
          appApi.DELETE('/v1/work-items/{id}', {
            params: {
              path: vars,
              header: { ...ctx.headers, 'X-Nizamio-Program': 'p1', 'X-Nizamio-Department': 'd1' },
            },
          }),
      })
      async function onDelete(): Promise<boolean> {
        const outcome = await confirmWrite(
          { title: 'Görev silinsin mi?', confirmLabel: 'Sil' },
          (context) => remove.submit({ id: 'w1' }, { context }),
        )
        return outcome !== null
      }
      return { onDelete }
    },
    render: () => null,
  })

  function setupChain() {
    let writes = 0
    server.use(
      http.delete(`${BASE}/v1/work-items/w1`, () => {
        writes += 1
        return HttpResponse.json({ status: 'deleted' })
      }),
    )
    setActivePinia(createPinia())
    const store = useScopeStore()
    store.commit(A)
    const host = mount(ConfirmHost, { attachTo: document.body })
    const consumer = mount(Consumer, { props: { queryClient: new QueryClient() } })
    const pending = (consumer.vm as unknown as { onDelete: () => Promise<boolean> }).onDelete()
    const dialog = () => document.querySelector('[data-testid="confirm-dialog"]')
    return { store, host, consumer, pending, dialog, writes: () => writes }
  }

  it('(a) A’da açılan silme onayı → kapsam B: pencere kendiliğinden kapanır, sıfır yazma', async () => {
    const c = setupChain()
    await flushPromises()
    expect(c.dialog()).not.toBeNull()
    const id = useConfirm().current.value!.id
    c.store.commit(B)
    await flushPromises()
    expect(c.dialog()).toBeNull()
    expect(await c.pending).toBe(false)
    await useConfirm().accept(id) // bayat kimlikle kabul: etkisiz
    await flushPromises()
    expect(c.writes()).toBe(0)
    c.consumer.unmount()
    c.host.unmount()
  })

  it('(b) onay açıkken çıkış → başka hesapla giriş: onay iptal, sıfır yazma', async () => {
    authSession.establish(login('acc-x'))
    const c = setupChain()
    await flushPromises()
    expect(c.dialog()).not.toBeNull()
    authSession.clear()
    authSession.establish(login('acc-y'))
    await flushPromises()
    expect(c.dialog()).toBeNull()
    expect(await c.pending).toBe(false)
    expect(c.writes()).toBe(0)
    c.consumer.unmount()
    c.host.unmount()
  })

  it('(c) onayı açan bileşen sökülünce bekleyen onay iptal (vazgeç), sıfır yazma', async () => {
    const c = setupChain()
    await flushPromises()
    expect(c.dialog()).not.toBeNull()
    c.consumer.unmount()
    await flushPromises()
    expect(c.dialog()).toBeNull()
    expect(await c.pending).toBe(false)
    expect(c.writes()).toBe(0)
    c.host.unmount()
  })

  it('(d) değişmeyen kapsam/oturumda kabul → tek yazma (regresyon)', async () => {
    authSession.establish(login('acc-x'))
    const c = setupChain()
    await flushPromises()
    ;(document.querySelector('[data-testid="confirm-accept"]') as HTMLButtonElement).click()
    expect(await c.pending).toBe(true)
    await flushPromises()
    expect(c.writes()).toBe(1)
    c.consumer.unmount()
    c.host.unmount()
  })

  it('savunma derinliği: dinleyici kaçırsa da (başka depo etkin) bayat bağlamda kabul = vazgeç', async () => {
    const c = setupChain()
    await flushPromises()
    const id = useConfirm().current.value!.id
    // Bildirimsiz kapsam değişimi: etkin Pinia değişir (yakalanan depo dinleyicisi tetiklenmez).
    setActivePinia(createPinia())
    useScopeStore().commit(B)
    expect(c.dialog()).not.toBeNull()
    await useConfirm().accept(id)
    expect(await c.pending).toBe(false)
    await flushPromises()
    expect(c.writes()).toBe(0)
    c.consumer.unmount()
    c.host.unmount()
  })

  it('etkili işlem onayı (confirmImpact) da kapsam değişiminde null ile kapanır; confirm=true gitmez', async () => {
    let calls = 0
    server.use(
      http.delete(`${BASE}/v1/departments/dep1/memberships/acc1`, () => {
        calls += 1
        return HttpResponse.json(
          { code: 'organization.confirmation_required', message: 'x', request_id: 'r' },
          { status: 409 },
        )
      }),
    )
    setActivePinia(createPinia())
    useScopeStore().commit(A)
    const { mutation, stop } = removeMember()
    const first = await mutation.submit({ id: 'dep1', accountId: 'acc1' })
    if (first.kind !== 'confirmation_required') throw new Error(first.kind)
    const pending = ownedConfirm().confirmImpact(first, OPTIONS)
    useScopeStore().commit(B)
    expect(await pending).toBeNull()
    expect(calls).toBe(1)
    stop()
  })
})

describe('confirmWrite — yazma onayın bağlamıyla başlar (CX-F1-E-02)', () => {
  const A = { programId: 'p1', lens: 'coordinator', departmentId: 'd1' } as const
  const B = { programId: 'p2', lens: 'coordinator', departmentId: 'd3' } as const

  function scoped() {
    setActivePinia(createPinia())
    const store = useScopeStore()
    store.commit(A)
    return store
  }

  it('verilen ilk eylem bağlamı açılışta bayatsa onay hiç açılmaz (null), start çağrılmaz', async () => {
    const store = scoped()
    const first = { scope: { ...store.snapshot }, generation: authSession.generation }
    store.commit(B)
    const start = vi.fn(() => Promise.resolve('yazıldı'))
    const result = ownedConfirm().confirmWrite(OPTIONS, start, { context: first })
    expect(useConfirm().current.value).toBeNull()
    expect(await result).toBeNull()
    expect(start).not.toHaveBeenCalled()
  })

  it('kabul → start onayın yakaladığı bağlamla, kabulle AYNI anda çağrılır; sonuç döner', async () => {
    const store = scoped()
    const start = vi.fn(() => Promise.resolve('yazıldı'))
    const result = ownedConfirm().confirmWrite(OPTIONS, start)
    const accepting = useConfirm().accept(useConfirm().current.value!.id)
    // `accept` ile `start` arasında araya giren iş yok: kabul döner dönmez yazma başlamış.
    expect(start).toHaveBeenCalledWith({
      scope: { ...store.snapshot },
      generation: authSession.generation,
    })
    await accepting
    expect(await result).toBe('yazıldı')
  })

  it('vazgeç → null, start çağrılmaz', async () => {
    scoped()
    const start = vi.fn(() => Promise.resolve('yazıldı'))
    const result = ownedConfirm().confirmWrite(OPTIONS, start)
    useConfirm().cancel(useConfirm().current.value!.id)
    expect(await result).toBeNull()
    expect(start).not.toHaveBeenCalled()
  })
})
