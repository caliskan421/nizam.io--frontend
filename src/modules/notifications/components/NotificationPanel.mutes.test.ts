// "Sessize alınan konular" alt görünümü (BE-156; P86): imleç, nötr metin, geri alma, odak.
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

describe('Sessize alınan konular alt görünümü (P86)', () => {
  const mute = (
    id: string,
    kind: 'work_item' | 'meeting' = 'work_item',
  ): NotificationSubjectMute => ({
    subject_kind: kind,
    subject_id: id,
    created_at: '2026-11-13T20:05:00Z',
  })
  const open = async (wrapper: VueWrapper, settle: () => Promise<void>) => {
    await wrapper.get('[data-testid="notification-mutes-open"]').trigger('click')
    await settle()
  }

  it('limit=30 ile okunur; başlık yalnız güncel available bildirim verisinden, yoksa nötr metin; opaque kimlik yazılmaz', async () => {
    serve(
      [
        row({
          id: 'a',
          subject_ref: { kind: 'work_item', id: 'w-1' },
          subject: {
            state: 'available',
            title: 'Bütçe taslağı',
            code: null,
            sequence_no: null,
            person: null,
          },
        }),
        row({
          id: 'b',
          subject_ref: { kind: 'work_item', id: 'w-2' },
          subject: { state: 'forbidden', title: null, code: null, sequence_no: null, person: null },
        }),
      ],
      [mute('w-1'), mute('w-2'), mute('m-9', 'meeting'), mute('w-3')],
    )
    const { wrapper, settle } = await mountPanel()
    await open(wrapper, settle)
    expect(sent('GET', '/v1/notifications/subject-mutes')[0]!.query.get('limit')).toBe('30')
    const texts = wrapper.findAll('[data-testid="notification-mute-row"]').map((r) => r.text())
    expect(texts[0]).toContain('Bütçe taslağı')
    expect(texts[1]).toContain('Sessize alınmış görev')
    expect(texts[2]).toContain('Sessize alınmış toplantı')
    expect(texts[3]).toContain('Sessize alınmış görev')
    expect(texts[0]).toContain('Sessize alma: 13.11.2026 23:05')
    for (const id of ['w-2', 'm-9', 'w-3']) expect(wrapper.text()).not.toContain(id)
  })

  it('eski başlık taşınmaz: en yeni satır forbidden/deleted ise başlık gösterilmez', async () => {
    serve(
      [
        row({
          id: 'new',
          subject_ref: { kind: 'work_item', id: 'w-1' },
          subject: { state: 'deleted', title: null, code: null, sequence_no: null, person: null },
        }),
        row({
          id: 'old',
          subject_ref: { kind: 'work_item', id: 'w-1' },
          subject: {
            state: 'available',
            title: 'ESKİ BAŞLIK',
            code: null,
            sequence_no: null,
            person: null,
          },
        }),
      ],
      [mute('w-1')],
    )
    const { wrapper, settle } = await mountPanel()
    await open(wrapper, settle)
    expect(wrapper.text()).not.toContain('ESKİ BAŞLIK')
  })

  it('"Sessizi kaldır": DELETE, satır düşer, bildirim satırlarındaki muted yenilenir; konuya erişim kalmasa da çalışır', async () => {
    serve([row({ id: 'a', muted: true })], [mute('w-1')])
    const { wrapper, settle } = await mountPanel()
    await open(wrapper, settle)
    await wrapper.get('[data-testid="notification-unmute"]').trigger('click')
    await settle()
    expect(sent('DELETE', '/v1/notifications/subject-mutes/work_item/w-1')).toHaveLength(1)
    expect(wrapper.findAll('[data-testid="notification-mute-row"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('Sessize alınmış konu yok')
    expect(toasts()).toContain('Sessiz kaldırıldı')
    expect(sent('GET', '/v1/notifications').length).toBeGreaterThan(1)
  })

  it('imleçli: "Daha fazla konu" sonraki sayfayı ekler; son sayfada düğme kalkar', async () => {
    serve([row()])
    server.use(
      http.get(`${N}/subject-mutes`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor')
          ? json({ items: [mute('w-2')], next_cursor: null })
          : json({ items: [mute('w-1')], next_cursor: 'k2' }),
      ),
    )
    const { wrapper, settle } = await mountPanel()
    await open(wrapper, settle)
    await wrapper.get('[data-testid="notification-mutes-older"]').trigger('click')
    await settle()
    expect(wrapper.findAll('[data-testid="notification-mute-row"]')).toHaveLength(2)
    expect(sent('GET', '/v1/notifications/subject-mutes')[1]!.query.get('cursor')).toBe('k2')
    expect(wrapper.find('[data-testid="notification-mutes-older"]').exists()).toBe(false)
  })

  it('hata → yeniden dene; geri düğmesi listeye döner ve odak "Sessize alınan konular"a gelir', async () => {
    serve([row()])
    server.use(http.get(`${N}/subject-mutes`, () => errorEnvelope('platform.internal', 400)))
    const { wrapper, settle } = await mountPanel()
    await open(wrapper, settle)
    expect(wrapper.get('[role="alert"]').text()).toContain('Sessize alınan konular yüklenemedi.')
    server.use(
      http.get(`${N}/subject-mutes`, () => json({ items: [mute('w-1')], next_cursor: null })),
    )
    await wrapper.get('[role="alert"] button').trigger('click')
    await settle()
    expect(wrapper.findAll('[data-testid="notification-mute-row"]')).toHaveLength(1)
    await wrapper.get('[data-testid="notification-mutes-back"]').trigger('click')
    await settle()
    expect(rows(wrapper)).toHaveLength(1)
    expect(document.activeElement).toBe(
      wrapper.get('[data-testid="notification-mutes-open"]').element,
    )
  })

  it('panel kapanıp açılınca görünüm listeye döner; mute listesi kapalıyken okunmaz', async () => {
    serve([row()])
    const { wrapper, settle } = await mountPanel()
    expect(sent('GET', '/v1/notifications/subject-mutes')).toHaveLength(0)
    await open(wrapper, settle)
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await settle()
    expect(wrapper.find('[data-testid="notification-mutes"]').exists()).toBe(false)
    expect(rows(wrapper)).toHaveLength(1)
  })
})
