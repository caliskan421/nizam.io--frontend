/**
 * Marka satırındaki sürüm etiketi (E-00-02 kabul: istemci DERLEME sürümü; API'de alan yok).
 * Kaynak derleme anındaki `VITE_APP_VERSION`; tanımsız, boş ya da `0.0.0` ise etiket gösterilmez.
 */
export function versionLabel(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim().replace(/^v/i, '')
  // Boş ya da yer tutucu sürüm (0.0.0) yanıltıcıdır: gösterilmez (ortak-kurallar §4).
  if (value === '' || /^0(?:\.0)*$/.test(value)) return null
  return `v${value}`
}

export function buildVersionLabel(): string | null {
  const raw: unknown = import.meta.env.VITE_APP_VERSION
  return versionLabel(raw)
}
