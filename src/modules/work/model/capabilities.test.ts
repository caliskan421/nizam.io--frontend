import { describe, expect, it } from 'vitest'

import { WORK_CAPABILITIES, WORK_CAPABILITY_SOURCES, type WorkActorFacts } from './capabilities'

// istemci-akislari.md §4 tablosu (pin v0.11.0-api), olgu birleşimleri üzerinden:
// Y = yönetici, K = koordinatör (görevin departmanında, seçili programda), U = üye satırı,
// A = göreve atanmış. Beklenen sütunlar: manageItem, manageAssignments, transition, writeNote.
const TABLE: ReadonlyArray<[string, WorkActorFacts, [boolean, boolean, boolean, boolean]]> = [
  ['hiçbiri', f(), [false, false, false, false]],
  ['yalnız yönetici', f('Y'), [true, false, false, false]],
  ['yönetici + atanmış (satırsız)', f('Y', 'A'), [true, false, false, false]],
  ['koordinatör', f('K'), [true, true, true, true]],
  ['koordinatör + atanmış', f('K', 'A'), [true, true, true, true]],
  ['üye (atanmamış)', f('U'), [false, false, false, false]],
  ['atanmış üye', f('U', 'A'), [false, false, true, true]],
  ['yönetici + koordinatör (not: yöneticilik baskın)', f('Y', 'K'), [true, true, true, false]],
  [
    'yönetici + atanmış üye (not: yöneticilik baskın)',
    f('Y', 'U', 'A'),
    [true, false, true, false],
  ],
  ['yönetici + üye (atanmamış)', f('Y', 'U'), [true, false, false, false]],
  ['koordinatör + üye + atanmış', f('K', 'U', 'A'), [true, true, true, true]],
]

function f(...flags: Array<'Y' | 'K' | 'U' | 'A'>): WorkActorFacts {
  return {
    companyAdmin: flags.includes('Y'),
    coordinator: flags.includes('K'),
    member: flags.includes('U'),
    assigned: flags.includes('A'),
  }
}

describe('work capabilities (istemci-akislari §4)', () => {
  it.each(TABLE)('%s', (_name, facts, expected) => {
    const { manageItem, manageAssignments, transition, writeNote } = WORK_CAPABILITIES
    expect([
      manageItem(facts),
      manageAssignments(facts),
      transition(facts),
      writeNote(facts),
    ]).toEqual(expected)
  })

  it('her işlemin §4 kaynak satırı yazılı', () => {
    for (const key of Object.keys(WORK_CAPABILITIES)) {
      expect(WORK_CAPABILITY_SOURCES[key as keyof typeof WORK_CAPABILITY_SOURCES]).toMatch(
        /istemci-akislari §4/,
      )
    }
  })
})
