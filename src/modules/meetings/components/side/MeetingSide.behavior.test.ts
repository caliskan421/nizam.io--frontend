import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { expect, it, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import type { MeetingDetail } from '../../model/types'
import MeetingSide from './MeetingSide.vue'

const actor = vi.hoisted(() => ({ admin: true }))
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({ accountId: 'a', companyAdmin: actor.admin, rows: [] })),
  }),
}))
vi.mock('../../pages/detail/use-departments', () => ({
  useDepartments: () => ref([{ department_id: 'd', code: 'BİR' }]),
}))
const meeting = {
  meeting_id: 'm',
  program_id: 'p',
  invite_mode: 'coordinatorship',
  owner_department_id: 'd',
  departments: [{ department_id: 'd', department_name: 'Birim' }],
  created_by_account_id: 'a',
  created_by_role: 'admin',
  created_at: '2026-10-21T10:00:00Z',
  members_included: false,
  viewer_role: 'admin',
  participants: [{ account_id: 'a', full_name: 'Ada' }],
  conference: { provider: 'LiveKit' },
} as unknown as MeetingDetail
function setup(admin: boolean, value = meeting) {
  actor.admin = admin
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  return mount(MeetingSide, { props: { meeting: value }, global: { plugins: [pinia] } })
}
it('shows department and information without conference provider', async () => {
  const wrapper = setup(true)
  expect(wrapper.text()).toContain('BİR')
  expect(wrapper.text()).toContain('Ada')
  expect(wrapper.text()).not.toContain('LiveKit')
  await wrapper.get('button').trigger('click')
  expect(wrapper.emitted('edit')).toHaveLength(1)
  wrapper.unmount()
})
it('hides editing for coordinators and person meetings and falls back for absent creator', () => {
  const missing = { ...meeting, participants: [], invite_mode: 'person' } as MeetingDetail
  const wrapper = setup(false, missing)
  expect(wrapper.find('button').exists()).toBe(false)
  expect(wrapper.text()).toContain('Bilinmeyen kişi')
  wrapper.unmount()
  const admin = setup(true, missing)
  expect(admin.find('button').exists()).toBe(false)
  admin.unmount()
})
