import { describe, expect, it } from 'vitest'

import { assignedSubset, isAssignedTo, lensAssignee } from './assignment'

const mine = { id: 'a', assignee_account_ids: ['acc-1', 'acc-2'] }
const theirs = { id: 'b', assignee_account_ids: ['acc-2'] }
const nobody = { id: 'c', assignee_account_ids: [] as string[] }

describe('assignment (Üye merceği "bana atananlar")', () => {
  it('isAssignedTo: çoklu atananlar içinde hesap aranır', () => {
    expect(isAssignedTo(mine, 'acc-1')).toBe(true)
    expect(isAssignedTo(theirs, 'acc-1')).toBe(false)
    expect(isAssignedTo(nobody, 'acc-1')).toBe(false)
  })

  it('lensAssignee: yalnız Üye merceğinde hesap; diğer mercekler ve hesapsız durumda null', () => {
    expect(lensAssignee('member', 'acc-1')).toBe('acc-1')
    expect(lensAssignee('coordinator', 'acc-1')).toBeNull()
    expect(lensAssignee('admin', 'acc-1')).toBeNull()
    expect(lensAssignee(null, 'acc-1')).toBeNull()
    expect(lensAssignee('member', null)).toBeNull()
    expect(lensAssignee('member', undefined)).toBeNull()
  })

  it('assignedSubset: atanan verilirse daraltır, null ise aynı kümeyi döndürür', () => {
    const all = [mine, theirs, nobody]
    expect(assignedSubset(all, 'acc-1').map((i) => i.id)).toEqual(['a'])
    expect(assignedSubset(all, 'acc-2').map((i) => i.id)).toEqual(['a', 'b'])
    expect(assignedSubset(all, null)).toBe(all)
  })
})
