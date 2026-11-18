// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Gantt sol tablosu 1440 px'te başlık ve tarih kolonları üst üste biniyordu: kesirli kolonların
// asgarisi 0 idi ve satırlar `nowrap` olduğundan taşan metin komşu kolona biniyordu. Düzen
// doğrulaması tarayıcıdadır; burada kolonların okunur asgari genişliği ve yerel kaydırma kaynağı
// korunur.
const css = readFileSync(fileURLToPath(new URL('./gantt.css', import.meta.url)), 'utf8')
const rule = (selector: string): string =>
  new RegExp(`${selector.replace('.', '\\.')} \\{([^}]*)\\}`).exec(css)?.[1] ?? ''

describe('Gantt sol tablo kolonları', () => {
  it('her görev kolonunun asgarisi 0 değildir ve yazı tipinden bağımsız rem birimindedir (başlık ve gövde aynı izler)', () => {
    const cols = rule('.report-gantt__cols')
    const template = /grid-template-columns:([^;]*);/.exec(cols)?.[1] ?? ''
    const mins = [...template.matchAll(/minmax\(([^,]+),/g)].map((m) => m[1]!.trim())
    expect(mins).toHaveLength(5)
    for (const min of mins) expect(min).toMatch(/^\d+rem$/)
    expect(Number.parseInt(mins[2]!, 10)).toBeGreaterThanOrEqual(6)
    expect(Number.parseInt(mins[3]!, 10)).toBeGreaterThanOrEqual(6)
  })

  it('ızgara toplam asgarisini taşır; sığmayan genişlikte yatay kaydırma kapsayıcıdadır', () => {
    const grid = rule('.report-gantt')
    expect(grid).toMatch(/min-inline-size:\s*calc\(var\(--rp-gantt-left-min\)/)
    expect(grid).toMatch(/minmax\(var\(--rp-gantt-left-min\),\s*5fr\)/)
    expect(grid).not.toMatch(/minmax\(0,\s*5fr\)/)
  })
})
