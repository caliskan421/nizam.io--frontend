import { describe, expect, it } from 'vitest'

import { parseStanding } from '@/shared/scope/standing-facts'

import { quickActions } from './quick-actions'

const standing = (companyAdmin: boolean, role?: string) =>
  parseStanding(
    { account_id: 'acc-1', email: 'a@b.test', full_name: 'Ayşe', company_admin: companyAdmin },
    {
      departments: role
        ? [
            {
              program_id: 'p1',
              program_name: 'Bir',
              department_id: 'd1',
              display_name: 'Birim',
              role,
            },
          ]
        : [],
    },
  )

describe('hızlı işlemler (E-01-08…12)', () => {
  it('yönetici: yeni görev canlı; toplantı F4, davet F2 devre dışı; rapor yok', () => {
    expect(quickActions(standing(true), 'p1')).toEqual([
      { key: 'newTask', icon: 'plus', phase: null },
      { key: 'meeting', icon: 'meetings', phase: 'F4' },
      { key: 'invite', icon: 'user-plus', phase: 'F2' },
    ])
  })

  it('koordinatör: üç kutucuk', () => {
    expect(quickActions(standing(false, 'koordinator'), 'p1').map((a) => a.key)).toEqual([
      'newTask',
      'meeting',
      'invite',
    ])
  })

  it('salt üye: hiçbiri; olgu yoksa hiçbiri', () => {
    expect(quickActions(standing(false, 'uye'), 'p1')).toEqual([])
    expect(quickActions(null, 'p1')).toEqual([])
  })
})
