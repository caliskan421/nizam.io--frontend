import { describe, expect, it } from 'vitest'

import {
  closesAtIso,
  filledOptions,
  filterByName,
  GROUP_MEMBERS_MAX,
  localDay,
  sizeKb,
  sortedByName,
  toPollBody,
  toTaskBody,
  validateGroup,
  validatePoll,
  validateTask,
} from '../forms'

const NOW = Date.parse('2026-11-14T10:00:00Z')

describe('grup formu (E-10-77/78/80)', () => {
  it('ad zorunlu, ≤80 (kırpılmış), en az 1 en çok 200 üye', () => {
    expect(validateGroup('  ', ['a'])).toBe('nameRequired')
    expect(validateGroup('x'.repeat(81), ['a'])).toBe('nameTooLong')
    expect(validateGroup(` ${'x'.repeat(80)} `, ['a'])).toBeNull()
    expect(validateGroup('Ad', [])).toBe('membersRequired')
    expect(validateGroup('Ad', Array(GROUP_MEMBERS_MAX + 1).fill('a'))).toBe('membersTooMany')
    expect(validateGroup('Ad', Array(GROUP_MEMBERS_MAX).fill('a'))).toBeNull()
  })

  it('ad süzmesi tr büyük/küçük harfe duyarsız; boş sorgu hepsi', () => {
    const items = [{ full_name: 'İpek Aydın' }, { full_name: 'Zeynep Işık' }]
    expect(filterByName(items, '')).toHaveLength(2)
    expect(filterByName(items, 'ipek')).toEqual([items[0]])
    expect(filterByName(items, 'IŞIK')).toEqual([items[1]])
    expect(filterByName(items, 'yok')).toEqual([])
  })

  it('ada göre sıralama (tr)', () => {
    const sorted = sortedByName([
      { full_name: 'Zeynep' },
      { full_name: 'Çağla' },
      { full_name: 'Ali' },
    ])
    expect(sorted.map((s) => s.full_name)).toEqual(['Ali', 'Çağla', 'Zeynep'])
  })
})

describe('anket formu (E-10-94…100)', () => {
  const base = {
    question: 'Hangi gün?',
    options: ['Salı', 'Çarşamba'],
    multi: false,
    anonymous: false,
    closesLocal: '',
  }

  it('soru ≤200, 2–10 seçenek, ≤100, tekrarsız', () => {
    expect(validatePoll({ ...base, question: ' ' }, NOW)).toBe('questionRequired')
    expect(validatePoll({ ...base, question: 'x'.repeat(201) }, NOW)).toBe('questionTooLong')
    expect(validatePoll({ ...base, options: ['Salı', ' '] }, NOW)).toBe('optionsMin')
    expect(validatePoll({ ...base, options: ['Salı', 'x'.repeat(101)] }, NOW)).toBe('optionTooLong')
    expect(validatePoll({ ...base, options: ['Salı', 'SALI'] }, NOW)).toBe('optionsDuplicate')
    expect(validatePoll(base, NOW)).toBeNull()
  })

  it('son tarih şimdiden sonra olmalı; boşsa süresiz', () => {
    expect(validatePoll({ ...base, closesLocal: 'bozuk' }, NOW)).toBe('closesInvalid')
    expect(validatePoll({ ...base, closesLocal: '2020-01-01T10:00' }, NOW)).toBe('closesPast')
    expect(validatePoll({ ...base, closesLocal: '2030-01-01T10:00' }, NOW)).toBeNull()
    expect(closesAtIso('')).toBeNull()
  })

  it('gövde: soru = body, boş satırlar atılır; isimli anket anonymous:false AÇIKÇA gider', () => {
    const body = toPollBody({ ...base, options: [' Salı ', '', 'Çarşamba'], multi: true }, 'cm-1')
    expect(body).toEqual({
      client_message_id: 'cm-1',
      body: 'Hangi gün?',
      poll: { options: ['Salı', 'Çarşamba'], multi: true, anonymous: false },
    })
    expect(Object.keys(body.poll!)).toContain('anonymous')
    const dated = toPollBody({ ...base, closesLocal: '2030-01-01T10:00' }, 'cm-2')
    expect(dated.poll?.closes_at).toMatch(/^2030-01-01T/)
    expect(filledOptions([' a ', '  '])).toEqual(['a'])
  })

  it('gövde: anonim anket anonymous:true AÇIKÇA gider; diğer alanlar isimliyle aynı', () => {
    const named = toPollBody(base, 'cm-3')
    const secret = toPollBody({ ...base, anonymous: true }, 'cm-3')
    expect(secret.poll).toEqual({ ...named.poll, anonymous: true })
    expect(secret.poll?.anonymous).toBe(true)
  })
})

describe('mesajdan görev formu (E-10-87…90)', () => {
  const draft = {
    title: '',
    departmentId: 'd1',
    assigneeIds: [] as string[],
    startOn: '2026-11-20',
    endOn: '2026-11-25',
  }

  it('hedef birim ve iki tarih zorunlu; başlangıç bugünden önce olamaz; bitiş ≥ başlangıç', () => {
    expect(validateTask(draft, '2026-11-14')).toEqual({})
    expect(validateTask({ ...draft, departmentId: '' }, '2026-11-14').departmentId).toBe(
      'departmentRequired',
    )
    expect(validateTask({ ...draft, startOn: '' }, '2026-11-14').startOn).toBe('dateInvalid')
    expect(validateTask({ ...draft, startOn: '2026-11-01' }, '2026-11-14').startOn).toBe(
      'startPast',
    )
    expect(validateTask({ ...draft, endOn: '2026-11-19' }, '2026-11-14').endOn).toBe(
      'endBeforeStart',
    )
    expect(validateTask({ ...draft, title: 'x'.repeat(256) }, '2026-11-14').title).toBe(
      'titleTooLong',
    )
  })

  it('gövde: boş başlık ve atanan gönderilmez (sunucu ilk 100 karakteri kullanır)', () => {
    expect(toTaskBody(draft)).toEqual({
      department_id: 'd1',
      start_date: '2026-11-20',
      end_date: '2026-11-25',
    })
    expect(toTaskBody({ ...draft, title: ' Rapor ', assigneeIds: ['a1'] })).toEqual({
      department_id: 'd1',
      start_date: '2026-11-20',
      end_date: '2026-11-25',
      title: 'Rapor',
      assignee_account_ids: ['a1'],
    })
  })

  it('yerel gün biçimi ve KB yuvarlama', () => {
    expect(localDay(new Date(2026, 10, 4))).toBe('2026-11-04')
    expect(sizeKb(100)).toBe(1)
    expect(sizeKb(10 * 1024)).toBe(10)
  })
})
