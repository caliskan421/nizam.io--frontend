// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { tokenPx } from './css-var'

// Codex CX-F1-K-03 (F2 W82 borç 14): CSS değişkeni `@media` koşulunda çalışmadığından medya
// eşikleri `.css`/`.vue` içinde sayı olarak yazılır (`px-scope.test.ts` istisnası). Tek kaynak
// token'dır: her genişlik eşiği `--rp-narrow-max` (dar ≤ N) ya da onun bir fazlası (geniş ≥ N+1)
// olmak zorundadır; token değişirse bu test eşleşmeyen her dosyayı adıyla gösterir. TS tarafı
// (`matchMedia`) eşiği doğrudan `tokenPx('rp-narrow-max')` ile kurar (`app/shell/narrow-nav.ts`).
const src = fileURLToPath(new URL('../..', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.(css|vue)$/.test(entry.name) ? [path] : []
  })
}

interface Threshold {
  file: string
  feature: string
  px: number
}

const thresholds: Threshold[] = walk(src).flatMap((path) => {
  const text = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  return [...text.matchAll(/@media([^{]*)\{/g)].flatMap((media) =>
    [...(media[1] ?? '').matchAll(/\(\s*((?:min|max)-[a-z-]+)\s*:\s*(\d+(?:\.\d+)?)px\s*\)/g)].map(
      (m) => ({ file: relative(src, path), feature: m[1] as string, px: Number(m[2]) }),
    ),
  )
})

describe('medya eşikleri token değeriyle eşleşir (K-03)', () => {
  const narrow = tokenPx('rp-narrow-max')

  it('kabuk eşikleri kapsamda (AppShell.vue, side.css, topbar.css)', () => {
    const files = new Set(thresholds.map((t) => t.file))
    expect(files).toContain('app/layouts/AppShell.vue')
    expect(files).toContain('app/shell/side/side.css')
    expect(files).toContain('app/shell/topbar/topbar.css')
  })

  it('her max-width = --rp-narrow-max, her min-width = --rp-narrow-max + 1; başka eşik yok', () => {
    const offenders = thresholds.filter(
      (t) =>
        !(
          (t.feature === 'max-width' && t.px === narrow) ||
          (t.feature === 'min-width' && t.px === narrow + 1)
        ),
    )
    expect(offenders).toEqual([])
  })
})
