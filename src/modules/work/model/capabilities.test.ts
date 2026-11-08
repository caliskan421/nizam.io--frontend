import { describe, expect, it } from 'vitest'

import type { ScopeLens } from '@/shared/scope/scope'
import type { Standing } from '@/shared/scope/standing-facts'

import {
  canCreateWorkItem,
  coordinatorDepartmentIds,
  isSelf,
  subtaskAssigneeFact,
  WORK_CAPABILITIES,
  WORK_CAPABILITY_SOURCES,
  workActorFacts,
  type WorkActionContext,
  type WorkCapability,
} from './capabilities'

// istemci-akislari.md §4 tablosu (pin v0.11.0-api, s.139–s.152), olgu birleşimleri üzerinden:
// Y = yönetici (company_admin), K = koordinatör (görevin departmanında, seçili programda),
// U = üye satırı, A = göreve atanmış, W = kaydın yazarı/yükleyeni, S = alt görev kendisine,
// N = alt görev atamasız, P = bekleyen tarih talebi var.
type Flag = 'Y' | 'K' | 'U' | 'A' | 'W' | 'S' | 'N' | 'P'

function ctx(...flags: Flag[]): WorkActionContext {
  const has = (f: Flag) => flags.includes(f)
  return {
    companyAdmin: has('Y'),
    coordinator: has('K'),
    member: has('U'),
    assigned: has('A'),
    author: has('W'),
    uploader: has('W'),
    subtaskAssignee: has('S') ? 'me' : has('N') ? 'none' : 'other',
    pendingDateRequest: has('P'),
  }
}

const ALL = Object.keys(WORK_CAPABILITIES) as WorkCapability[]

// Satır: olgular → görünür eylemler (listede olmayan her eylem GİZLİ beklenir).
const TABLE: ReadonlyArray<[string, WorkActionContext, WorkCapability[]]> = [
  ['hiçbiri', ctx(), []],
  [
    'yalnız yönetici',
    ctx('Y'),
    ['manageItem', 'readNotes', 'manageSubtasks', 'renameFile', 'reviewDateChange'],
  ],
  [
    'yönetici + atanmış, ekip satırı yok',
    ctx('Y', 'A', 'W'),
    ['manageItem', 'readNotes', 'manageSubtasks', 'renameFile', 'reviewDateChange'],
  ],
  [
    'koordinatör (atanmamış)',
    ctx('K'),
    [
      'manageItem',
      'manageAssignments',
      'transition',
      'readNotes',
      'writeNote',
      'manageSubtasks',
      'toggleSubtask',
      'uploadFile',
      'renameFile',
      'requestDateChange',
    ],
  ],
  [
    'koordinatör + bekleyen talep (s.151 gizli)',
    ctx('K', 'P'),
    [
      'manageItem',
      'manageAssignments',
      'transition',
      'readNotes',
      'writeNote',
      'manageSubtasks',
      'toggleSubtask',
      'uploadFile',
      'renameFile',
    ],
  ],
  [
    'koordinatör + atanmış + yazar/yükleyen',
    ctx('K', 'A', 'W'),
    [
      'manageItem',
      'manageAssignments',
      'transition',
      'ownStatus',
      'readNotes',
      'writeNote',
      'editOwnNote',
      'manageSubtasks',
      'toggleSubtask',
      'uploadFile',
      'renameFile',
      'deleteFile',
      'requestDateChange',
    ],
  ],
  ['üye (atanmamış)', ctx('U'), []],
  ['üye (atanmamış) + yazar/yükleyen', ctx('U', 'W'), ['editOwnNote', 'renameFile', 'deleteFile']],
  [
    'atanmış üye, alt görev başkasında',
    ctx('U', 'A'),
    ['transition', 'ownStatus', 'readNotes', 'writeNote', 'uploadFile'],
  ],
  [
    'atanmış üye, alt görev kendisine',
    ctx('U', 'A', 'S'),
    ['transition', 'ownStatus', 'readNotes', 'writeNote', 'toggleSubtask', 'uploadFile'],
  ],
  [
    'atanmış üye, alt görev atamasız',
    ctx('U', 'A', 'N'),
    ['transition', 'ownStatus', 'readNotes', 'writeNote', 'toggleSubtask', 'uploadFile'],
  ],
  [
    'yönetici + koordinatör (not/dosya yükleme: yöneticilik baskın)',
    ctx('Y', 'K'),
    [
      'manageItem',
      'manageAssignments',
      'transition',
      'readNotes',
      'manageSubtasks',
      'toggleSubtask',
      'renameFile',
      'requestDateChange',
      'reviewDateChange',
    ],
  ],
  [
    'yönetici + atanmış üye + yazar (yöneticilik baskın)',
    ctx('Y', 'U', 'A', 'W'),
    [
      'manageItem',
      'transition',
      'ownStatus',
      'readNotes',
      'editOwnNote',
      'manageSubtasks',
      'renameFile',
      'deleteFile',
      'reviewDateChange',
    ],
  ],
]

