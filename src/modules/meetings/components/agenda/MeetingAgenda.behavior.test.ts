import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import { expect, it, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import type { MeetingDetail } from '../../model/types'
import MeetingAgenda from './MeetingAgenda.vue'

const actor = vi.hoisted(() => ({ admin: true }))
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({ accountId: 'a', companyAdmin: actor.admin, rows: [] })),
  }),
}))
const meeting = {
  meeting_id: 'm',
  program_id: 'p',
  invite_mode: 'person',
  owner_department_id: 'd',
  departments: [{ department_id: 'd', department_name: 'Birim' }],
  created_by_account_id: 'a',
  members_included: false,
  viewer_role: 'member',
  participants: [{ account_id: 'a', full_name: 'Ada Yılmaz' }],
  agenda: [
    {
      agenda_item_id: 'i',
      meeting_id: 'm',
      title: 'Karar',
      is_checked: true,
      checked_by_account_id: 'a',
      checked_at: '2026-10-21T11:00:00Z',
      created_at: '2026-10-21T10:00:00Z',
      sort_order: 1,
    },
  ],
} as MeetingDetail
function setup(admin: boolean) {
  actor.admin = admin
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  return mount(MeetingAgenda, {
    props: { meeting },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
    attachTo: document.body,
  })
}
it('shows progress and resolves the checker from participants', () => {
  const wrapper = setup(true)
  expect(wrapper.text()).toContain('1 / 1')
  expect(wrapper.text()).toContain('Ada Y.')
  expect(wrapper.find('progress').attributes('value')).toBe('1')
  wrapper.unmount()
})
it('keeps agenda read only for a member', () => {
  const wrapper = setup(false)
  expect(wrapper.get('input[type="checkbox"]').attributes('disabled')).toBeDefined()
  expect(wrapper.find('form').exists()).toBe(false)
  wrapper.unmount()
})
it('returns focus to the menu trigger on Escape', async () => {
  const wrapper = setup(true)
  const trigger = wrapper.get('button[aria-label="Karar işlemleri"]')
  await trigger.trigger('click')
  expect(trigger.attributes('aria-expanded')).toBe('true')
  await wrapper.get('[role="menu"]').trigger('keydown.esc')
  expect(trigger.attributes('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(trigger.element)
  wrapper.unmount()
})
