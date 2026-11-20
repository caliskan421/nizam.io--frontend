import { expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  createFakeLifecycle,
  defaultState,
  mountWithScope,
  sideContext,
  STANDING,
} from '@/app/shell/side/__tests__/fake-lifecycle'
import type * as AuditPublic from '@/modules/audit/public'
import type { StandingRow } from '@/shared/scope/standing-facts'

import ProfilePage from './ProfilePage.vue'

vi.mock('./PushPreferences.vue', () => ({ default: { template: '<p>Bildirim tercihleri</p>' } }))
vi.mock('./ProfileAdminSummary.vue', () => ({ default: { template: '<p>Yönetici özeti</p>' } }))
vi.mock('./ProfileMeetings.vue', () => ({ default: { template: '<p>Üye toplantıları</p>' } }))
vi.mock('./ProfileTaskQueue.vue', () => ({
  default: {
    props: ['account', 'department'],
    template: '<p>Kuyruk {{ account || department }}</p>',
  },
}))
vi.mock('@/modules/audit/public', async (importOriginal) => ({
  ...(await importOriginal<typeof AuditPublic>()),
  AuditFeed: { template: '<p>İşlem özeti</p>' },
}))
vi.mock('@/app/password/ForcePasswordChange.vue', () => ({
  default: { template: '<p>Parola</p>' },
}))

const rows: StandingRow[] = [
  {
    programId: 'p1',
    programName: 'Bir',
    departmentId: 'd1',
    displayName: 'Lojistik',
    role: 'coordinator',
  },
  {
    programId: 'p2',
    programName: 'İki',
    departmentId: 'd2',
    displayName: 'İletişim',
    role: 'member',
  },
]

it('seçili program üyeliklerine ve doğrulanmış rol olgularına göre ilgili özeti açar', async () => {
  const context = await sideContext()
  const programs = defaultState().programs
  const { state, lifecycle, store } = createFakeLifecycle({
    standing: { ...STANDING, rows },
    programs: [...programs, { ...programs[0]!, programId: 'p2', name: 'Program İki' }],
    departments: [{ departmentId: 'd1', displayName: 'Lojistik' }],
    departmentsTruncated: true,
  })
  store.setProgram('p1')
  store.setLens('admin')
  const wrapper = mountWithScope(context, lifecycle, ProfilePage)
  try {
    const membership = '[aria-labelledby="profile-roles-title"]'
    expect(wrapper.get(membership).text()).toContain('Lojistik')
    expect(wrapper.get(membership).text()).not.toContain('İletişim')
    expect(wrapper.get(membership).text()).toContain('Üyelik yanıtı sınırlı')
    expect(wrapper.text()).toContain('Yönetici özeti')

    state.standing = { ...STANDING, rows, companyAdmin: false }
    await nextTick()
    expect(wrapper.text()).not.toContain('Yönetici özeti')
    expect(wrapper.text()).not.toContain('Kuyruk')

    store.setLens('coordinator')
    store.setDepartment('d1')
    await nextTick()
    expect(wrapper.text()).not.toContain('Kuyruk d1')
    state.facts = { companyAdmin: false, coordinator: true, member: false }
    await nextTick()
    expect(wrapper.text()).toContain('Kuyruk d1')
    expect(wrapper.text()).not.toContain('Üye toplantıları')

    store.setProgram('p2')
    store.setLens('member')
    store.setDepartment('d2')
    state.facts = { companyAdmin: false, coordinator: false, member: true }
    state.departmentsTruncated = false
    await nextTick()
    expect(wrapper.get(membership).text()).toContain('İletişim')
    expect(wrapper.get(membership).text()).not.toContain('Lojistik')
    expect(wrapper.text()).toContain('Kuyruk acc-1')
    expect(wrapper.text()).toContain('Üye toplantıları')
    expect(wrapper.text()).not.toContain('Kuyruk d1')

    state.status = 'selecting'
    await nextTick()
    expect(wrapper.text()).not.toContain('Üye toplantıları')
    expect(wrapper.text()).toContain('Bildirim tercihleri')
  } finally {
    wrapper.unmount()
  }
})
