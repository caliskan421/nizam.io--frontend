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
  errorEnvelope,
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
const toasts = () => useToast().queue.value.map((t) => t.message)

describe('Kaldır (BE-156)', () => {
  it('DELETE + satır düşer + iki sayaç yeniden okunur; CSRF var, Idempotency-Key yok', async () => {
    serve([row({ id: 'a' }), row({ id: 'b' })])
    const { wrapper, settle } = await mountPanel()
    expect(rows(wrapper)).toHaveLength(2)
    const unreadTab = () => wrapper.get('[role="tab"]:last-child').text()
    expect(unreadTab()).toContain('2')
    const listReads = sent('GET', '/v1/notifications').length
    await rows(wrapper)[0]!.get('[data-testid="notification-dismiss"]').trigger('click')
    await settle()
    expect(rows(wrapper)).toHaveLength(1)
    const call = sent('DELETE', '/v1/notifications/a')[0]!
    expect(call.headers.get('X-Requested-With')).toBeTruthy()
    expect(call.headers.get('Idempotency-Key')).toBeNull()
    expect(toasts()).toContain('Bildirim kaldırıldı')
    expect(sent('GET', '/v1/notifications').length).toBeGreaterThan(listReads)
    expect(unreadTab()).toContain('1')
  })

  it('404 (zaten kaldırılmış): sessiz; liste yeniden okunur', async () => {
    const w = serve([row({ id: 'a' })])
    server.use(
      http.delete(`${N}/a`, () => {
        w.rows = []
        return errorEnvelope('notifications.notification_not_found', 404)
      }),
    )
    const { wrapper, settle } = await mountPanel()
    await rows(wrapper)[0]!.get('[data-testid="notification-dismiss"]').trigger('click')
    await settle()
    expect(rows(wrapper)).toHaveLength(0)
    expect(toasts()).toEqual([])
  })
})

describe('Sessize al / geri al (BE-156)', () => {
  it('PUT → muted rozeti (sunucudan) → aynı düğme DELETE; kind yolda, S1 başlıksız', async () => {
    serve([
      row({
        id: 'a',
        subject_ref: { kind: 'meeting', id: 'm-1' },
        type: 'collaboration.meeting.created',
      }),
    ])
    const { wrapper, settle } = await mountPanel()
    const button = () => rows(wrapper)[0]!.get('[data-testid="notification-mute"]')
    expect(button().attributes('aria-label')).toBe('Bu toplantıyı sessize al')
    await button().trigger('click')
    await settle()
    const put = sent('PUT', '/v1/notifications/subject-mutes/meeting/m-1')[0]!
    expect(put.headers.get('X-Nizamio-Program')).toBeNull()
    expect(put.headers.get('X-Requested-With')).toBeTruthy()
    expect(button().attributes('aria-label')).toBe('Bu toplantının sessizini kaldır')
    expect(rows(wrapper)[0]!.text()).toContain('Sessize alındı')
    await button().trigger('click')
    await settle()
    expect(sent('DELETE', '/v1/notifications/subject-mutes/meeting/m-1')).toHaveLength(1)
    expect(rows(wrapper)[0]!.text()).not.toContain('Sessize alındı')
  })

  it('500 konu tavanı: 422 subject_id → özel metin (sunucu iletisi yok)', async () => {
    serve([row({ id: 'a' })])
    server.use(
      http.put(`${N}/subject-mutes/:kind/:id`, () =>
        errorEnvelope('notifications.input_invalid', 422, [
          { field: 'subject_id', code: 'notifications.input_invalid' },
        ]),
      ),
    )
    const { wrapper, settle } = await mountPanel()
    await rows(wrapper)[0]!.get('[data-testid="notification-mute"]').trigger('click')
    await settle()
    expect(toasts()).toEqual(['En çok 500 konu sessize alınabilir'])
  })
})
