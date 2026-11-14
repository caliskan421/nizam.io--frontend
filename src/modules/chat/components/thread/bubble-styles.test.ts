// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('./bubble.css', import.meta.url)), 'utf8')
const narrow = css.slice(css.indexOf('@media (max-width: 900px)'))

describe('dar ekran satır araçları (KUSUR 5)', () => {
  it('araçlar kendi satırının üst şeridinde: önceki mesajın saatini örten yukarı kaydırma yok', () => {
    const rule = /\.msg-row__tools \{([^}]*)\}/.exec(narrow)?.[1] ?? ''
    expect(rule).toMatch(/position: absolute;/)
    expect(rule).toMatch(/top: 0;/)
    expect(rule).not.toMatch(/translateY/)
  })

  it('araçlar açıkken satır şerit kadar uzar (araç yüksekliği + boşluk tokeniyle)', () => {
    const rule = /\.msg-row--tools,\s*\.msg-row:focus-within \{([^}]*)\}/.exec(narrow)?.[1] ?? ''
    expect(rule).toMatch(/padding-top: calc\(var\(--ui-av-sm\) \+ var\(--space-1\)\);/)
  })
})
