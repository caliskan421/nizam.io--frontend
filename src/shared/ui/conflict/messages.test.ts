import { describe, expect, it } from 'vitest'

import { conflictText, trConflict } from './messages'

describe('conflict metinleri', () => {
  it('anahtarlar i18n ağacına eklenir; parametreli metin', () => {
    expect(conflictText('conflict.title')).toBe(trConflict.conflict.title)
    expect(conflictText('conflict.choice', { field: 'Başlık' })).toBe('Başlık: kalacak değer')
  })
})
