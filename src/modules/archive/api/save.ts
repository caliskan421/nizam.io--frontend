/**
 * Bilet tüketimi sonrası kaydetme yardımcıları. Bilet `fetch` ile tüketilir (hedefin 422/429/
 * `records.*` hataları görünür olsun diye; `<a href>` gezintisi bu hataları kullanıcıya JSON
 * dosyası olarak indirirdi); başarıda gövde `blob` olarak tarayıcı indirmesine verilir ve URL
 * hemen serbest bırakılır. Bilet/URL hiçbir yerde saklanmaz.
 */
export const DOWNLOAD_PATH = /^\/v1\/downloads\/([A-Za-z0-9_-]+)$/

/** Yanıt `url`'i sözleşmedeki göreli tüketme yolu mu; bilet parçasını döndürür. */
export function ticketOf(url: string): string | null {
  return DOWNLOAD_PATH.exec(url)?.[1] ?? null
}

/** `Content-Disposition` dosya adı: `filename*` (UTF-8) önce, sonra `filename`. */
export function dispositionName(header: string | null): string | null {
  if (!header) return null
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)?.[1]
  if (star) {
    try {
      return decodeURIComponent(star.trim())
    } catch {
      // Bozuk kodlama: ASCII yedeğe düş.
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header)?.[1]
  return plain ? plain.trim() : null
}

/** Dosya adı yol ayracı taşıyamaz (indirme adı yalnız ad). */
export function safeFileName(name: string, fallback: string): string {
  const cleaned = name.replace(/[\\/\u0000-\u001f]/g, '_').trim()
  return cleaned === '' ? fallback : cleaned
}

/** Blob'u tarayıcı indirme yöneticisine verir; geçici bağlantı ve URL hemen kaldırılır. */
export function saveBlob(blob: Blob, fileName: string, doc: Document = document): void {
  const href = URL.createObjectURL(blob)
  const link = doc.createElement('a')
  link.href = href
  link.download = fileName
  link.rel = 'noopener noreferrer'
  link.hidden = true
  doc.body.appendChild(link)
  try {
    link.click()
  } finally {
    link.remove()
    URL.revokeObjectURL(href)
  }
}
