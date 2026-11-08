import { describe, expect, it } from 'vitest'

import type { WorkActorFacts } from './capabilities'
import {
  canCloseSubtasks,
  isValidReason,
  requiresReason,
  TRANSITION_MATRIX,
  transitionActor,
  transitionTargets,
} from './transitions'
import { WORK_ITEM_STATUSES } from './types'

const facts = (over: Partial<WorkActorFacts>): WorkActorFacts => ({
  companyAdmin: false,
  coordinator: false,
  member: false,
  assigned: false,
  ...over,
})

// istemci-akislari §5 tablosu birebir (satır = aktör; hücre = hedefler).
const EXPECTED = {
  member: [
    ['baslanmadi', ['devam_ediyor']],
    ['devam_ediyor', ['onaya_sunuldu']],
    ['onaya_sunuldu', []],
    ['iade_edildi', ['devam_ediyor']],
    ['tamamlandi', []],
  ],
  coordinator: [
    ['baslanmadi', ['devam_ediyor', 'tamamlandi']],
    ['devam_ediyor', ['baslanmadi', 'tamamlandi']],
    ['onaya_sunuldu', ['tamamlandi', 'iade_edildi']],
    ['iade_edildi', ['baslanmadi', 'devam_ediyor', 'tamamlandi']],
    ['tamamlandi', ['devam_ediyor']],
  ],
  own: [
    ['baslanmadi', ['devam_ediyor', 'tamamlandi']],
    ['devam_ediyor', ['baslanmadi', 'onaya_sunuldu', 'tamamlandi']],
    ['onaya_sunuldu', ['tamamlandi', 'iade_edildi']],
    ['iade_edildi', ['baslanmadi', 'devam_ediyor', 'tamamlandi']],
    ['tamamlandi', ['devam_ediyor']],
  ],
} as const

describe('durum geçişi matrisi (istemci-akislari §5)', () => {
  it.each(Object.entries(EXPECTED))('%s satırı', (actor, rows) => {
    const matrix = TRANSITION_MATRIX[actor as keyof typeof TRANSITION_MATRIX]
    expect(Object.keys(matrix)).toEqual([...WORK_ITEM_STATUSES])
    for (const [from, targets] of rows) expect(matrix[from], from).toEqual(targets)
  })

  it('aktör: atanmış koordinatör = kendi görevi; yönetici tek başına aktör değil', () => {
    expect(transitionActor(facts({ coordinator: true, assigned: true }))).toBe('own')
    expect(transitionActor(facts({ coordinator: true }))).toBe('coordinator')
    expect(transitionActor(facts({ member: true, assigned: true }))).toBe('member')
    expect(transitionActor(facts({ member: true }))).toBeNull()
    expect(transitionActor(facts({ companyAdmin: true, assigned: true }))).toBeNull()
  })

  it('hedefler aktör ve mevcut durumdan; aktör değilse boş (salt okunur etiket)', () => {
    expect(transitionTargets(facts({ member: true, assigned: true }), 'devam_ediyor')).toEqual([
      'onaya_sunuldu',
    ])
    expect(transitionTargets(facts({ companyAdmin: true }), 'baslanmadi')).toEqual([])
    // Dönen dizi kopyadır (matris değişmez).
    transitionTargets(facts({ coordinator: true }), 'tamamlandi').push('baslanmadi')
    expect(TRANSITION_MATRIX.coordinator.tamamlandi).toEqual(['devam_ediyor'])
  })

  it('geri alma gerekçesi (≥ 3 bayt) ve close_subtasks yalnız tamamlandi', () => {
    expect(requiresReason('tamamlandi', 'devam_ediyor')).toBe(true)
    expect(requiresReason('devam_ediyor', 'tamamlandi')).toBe(false)
    expect(isValidReason('  ab ')).toBe(false)
    expect(isValidReason('çş')).toBe(true) // 4 bayt
    expect(canCloseSubtasks('tamamlandi')).toBe(true)
    expect(canCloseSubtasks('onaya_sunuldu')).toBe(false)
  })
})
