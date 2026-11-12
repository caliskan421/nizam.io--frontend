import { describe, expect, it } from 'vitest'

import { errorField, firstDropped } from './model'

describe('errorField', () => {
  it.each([
    ['records.tag_required', 'tag'],
    ['records.tag_invalid', 'tag'],
    ['records.too_many_files', 'task'],
    ['records.too_large', 'file'],
    ['platform.body_too_large', 'file'],
    ['records.content_rejected', 'file'],
    ['records.name_invalid', 'file'],
    ['records.name_taken', 'file'],
  ])('%s → %s', (code, field) => {
    expect(errorField(code)).toBe(field)
  })

  it('eşlenmeyen kod üst bildirimde kalır', () => {
    for (const code of ['records.not_authorized', 'records.transfer_active', 'platform.internal']) {
      expect(errorField(code)).toBeNull()
    }
  })
})

describe('firstDropped', () => {
  const a = new File(['1'], 'a.pdf')
  const b = new File(['2'], 'b.pdf')
  it('ilk dosyayı alır; birden çoksa extra', () => {
    expect(firstDropped([a])).toEqual({ file: a, extra: false })
    expect(firstDropped([a, b])).toEqual({ file: a, extra: true })
  })
  it('boş girdi dosya vermez', () => {
    expect(firstDropped(null)).toEqual({ file: null, extra: false })
    expect(firstDropped([])).toEqual({ file: null, extra: false })
  })
})
