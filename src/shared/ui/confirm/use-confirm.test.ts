// Etkili işlem onayı: GERÇEK yazma protokolü (`useProtectedMutation`, `removeMember`) + sahte
// backend; iki aşama (409 confirmation_required → pencere → confirm=true) ve genel istemci onayı.
import { QueryClient } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { effectScope } from 'vue'

import { createApiClient } from '@/shared/http/client'
import { useProtectedMutation } from '@/shared/http/mutation'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { AuthSession } from '@/shared/session/auth-session'

import { BASE, noopCoordination } from '../../../../tests/support/fake-backend'
import { useToast } from '../use-toast'
import ConfirmHost from './ConfirmHost.vue'
import { unassignedTasks, useConfirm } from './use-confirm'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  server.resetHandlers()
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

    const pending = useConfirm().confirmImpact(first, OPTIONS)
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
    const pending = useConfirm().confirmImpact(first, OPTIONS)
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
  it('kabul → true; vazgeç → false; kuyruk sırayla gösterir', async () => {
    const host = mount(ConfirmHost, { attachTo: document.body })
    const confirm = useConfirm()
    const first = confirm.confirm({
      title: 'Görev silinsin mi?',
      body: ['Görev listeden kalkar.'],
      confirmLabel: 'Sil',
    })
    const second = confirm.confirm({ title: 'İkinci', confirmLabel: 'Tamam', tone: 'primary' })
    await flushPromises()
    expect(document.body.textContent).toContain('Görev silinsin mi?')
    expect(document.body.textContent).toContain('Görev listeden kalkar.')
    const accept = () => document.querySelector('[data-testid="confirm-accept"]') as HTMLElement
    expect(accept().className).toContain('t-btn--danger')
    accept().click()
    expect(await first).toBe(true)
    await flushPromises()
    expect(document.body.textContent).toContain('İkinci')
    expect(accept().className).toContain('t-btn--primary')
    confirm.cancel(confirm.current.value!.id)
    expect(await second).toBe(false)
    host.unmount()
  })

  it('unassignedTasks yalnız pozitif sayı', () => {
    expect(unassignedTasks({ unassigned_tasks: 3 })).toBe(3)
    expect(unassignedTasks({ unassigned_tasks: 0 })).toBe(0)
    expect(unassignedTasks(null)).toBe(0)
    expect(unassignedTasks({ unassigned_tasks: '2' })).toBe(0)
  })
})
