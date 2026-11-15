import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  makeTaskPriorityDistribution,
  makeTaskStatusDistribution,
} from '@/shared/api/__tests__/defaults'
import type { components } from '@/shared/api/schema'

import {
  distribution,
  SEASON_PRIORITIES,
  SEASON_STATUSES,
  type SeasonPriority,
  type SeasonStatus,
} from './season-view'

type Schemas = components['schemas']

describe('K-3: dağılım şemaları kapalı (pin v0.23.0-api)', () => {
  it('satır anahtarları şemanın anahtar kümesiyle birebir (derleme + çalışma zamanı)', () => {
    expectTypeOf<SeasonStatus>().toEqualTypeOf<keyof Schemas['TaskStatusDistribution']>()
    expectTypeOf<SeasonPriority>().toEqualTypeOf<keyof Schemas['TaskPriorityDistribution']>()
    expect([...SEASON_STATUSES].sort()).toEqual(Object.keys(makeTaskStatusDistribution()).sort())
    expect([...SEASON_PRIORITIES].sort()).toEqual(
      Object.keys(makeTaskPriorityDistribution()).sort(),
    )
  })

  it('tam şema: sayılar ve genişlikler pin öncesi `{}` kısmi gövdeyle aynı sonucu verir', () => {
    const full = distribution(
      SEASON_STATUSES,
      makeTaskStatusDistribution({ baslanmadi: 1, tamamlandi: 3 }),
    )
    const partial = distribution(SEASON_STATUSES, { baslanmadi: 1, tamamlandi: 3 })
    expect(full).toEqual(partial)
    expect(full.total).toBe(4)
    expect(full.rows.map((r) => [r.key, r.count])).toEqual([
      ['baslanmadi', 1],
      ['devam_ediyor', 0],
      ['onaya_sunuldu', 0],
      ['iade_edildi', 0],
      ['tamamlandi', 3],
    ])
  })

  it('sıfır zarf (tam şema, hepsi 0) boş dağılımla aynıdır; eksik anahtar sıfır sayılır', () => {
    expect(distribution(SEASON_PRIORITIES, makeTaskPriorityDistribution())).toEqual(
      distribution(SEASON_PRIORITIES, {}),
    )
    expect(distribution(SEASON_PRIORITIES, {}).total).toBe(0)
  })
})
