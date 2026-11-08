import { describe, expect, it } from 'vitest'

import { subtask, workItem } from '../../model/__tests__/harness'
import {
  countSubtasks,
  dateRangeLabel,
  datesChange,
  datesProblem,
  fullDate,
  keepDatePair,
  personOptions,
  shortDate,
  subtaskValues,
} from './subtask-format'

describe('alt görev biçimleri', () => {
  it('tarih: GG Aaa (Türkçe üç harf), GG.AA.YYYY; biçimsiz değer aynen', () => {
    expect(shortDate('2026-06-05')).toBe('05 Haz')
    expect(shortDate('2026-08-31')).toBe('31 Ağu')
    expect(shortDate('2026-02-01')).toBe('01 Şub')
    expect(fullDate('2026-11-09')).toBe('09.11.2026')
    expect(fullDate('')).toBe('')
    expect(shortDate('yarın')).toBe('yarın')
  })

  it('tarih yuvası: iki tarih varsa "GG Aaa – GG Aaa", yoksa null', () => {
    expect(dateRangeLabel({ start_on: '2026-06-05', end_on: '2026-07-01' })).toBe('05 Haz – 01 Tem')
    expect(dateRangeLabel({})).toBeNull()
  })

  it('sayaç yüklenen listeden', () => {
    expect(countSubtasks([{ done: true }, { done: false }, { done: true }])).toEqual({
      done: 2,
      total: 3,
    })
    expect(countSubtasks([])).toEqual({ done: 0, total: 0 })
  })

  it('karşılaştırma değerleri: eksik alan boş dize', () => {
    expect(subtaskValues(subtask())).toEqual({
      title: 'Taslak',
      assignee_account_id: '',
      start_on: '',
      end_on: '',
    })
  })

  it('kişi seçenekleri yalnız ana göreve atananlar; atanmayan mevcut değer korunur; null ad', () => {
    const item = workItem({
      assignees: [
        { account_id: 'acc-1', full_name: 'Ayşe' },
        { account_id: 'acc-2', full_name: null },
      ],
    })
    expect(personOptions(item, subtask(), '?')).toEqual([
      { value: 'acc-1', label: 'Ayşe' },
      { value: 'acc-2', label: '?' },
    ])
    const gone = subtask({ assignee_account_id: 'acc-7', assignee_full_name: 'Eski' })
    expect(personOptions(item, gone, '?').at(-1)).toEqual({ value: 'acc-7', label: 'Eski' })
  })

  it('tarih doğrulaması: ikisi birlikte, bitiş ≥ başlangıç', () => {
    expect(datesProblem('', '')).toBeNull()
    expect(datesProblem('2026-06-05', '')).toBe('pair')
    expect(datesProblem('', '2026-06-05')).toBe('pair')
    expect(datesProblem('2026-06-05', '2026-06-04')).toBe('order')
    expect(datesProblem('2026-06-05', '2026-06-05')).toBeNull()
  })

  it('"Tamam": değişmediyse istek yok; boş çift tarihi kaldırır', () => {
    const s = { start_on: '2026-06-05', end_on: '2026-06-10' }
    expect(datesChange(s, '2026-06-05', '2026-06-10')).toBeNull()
    expect(datesChange(s, '2026-06-06', '2026-06-10')).toEqual({
      start_on: '2026-06-06',
      end_on: '2026-06-10',
    })
    expect(datesChange(s, '', '')).toEqual({ start_on: '', end_on: '' })
    expect(datesChange({}, '', '')).toBeNull()
  })

  it('çakışma sonrası tarih çifti bütün kalır', () => {
    const server = { start_on: '2026-06-01', end_on: '2026-06-30' }
    expect(keepDatePair({ end_on: '2026-07-01' }, server)).toEqual({
      start_on: '2026-06-01',
      end_on: '2026-07-01',
    })
    expect(keepDatePair({ start_on: '2026-05-01' }, server)).toEqual({
      start_on: '2026-05-01',
      end_on: '2026-06-30',
    })
    expect(keepDatePair({ title: 'x' }, server)).toEqual({ title: 'x' })
  })
})
