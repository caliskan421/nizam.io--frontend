// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { TOKENS } from '@/shared/tokens/tokens.gen'

const css = readFileSync(fileURLToPath(new URL('./tracking.css', import.meta.url)), 'utf8')
const body = css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('05b stilleri (KESİN 5: yalnız token)', () => {
  it('kullanılan her --pt-* ölçüsü üretilmiş token (yerinde tanımlananlar hariç)', () => {
    const used = new Set([...body.matchAll(/var\(--(pt-[a-z0-9-]+)/g)].map((m) => m[1] as string))
    const local = new Set([...body.matchAll(/--(pt-[a-z0-9-]+)\s*:/g)].map((m) => m[1] as string))
    // Dinamik değerler (bileşende `:style`) yalnız kart doluluğu ve dağılım dilimi genişliği.
    const dynamic = new Set(['pt-fill', 'pt-share'])
    expect(used.size).toBeGreaterThan(15)
    expect([...used].filter((n) => !(n in TOKENS) && !local.has(n) && !dynamic.has(n))).toEqual([])
    expect([...local].sort()).toEqual(['pt-tone'])
  })

  it('ham renk yok; katman components; medya eşiği --rp-narrow-max ile aynı', () => {
    expect(body).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(body).not.toMatch(/rgba?\(/)
    expect(body.trim().startsWith('@layer components')).toBe(true)
    const media = [...body.matchAll(/@media \(max-width: (\d+)px\)/g)].map((m) => `${m[1]}px`)
    expect(media).toEqual([TOKENS['rp-narrow-max'].dark])
  })

  it('kapsam: her kural .pt-page altında (work rp-dtable kurallarıyla çakışmaz)', () => {
    const selectors = [...body.matchAll(/([^{}@]+)\{/g)]
      .map((m) => m[1]!.trim())
      .filter((s) => s && !/^(layer|media)\b/.test(s))
    for (const selector of selectors) {
      for (const part of selector.split(',')) expect(part.trim(), part).toMatch(/\.pt-page\b/)
    }
  })
})
