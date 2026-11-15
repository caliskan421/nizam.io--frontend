import { describe, expect, it } from 'vitest'

import { item } from '../../__tests__/rows'
import { longestNote, returnedNote } from './notes'
import { unitSummary } from './summary'

const counts = (iade: number) => ({
  by_status: { baslanmadi: 0, devam_ediyor: 0, onaya_sunuldu: 0, iade_edildi: iade, tamamlandi: 0 },
  total: iade,
  overdue: 0,
  pending_date_requests: 0,
})

describe('K1 KPI notları (E-K1-09/11, BE-005)', () => {
  it('en uzun gecikme: kodlu "· kod", kısmi kümede "≥", gecikme yoksa "Yok"', () => {
    const late = [item({ is_overdue: true, days_overdue: 8, code: 'ALT-2', sequence_no: 2 })]
    expect(longestNote(unitSummary(counts(0), late, true))).toBe('En uzunu 8 gün · ALT-2')
    expect(longestNote(unitSummary(counts(0), late, false))).toBe('En uzunu ≥8 gün · ALT-2')
    expect(longestNote(unitSummary(counts(0), [item()], true))).toBe('Yok')
  })

  it('iade: tek görevde "kod · atanan"; atanan adı yoksa yalnız kod; çoksa sayı', () => {
    const named = item({
      status: 'iade_edildi',
      code: 'SİS-4',
      sequence_no: 4,
      assignees: [{ account_id: 'a', full_name: 'Ayşe Kaya' }],
    })
    expect(returnedNote(unitSummary(counts(1), [named], true))).toBe('SİS-4 · Ayşe Kaya')
    const bare = item({ status: 'iade_edildi', code: 'SİS-5', sequence_no: 5 })
    expect(returnedNote(unitSummary(counts(1), [bare], true))).toBe('SİS-5')
    expect(returnedNote(unitSummary(counts(3), [bare], true))).toBe('3 görev')
    expect(returnedNote(unitSummary(counts(0), [], true))).toBe('Yok')
  })
})
