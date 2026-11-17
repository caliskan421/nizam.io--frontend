import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { CHAT_STUBS } from './stubs'

describe('CHAT_STUBS — W183 canlanan satırlar (eski yol yok)', () => {
  it('BE-081/082/086/160/162 stub tanımları kalktı; BE-027 (W184/W185) durur', () => {
    const keys = Object.keys(CHAT_STUBS)
    for (const gone of [
      'filters',
      'ownReadSeq',
      'lastMessageKind',
      'coordinatorsGroup',
      'quoteSeq',
    ]) {
      expect(keys).not.toContain(gone)
    }
    expect(keys).toContain('mute')
    const source = readFileSync(new URL('./stubs.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/designStub\('BE-(081|082|086|160|162)'/)
  })
})
