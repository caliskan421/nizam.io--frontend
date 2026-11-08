// Tarayıcı depolama denetimi (CLAUDE.md: belirteç asla `localStorage`/`sessionStorage`'a yazılmaz;
// yol haritası K2: tek istisna `src/shared/preferences/storage-adapter.ts`'in İZİNLİ anahtarları).
//
// İzinli anahtar listesi, önek ve değer doğrulayıcıları uygulamanın kendi kaynağından içe aktarılır
// (`src/shared/preferences/keys.ts`, `storage-adapter.ts`): liste orada genişlerse denetim de
// kendiliğinden izler, kopya kayması olmaz. Denetim eski "depolar boş" kuralından SIKIdır:
//  - `sessionStorage` boş;
//  - `localStorage`'da yalnız `nizamio.pref.<izinli anahtar>` ve değer o anahtarın doğrulayıcısından
//    geçer (kimlik / mercek / tema — serbest metin değil);
//  - hiçbir anahtar ya da değerde JWT biçimi, `token`, `bearer`, `access_token`, `refresh` yok;
//  - oturumdan bilinen gizli değerler (ör. ağdan okunan erişim belirteci) hiçbir yerde geçmez;
//  - `document.cookie` `nizamio` çerezini göstermez (yenileme çerezi HttpOnly).
import type { Page } from '@playwright/test'

import {
  isPreferenceKey,
  PREFERENCE_PARSERS,
  type PreferenceKey,
} from '../src/shared/preferences/keys'
import { STORAGE_PREFIX } from '../src/shared/preferences/storage-adapter'

export interface StorageSnapshot {
  local: Array<[string, string]>
  session: Array<[string, string]>
  cookie: string
}

export async function readStorage(page: Page): Promise<StorageSnapshot> {
  return page.evaluate(() => {
    const entries = (s: Storage) =>
      Array.from({ length: s.length }, (_, i) => s.key(i))
        .filter((k): k is string => k !== null)
        .map((k): [string, string] => [k, s.getItem(k) ?? ''])
    return {
      local: entries(window.localStorage),
      session: entries(window.sessionStorage),
      cookie: document.cookie,
    }
  })
}

const SECRET_HINTS: readonly RegExp[] = [
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWT başlığı (base64url "{")
  /access_token/i,
  /refresh/i,
  /bearer/i,
  /token/i,
]

function preferenceKey(storageKey: string): PreferenceKey | null {
  if (!storageKey.startsWith(STORAGE_PREFIX)) return null
  const key = storageKey.slice(STORAGE_PREFIX.length)
  return isPreferenceKey(key) ? key : null
}

function secretFindings(where: string, text: string, secrets: readonly string[]): string[] {
  const hints = SECRET_HINTS.filter((re) => re.test(text)).map((re) => `${where}: ${re.source}`)
  const known = secrets.filter((s) => s !== '' && text.includes(s)).map(() => `${where}: belirteç`)
  return [...hints, ...known]
}

/** İhlal listesi; boşsa depolar sözleşmeye uygundur. */
export function storageViolations(
  snapshot: StorageSnapshot,
  secrets: readonly string[] = [],
): string[] {
  const found: string[] = []
  for (const [key] of snapshot.session) found.push(`sessionStorage dolu: ${key}`)
  for (const [storageKey, value] of [...snapshot.local, ...snapshot.session]) {
    found.push(...secretFindings(`anahtar ${storageKey}`, storageKey, secrets))
    found.push(...secretFindings(`değer ${storageKey}`, value, secrets))
    const key = preferenceKey(storageKey)
    if (!key) {
      found.push(`izinli olmayan anahtar: ${storageKey}`)
    } else if (PREFERENCE_PARSERS[key](value) === null) {
      found.push(`geçersiz değer: ${storageKey}`)
    }
  }
  if (snapshot.cookie.includes('nizamio')) found.push('nizamio çerezi JS’e görünür')
  found.push(...secretFindings('document.cookie', snapshot.cookie, secrets))
  return found
}

/** Depolarda yalnız izinli tercih anahtarları var ve hiçbir yerde belirteç yok. */
export async function storageHasOnlyAllowedKeys(
  page: Page,
  secrets: readonly string[] = [],
): Promise<string[]> {
  return storageViolations(await readStorage(page), secrets)
}
