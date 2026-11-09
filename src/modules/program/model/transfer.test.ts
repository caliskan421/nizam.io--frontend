import { describe, expect, it } from 'vitest'

import {
  canExecute,
  isPreviewCurrent,
  previewSummary,
  sameSelection,
  TRANSFER_ITEM_LIMIT,
} from './transfer'
import type { TransferPreview, TransferSelection } from './types'

const sel = (ids: string[], target = 'p2'): TransferSelection => ({
  sourceProgramId: 'p1',
  targetProgramId: target,
  departmentId: 'd1',
  workItemIds: ids,
})

function preview(over: Partial<TransferPreview> = {}): TransferPreview {
  return {
    resolved_work_item_ids: ['w1', 'w2'],
    file_count: 0,
    file_total_bytes: 0,
    preserved_dependency_count: 0,
    missing_access: false,
    granted_memberships: [],
    blockers: [],
    warnings: [],
    can_execute: true,
    preview_fingerprint: 'fp-1',
    ...over,
  }
}

describe('aktarım görünüm modeli', () => {
  it('tavan 200 kalem (PROGRAM-K33)', () => {
    expect(TRANSFER_ITEM_LIMIT).toBe(200)
  })

  it('önizleme yalnız aynı seçime aittir (sıra dahil)', () => {
    expect(sameSelection(sel(['a', 'b']), sel(['a', 'b']))).toBe(true)
    expect(sameSelection(sel(['a', 'b']), sel(['b', 'a']))).toBe(false)
    expect(sameSelection(sel(['a']), sel(['a'], 'p3'))).toBe(false)
    expect(isPreviewCurrent(null, sel(['a']))).toBe(false)
    expect(isPreviewCurrent(sel(['a']), null)).toBe(false)
  })

  it('yürütme: can_execute ya da tek engel eksik erişim + bayrak', () => {
    expect(canExecute(preview(), false)).toBe(true)
    const missing = preview({ can_execute: false, missing_access: true, blockers: ['x'] })
    expect(canExecute(missing, false)).toBe(false)
    expect(canExecute(missing, true)).toBe(true)
    const more = preview({ can_execute: false, missing_access: true, blockers: ['x', 'y'] })
    expect(canExecute(more, true)).toBe(false)
  })

  it('özet yapılandırılmış alanlardan; engel dizeleri metne çevrilmez', () => {
    const lines = previewSummary(
      preview({
        unresolved_work_item_ids: ['w9'],
        file_count: 2,
        file_total_bytes: 2048,
        preserved_dependency_count: 1,
        cut_dependency_ids: ['e1', 'e2'],
        cycle_work_item_ids: ['w1'],
        missing_file_ids: ['f1'],
        granted_memberships: [{ department_id: 'd1', account_id: 'a1' }],
        missing_access: true,
        blockers: ['bilinmeyen_kod'],
      }),
    )
    expect(lines.map((l) => [l.key, l.tone])).toEqual([
      ['resolved', 'neutral'],
      ['unresolved', 'danger'],
      ['files', 'neutral'],
      ['preserved', 'neutral'],
      ['cut', 'warn'],
      ['cycle', 'danger'],
      ['missingFiles', 'danger'],
      ['granted', 'neutral'],
      ['missingAccess', 'warn'],
    ])
    expect(lines[0]!.text).toBe('2 görev aktarılacak')
    expect(lines[2]!.text).toBe('2 dosya (2,0 KB)')
    expect(lines.map((l) => l.text).join(' ')).not.toContain('bilinmeyen_kod')
  })

  it('boş önizlemede yalnız çözülen sayısı', () => {
    const lines = previewSummary(preview({ resolved_work_item_ids: null }))
    expect(lines).toHaveLength(1)
    expect(lines[0]!.text).toBe('0 görev aktarılacak')
  })
})
