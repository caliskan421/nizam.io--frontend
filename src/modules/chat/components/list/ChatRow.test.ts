import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { makeChatLastMessage, makeChatSummary } from '@/shared/api/__tests__/defaults'

import type { ChatSummary } from '../../model/types'
import { ICONS } from '@/shared/ui/icons'

import ChatRow from './ChatRow.vue'

const base: ChatSummary = makeChatSummary({ created_at: '2026-11-01T08:00:00Z' })
const NOW = new Date('2026-11-14T12:00:00Z')

function mountRow(over: Partial<ChatSummary> = {}, selected = false) {
  return mount(ChatRow, {
    props: {
      chat: { ...base, ...over },
      selected,
      meAccountId: 'u1',
      now: NOW,
      timeZone: 'Europe/Istanbul',
    },
  })
}

describe('ChatRow', () => {
  it('tek button; seçili değilse aria-current yok, seçiliyse "true"', () => {
    expect(mountRow().element.tagName).toBe('BUTTON')
    expect(mountRow().attributes('aria-current')).toBeUndefined()
    expect(mountRow({}, true).attributes('aria-current')).toBe('true')
  })

  it('son mesaj yoksa zaman ve önizleme boş (sahte metin yok)', () => {
    const wrapper = mountRow()
    expect(wrapper.find('.chat-row__time').exists()).toBe(false)
    expect(wrapper.get('.chat-row__prev').text()).toBe('')
  })

  it('okunmamışta önizleme kalın sınıfı; rozet yoksa gizli; yalnız bahsetme de "@" gösterir', () => {
    expect(mountRow().classes()).not.toContain('chat-row--unread')
    expect(mountRow().find('.chat-row__badge').exists()).toBe(false)
    expect(mountRow({ unread_count: 4 }).classes()).toContain('chat-row--unread')
    expect(mountRow({ mentioned: true }).get('.chat-row__badge').text()).toBe('@')
  })

  it('tık kimliği yayar; avatar erişim adına girmez', async () => {
    const wrapper = mountRow()
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['c1']])
    expect(wrapper.get('.chat-av').attributes('aria-hidden')).toBe('true')
  })

  it('sessiz rozeti notify_level none iken görünür; okunmamış sayacı seviyeden bağımsız aynen kalır (BE-027)', () => {
    const muted = mountRow({ notify_level: 'none', unread_count: 4 })
    expect(muted.find('[data-testid="chat-row-muted"]').attributes('aria-label')).toBe(
      'Bildirimler kapalı',
    )
    expect(muted.get('.chat-row__badge').text()).toBe('4')
    const d = muted.get('[data-testid="chat-row-muted"] path').attributes('d')
    expect(d).toBe(ICONS['bell-off'])
    expect(d).not.toBe(ICONS.bell)
    expect(
      mountRow({ notify_level: 'mentions' }).find('[data-testid="chat-row-muted"]').exists(),
    ).toBe(false)
    expect(mountRow().find('[data-testid="chat-row-muted"]').exists()).toBe(false)
  })

  it('birebirde son mesajım: okundu tiki peer_read_seq`ten; grupta tik yok', () => {
    const mine = makeChatLastMessage({ sender_account_id: 'u1', seq: 5, body: 'selam' })
    const dm = { kind: 'direct' as const, name: null, counterpart_name: 'Ayşe', last_message: mine }
    const read = mountRow({ ...dm, peer_read_seq: 5 }).get('[data-testid="chat-row-tick"]')
    expect(read.attributes('aria-label')).toBe('Okundu')
    expect(read.classes()).toContain('chat-row__tick--read')
    expect(
      mountRow({ ...dm, peer_read_seq: 4 })
        .get('[data-testid="chat-row-tick"]')
        .attributes('aria-label'),
    ).toBe('Gönderildi')
    expect(
      mountRow({ ...dm, kind: 'group', peer_read_seq: 5 })
        .find('[data-testid="chat-row-tick"]')
        .exists(),
    ).toBe(false)
  })

  it('Koordinatörler sistem grubu: "K" sistem avatarı ve iğne', () => {
    const wrapper = mountRow({
      auto_kind: 'coordinators',
      source: 'coordinators',
      name: 'Koordinatörler',
    })
    expect(wrapper.get('.chat-av').text()).toBe('K')
    expect(wrapper.get('.chat-av').classes()).toContain('chat-av--sys')
    expect(wrapper.find('.chat-row__pin').exists()).toBe(true)
  })
})
