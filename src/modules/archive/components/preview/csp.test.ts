// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Arşiv önizlemesi (W124) aynı kökenden `Authorization`'la okunan raster gövdenin `blob:` URL'sini
// `<img>` ile gösterir. Koordinatör kararı (2026-11-12): YALNIZ `img-src` direktifine `blob:`
// eklenir; başka yönerge değişmez, `unsafe-*` yoktur. Bu test üretim CSP'sini (Caddyfile) sabitler.
const CADDYFILE = fileURLToPath(new URL('../../../../../deploy/Caddyfile', import.meta.url))
const POLICY = /header Content-Security-Policy "([^"]+)"/.exec(readFileSync(CADDYFILE, 'utf8'))?.[1]

function directives(policy: string): Record<string, string> {
  return Object.fromEntries(
    policy.split(';').map((part) => {
      const [name, ...values] = part.trim().split(/\s+/)
      return [name as string, values.join(' ')]
    }),
  )
}

describe('üretim CSP (deploy/Caddyfile)', () => {
  it('img-src yalnız self, data: ve blob: içerir', () => {
    expect(POLICY).toBeDefined()
    expect(directives(POLICY!)['img-src']).toBe("'self' data: blob:")
  })

  it('başka hiçbir yönerge gevşemedi (blob: yalnız img-src; unsafe-* yok)', () => {
    const all = directives(POLICY!)
    expect(all).toEqual({
      'default-src': "'self'",
      'script-src': "'self' https://challenges.cloudflare.com",
      'style-src': "'self' 'nonce-{http.request.uuid}'",
      'img-src': "'self' data: blob:",
      'font-src': "'self'",
      'connect-src': "'self'",
      'frame-src': 'https://challenges.cloudflare.com',
      'frame-ancestors': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'",
      'object-src': "'none'",
    })
    expect(POLICY).not.toMatch(/unsafe-/)
    const withBlob = Object.entries(all).filter(([, v]) => v.includes('blob:'))
    expect(withBlob.map(([name]) => name)).toEqual(['img-src'])
  })
})
