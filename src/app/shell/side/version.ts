/**
 * Marka satırındaki sürüm etiketi (E-00-02 kabul: istemci DERLEME sürümü; API'de alan yok).
 * Kaynak derleme anındaki `VITE_APP_VERSION`; tanımsızsa etiket gösterilmez (uydurma sürüm yok).
 */
export function versionLabel(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim().replace(/^v/i, '')
  return value === '' ? null : `v${value}`
}

export function buildVersionLabel(): string | null {
  const raw: unknown = import.meta.env.VITE_APP_VERSION
  return versionLabel(raw)
}
