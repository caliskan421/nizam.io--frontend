// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// K1/Ü1 görünüm kuralları (KESİN 5/17): medya eşiği dar ekran eşiğiyle aynı, statik satır içi
// stil yok (tek dinamik bağ `--rh-w` çubuk genişliği), .vue ≤ 250 satır. Ham renk ve px kuralı
// `pages/home-styles.test.ts` ve `shared/tokens/px-scope.test.ts` tarafından da taranır.
const root = fileURLToPath(new URL('.', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.(vue|css)$/.test(entry.name) ? [path] : []
  })
}

const files = [
  join(root, 'role-home.css'),
  ...walk(join(root, 'k1')),
  ...walk(join(root, 'u1')),
].map((path) => ({ name: relative(root, path), text: readFileSync(path, 'utf8') }))

describe('K1/Ü1 görünüm kuralları', () => {
  it('medya koşulu yalnız dar ekran eşiği (900px = --rp-narrow-max)', () => {
    const css = files.find((f) => f.name === 'role-home.css')!.text
    expect(css.match(/@media[^{]*/g)?.map((m) => m.trim())).toEqual(['@media (max-width: 900px)'])
  })

  it('birim özeti şeridi esnek sarma: 6 kutu tek satıra sığar, eksik satır uzar (KUSUR 5a)', () => {
    const css = files.find((f) => f.name === 'role-home.css')!.text
    const strip = /\.role-home \.rh-strip \{[^}]*\}/.exec(css)?.[0] ?? ''
    expect(strip).toContain('display: flex')
    expect(strip).toContain('flex-wrap: wrap')
    expect(css).toMatch(/\.rh-strip > \* \{\s*flex: 1 1 calc\(var\(--pt-kpi-min\) \* 0\.9\)/)
  })

  it('statik satır içi stil yok; dinamik bağ yalnız fill (--rh-w)', () => {
    for (const { name, text } of files.filter((f) => f.name.endsWith('.vue'))) {
      expect(text, name).not.toMatch(/\sstyle=/)
      for (const binding of text.match(/:style="[^"]*"/g) ?? []) {
        expect(binding, name).toBe(':style="fill"')
      }
      expect(text.split('\n').length, name).toBeLessThanOrEqual(250)
    }
    const seg = files.find((f) => f.name === 'k1/BarSeg.vue')!.text
    expect(seg).toMatch(/'--rh-w':/)
  })

  it('tüm kurallar .role-home / .role-home-dialog altında kapsanır', () => {
    const css = files.find((f) => f.name === 'role-home.css')!.text.replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = css.match(/^\s{2}[.][^{]*\{/gm) ?? []
    expect(selectors.length).toBeGreaterThan(50)
    for (const selector of selectors) expect(selector).toMatch(/\.role-home/)
  })
})
