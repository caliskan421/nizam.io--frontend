// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { TOKENS } from '@/shared/tokens/tokens.gen'

import { trUsers, usersText, type UsersTextKey } from './messages'

// 05 Kullanıcılar görünüm kuralları (KESİN 5): ham renk yok, px yok (`--users-*` üretilmiş
// token; medya koşulu hariç), satır içi stil yok, .vue ≤ 250 satır; ızgara ve ölçüler
// Kullanicilar.dc.html ile aynı. Kapsam: bileşenler, sayfa dizini ve sayfa dosyası.
const here = fileURLToPath(new URL('.', import.meta.url))
const pages = fileURLToPath(new URL('../../pages/', import.meta.url))
const files = [
  ...readdirSync(here).map((n) => join(here, n)),
  ...readdirSync(join(pages, 'users')).map((n) => join(pages, 'users', n)),
  join(pages, 'UsersPage.vue'),
].filter((p) => /\.(vue|css)$/.test(p))
const read = (path: string) => readFileSync(path, 'utf8')
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const clean = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '@media {')

describe('05 Kullanıcılar görünüm kuralları', () => {
  it('dosyalar bulundu', () => {
    expect(files.length).toBeGreaterThanOrEqual(13)
  })

  it('ham renk yok; px yok (medya koşulu hariç)', () => {
    for (const path of files) {
      expect(clean(read(path)).match(RAW_COLOR)?.[0], path).toBeUndefined()
      expect(clean(read(path)).match(PX)?.[0], path).toBeUndefined()
    }
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const path of files.filter((p) => p.endsWith('.vue'))) {
      const text = read(path)
      expect(text, path).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, path).toBeLessThanOrEqual(250)
    }
  })

  it('tablo ızgarası ve ölçüler tasarımla aynı', () => {
    expect(TOKENS['users-cols'].dark).toBe('20px minmax(0, 2fr) 152px minmax(0, 1.2fr) 36px')
    expect(TOKENS['users-min-w'].dark).toBe('640px')
    expect(TOKENS['users-badge-h'].dark).toBe('24px')
    expect(TOKENS['users-search-h'].dark).toBe('36px')
    expect(TOKENS['users-strip-cols'].dark).toBe('repeat(3, minmax(0, 1fr)) 20px')
    expect(read(join(here, 'users.css'))).toMatch(
      /\.users-table \.rp-dtable \.rp-tr \{[^}]*grid-template-columns: var\(--users-cols\)/,
    )
  })

  it('dar ekran (K-3): kaydırma yok, roller sütunu içerik kadar, koordinatörlük ikinci satırda', () => {
    expect(TOKENS['users-cols-narrow'].dark).toBe('20px minmax(0, 1fr) auto 36px')
    const css = read(join(here, 'users.css'))
    const narrow = css.slice(css.indexOf('@media (max-width: 900px)'))
    expect(narrow).toMatch(/\.users-grid \{\s*min-width: 0;/)
    expect(narrow).toMatch(/grid-template-columns: var\(--users-cols-narrow\)/)
    expect(narrow).toMatch(/:nth-child\(4\) \{\s*grid-column: 2 \/ 4;\s*grid-row: 2;/)
  })

  it('kullanılan her --users-* ölçüsü üretilmiş token', () => {
    const used = new Set(
      files.flatMap((p) => [...read(p).matchAll(/var\(--(users-[a-z0-9-]+)/g)].map((m) => m[1]!)),
    )
    expect(used.size).toBeGreaterThan(10)
    expect([...used].filter((name) => !(name in TOKENS))).toEqual([])
  })
})

describe('05 metinleri', () => {
  const walk = (node: Record<string, unknown>, prefix: string): string[] =>
    Object.entries(node).flatMap(([k, v]) =>
      typeof v === 'string'
        ? [`${prefix}${k}`]
        : walk(v as Record<string, unknown>, `${prefix}${k}.`),
    )

  it('her yaprak dolu çözülür; sunucu iletisi yok', () => {
    const keys = walk(trUsers, 'users.') as UsersTextKey[]
    expect(keys.length).toBeGreaterThan(80)
    for (const key of keys) expect(usersText(key).trim(), key).not.toBe('')
  })

  it('kaynakta geçen her organization.users.* anahtarı ağaçta', () => {
    const known = new Set(walk(trUsers, 'users.'))
    for (const path of files
      .filter((p) => p.endsWith('.vue'))
      .concat(
        readdirSync(here)
          .filter((n) => n.endsWith('.ts') && !n.endsWith('.test.ts'))
          .map((n) => join(here, n)),
      )) {
      for (const [, key] of read(path).matchAll(/'(users\.[A-Za-z.]+)'/g)) {
        expect(known.has(key!), `${path}: ${key}`).toBe(true)
      }
    }
  })
})
