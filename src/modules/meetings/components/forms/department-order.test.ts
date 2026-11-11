import { expect, it } from 'vitest'
import type { MeetingDetail } from '../../model/types'
import { departmentOrder, toggleDepartment } from './department-order'
it('puts the actual owner first without duplicating it', () => {
  const meeting = {
    owner_department_id: 'b',
    departments: [{ department_id: 'a' }, { department_id: 'b' }],
  } as MeetingDetail
  expect(departmentOrder(meeting)).toEqual(['b', 'a'])
  expect(departmentOrder(null)).toEqual([])
})

it('keeps a single person owner and coordinator ordering', () => {
  expect(toggleDepartment('person', ['a'], 'b')).toEqual(['b'])
  expect(toggleDepartment('coordinatorship', ['a'], 'b')).toEqual(['a', 'b'])
  expect(toggleDepartment('coordinatorship', ['a', 'b'], 'a')).toEqual(['b'])
})
