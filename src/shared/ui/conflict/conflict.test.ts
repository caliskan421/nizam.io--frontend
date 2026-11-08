import { describe, expect, it } from 'vitest'

import { allChosen, conflictRows, resolveDraft } from './conflict'

const base = { title: 'A', description: 'x', priority: 'orta', end_on: '2026-11-10' }
const server = { title: 'B', description: 'y', priority: 'orta', end_on: '2026-11-20' }
const labels = { title: 'Başlık', description: 'Açıklama', priority: 'Öncelik' }

describe('alan alan çakışma', () => {
  it('yalnız gerçek çakışmalar (iki taraf da değiştirdi, farklı), etiket sırasıyla', () => {
    const draft = { title: 'C', description: 'y', priority: 'acil' }
    expect(conflictRows({ base, draft, server, labels })).toEqual([
      { field: 'title', label: 'Başlık', mine: 'C', theirs: 'B' },
    ])
  })

  it('etiketi olmayan alan sorulmaz; biçimleyici uygulanır; boş/null', () => {
    const draft = { title: 'C', end_on: '2026-12-01' }
    const rows = conflictRows({
      base: { ...base, title: null },
      draft,
      server: { ...server, title: 'B' },
      labels: { title: 'Başlık' },
      format: (field, value) => `${field}=${String(value)}`,
    })
    expect(rows).toEqual([{ field: 'title', label: 'Başlık', mine: 'title=C', theirs: 'title=B' }])
    expect(
      conflictRows({ base: { a: 1 }, draft: { a: 2 }, server: { a: null }, labels: { a: 'A' } }),
    ).toEqual([{ field: 'a', label: 'A', mine: '2', theirs: '' }])
  })

  it('allChosen: her satır seçilmeden false', () => {
    const rows = [
      { field: 'title', label: 'Başlık', mine: 'C', theirs: 'B' },
      { field: 'priority', label: 'Öncelik', mine: 'acil', theirs: 'yuksek' },
    ]
    expect(allChosen(rows, { title: 'mine' })).toBe(false)
    expect(allChosen(rows, { title: 'mine', priority: 'theirs' })).toBe(true)
  })

  it('resolveDraft: "güncel değer" seçilen alan düşer; sunucuyla aynı alan düşer; gerisi taslaktan', () => {
    const draft = { title: 'C', description: 'y', priority: 'acil' }
    expect(resolveDraft(draft, server, { title: 'theirs' })).toEqual({ priority: 'acil' })
    expect(resolveDraft(draft, server, { title: 'mine' })).toEqual({ title: 'C', priority: 'acil' })
  })
})
