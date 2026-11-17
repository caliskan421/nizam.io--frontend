import { describe, expect, it } from 'vitest'

import type { NormalizedFieldError } from '@/shared/errors/api-error'

import { blockedMessage, blockerPartsFromFields, impactConfirmBody } from './impact'
import { interpretOutcome } from './outcome'
import type { DepartmentDeleteImpact } from './types'

const impact = (over: Partial<DepartmentDeleteImpact> = {}): DepartmentDeleteImpact => ({
  active_items: 0,
  completed_items: 0,
  deleted: true,
  deleted_items: 0,
  deleted_with_department: 0,
  department_id: 'd1',
  file_count: 0,
  meeting_count: 0,
  member_count: 0,
  name: 'Mekanik',
  permanent_blocked: false,
  permanent_blockers: { pending_proposals: 0, projects: 0, tables: 0 },
  programs: [],
  ...over,
})

const field = (name: string, value?: string): NormalizedFieldError => ({
  field: name,
  code: 'organization.department_usage',
  messageKey: 'errors.organization.department_usage',
  ...(value === undefined ? {} : { value }),
})

describe('etki gövdesi', () => {
  it('programsız sıfır etkide başlık satırı yok, anlık görüntü uyarısı var', () => {
    const body = impactConfirmBody(impact())
    expect(body).not.toContain('Programlara göre:')
    expect(body).toContain('Silinecek görev yok.')
    expect(body.at(-1)).toContain('okuma anının görüntüsü')
  })

  it('silinmiş görevler iki kez sayılmaz', () => {
    const body = impactConfirmBody(
      impact({ active_items: 1, completed_items: 1, deleted_items: 5, deleted_with_department: 5 }),
    )
    expect(body.join(' ')).toContain('7 görev silinecek')
  })
})

describe('engel metinleri', () => {
  it('yalnız sıfırdan büyük engeller yazılır; sayısız engelde genel cümle', () => {
    expect(
      blockedMessage(
        impact({ permanent_blockers: { tables: 1, projects: 2, pending_proposals: 0 } }),
      ),
    ).toContain('1 tablo, 2 proje')
    expect(blockedMessage(impact({ permanent_blocked: true }))).toContain('bir engeli var')
  })

  it('fields: bilinen alan + tam sayı değeri; bilinmeyen alan yok sayılır', () => {
    expect(blockerPartsFromFields([field('tables', '3'), field('x', '1')])).toEqual(['3 tablo'])
    expect(blockerPartsFromFields([field('projects', 'çok')])).toEqual(['proje'])
    expect(blockerPartsFromFields([field('x', '1')])).toBeNull()
    expect(blockerPartsFromFields([])).toBeNull()
  })
})

describe('departman yaşam döngüsü sonucu', () => {
  const row = { kind: 'departments', title: 'Mekanik' } as const
  const ok = (data: unknown) => ({ kind: 'success', data }) as never

  it('geri yükleme gerçek görev sayısını söyler, yoksa uydurmaz', () => {
    expect(interpretOutcome('restore', row, ok({ work_items_restored: 4 }))).toEqual({
      kind: 'done',
      message: 'Mekanik geri yüklendi; 4 görev de geri geldi.',
    })
    expect(interpretOutcome('restore', row, ok({ work_items_restored: 0 }))).toMatchObject({
      message: 'Mekanik geri yüklendi; geri gelecek görev yoktu.',
    })
    expect(interpretOutcome('restore', row, ok({}))).toEqual({
      kind: 'done',
      message: 'Mekanik geri yüklendi.',
    })
  })

  it('kalıcı silme yalnız yanıttaki sayıları yazar', () => {
    expect(interpretOutcome('purge', row, ok({ work_items_deleted: 2, files_deleted: 0 }))).toEqual(
      {
        kind: 'done',
        message: 'Mekanik kalıcı olarak silindi: 2 görev, 0 dosya.',
      },
    )
  })
})
