// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Görev listesi sayfa görünüm kuralları (KESİN 5): ham renk yok, px yalnız tasks-metrics.css'te
// (medya koşulu hariç), satır içi stil yok, .vue ≤ 250 satır (sayfa dahil).
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const page = readFileSync(join(dir, '../TasksPage.vue'), 'utf8')
const vue = readdirSync(dir).filter((n) => n.endsWith('.vue'))
const css = readdirSync(dir).filter((n) => n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/
const stripComments = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '')
const stripMedia = (text: string) => text.replace(/@media[^{]*\{/g, '@media {')

describe('görev listesi sayfa görünüm kuralları', () => {
  it('ham renk yok', () => {
    for (const [name, text] of [
      ...[...vue, ...css].map((n) => [n, read(n)]),
      ['TasksPage', page],
    ]) {
      expect(stripComments(text!).match(RAW_COLOR)?.[0], name).toBeUndefined()
    }
  })

  it('px yalnız tasks-metrics.css içinde (medya koşulu hariç); metrics yalnız --tasks-*', () => {
    for (const [name, text] of [
      ...[...vue, ...css].map((n) => [n, read(n)]),
      ['TasksPage', page],
    ]) {
      if (name === 'tasks-metrics.css') continue
      expect(stripMedia(stripComments(text!)).match(PX)?.[0], name).toBeUndefined()
    }
    const metrics = stripComments(read('tasks-metrics.css'))
    for (const decl of metrics.match(/[\w-]+\s*:/g) ?? [])
      expect(decl).toMatch(/^--tasks-[\w-]+\s*:$/)
  })

  it('medya koşulu dar ekran eşiğiyle (--rp-narrow-max = 900px) aynı', () => {
    expect(
      read('tasks.css')
        .match(/@media[^{]*/g)
        ?.map((m) => m.trim()),
    ).toEqual(['@media (max-width: 900px)'])
  })

  it('satır içi stil yok; .vue ≤ 250 satır', () => {
    for (const [name, text] of [...vue.map((n) => [n, read(n)]), ['TasksPage', page]]) {
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text!.split('\n').length, name).toBeLessThanOrEqual(250)
    }
  })

  it('yerleşim tabanları token (rp-col / rp-aside / rp-head)', () => {
    const tasks = read('tasks.css')
    expect(tasks).toMatch(/\.rp-col \{[^}]*flex: 999 1 var\(--rp-col-basis\)/)
    expect(tasks).toMatch(/\.rp-aside \{[^}]*max-width: var\(--rp-aside-max\)/)
    expect(tasks).toMatch(/\.rp-head > :first-child \{[^}]*flex: 1 1 var\(--rp-head-basis\)/)
  })
})
