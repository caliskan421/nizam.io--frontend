import { expect, it } from 'vitest'
import type { MeetingDetail } from '../../model/types'
import { departmentOrder } from './department-order'
it('puts the actual owner first without duplicating it', () => {
  const meeting = {
    owner_department_id: 'b',
    departments: [{ department_id: 'a' }, { department_id: 'b' }],
  } as MeetingDetail
  expect(departmentOrder(meeting)).toEqual(['b', 'a'])
  expect(departmentOrder(null)).toEqual([])
})
