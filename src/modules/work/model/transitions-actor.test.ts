import { describe, expect, it } from 'vitest'

import type { components } from '@/shared/api/schema'

import type { WorkActorFacts } from './capabilities'
import { SERVER_ACTOR_TO_CLIENT, transitionActor, transitionTargets } from './transitions'
import { WORK_ITEM_STATUSES } from './types'

type ServerActor = components['schemas']['TransitionResult']['actor']

const facts = (over: Partial<WorkActorFacts>): WorkActorFacts => ({
  companyAdmin: false,
  coordinator: false,
  member: false,
  assigned: false,
  ...over,
})

describe('K-1: actor enum + sirket_yoneticisi (pin v0.23.0-api)', () => {
  it('sunucu aktör kümesi tam eşlenir (yeni değer derlemeyi ve bu testi kırar)', () => {
    const all: ServerActor[] = [
      'uye',
      'koordinator',
      'koordinator_kendi_gorevi',
      'sirket_yoneticisi',
    ]
    expect(Object.keys(SERVER_ACTOR_TO_CLIENT).sort()).toEqual([...all].sort())
    expect(SERVER_ACTOR_TO_CLIENT).toEqual({
      uye: 'member',
      koordinator: 'coordinator',
      koordinator_kendi_gorevi: 'own',
      sirket_yoneticisi: null,
    })
  })

  it('pin öncesi davranış korunur: şirket yöneticisi tek başına aktör değildir', () => {
    const admin = facts({ companyAdmin: true })
    expect(transitionActor(admin)).toBeNull()
    for (const from of WORK_ITEM_STATUSES) expect(transitionTargets(admin, from)).toEqual([])
    // Yönetici + atanmış üye: üye matrisi (yöneticilik hedef eklemez).
    const adminAssigned = facts({ companyAdmin: true, member: true, assigned: true })
    expect(transitionActor(adminAssigned)).toBe('member')
  })

  it('istemci aktörleri aynı kalır: koordinatör / kendi görevi / üye', () => {
    expect(transitionActor(facts({ coordinator: true }))).toBe('coordinator')
    expect(transitionActor(facts({ coordinator: true, assigned: true }))).toBe('own')
    expect(transitionActor(facts({ member: true, assigned: true }))).toBe('member')
    expect(transitionActor(facts({ member: true }))).toBeNull()
  })
})
