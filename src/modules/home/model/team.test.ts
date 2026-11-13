import { describe, expect, it } from 'vitest'

import { dashboard } from '../__tests__/harness'
import { ROLE_CARDS, teamFacts } from './team'

describe('ekip şeridi türetimi (E-01-19/20/39)', () => {
  const facts = teamFacts(dashboard({ total_users: 18, total_admins: 2, total_coordinators: 15 }))

  it('sayılar pano alanlarıdır; toplam istemcide hesaplanmaz (roller toplamı kullanıcıyı aşabilir)', () => {
    expect(facts).toEqual({
      users: 18,
      coordinatorships: 11,
      admins: 2,
      coordinators: 15,
      members: 30,
    })
    expect(facts.admins + facts.coordinators + facts.members).toBeGreaterThan(facts.users)
  })

  it('rol kartları 05 rol sekmelerine eşlenir (Admin → Koordinatör → Üye)', () => {
    expect(ROLE_CARDS.map((r) => [r.key, r.tab, r.count(facts)])).toEqual([
      ['admin', 'admin', 2],
      ['coordinator', 'koordinator', 15],
      ['member', 'uye', 30],
    ])
  })
})
