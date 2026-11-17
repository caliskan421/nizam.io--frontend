import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { makeNotification } from '@/shared/api/__tests__/defaults'

import NotificationRow from './NotificationRow.vue'
import type { NotificationItem } from '../model/types'

const NOW = new Date('2026-11-14T09:00:00Z')
const TZ = 'Europe/Istanbul'
const AYSE = { account_id: 'a1', full_name: 'Ayşe Kaya' }
const BERK = { account_id: 'b2', full_name: 'Berk Yıldız' }

function item(over: Partial<NotificationItem> = {}): NotificationItem {
  return makeNotification(over)
}

function mountRow(over: Partial<NotificationItem> = {}, pending = false, deciding = false) {
  return mount(NotificationRow, {
    props: {
      item: item(over),
      group: 'today',
      now: NOW,
      timeZone: TZ,
      pending,
      deciding,
      me: 'me-1',
    },
  })
}

describe('NotificationRow', () => {
  it('sözlükten genel cümle + etiket + göreli zaman; aktör yoksa ad uydurulmaz', () => {
    const wrapper = mountRow()
    expect(wrapper.get('.nb-tx__text').text()).toBe('Yeni görev oluşturuldu')
    expect(wrapper.get('.nb-meta').text()).toContain('Görev')
    expect(wrapper.get('time').text()).toBe('5 dk')
    expect(wrapper.get('time').attributes('title')).toBe('14.11.2026 11:55')
    expect(wrapper.get('time').attributes('datetime')).toBe('2026-11-14T08:55:00Z')
    expect(wrapper.find('[data-testid="notification-subject"]').exists()).toBe(false)
  })

  it('aktör + available konu: cümle aktörle, konu başlığı/kodu ikinci satırda', () => {
    const wrapper = mountRow({
      type: 'work.item.transitioned',
      actor: AYSE,
      subject: { state: 'available', title: 'Bütçe', code: 'ALT-3', sequence_no: 3, person: null },
    })
    expect(wrapper.get('.nb-tx__text').text()).toBe('Ayşe Kaya bir görevin durumunu değiştirdi')
    expect(wrapper.get('[data-testid="notification-subject"]').text()).toBe('ALT-3 · Bütçe')
  })

  it('konu forbidden/deleted/unknown: başlık yok; deleted "Bu kayıt silindi"', () => {
    for (const state of ['forbidden', 'unknown'] as const) {
      const w = mountRow({
        subject: { state, title: null, code: null, sequence_no: null, person: null },
      })
      expect(w.find('[data-testid="notification-subject"]').exists()).toBe(false)
    }
    const deleted = mountRow({
      subject: { state: 'deleted', title: null, code: null, sequence_no: null, person: null },
    })
    expect(deleted.get('[data-testid="notification-subject"]').text()).toBe('Bu kayıt silindi')
  })

  it('birleşik grup: yığın avatar (≤5), kayıt sayısı, "ve N kişi" cümlesi', () => {
    const wrapper = mountRow({
      type: 'work.item.date_changed',
      actor: AYSE,
      group: { count: 4, actors: [AYSE, BERK], first_created_at: '2026-11-14T07:00:00Z' },
    })
    expect(wrapper.get('.nb-tx__text').text()).toBe(
      'Ayşe Kaya ve 1 kişi bir görevin tarihini değiştirdi',
    )
    expect(wrapper.findAll('[data-testid="notification-stack"] .rp-av')).toHaveLength(2)
    expect(wrapper.get('.nb-meta').text()).toContain('4 olay')
    expect(mountRow().find('[data-testid="notification-stack"]').exists()).toBe(false)
  })

  it('okunmamış: nokta + okundu düğmesi; okunmuş: nokta ve okundu düğmesi yok, kaldır var', () => {
    const unread = mountRow()
    expect(unread.attributes('data-unread')).toBe('true')
    expect(unread.get('.nb-un').attributes('aria-label')).toBe('okunmamış')
    expect(unread.get('.nb-hov button').attributes('aria-label')).toBe('Okundu say')
    const read = mountRow({ is_read: true })
    expect(read.attributes('data-unread')).toBe('false')
    expect(read.find('.nb-un').exists()).toBe(false)
    expect(read.findAll('.nb-hov button').map((b) => b.attributes('aria-label'))).toEqual([
      'Bu görevi sessize al',
      'Kaldır',
    ])
  })

  it('satır tıklaması activate; hover düğmeleri satırı açmaz (markRead/toggleMute/dismiss)', async () => {
    const wrapper = mountRow()
    await wrapper.get('.nb-it__main').trigger('click')
    expect(wrapper.emitted('activate')).toHaveLength(1)
    await wrapper.get('[aria-label="Okundu say"]').trigger('click')
    await wrapper.get('[data-testid="notification-mute"]').trigger('click')
    await wrapper.get('[data-testid="notification-dismiss"]').trigger('click')
    expect(wrapper.emitted('markRead')).toHaveLength(1)
    expect(wrapper.emitted('toggleMute')).toHaveLength(1)
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    expect(wrapper.emitted('activate')).toHaveLength(1)
  })

  it("sessize alma: kind'a ve muted'a göre etiket; sohbet/üyelik konusunda düğme yok", () => {
    const muteLabel = (over: Partial<NotificationItem>) => {
      const button = mountRow(over).find('[data-testid="notification-mute"]')
      return button.exists() ? button.attributes('aria-label') : undefined
    }
    expect(muteLabel({})).toBe('Bu görevi sessize al')
    expect(muteLabel({ muted: true })).toBe('Bu görevin sessizini kaldır')
    expect(muteLabel({ subject_ref: { kind: 'meeting', id: 'm-1' } })).toBe(
      'Bu toplantıyı sessize al',
    )
    expect(muteLabel({ subject_ref: { kind: 'meeting', id: 'm-1' }, muted: true })).toBe(
      'Bu toplantının sessizini kaldır',
    )
    expect(muteLabel({ subject_ref: { kind: 'chat', id: 'c-1' } })).toBeUndefined()
    expect(muteLabel({ subject_ref: { kind: 'membership', id: 'x' } })).toBeUndefined()
    expect(mountRow({ muted: true }).get('.nb-meta').text()).toContain('Sessize alındı')
  })

  it('yazma sürerken hover düğmeleri aria-busy/devre dışı, satır aria-busy', () => {
    const wrapper = mountRow({}, true)
    const button = wrapper.get('.nb-hov button')
    expect(button.attributes('aria-busy')).toBe('true')
    expect(button.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('toplantı: "Gündemi aç" canlı; diğer türlerde eylem yok', async () => {
    const meeting = mountRow({
      type: 'collaboration.meeting.created',
      subject_ref: { kind: 'meeting', id: 'm-1' },
    })
    expect(meeting.findAll('.nb-acts button').map((b) => b.text())).toEqual(['Gündemi aç'])
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
    expect(
      mountRow({
        subject_ref: { kind: 'chat', id: 'c1' },
        type: 'messaging.message.sent',
      }).attributes('data-navigable'),
    ).toBe('true')
  })

  it('dün/eski grupta zaman SS:dd / GG.AA SS:dd', () => {
    const yesterday = mount(NotificationRow, {
      props: {
        item: item({ created_at: '2026-11-13T20:05:00Z' }),
        group: 'yesterday',
        now: NOW,
        timeZone: TZ,
        pending: false,
        deciding: false,
        me: null,
      },
    })
    expect(yesterday.get('time').text()).toBe('23:05')
  })
})
