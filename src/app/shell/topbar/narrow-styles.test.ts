// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Dar ekran (O4 görsel borç): menü düğmesi yalnız ≤ 900 px; konum izinin son parçası üç noktayla
// kesilir (esnek öğe min-width 0).
const dir = fileURLToPath(new URL('.', import.meta.url))
const css = readFileSync(join(dir, 'topbar.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const media = css.indexOf('@media (max-width: 900px)')

describe('üst çubuk — dar ekran', () => {
  it('menü düğmesi geniş ekranda gizli, dar ekranda görünür', () => {
    expect(css.slice(0, media)).toMatch(/\.rp-topbar \.rp-navtoggle \{\s*display: none;/)
    expect(css.slice(media)).toMatch(/\.rp-topbar \.rp-navtoggle \{\s*display: inline-flex;/)
  })

  it('dar ekranda tarih gizli (konum izi ve zil sığar)', () => {
    expect(css.slice(media)).toMatch(/\.rp-topbar \.rp-kicker \{\s*display: none;/)
  })

  it('dar ekranda konum izi bağlantısı önce daralır, üç noktalı kesilir', () => {
    const rule = /\.rp-topbar \.rp-crumbs a \{([^}]*)\}/.exec(css.slice(media))?.[1] ?? ''
    expect(rule).toContain('flex: 0 100 auto')
    expect(rule).toContain('min-width: 0')
    expect(rule).toContain('text-overflow: ellipsis')
  })

  it('konum izi son parçası üç noktalı kesilir', () => {
    const rule = /\.rp-crumbs strong \{([^}]*)\}/.exec(css)?.[1] ?? ''
    for (const decl of [
      'min-width: 0',
      'white-space: nowrap',
      'overflow: hidden',
      'text-overflow: ellipsis',
    ]) {
      expect(rule).toContain(decl)
    }
  })
})
