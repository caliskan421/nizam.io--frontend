import { describe, expect, it } from 'vitest'

import type { Poll } from '../../model/types'
import { pollView } from './poll-view'

const named = (over: Partial<Poll> = {}): Poll => ({
  anonymous: false,
  closed_at: null,
  closes_at: null,
  multi: false,
  results: [
    {
      option_index: 0,
      label: 'A',
      count: 2,
      mine: true,
      voters: [
        { account_id: 'u1', full_name: 'Bir' },
        { account_id: 'u2', full_name: 'İki' },
      ],
    },
    {
      option_index: 1,
      label: 'B',
      count: 1,
      mine: false,
      voters: [{ account_id: 'u3', full_name: 'Üç' }],
    },
  ],
  ...over,
})
const anon = (over: Partial<Poll> = {}): Poll => ({
  ...named(),
  anonymous: true,
  results: [
    { option_index: 0, label: 'A', count: 2, mine: true, voters: [] },
    { option_index: 1, label: 'B', count: 1, mine: false, voters: [] },
  ],
  ...over,
})

describe('pollView (E-10-35, BE-161)', () => {
  it("isimli: kendi oy mine'dan; kişi sayısı voters birleşimi; yüzde count/kişi", () => {
    const view = pollView(named())
    expect([...view.mine]).toEqual([0])
    expect(view.voters).toBe(3)
    expect(view.percent(2)).toBe(67)
    expect(view.bar(1)).toBe(33)
  })

  it("isimli çoklu: aynı kişi iki seçenekte tek sayılır (yüzde toplamı %100'ü aşabilir)", () => {
    const poll = named({ multi: true })
    poll.results[1]!.voters.push({ account_id: 'u1', full_name: 'Bir' })
    poll.results[1]!.count = 2
    const view = pollView(poll)
    expect(view.voters).toBe(3)
    expect(view.percent(2)! + view.percent(2)!).toBeGreaterThan(100)
  })

  it("anonim: voters [] iken kendi oy yine mine'dan; kişi voters'tan TÜRETİLMEZ", () => {
    const view = pollView(anon())
    expect([...view.mine]).toEqual([0])
    expect(view.voters).toBe(3)
  })

  it('anonim tek seçim: kişi = Σcount, yüzde bilinir', () => {
    const view = pollView(anon())
    expect(view.percent(1)).toBe(33)
  })

  it('anonim çoklu: kişi sayısı bilinmez → yüzde yok, çubuk en büyük sayıya oranlı', () => {
    const view = pollView(anon({ multi: true }))
    expect(view.voters).toBeNull()
    expect(view.percent(2)).toBeNull()
    expect(view.bar(2)).toBe(100)
    expect(view.bar(1)).toBe(50)
  })

  it('oy yok: yüzde 0, çubuk 0 (sıfıra bölme yok)', () => {
    const empty = anon()
    for (const r of empty.results) r.count = 0
    const view = pollView(empty)
    expect(view.percent(0)).toBe(0)
    expect(pollView({ ...empty, multi: true }).bar(0)).toBe(0)
  })
})
