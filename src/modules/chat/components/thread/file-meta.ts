/** Dosya kartı yardımcıları (E-10-33): tür kutusu ve okunur boyut. */
export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot + 1, dot + 5).toUpperCase() : ''
}

const UNITS = ['B', 'KB', 'MB', 'GB'] as const

export function formatSize(bytes: number): string {
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1
  return `${value.toLocaleString('tr-TR', { maximumFractionDigits: digits })} ${UNITS[unit]}`
}
