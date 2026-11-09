import { describe, expect, it } from 'vitest'

import { formatBytes, programText } from './messages'

describe('program metinleri', () => {
  it('statik ağaçtan çözülür (program.* kayıtlı)', () => {
    expect(programText('page.title')).toBe('Teknofest ve sezon')
    expect(programText('page.count', { n: 3 })).toBe('3 program')
  })

  it('bayt → okunur boyut (1024 tabanı, TR ondalık)', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1,5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5,0 MB')
    expect(formatBytes(3 * 1024 ** 4)).toBe('3072,0 GB')
  })
})
