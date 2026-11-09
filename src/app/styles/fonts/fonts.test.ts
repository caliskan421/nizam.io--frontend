// @vitest-environment node
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { TOKENS } from '@/shared/tokens/tokens.gen'

// CX-F0-Ö-05: yazı tipleri kendi barındırılır (CSP `font-src 'self'`), lisans ve kaynak yanında.
const dir = fileURLToPath(new URL('.', import.meta.url))
const read = (name: string) => readFileSync(join(dir, name), 'utf8')
const fontsCss = read('fonts.css')
const mainCss = read('../main.css')
const kaynak = read('KAYNAK.txt')

const faces = [...fontsCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
  const body = m[1] as string
  return {
    family: /font-family:\s*'([^']+)'/.exec(body)?.[1],
    src: [...body.matchAll(/url\(([^)]*)\)/g)].map((u) => (u[1] as string).replace(/['"]/g, '')),
    range: /unicode-range:([^;]+);/.exec(body)?.[1] ?? '',
  }
})

/** Token yığınındaki ilk aile ("Inter", system-ui … → Inter). */
const firstFamily = (token: 'font-sans' | 'font-display' | 'font-mono') =>
  /^"([^"]+)"/.exec(TOKENS[token].dark)?.[1]

describe('yazı tipleri (kendi barındırılan)', () => {
  it('main.css fonts.css içe aktarır; harici adres yok', () => {
    expect(mainCss).toContain("@import './fonts/fonts.css';")
    expect(`${fontsCss}\n${mainCss}`).not.toMatch(/https?:\/\/|\/\/fonts\.|@import\s+url\(/i)
  })

  it('her token ailesi için latin + latin-ext yüzü var', () => {
    for (const token of ['font-sans', 'font-display', 'font-mono'] as const) {
      const family = firstFamily(token)
      const own = faces.filter((f) => f.family === family)
      expect(own.length, `${token} → ${family}`).toBe(2)
      // Türkçe: ı (U+0131) latin'de, ğ (U+011F) / ş (U+015F) latin-ext aralığında (U+0100-02BA).
      expect(own.some((f) => f.range.includes('U+0131'))).toBe(true)
      expect(own.some((f) => f.range.includes('U+0100-02BA'))).toBe(true)
    }
  })

  it('her kaynak yerel woff2; dosya var, woff2 imzası taşır ve özeti KAYNAK.txt ile aynı', () => {
    const urls = faces.flatMap((f) => f.src)
    expect(urls.length).toBe(6)
    for (const url of urls) {
      expect(url).toMatch(/^\.\/[a-z0-9-]+\.woff2$/)
      const file = join(dir, url)
      expect(existsSync(file), url).toBe(true)
      const bytes = readFileSync(file)
      expect(bytes.subarray(0, 4).toString('latin1'), url).toBe('wOF2')
      const sha = createHash('sha256').update(bytes).digest('hex')
      expect(kaynak, url).toContain(`${url.slice(2)}`)
      expect(kaynak, url).toContain(sha)
    }
  })

  it('her aile için OFL lisans metni yanında', () => {
    for (const name of ['OFL-Inter.txt', 'OFL-Poppins.txt', 'OFL-GeistMono.txt']) {
      expect(read(name)).toContain('SIL Open Font License, Version 1.1')
    }
  })
})
