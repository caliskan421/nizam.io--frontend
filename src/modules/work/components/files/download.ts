/**
 * İndirme biletini tüketme (`redeemDownloadTicket`, S0; ADR-0013). Bilet tarayıcının indirme
 * yöneticisine verilir: geçici bir bağlantı öğesi oluşturulur, tıklanır ve hemen kaldırılır.
 * Bilet ve URL hiçbir yerde saklanmaz (durum, URL çubuğu, tarayıcı deposu); 60 sn / tek
 * kullanımlıktır. Yalnız sözleşmedeki göreli tüketme yolu (`/v1/downloads/{ticket}`) açılır:
 * başka bir köken ya da yol reddedilir (açık yönlendirme yok).
 */
export const DOWNLOAD_PATH_PREFIX = '/v1/downloads/'

const TICKET_SEGMENT = /^[A-Za-z0-9_-]+$/

/** Yanıt `url`'i sözleşmedeki göreli tüketme yolu mu (tek kesim, base64url bilet). */
export function isRedeemPath(url: string): boolean {
  if (!url.startsWith(DOWNLOAD_PATH_PREFIX)) return false
  return TICKET_SEGMENT.test(url.slice(DOWNLOAD_PATH_PREFIX.length))
}

/**
 * Bileti tarayıcıda tüketir; yol geçersizse hiçbir şey açmaz ve `false` döner.
 * `fileName` yalnız sunucu `Content-Disposition` adı vermezse kullanılır.
 */
export function redeemDownload(url: string, fileName: string, doc: Document = document): boolean {
  if (!isRedeemPath(url)) return false
  const link = doc.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener noreferrer'
  link.hidden = true
  doc.body.appendChild(link)
  try {
    link.click()
  } finally {
    link.remove()
  }
  return true
}
