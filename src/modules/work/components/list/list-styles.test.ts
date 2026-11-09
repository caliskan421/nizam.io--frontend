// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { TOKENS } from '@/shared/tokens/tokens.gen'

// Görev tablosu görünüm kuralları (KESİN 5): ham renk yok, px yok (`--list-*` üretilmiş token),
// satır içi stil yok, .vue ≤ 250 satır; ızgara tasarımla aynı.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')

describe('görev tablosu görünüm kuralları', () => {
  it('ham renk yok', () => {
    for (const name of [...vue, ...css]) {
      expect(stripComments(read(name)).match(RAW_COLOR)?.[0], name).toBeUndefined()
    }
  })

  it('px yok; ayrı ölçü dosyası yok', () => {
    expect(css.filter((name) => name.includes('metrics'))).toEqual([])
    for (const name of [...vue, ...css]) {
      expect(stripComments(read(name)).match(PX)?.[0], name).toBeUndefined()
    }
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const name of vue) {
      const text = read(name)
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('tablo ızgarası tasarımla aynı (20 · 1fr · 124 · 132 · 60; satır 64, en az 640)', () => {
    expect(TOKENS['list-cols'].dark).toBe('20px minmax(0, 1fr) 124px 132px 60px')
    expect(TOKENS['list-row-h'].dark).toBe('64px')
    expect(TOKENS['list-min-w'].dark).toBe('640px')
    expect(read('list.css')).toMatch(
      /\.rp-dtable \.rp-tr \{[^}]*grid-template-columns: var\(--list-cols\)/,
    )
  })
})
