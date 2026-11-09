import { describe, expect, it } from 'vitest'

import type { Standing } from '@/shared/scope/standing-facts'

import {
  datePolicy,
  dateWriteFor,
  TIMELINE_CAPABILITIES,
  TIMELINE_CAPABILITY_SOURCES,
  timelineActorFacts,
  type DatePolicy,
  type TimelineActionContext,
  type TimelineCapability,
} from './capabilities'
import type { GanttFace } from './types'

// P8 (ortak-kurallar §12) + 03c kabul: yüz × rol × company_admin. Y = company_admin, K = görevin
// departmanında koordinatör, U = üye satırı, P = bekleyen talep, C = tamamlanmış görev.
type Flag = 'Y' | 'K' | 'U' | 'P' | 'C'

function ctx(face: GanttFace, ...flags: Flag[]): TimelineActionContext {
  const has = (f: Flag) => flags.includes(f)
  return {
    face,
    companyAdmin: has('Y'),
    coordinator: has('K'),
    member: has('U'),
    pendingDateRequest: has('P'),
    completed: has('C'),
  }
}

const ALL = Object.keys(TIMELINE_CAPABILITIES) as TimelineCapability[]

// Satır: bağlam → görünür eylemler (listede olmayan her eylem GİZLİ beklenir).
const TABLE: ReadonlyArray<[string, TimelineActionContext, TimelineCapability[]]> = [
  ['hiçbiri, admin yüzü', ctx('admin'), []],
  [
    'Admin (yalnız yönetici), admin yüzü',
    ctx('admin', 'Y'),
    ['dragHandles', 'directDateWrite', 'seeDateRequest', 'manageDependencies', 'readDependencies'],
  ],
  [
    'Admin + bekleyen talep, admin yüzü',
    ctx('admin', 'Y', 'P'),
    [
      'dragHandles',
      'directDateWrite',
      'reviewDateRequest',
      'seeDateRequest',
      'manageDependencies',
      'readDependencies',
    ],
  ],
  [
    'Admin, tamamlanmış görev: tutamaç yok',
    ctx('admin', 'Y', 'C'),
    ['directDateWrite', 'seeDateRequest', 'manageDependencies', 'readDependencies'],
  ],
  [
    'Koordinatör, koordinatör yüzü',
    ctx('coordinator', 'K'),
    [
      'dragHandles',
      'requestDateChange',
      'seeDateRequest',
      'manageDependencies',
      'readDependencies',
    ],
  ],
  [
    'Koordinatör + bekleyen talep: talep gizli',
    ctx('coordinator', 'K', 'P'),
    ['dragHandles', 'seeDateRequest', 'manageDependencies', 'readDependencies'],
  ],
  [
    'Koordinatör, tamamlanmış görev: tutamaç yok',
    ctx('coordinator', 'K', 'C'),
    ['requestDateChange', 'seeDateRequest', 'manageDependencies', 'readDependencies'],
  ],
  // P1: Koordinatör merceğinde şirket yöneticisi yetkisini korur.
  [
    'Admin + Koordinatör (birleşik), koordinatör yüzü',
    ctx('coordinator', 'Y', 'K'),
    [
      'dragHandles',
      'directDateWrite',
      'requestDateChange',
      'seeDateRequest',
      'manageDependencies',
      'readDependencies',
    ],
  ],
  [
    'Admin (koordinatör değil), koordinatör yüzü: yetki korunur, talep açamaz',
    ctx('coordinator', 'Y'),
    ['dragHandles', 'directDateWrite', 'seeDateRequest', 'manageDependencies', 'readDependencies'],
  ],
  [
    'Admin + Koordinatör + bekleyen talep, koordinatör yüzü',
    ctx('coordinator', 'Y', 'K', 'P'),
    [
      'dragHandles',
      'directDateWrite',
      'reviewDateRequest',
      'seeDateRequest',
      'manageDependencies',
      'readDependencies',
    ],
  ],
  ['Üye, üye yüzü: salt okuma', ctx('member', 'U'), []],
  ['Koordinatör merceği olmayan üye yüzü (koordinatör olgusu)', ctx('member', 'K', 'U'), []],
  ['Admin, üye yüzü: tarih/bağımlılık yazımı yok (en dar güvenli)', ctx('member', 'Y'), []],
  ['yetkisiz (satır yok), koordinatör yüzü', ctx('coordinator', 'U'), []],
]

describe('P8 capability tablosu (yüz × rol × company_admin)', () => {
  it.each(TABLE)('%s', (_name, context, visible) => {
    for (const capability of ALL) {
      expect(
        TIMELINE_CAPABILITIES[capability](context),
        `${capability} ${visible.includes(capability) ? 'görünür' : 'gizli'} olmalı`,
      ).toBe(visible.includes(capability))
    }
  })

  it('her eylemin kaynağı (kabul satırı) yazılı', () => {
    expect(Object.keys(TIMELINE_CAPABILITY_SOURCES).sort()).toEqual([...ALL].sort())
  })
})

