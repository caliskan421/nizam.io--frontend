/**
 * Giriş sonrası dönüş hedefi (W145 KUSUR 1): kapı, anonim kullanıcıyı `/oturum?next=<geldiği yol>`
 * ile yönlendirir; başarılı girişte yalnız UYGULAMA İÇİ ve kayıtlı bir yola dönülür. Dış/mutlak
 * URL (`https://…`, `//host`, `\host`), kontrol karakteri ve oturum rotasının kendisi reddedilir.
 */
import type { Router } from 'vue-router'

import { routeSpec } from '@/app/routes.catalog'

const MAX_LENGTH = 2048

/** Ham `next` değeri uygulama içi mutlak yol biçiminde mi (`/…`, şema/ağ konumu yok). */
export function isInternalPath(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_LENGTH) return false
  if (raw[0] !== '/' || raw[1] === '/' || raw[1] === '\\') return false
  for (let i = 0; i < raw.length; i += 1) {
    const code = raw.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) return false
  }
  return true
}

/** Sorgudan gelen `next` (dizi olabilir) → güvenli yol ya da `undefined`. */
export function safeNext(raw: unknown, router: Router): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!isInternalPath(value)) return undefined
  const resolved = router.resolve(value)
  // Kayıtlı rota olmalı (bilinmeyen yol atılır) ve oturum rotasının kendisi olmamalı (döngü).
  if (resolved.matched.length === 0 || resolved.path === routeSpec('identity.session').path) {
    return undefined
  }
  return resolved.fullPath
}
