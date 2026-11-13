import { describe, expect, it } from 'vitest'

import { REPORT_FALLBACK_NAMES, reportPath, reportTarget, workloadBody } from './targets'
import { REPORT_KINDS } from './types'

const base = { programId: 'p1' } as const

describe('rapor bilet hedefleri (kapalı liste: dört PDF)', () => {
  it('dönem: GET, program başlığı, parametre yok', () => {
    expect(reportTarget({ ...base, kind: 'season' })).toEqual({
      method: 'GET',
      path: '/v1/reports/season/pdf',
      headers: { 'X-Nizamio-Program': 'p1' },
      fallbackName: 'donem-raporu.pdf',
    })
  })

  it('toplantı ve görev: kimlik kodlanır, ham sorgu yok', () => {
    expect(reportTarget({ ...base, kind: 'meeting', targetId: 'm 1/x' })).toMatchObject({
      method: 'GET',
      path: '/v1/reports/meetings/m%201%2Fx/pdf',
      fallbackName: 'toplanti-raporu.pdf',
    })
    expect(reportTarget({ ...base, kind: 'task', targetId: 't1' })).toMatchObject({
      method: 'GET',
      path: '/v1/reports/tasks/t1/pdf',
      fallbackName: 'gorev-raporu.pdf',
    })
    expect(reportPath({ ...base, kind: 'task', targetId: 't1' })).not.toContain('?')
  })

  it('kayıt kimliksiz toplantı/görev hedefi programlama hatasıdır', () => {
    expect(() => reportTarget({ ...base, kind: 'meeting' })).toThrow(/kimliği gerekli/)
    expect(() => reportTarget({ ...base, kind: 'task', targetId: '' })).toThrow(/kimliği gerekli/)
  })

  it('iş yükü: tek POST hedefi; seçim yokken AÇIK boş dizi', () => {
    expect(reportTarget({ ...base, kind: 'workload' })).toEqual({
      method: 'POST',
      path: '/v1/reports/workload',
      body: { member_ids: [] },
      headers: { 'X-Nizamio-Program': 'p1' },
      fallbackName: 'is-yuku-raporu.pdf',
    })
    expect(reportTarget({ ...base, kind: 'workload', memberIds: ['a', 'b'] })).toMatchObject({
      body: { member_ids: ['a', 'b'] },
    })
  })

  it('iş yükü gövdesi tekilleşir, sırayı korur', () => {
    expect(workloadBody(['a', 'b', 'a']).member_ids).toEqual(['a', 'b'])
    expect(workloadBody(undefined).member_ids).toEqual([])
  })

  it('yedek adlar yalnız ASCII ve dört türün hepsi için var', () => {
    expect(Object.keys(REPORT_FALLBACK_NAMES).sort()).toEqual([...REPORT_KINDS].sort())
    for (const name of Object.values(REPORT_FALLBACK_NAMES)) expect(name).toMatch(/^[a-z-]+\.pdf$/)
  })
})