describe('tarih yazma politikası', () => {
  const policies: ReadonlyArray<[string, TimelineActionContext, DatePolicy]> = [
    ['Koordinatör → talep', ctx('coordinator', 'K'), 'request'],
    ['Admin → doğrudan', ctx('admin', 'Y'), 'direct'],
    [
      'Birleşik, koordinatör yüzünde yönetici yetkisi korunur → doğrudan',
      ctx('coordinator', 'Y', 'K'),
      'direct',
    ],
    ['Üye → yok', ctx('member', 'U'), 'none'],
    ['Üye yüzünde yönetici de yok', ctx('member', 'Y', 'K'), 'none'],
    ['yetkisiz → yok', ctx('coordinator'), 'none'],
  ]
  it.each(policies)('%s', (_name, context, policy) => {
    expect(datePolicy(context)).toBe(policy)
  })

  it('olgular mercekten değil standing satırlarından: görevin departmanındaki satır', () => {
    const standing: Standing = {
      accountId: 'me',
      fullName: 'Ben',
      email: 'ben@x.test',
      companyAdmin: true,
      rows: [
        {
          programId: 'p1',
          programName: 'P',
          departmentId: 'd1',
          displayName: 'D1',
          role: 'coordinator',
        },
        {
          programId: 'p1',
          programName: 'P',
          departmentId: 'd3',
          displayName: 'D3',
          role: 'member',
        },
      ],
    }
    const scope = { programId: 'p1', departmentId: 'd1', lens: 'coordinator' as const }
    expect(timelineActorFacts(standing, scope, 'coordinator', 'd1')).toEqual({
      face: 'coordinator',
      companyAdmin: true,
      coordinator: true,
      member: false,
    })
    expect(timelineActorFacts(standing, scope, 'coordinator', 'd3')).toMatchObject({
      coordinator: false,
      member: true,
    })
    // Standing yokken her olgu false: en dar güvenli davranış.
    expect(timelineActorFacts(null, scope, 'coordinator', 'd1')).toEqual({
      face: 'coordinator',
      companyAdmin: false,
      coordinator: false,
      member: false,
    })
  })
})

describe('bırakma → yazma eşlemesi (P8)', () => {
  const before = { start_on: '2026-11-01', end_on: '2026-11-10' }

  it('Koordinatör: her değişim talep (iki uç da gönderilir)', () => {
    expect(
      dateWriteFor('request', before, { start_on: '2026-11-01', end_on: '2026-11-12' }),
    ).toEqual({
      kind: 'request',
      newStartOn: '2026-11-01',
      newEndOn: '2026-11-12',
    })
    expect(
      dateWriteFor('request', before, { start_on: '2026-10-30', end_on: '2026-11-10' }),
    ).toEqual({
      kind: 'request',
      newStartOn: '2026-10-30',
      newEndOn: '2026-11-10',
    })
  })

  it('Admin: yalnız bitiş ileri 1–90 gün → extendWorkItem', () => {
    expect(
      dateWriteFor('direct', before, { start_on: '2026-11-01', end_on: '2026-11-11' }),
    ).toEqual({
      kind: 'extend',
      days: 1,
    })
    expect(
      dateWriteFor('direct', before, { start_on: '2026-11-01', end_on: '2027-02-08' }),
    ).toEqual({
      kind: 'extend',
      days: 90,
    })
  })

  it('Admin: kısaltma, başlangıç kaydırma, iki uç, 90 günü aşan uzatma → updateWorkItem', () => {
    const update = (after: { start_on: string; end_on: string }) =>
      dateWriteFor('direct', before, after)
    expect(update({ start_on: '2026-11-01', end_on: '2026-11-08' })).toEqual({
      kind: 'update',
      start_on: '2026-11-01',
      end_on: '2026-11-08',
    })
    expect(update({ start_on: '2026-11-03', end_on: '2026-11-10' })?.kind).toBe('update')
    expect(update({ start_on: '2026-11-03', end_on: '2026-11-14' })?.kind).toBe('update')
    expect(update({ start_on: '2026-11-01', end_on: '2027-02-09' })?.kind).toBe('update')
  })

  it('değişim yok, bozuk tarih ya da politika yok → istek yok', () => {
    expect(dateWriteFor('direct', before, before)).toBeNull()
    expect(dateWriteFor('request', before, before)).toBeNull()
    expect(dateWriteFor('direct', before, { start_on: 'x', end_on: '2026-11-11' })).toBeNull()
    expect(
      dateWriteFor('none', before, { start_on: '2026-11-01', end_on: '2026-11-11' }),
    ).toBeNull()
  })
})
