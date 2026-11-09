// CSP denetimi (CX-F0-Ö-05): `vite preview` CSP başlığı vermez; üretimde belgenin CSP'sini web
// Caddy'si verir (deploy/Caddyfile). Duman testinde belge yanıtına AYNI politika (Caddyfile'dan
// okunur, istek başı nonce `<meta name="csp-nonce">` ile aynı) eklenir ve sayfadaki
// `securitypolicyviolation` olayları toplanır. Duman testi **bütün** ihlallerin 0 olmasını ister
// (yalnız `font-src` değil; CX-F1-Ö-03): ihlal ayrıntısı (yönerge, engellenen, kaynak satırı,
// örnek) hata iletisinde yazılır.
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { Page } from '@playwright/test'

export interface CspViolation {
  directive: string
  blocked: string
  /** İhlali üreten kaynak dosya:satır (tarayıcı verirse). */
  source: string
  /** Satır içi içerikte tarayıcının verdiği ilk karakterler (`'report-sample'` yoksa boş). */
  sample: string
}

const CADDYFILE = fileURLToPath(new URL('../deploy/Caddyfile', import.meta.url))
const NONCE_PLACEHOLDER = '{{placeholder `http.request.uuid`}}'

/** Caddyfile'daki SPA belgesi CSP'si; `{http.request.uuid}` yerine verilen nonce. */
export function caddyCsp(nonce: string): string {
  const match = /header Content-Security-Policy "([^"]+)"/.exec(readFileSync(CADDYFILE, 'utf8'))
  if (!match?.[1]) throw new Error('deploy/Caddyfile: Content-Security-Policy başlığı bulunamadı')
  return match[1].replaceAll('{http.request.uuid}', nonce)
}

/** Belge yanıtlarına üretim CSP'sini ekler ve ihlalleri sayfa içinde toplar. */
export async function enforceCaddyCsp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const store: { directive: string; blocked: string; source: string; sample: string }[] = []
    ;(window as unknown as { __cspViolations?: unknown[] }).__cspViolations = store
    document.addEventListener('securitypolicyviolation', (event) => {
      store.push({
        directive: event.effectiveDirective,
        blocked: event.blockedURI,
        source: event.sourceFile ? `${event.sourceFile}:${event.lineNumber}` : '',
        sample: event.sample,
      })
    })
  })
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback()
    const response = await route.fetch()
    const nonce = randomUUID()
    const body = (await response.text()).replaceAll(NONCE_PLACEHOLDER, nonce)
    await route.fulfill({
      response,
      body,
      headers: { ...response.headers(), 'content-security-policy': caddyCsp(nonce) },
    })
  })
}

/** Şimdiye kadar toplanan ihlaller (yazı tipleri yüklendikten sonra okunur). */
export async function cspViolations(page: Page): Promise<CspViolation[]> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  return page.evaluate(
    () => (window as unknown as { __cspViolations?: CspViolation[] }).__cspViolations ?? [],
  )
}

/** İhlallerin okunur dökümü (duman hata iletisi). */
export function describeViolations(where: string, violations: readonly CspViolation[]): string {
  const lines = violations.map(
    (v) => `  ${v.directive} engellendi: ${v.blocked || '(satır içi)'} @ ${v.source || '?'}`,
  )
  return [`${where}: ${violations.length} CSP ihlali`, ...lines].join('\n')
}

/** Yüklenmiş yazı tipi aileleri (kendi barındırılan dosyalar gerçekten kullanıldı mı). */
export async function loadedFontFamilies(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const families = new Set<string>()
    document.fonts.forEach((f) => {
      if (f.status === 'loaded') families.add(f.family.replace(/^["']|["']$/g, ''))
    })
    return [...families]
  })
}
