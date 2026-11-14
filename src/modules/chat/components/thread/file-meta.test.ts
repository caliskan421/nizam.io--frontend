import { describe, expect, it } from 'vitest'

import { extensionOf, formatSize } from './file-meta'

describe('file-meta', () => {
  it('uzantı büyük harf ve en çok 4 karakter', () => {
    expect(extensionOf('Vardiya_taslak.xlsx')).toBe('XLSX')
    expect(extensionOf('arşiv.tar.gzip')).toBe('GZIP')
    expect(extensionOf('uzantısız')).toBe('')
  })
  it('boyut KB/MB', () => {
    expect(formatSize(512)).toBe('512 B')
    expect(formatSize(2048)).toBe('2 KB')
    expect(formatSize(5 * 1024 * 1024)).toBe('5 MB')
    expect(formatSize(1536)).toBe('1,5 KB')
  })
})