describe('work capabilities (istemci-akislari §4 s.139–s.152)', () => {
  it.each(TABLE)('%s', (_name, facts, visible) => {
    for (const capability of ALL) {
      expect(WORK_CAPABILITIES[capability](facts), capability).toBe(visible.includes(capability))
    }
  })

  it('her işlemin §4 kaynak satırı yazılı', () => {
    for (const key of ALL) {
      expect(WORK_CAPABILITY_SOURCES[key]).toMatch(/istemci-akislari §4 s\.1(39|4\d|5[0-2])/)
    }
  })

  it('kayıt olgusu verilmezse en dar güvenli davranış (gizli)', () => {
    const bare = { companyAdmin: false, coordinator: false, member: true, assigned: true }
    expect(WORK_CAPABILITIES.toggleSubtask(bare)).toBe(false)
    expect(WORK_CAPABILITIES.editOwnNote(bare)).toBe(false)
    expect(WORK_CAPABILITIES.deleteFile(bare)).toBe(false)
  })
})

// --- Olgular: mercek × rol × company_admin (P1) -------------------------------------------

function standing(companyAdmin: boolean, rows: Array<['koordinator' | 'uye', string]>): Standing {
  return {
    accountId: 'me',
    fullName: 'Ben',
    email: 'ben@example.test',
    companyAdmin,
    rows: rows.map(([role, departmentId]) => ({
      programId: 'p1',
      programName: 'P',
      departmentId,
      displayName: departmentId,
      role: role === 'koordinator' ? 'coordinator' : 'member',
    })),
  }
}

const item = { department_id: 'd1', assignee_account_ids: ['me'] }
const LENSES: ScopeLens[] = ['admin', 'coordinator', 'member']

describe('workActorFacts — mercekten bağımsız (P1, ortak-kurallar §1)', () => {
  it.each([
    ['yönetici, satırsız', standing(true, []), { companyAdmin: true, coordinator: false }],
    [
      'yönetici + d1 koordinatörü',
      standing(true, [['koordinator', 'd1']]),
      { companyAdmin: true, coordinator: true },
    ],
    [
      'başka departmanın koordinatörü',
      standing(false, [['koordinator', 'd2']]),
      { companyAdmin: false, coordinator: false },
    ],
    [
      'd1 üyesi',
      standing(false, [['uye', 'd1']]),
      { companyAdmin: false, member: true, assigned: true },
    ],
  ] as const)('%s', (_name, st, expected) => {
    // Mercek girdi değildir: her mercekte aynı olgular ve aynı görünürlük.
    const results = LENSES.map(() => workActorFacts(st, 'p1', item))
    for (const facts of results) expect(facts).toMatchObject(expected)
    const visible = results.map((facts) => ALL.filter((c) => WORK_CAPABILITIES[c](facts)))
    expect(new Set(visible.map((v) => v.join()))).toHaveProperty('size', 1)
  })

  it('yönetici Koordinatör merceğinde de görev yönetir; not yazamaz (s.144 baskın)', () => {
    const facts = workActorFacts(standing(true, [['koordinator', 'd1']]), 'p1', item)
    expect(WORK_CAPABILITIES.manageItem(facts)).toBe(true)
    expect(WORK_CAPABILITIES.writeNote(facts)).toBe(false)
    expect(WORK_CAPABILITIES.uploadFile(facts)).toBe(false)
  })

  it('standing yoksa her olgu false; başka programın satırı yetki vermez', () => {
    expect(workActorFacts(null, 'p1', item)).toEqual({
      companyAdmin: false,
      coordinator: false,
      member: false,
      assigned: false,
    })
    expect(workActorFacts(standing(false, [['koordinator', 'd1']]), 'p2', item).coordinator).toBe(
      false,
    )
  })
})

describe('kayıt olguları ve yeni görev', () => {
  it('isSelf / subtaskAssigneeFact', () => {
    const st = standing(false, [])
    expect(isSelf(st, 'me')).toBe(true)
    expect(isSelf(st, 'other')).toBe(false)
    expect(isSelf(null, 'me')).toBe(false)
    expect(subtaskAssigneeFact(st, undefined)).toBe('none')
    expect(subtaskAssigneeFact(st, '')).toBe('none')
    expect(subtaskAssigneeFact(st, 'me')).toBe('me')
    expect(subtaskAssigneeFact(st, 'x')).toBe('other')
  })

  it('Yeni görev (E-03-06, s.139): yönetici ya da programda koordinatör', () => {
    expect(canCreateWorkItem(standing(true, []), 'p1')).toBe(true)
    expect(canCreateWorkItem(standing(false, [['koordinator', 'd1']]), 'p1')).toBe(true)
    expect(canCreateWorkItem(standing(false, [['uye', 'd1']]), 'p1')).toBe(false)
    expect(canCreateWorkItem(standing(false, [['koordinator', 'd1']]), 'p2')).toBe(false)
    expect(canCreateWorkItem(null, 'p1')).toBe(false)
    expect(canCreateWorkItem(standing(true, []), null)).toBe(false)
    expect([
      ...coordinatorDepartmentIds(
        standing(false, [
          ['koordinator', 'd1'],
          ['uye', 'd2'],
          ['koordinator', 'd3'],
        ]),
        'p1',
      ),
    ]).toEqual(['d1', 'd3'])
  })
})
