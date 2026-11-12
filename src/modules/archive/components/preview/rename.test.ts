import { describe, expect, it } from 'vitest'

import { MAX_FILE_NAME, validateFileName } from './rename'

describe('validateFileName (E-06-57)', () => {
  it('boş ve yalnız boşluk reddedilir; kırpılmış ad geçerlidir', () => {
    expect(validateFileName('')).toBe('required')
    expect(validateFileName('   ')).toBe('required')
    expect(validateFileName('  rapor.pdf  ')).toBeNull()
  })

  it('150 karakter geçerli, 151 reddedilir (kod noktası sayılır)', () => {
    expect(validateFileName('a'.repeat(MAX_FILE_NAME))).toBeNull()
    expect(validateFileName('a'.repeat(MAX_FILE_NAME + 1))).toBe('too_long')
    expect(validateFileName('😀'.repeat(MAX_FILE_NAME))).toBeNull()
  })
})
