/**
 * CSP nonce okuma.
 *
 * Üretim imajında SPA belgesinin CSP'sini web konteynerindeki Caddy verir: `style-src` istek
 * başı bir nonce taşır ve aynı değer `templates` ile `index.html`'deki
 * `<meta name="csp-nonce">` öğesine yazılır. PrimeVue çalışma anında enjekte ettiği `<style>`
 * öğelerine bu nonce'u koyar (`csp.nonce`); `'unsafe-inline'` gerekmez.
 *
 * Şablonlanmamış sayfada (vite dev / preview) öğe yer tutucuyu (`{{…}}`) taşır; o durumda nonce
 * yoktur ve CSP de yoktur.
 */
export const CSP_NONCE_META = 'csp-nonce'

/** CSP nonce değerleri base64/base64url karakter kümesindedir (CSP3 `nonce-source`). */
const NONCE_PATTERN = /^[A-Za-z0-9+/_-]+={0,2}$/

export function readCspNonce(doc: Document = document): string | undefined {
  const value = doc.querySelector(`meta[name="${CSP_NONCE_META}"]`)?.getAttribute('content')?.trim()
  if (!value || !NONCE_PATTERN.test(value)) return undefined
  return value
}
