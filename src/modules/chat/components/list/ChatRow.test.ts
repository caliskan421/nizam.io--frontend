import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { makeChatSummary } from '@/shared/api/__tests__/defaults'

import type { ChatSummary } from '../../model/types'
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
})
