import { describe, expect, it } from 'vitest'

import type { WorkItem } from '@/modules/work/public'

import { taskSummary } from './task-summary'

const item = (status: string, overdue = false) => ({ status, is_overdue: overdue }) as WorkItem

describe('görev özeti sayaçları (E-05-29)', () => {
  it('iade_edildi açık sayılır; tamamlanmış geç görev gecikmede sayılmaz', () => {
    expect(
      taskSummary([
        item('baslanmadi'),
        item('devam_ediyor', true),
        item('iade_edildi', true),
        item('onaya_sunuldu'),
        item('tamamlandi', true),
      ]),
    ).toEqual({ open: 4, overdue: 2, approval: 1 })
    expect(taskSummary([])).toEqual({ open: 0, overdue: 0, approval: 0 })
  })
})
