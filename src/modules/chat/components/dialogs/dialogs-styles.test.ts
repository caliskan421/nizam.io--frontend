// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('./dialogs.css', import.meta.url)), 'utf8')

describe('Gruptan ayrıl (10c tasarım farkı)', () => {
  it("metin bağlantısı: dolgu ve kenarlık yok, tehlike rengi token'dan", () => {
    const rule = /\.chat-dlg__leave \{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(rule).toMatch(/background: none;/)
    expect(rule).toMatch(/border: 0;/)
    expect(rule).toMatch(/color: var\(--danger\);/)
  })
})
