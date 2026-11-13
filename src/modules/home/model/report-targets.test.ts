import { describe, expect, it } from 'vitest'

import { REPORT_TARGETS } from './report-targets'

describe('"Rapor oluştur" hedefleri (E-01-12; P47)', () => {
  it('dört hedef tasarım sırasıyla: 06 Arşiv, 05 Kullanıcılar, 09 Toplantılar, 03 Görevler', () => {
    expect(REPORT_TARGETS.map((t) => [t.key, t.routeName])).toEqual([
      ['season', 'archive.folders'],
      ['workload', 'organization.users'],
      ['meeting', 'collaboration.meetings'],
      ['task', 'work.tasks'],
    ])
  })
})
