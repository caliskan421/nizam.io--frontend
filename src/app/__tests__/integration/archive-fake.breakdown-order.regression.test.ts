import { expect, it } from 'vitest'

import { breakdown, file } from './archive-fake'

const tied = [
  file('pdf', 'w1', 'd1', 'u', { content_type: 'application/pdf', size_bytes: 100, tag: 'plan' }),
  file('image', 'w2', 'd1', 'u', { content_type: 'image/png', size_bytes: 100, tag: 'analiz' }),
]

it('eşit baytta tür kovaları giriş sırasından bağımsız anahtara göre sıralanır', () => {
  for (const files of [tied, [...tied].reverse()]) {
    const rows = breakdown(files).by_type
    expect(rows.reduce((sum, row) => sum + row.file_count, 0)).toBe(2)
    expect(rows.reduce((sum, row) => sum + row.total_bytes, 0)).toBe(200)
    expect(rows.map((row) => row.type)).toEqual(['image', 'pdf'])
  }
})

it('eşit baytta etiket kovaları giriş sırasından bağımsız anahtara göre sıralanır', () => {
  for (const files of [tied, [...tied].reverse()]) {
    const rows = breakdown(files).by_tag
    expect(rows.reduce((sum, row) => sum + row.file_count, 0)).toBe(2)
    expect(rows.reduce((sum, row) => sum + row.total_bytes, 0)).toBe(200)
    expect(rows.map((row) => row.tag)).toEqual(['analiz', 'plan'])
  }
})
