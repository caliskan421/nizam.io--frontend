// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// shared/ui görünüm kuralları (W12 kabulü): ham renk yok, px yalnız metrics.css'te, satır içi
// stil yok (CSP `style-src` nonce'lu; `'unsafe-inline'` yok), bileşen ≤ 150 satır.
const dir = fileURLToPath(new URL('.', import.meta.url))

function files(sub: string, ext: string): { name: string; text: string }[] {
  const base = join(dir, sub)
  return readdirSync(base)
    .filter((name) => name.endsWith(ext))
    .map((name) => ({ name: join(sub, name), text: readFileSync(join(base, name), 'utf8') }))
}

const components = files('.', '.vue')
const styles = files('styles', '.css')
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/

describe('shared/ui görünüm kuralları', () => {
  it('bileşenler var ve her biri ≤ 150 satır', () => {
    expect(components.length).toBeGreaterThan(20)
    for (const { name, text } of components) {
      expect(text.split('\n').length, name).toBeLessThanOrEqual(150)
    }
  })

  it('ham renk yok (bileşen ve stil dosyaları)', () => {
    for (const { name, text } of [...components, ...styles]) {
      expect(text.match(RAW_COLOR)?.[0], name).toBeUndefined()
    }
  })

  it('px yalnız metrics.css içinde', () => {
    for (const { name, text } of [...components, ...styles]) {
      if (name.endsWith('metrics.css')) continue
      expect(text.match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('metrics.css yalnız --ui-* değişkeni tanımlar', () => {
    const metrics = styles.find((s) => s.name.endsWith('metrics.css'))!.text
    const declarations = metrics.replace(/\/\*[\s\S]*?\*\//g, '').match(/[\w-]+\s*:/g) ?? []
    for (const decl of declarations) expect(decl, decl).toMatch(/^--ui-[\w-]+\s*:$/)
  })

  it('satır içi stil yok', () => {
    for (const { name, text } of components) {
      expect(text, name).not.toMatch(/\s:?style=/)
    }
  })
})
