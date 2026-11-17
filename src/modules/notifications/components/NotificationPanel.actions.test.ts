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
