// Satır içi karar — panel düzeyi (BE-146; P88): sunucu satırı çözer, iade gerekçesi penceresi.
// Panel satır işlemleri ve alt görünüm (BE-146/156; P86/P88): GERÇEK istemci + MSW durumlu sahte
// sunucu + gerçek Pinia/TanStack Query. Önce-sonra: yazma sonrası liste ve İKİ sayaç sunucudan okunur.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'
import { useInstanceStore } from '@/shared/instance/store'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import {
  http,
  json,
  noContent,
  ORIGIN,
  resetAll,
  sent,
  server,
  settleQueries,
  signIn,
} from '../__tests__/harness'
import type { NotificationItem, NotificationSubjectMute } from '../model/types'
import NotificationPanel from './NotificationPanel.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  useToast().clear()
  vi.useRealTimers()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
beforeEach(() => {
  signIn()
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-14T09:00:00Z') })
})

const N = `${ORIGIN}/v1/notifications`
const row = (over: Partial<NotificationItem> = {}) =>
  makeNotification({ created_at: '2026-11-14T08:55:00Z', ...over })

interface World {
  rows: NotificationItem[]
  mutes: NotificationSubjectMute[]
  bodies: unknown[]
}

/** Durumlu sunucu: kaldır/sessize al/okundu satırları ve sayaçları birlikte değiştirir. */
function serve(rows: NotificationItem[], mutes: NotificationSubjectMute[] = []): World {
  const w: World = { rows, mutes, bodies: [] }
  const counts = () => ({
    unread_count: w.rows.filter((n) => !n.is_read).length,
    awaiting_count: w.rows.filter((n) => n.action?.state === 'pending').length,
  })
  server.use(
    http.get(N, () => json({ items: w.rows, ...counts() })),
    http.get(`${N}/unread-count`, () => {
      const c = counts()
      return json({ count: c.unread_count, awaiting_count: c.awaiting_count })
    }),
    http.get(`${N}/vapid-public-key`, () => json({ enabled: false, public_key: '' })),
    http.delete(`${N}/subject-mutes/:kind/:id`, ({ params }) => {
      w.mutes = w.mutes.filter((m) => m.subject_id !== params.id)
      w.rows.forEach((n) => n.subject_ref.id === params.id && (n.muted = false))
      return noContent()
    }),
    http.delete(`${N}/:id`, ({ params }) => {
      w.rows = w.rows.filter((n) => n.id !== params.id)
      return noContent()
    }),
    http.put(`${N}/subject-mutes/:kind/:id`, ({ params }) => {
      w.mutes = [
        {
          subject_kind: params.kind as 'work_item',
          subject_id: String(params.id),
          created_at: '2026-11-14T08:59:00Z',
        },
        ...w.mutes,
      ]
      w.rows.forEach((n) => n.subject_ref.id === params.id && (n.muted = true))
      return noContent()
    }),
    http.get(`${N}/subject-mutes`, () => json({ items: w.mutes, next_cursor: null })),
  )
  return w
}

async function mountPanel() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useInstanceStore().profile = { timezone: 'Europe/Istanbul' } as never
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  const wrapper = mount(NotificationPanel, {
    props: { open: true },
    attachTo: document.body,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
  })
  await flushPromises()
  const settle = async () => {
    await settleQueries(client)
    await wrapper.vm.$nextTick()
  }
  await settle()
  return { wrapper, client, settle }
}
const rows = (w: VueWrapper) => w.findAll('[data-testid="notification-row"]')

describe('satır içi karar — panel (BE-146)', () => {
  const dateRequest = (state: 'pending' | 'resolved' = 'pending') =>
    row({
      id: 'dr',
      type: 'work.date_change.requested',
      program_id: 'p1',
      department_id: 'd1',
      subject_ref: { kind: 'work_item', id: 'w-1' },
      action: {
        kind: 'review_date_request',
        request_id: 'r1',
        state,
        resolution:
          state === 'resolved'
            ? {
                outcome: 'approved',
                decided_by: { account_id: 'acc-1', full_name: 'Ben' },
                decided_at: null,
              }
            : null,
      },
    })

  it('Onayla: istek + liste/sayaç sunucudan okunur; satır "Onaylandı · sen" olur; Geri al çizilmez', async () => {
    const w = serve([dateRequest()])
    server.use(
      http.post(`${ORIGIN}/v1/date-change-requests/r1/review`, async ({ request }) => {
        w.bodies.push(await request.json())
        w.rows = [dateRequest('resolved')]
        return json({ decision: 'approved' })
      }),
    )
    const { wrapper, settle } = await mountPanel()
    expect(wrapper.get('[role="tab"]:first-child').text()).toContain('1')
    const buttons = rows(wrapper)[0]!.findAll('[data-testid="notification-decision"] button')
    expect(buttons.map((b) => b.text())).toEqual(['Onayla', 'Reddet'])
    await buttons[0]!.trigger('click')
    await settle()
    expect(w.bodies).toEqual([{ decision: 'approved' }])
    expect(rows(wrapper)[0]!.get('[data-testid="notification-resolved"]').text()).toBe(
      'Onaylandı · sen',
    )
    expect(rows(wrapper)[0]!.text()).not.toContain('Geri al')
    expect(wrapper.get('[role="tab"]:first-child').text()).not.toContain('1')
  })

  it('görev onayı "Reddet": gerekçe penceresi (iade, isteğe bağlı); gönder → iade_edildi', async () => {
    const task = row({
      id: 'tk',
      type: 'work.item.transitioned',
      program_id: 'p9',
      department_id: 'd9',
      subject_ref: { kind: 'work_item', id: 'w9' },
      action: { kind: 'approve_task', request_id: null, state: 'pending', resolution: null },
    })
    const w = serve([task])
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w9/transitions`, async ({ request }) => {
        w.bodies.push(await request.json())
        return json({ work_item_id: 'w9', status: 'iade_edildi' })
      }),
    )
    const { wrapper, settle } = await mountPanel()
    await rows(wrapper)[0]!
      .findAll('[data-testid="notification-decision"] button')[1]!
      .trigger('click')
    await settle()
    const input = document.body.querySelector<HTMLInputElement>('input[name="reason"]')!
    expect(input).not.toBeNull()
    input.value = 'Kanıt eksik'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    document.body.querySelector<HTMLButtonElement>('[data-testid="wf-revert-submit"]')!.click()
    await settle()
    await vi.waitFor(() => expect(w.bodies).toEqual([{ to: 'iade_edildi', reason: 'Kanıt eksik' }]))
    const call = sent('POST', '/v1/work-items/w9/transitions')[0]!
    expect([
      call.headers.get('X-Nizamio-Program'),
      call.headers.get('X-Nizamio-Department'),
    ]).toEqual(['p9', 'd9'])
  })
})
