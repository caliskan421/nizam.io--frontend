import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import { expect, it, vi } from 'vitest'
import { useScopeStore } from '@/shared/scope/store'
import type { MeetingDetail } from '../../model/types'
import { useMeetingAccess } from './use-meeting-access'
vi.mock('@/shared/scope/standing', () => ({
  useStanding: () => ({
    standing: computed(() => ({ accountId: 'a', companyAdmin: true, rows: [] })),
  }),
}))
it('derives management from standing and the meeting facts', () => {
  setActivePinia(createPinia())
  useScopeStore().commit({ programId: 'p', departmentId: null, lens: 'admin' })
  const meeting = {
    invite_mode: 'person',
    owner_department_id: 'd',
    departments: [],
    created_by_account_id: 'a',
    members_included: false,
    participants: [],
    viewer_role: 'admin',
  } as MeetingDetail
  expect(useMeetingAccess(meeting).value).toBe(true)
  expect(useMeetingAccess(undefined).value).toBe(false)
})
