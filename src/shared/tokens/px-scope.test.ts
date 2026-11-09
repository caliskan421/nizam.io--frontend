// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { TOKENS } from './tokens.gen'

// CX-F0-Ö-02: ölçek dışı px değerleri design/web-tokens.json → `pnpm gen:tokens` ile üretilir; px
// yalnız üretilmiş token dosyasında. Tek istisna medya koşulu (CSS değişkeni orada çalışmaz;
// değer `--rp-narrow-max` ile aynı, kabuk stil testleri denetler).
const src = fileURLToPath(new URL('../..', import.meta.url))
const GENERATED = new Set(['shared/tokens/tokens.gen.css', 'shared/tokens/tailwind.gen.css'])
const PX = /\d(?:\.\d+)?px\b/

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.(css|vue)$/.test(entry.name) ? [path] : []
  })
}

const files = walk(src).map((path) => ({
  name: relative(src, path),
  text: readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@media[^{]*\{/g, '@media {'),
}))

describe('px yalnız üretilmiş token dosyasında', () => {
  it('src altındaki .css/.vue dosyalarında px yok (medya koşulu hariç)', () => {
    expect(files.length).toBeGreaterThan(30)
    const offenders = files
      .filter((f) => !GENERATED.has(f.name))
      .map((f) => [f.name, f.text.match(PX)?.[0]])
      .filter(([, hit]) => hit !== undefined)
    expect(offenders).toEqual([])
  })

  it('ayrı *-metrics.css ölçü dosyası kalmadı', () => {
    expect(files.filter((f) => /metrics\.css$/.test(f.name)).map((f) => f.name)).toEqual([])
  })

  it('kullanılan her bileşen ölçüsü (--ui/side/topbar/list/wd/sub/notes/tasks/wf/home-*) üretilmiş token', () => {
    const used = new Set(
      files.flatMap((f) =>
        [
          ...f.text.matchAll(
            /var\(--((?:ui|side|topbar|list|wd|sub|notes|tasks|wf|home)-[a-z0-9-]+)/g,
          ),
        ].map((m) => m[1] as string),
      ),
    )
    // Yerinde tanımlananlar (durum başına ton, `:style` ile verilen dinamik doluluk) ölçü değildir.
    const local = new Set(
      files.flatMap((f) =>
        [...f.text.matchAll(/(?:^|[{;\s'"])--([a-z0-9-]+)['"]?\s*:/g)].map((m) => m[1] as string),
      ),
    )
    expect(used.size).toBeGreaterThan(100)
    expect([...used].filter((name) => !(name in TOKENS) && !local.has(name))).toEqual([])
  })
})
