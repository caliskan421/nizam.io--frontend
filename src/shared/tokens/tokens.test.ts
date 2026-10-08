import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { TOKENS } from './tokens.gen'

const json = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tokens/tokens.json'), 'utf8'),
) as Record<string, unknown>

describe('tasarım token kaynağı', () => {
  it('JSON platformdan bağımsız: yalnız hex renk, sayı ve yazı tipi adları; CSS/Vue ifadesi yok', () => {
    // Açıklama alanı ($description) hariç bütün değerler.
    const text = JSON.stringify(json, (key, value: unknown) =>
      key.startsWith('$') ? undefined : value,
    )
    expect(text).not.toMatch(/var\(|rem|px"|--|vue|primevue|tailwind/i)
  })

  it('açık ve koyu mod aynı rolleri taşır', () => {
    expect(Object.keys(TOKENS.modes.dark).sort()).toEqual(Object.keys(TOKENS.modes.light).sort())
  })

  it('marka birincil rengi varsayılan kurulum rengiyle aynı (#1F4E79)', () => {
    expect(TOKENS.modes.light.primary.toLowerCase()).toBe('#1f4e79')
  })
})
