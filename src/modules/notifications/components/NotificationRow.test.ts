import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import NotificationRow from './NotificationRow.vue'
import type { NotificationItem } from '../model/types'

const NOW = new Date('2026-11-14T09:00:00Z')
const TZ = 'Europe/Istanbul'

function item(over: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'n1',
    type: 'work.item.created',
    subject_ref: { kind: 'work_item', id: 'w-1' },
    is_read: false,
    created_at: '2026-11-14T08:55:00Z',
    ...over,
  }
}

function mountRow(over: Partial<NotificationItem> = {}, pending = false) {
  return mount(NotificationRow, {
    props: { item: item(over), group: 'today', now: NOW, timeZone: TZ, pending },
  })
}

describe('NotificationRow', () => {
  it('sözlükten cümle + etiket + göreli zaman; aktör/başlık yok', () => {
    const wrapper = mountRow()
    expect(wrapper.get('.nb-tx__text').text()).toBe('Yeni görev oluşturuldu')
    expect(wrapper.get('.nb-meta').text()).toContain('Görev')
    expect(wrapper.get('time').text()).toBe('5 dk')
    expect(wrapper.get('time').attributes('title')).toBe('14.11.2026 11:55')
    expect(wrapper.get('time').attributes('datetime')).toBe('2026-11-14T08:55:00Z')
  })

  it('okunmamış: nokta (erişim adı "okunmamış") + okundu düğmesi; okunmuş: ikisi de yok', () => {
    const unread = mountRow()
    expect(unread.attributes('data-unread')).toBe('true')
    expect(unread.get('.nb-un').attributes('aria-label')).toBe('okunmamış')
    expect(unread.get('.nb-hov button').attributes('aria-label')).toBe('Okundu say')
    const read = mountRow({ is_read: true })
    expect(read.attributes('data-unread')).toBe('false')
    expect(read.find('.nb-un').exists()).toBe(false)
    expect(read.find('.nb-hov').exists()).toBe(false)
  })

  it('satır tıklaması activate; okundu düğmesi satırı açmaz (yalnız markRead)', async () => {
    const wrapper = mountRow()
    await wrapper.get('.nb-it__main').trigger('click')
    expect(wrapper.emitted('activate')).toHaveLength(1)
    await wrapper.get('.nb-hov button').trigger('click')
    expect(wrapper.emitted('markRead')).toHaveLength(1)
    expect(wrapper.emitted('activate')).toHaveLength(1)
  })

  it('okundu yazması sürerken düğme aria-busy + devre dışı, satır aria-busy', () => {
    const wrapper = mountRow({}, true)
    const button = wrapper.get('.nb-hov button')
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('tarih talebi: "İncele" canlı; Onayla/Reddet devre dışı + BE-146 stub', async () => {
    const wrapper = mountRow({ type: 'work.date_change.requested' })
    const buttons = wrapper.findAll('.nb-acts button')
    expect(buttons.map((b) => b.text())).toEqual(['İncele', 'Onayla', 'Reddet'])
    expect(buttons[0]!.attributes('disabled')).toBeUndefined()
    expect(buttons[1]!.attributes('disabled')).toBeDefined()
    expect(buttons[2]!.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-design-stub="BE-146"]').exists()).toBe(true)
    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('activate')).toHaveLength(1)
  })

  it('toplantı: "Gündemi aç" canlı, stub yok; diğer türlerde eylem yok', async () => {
    const meeting = mountRow({
      type: 'collaboration.meeting.created',
      subject_ref: { kind: 'meeting', id: 'm-1' },
    })
    expect(meeting.findAll('.nb-acts button').map((b) => b.text())).toEqual(['Gündemi aç'])
    expect(meeting.find('[data-design-stub]').exists()).toBe(false)
    await meeting.get('.nb-acts button').trigger('click')
    expect(meeting.emitted('activate')).toHaveLength(1)
    expect(mountRow().find('.nb-acts').exists()).toBe(false)
  })

  it('hedefi olmayan satır (membership) gezinmez işaretlenir; bilinmeyen tür genel satır', () => {
    const membership = mountRow({
      type: 'organization.membership.assigned',
      subject_ref: { kind: 'membership', id: 'x' },
    })
    expect(membership.attributes('data-navigable')).toBe('false')
    const unknown = mountRow({ type: 'yeni.olay', subject_ref: { kind: 'baska', id: 'x' } })
    expect(unknown.get('.nb-tx__text').text()).toBe('Yeni bildirim')
    expect(unknown.get('.nb-meta').text()).toContain('Bildirim')
    expect(unknown.attributes('data-navigable')).toBe('false')
    expect(mountRow().attributes('data-navigable')).toBe('true')
  })

  it('dün/eski grupta zaman SS:dd / GG.AA SS:dd', () => {
    const yesterday = mount(NotificationRow, {
      props: {
        item: item({ created_at: '2026-11-13T20:05:00Z' }),
        group: 'yesterday',
        now: NOW,
        timeZone: TZ,
        pending: false,
      },
    })
    expect(yesterday.get('time').text()).toBe('23:05')
  })
})
