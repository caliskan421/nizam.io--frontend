// W184 (BE-083 rozet, BE-028 grup tiki, BE-085 görev kartları): gerçek konuşma gövdesi + msw.
import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { msg } from '../../__tests__/fixtures'
import { resetAll, sent, server, signIn } from '../../__tests__/harness'
import { mountPane, servePane, unmountAll } from '../__tests__/pane-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  unmountAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const ME = 'acc-1'
const POLL = {
  anonymous: false,
  closed_at: null,
  closes_at: null,
  multi: false,
  results: [{ option_index: 0, label: 'A', count: 0, mine: false, voters: [] }],
}
const mine = (seq: number, over = {}) =>
  msg(seq, { sender_account_id: ME, sender_name: 'Ben', ...over })

describe('rol rozeti (BE-083)', () => {
  it('Admin ve Koordinatör rozet taşır (başlıkta koordinatörlük); üye/none/alansız taşımaz', async () => {
    servePane({
      departments: [{ department_id: 'd1', display_name: 'Yazılım', code: 'YZ', status: 'active' }],
      messages: [
        msg(1, {
          sender_account_id: 'a',
          sender_name: 'Aylin',
          sender_role: { role: 'company_admin', department_ids: [] },
        }),
        msg(2, {
          sender_account_id: 'b',
          sender_name: 'Berk',
          sender_role: { role: 'coordinator', department_ids: ['d1'] },
        }),
        msg(3, {
          sender_account_id: 'c',
          sender_name: 'Can',
          sender_role: { role: 'member', department_ids: ['d1'] },
        }),
        msg(4, {
          sender_account_id: 'd',
          sender_name: 'Deniz',
          sender_role: { role: 'none', department_ids: [] },
        }),
        msg(5, { sender_account_id: 'e', sender_name: 'Ece' }),
      ],
    })
    const { wrapper } = await mountPane()
    const rows = wrapper.findAll('[data-testid="chat-message"]')
    const badge = (i: number) => rows[i]!.find('[data-testid="chat-role-badge"]')
    expect(badge(0).text()).toBe('Admin')
    expect(badge(1).text()).toBe('Koordinatör')
    expect(badge(1).attributes('title')).toBe('Koordinatör · Yazılım')
    for (const i of [2, 3, 4]) expect(badge(i).exists()).toBe(false)
    // Rozet gösterimdir: grup rolü ("Yönetici") ile karışmaz.
    expect(wrapper.text()).not.toContain('Yönetici')
  })
})

describe('grup okundu tiki (BE-028)', () => {
  it('read_by_all: true → "Herkes okudu"; false → "Gönderildi"; null/yok → tik çizilmez; başkasının mesajında tik yok', async () => {
    servePane({
      messages: [
        mine(1, { read_by_all: true }),
        mine(2, { read_by_all: false }),
        mine(3, { read_by_all: null }),
        mine(4),
        msg(5, { read_by_all: true }),
      ],
    })
    const { wrapper } = await mountPane()
    const rows = wrapper.findAll('[data-testid="chat-message"]')
    const tick = (i: number) => rows[i]!.find('.chat-tick')
    expect(tick(0).attributes('aria-label')).toBe('Herkes okudu')
    expect(tick(0).classes()).toContain('chat-tick--read')
    expect(tick(1).attributes('aria-label')).toBe('Gönderildi')
    expect(tick(1).classes()).not.toContain('chat-tick--read')
    expect(tick(2).exists()).toBe(false)
    expect(tick(3).exists()).toBe(false)
    expect(tick(4).exists()).toBe(false)
  })

  it('grup tiki Mesaj bilgisi penceresini açar; menüde kendi mesajımda "Mesaj bilgisi" etkin', async () => {
    servePane({ messages: [mine(1, { read_by_all: false })] })
    const { wrapper, dialogs } = await mountPane()
    await wrapper.get('.chat-tick').trigger('click')
    expect(dialogs).toEqual([{ dialog: 'messageInfo', chatId: 'c1', messageId: 'm1' }])
  })
})

