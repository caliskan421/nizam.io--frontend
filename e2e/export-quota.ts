// Dışa aktarım kotası bekçisi (W176 O3, reports.spec ardışık koşum kararsızlığının kök nedeni).
//
// Backend ZIP/PDF/CSV bilet hedeflerini HESAP başına dakikalık ortak kotada tutar
// (`NIZAMIO_RECORDS_EXPORT_PER_MINUTE`, üretim varsayılanı 5; aşım 429 `platform.rate_limited` →
// arayüz geri sayım kartı gösterir, indirme başlamaz; `up.sh` e2e'de 30 verir, bekçi yedektir). Tek yönetici
// hesabıyla koşan spec'ler ardışık koşumda ya da aynı koşumda beşten fazla dışa aktarım yaparsa
// `page.waitForEvent('download')` zaman aşımına düşer. Çözüm kota-bilinçli bekleme: her dışa
// aktarım tıklamasından ÖNCE `reserveExport()` çağrılır; son 60 sn içinde ayrılmış dışa aktarım
// sayısı sınıra erişmişse en eski kayıt düşene kadar (gerçek süre; e2e gerçek backend'e karşıdır)
// beklenir. Kayıt `e2e/.state/export-times.json`'dadır, koşumlar arasında kalır (kasıtlı).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const STATE = resolve(import.meta.dirname, '.state/export-times.json')
const WINDOW_MS = 60_000
/** `up.sh` backend'e `NIZAMIO_RECORDS_EXPORT_PER_MINUTE=30` verir (non-prod); farklı bir backend için env ile geçersiz kılınır (üretim varsayılanı 5). */
export const EXPORT_LIMIT = Number(process.env.NIZAMIO_E2E_EXPORT_LIMIT ?? 30)

function read(): number[] {
  if (!existsSync(STATE)) return []
  try {
    const parsed = JSON.parse(readFileSync(STATE, 'utf8')) as unknown
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : []
  } catch {
    return []
  }
}

function write(times: number[]): void {
  mkdirSync(dirname(STATE), { recursive: true })
  writeFileSync(STATE, JSON.stringify(times))
}

/** Tek bir dışa aktarım için yer ayırır; kota doluysa pencere açılana dek bekler. */
export async function reserveExport(): Promise<void> {
  for (;;) {
    const now = Date.now()
    const live = read().filter((t) => now - t < WINDOW_MS)
    if (live.length < EXPORT_LIMIT) {
      write([...live, now])
      return
    }
    // Sınırın altına inmek için en eski (live.length - LIMIT + 1) kayıt düşmeli.
    const free = live[live.length - EXPORT_LIMIT]!
    await new Promise((resolveWait) => setTimeout(resolveWait, free + WINDOW_MS - now + 250))
  }
}
