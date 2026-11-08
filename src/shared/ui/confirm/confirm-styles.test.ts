// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// shared/ui kuralları (W12) bu alt dizinde de: ham renk yok, px yok (ölçek dışı `--ui-*`
// metrics.css'te), satır içi stil yok, bileşen ≤ 150 satır.
const dir = fileURLToPath(new URL('.', import.meta.url))
const files = readdirSync(dir).filter((n) => n.endsWith('.vue') || n.endsWith('.css'))
const RAW_COLOR =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklch)\(/i
const PX = /\d(?:\.\d+)?px\b/

describe('confirm görünüm kuralları', () => {
  it('ham renk ve px yok; satır içi stil yok; bileşen ≤ 150 satır', () => {
    expect(files.length).toBeGreaterThan(3)
    for (const name of files) {
      const text = readFileSync(join(dir, name), 'utf8')
      expect(text.match(RAW_COLOR)?.[0], name).toBeUndefined()
      expect(text.match(PX)?.[0], name).toBeUndefined()
      if (!name.endsWith('.vue')) continue
      expect(text, name).not.toMatch(/\s:?style=/)
      expect(text.split('\n').length, name).toBeLessThanOrEqual(150)
    }
  })
})
