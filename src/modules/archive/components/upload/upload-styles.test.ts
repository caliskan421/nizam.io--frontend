// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { TOKENS } from '@/shared/tokens/tokens.gen'

// Yükleme penceresi stilleri yalnız token'dan (KESİN 5): ham renk yok, kullanılan her
// `--değişken` üretilmiş token (ya da bu dosyanın kendi `au-*` tanımı).
const css = readFileSync(fileURLToPath(new URL('./upload.css', import.meta.url)), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

describe('upload.css', () => {
  it('ham renk değeri yok', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i)
  })

  it('kullanılan her değişken üretilmiş token', () => {
    const used = [...css.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]!)
    expect(used.length).toBeGreaterThan(5)
    const known = new Set(Object.keys(TOKENS).map((k) => (k.startsWith('--') ? k : `--${k}`)))
    const generated = readFileSync(
      fileURLToPath(new URL('../../../../shared/tokens/tokens.gen.css', import.meta.url)),
      'utf8',
    )
    for (const name of new Set(used)) {
      expect(known.has(name) || generated.includes(`${name}:`), name).toBe(true)
    }
  })

  it('sürükle-bırak çerçevesi kesik çizgi ve katman içinde', () => {
    expect(css).toMatch(/@layer components/)
    expect(css).toMatch(/\.au-drop \{[^}]*dashed/)
  })
})