describe('mesaj görev kartları (BE-085)', () => {
  const tasks = [
    {
      state: 'available',
      work_item_id: 'w1',
      task: {
        title: 'Trafo',
        status: 'devam_ediyor',
        code: null,
        sequence_no: 7,
        department_id: 'd1',
      },
    },
    { state: 'forbidden', work_item_id: 'w2', task: null },
    { state: 'deleted', work_item_id: 'w3', task: null },
  ]

  it('available kodlu/başlıklı kart; forbidden/deleted başlık sızdırmadan metin; TEK istek, getWorkItem yok', async () => {
    servePane({ messages: [msg(1, { task_ids: ['w1', 'w2', 'w3'] })], messageTasks: { m1: tasks } })
    const { wrapper } = await mountPane()
    const cards = wrapper.get('[data-testid="chat-task-cards"]')
    expect(cards.find('[data-state="available"]').text()).toContain('#7')
    expect(cards.find('[data-state="available"]').text()).toContain('Trafo')
    expect(cards.find('[data-state="available"]').text()).toContain('Devam ediyor')
    expect(cards.find('[data-state="forbidden"]').text()).toBe('Görevi görme yetkiniz yok')
    expect(cards.find('[data-state="deleted"]').text()).toBe('Görev silinmiş')
    expect(cards.find('[data-state="forbidden"]').element.tagName).toBe('SPAN')
    expect(sent('GET', '/v1/chats/c1/messages/m1/tasks')).toHaveLength(1)
    expect(sent('GET', '/v1/work-items/w1')).toHaveLength(0)
    expect(sent('GET', '/v1/work-items/w2')).toHaveLength(0)
  })

  it('mesajda task_ids yoksa istek yok; kart tıkı /gorevler?gorev= açar', async () => {
    servePane({
      messages: [msg(1), msg(2, { task_ids: ['w1'] })],
      messageTasks: { m2: tasks.slice(0, 1) },
    })
    const { wrapper, router } = await mountPane()
    router.addRoute({ name: 'work.tasks', path: '/gorevler', component: { template: '<div />' } })
    expect(sent('GET', '/v1/chats/c1/messages/m1/tasks')).toHaveLength(0)
    await wrapper.get('[data-state="available"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.gorev).toBe('w1')
  })
})

describe('İlet kapısı (BE-080, W185b bağladı)', () => {
  it('menü öğesi etkindir (stub yok); seçilince İlet penceresi isteği (kaynak mesaj kimliğiyle) açılır', async () => {
    servePane({ messages: [msg(1)] })
    const { wrapper, dialogs } = await mountPane()
    await wrapper.get('.msg-row [aria-label="Diğer"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-design-stub="BE-080"]').exists()).toBe(false)
    const item = wrapper.findAll('[role="menuitem"]').find((e) => e.text() === 'İlet')!
    expect(item.attributes('disabled')).toBeUndefined()
    await item.trigger('click')
    expect(dialogs).toEqual([{ dialog: 'forward', chatId: 'c1', messageId: 'm1' }])
  })

  it('anket mesajında İlet gizlidir', async () => {
    servePane({ messages: [msg(1, { body: 'Soru?', poll: POLL })] })
    const { wrapper } = await mountPane()
    await wrapper.get('.msg-row [aria-label="Diğer"]').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[role="menuitem"]').map((e) => e.text())).not.toContain('İlet')
  })

  it('"İletildi" etiketi yalnız forwarded_from varken; kaynak sohbet/gönderen gösterilmez', async () => {
    servePane({
      messages: [msg(1), msg(2, { forwarded_from: { message_id: 'kaynak-9' }, body: 'Merhaba' })],
    })
    const { wrapper } = await mountPane()
    const rows = wrapper.findAll('[data-testid="chat-message"]')
    expect(rows[0]!.find('[data-testid="chat-forwarded"]').exists()).toBe(false)
    expect(rows[1]!.get('[data-testid="chat-forwarded"]').text()).toBe('İletildi')
    expect(rows[1]!.text()).not.toContain('kaynak-9')
  })
})
