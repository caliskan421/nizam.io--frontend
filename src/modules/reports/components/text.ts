/**
 * Rapor bileşenlerinin metin çözücüsü: ortak `i18n` örneğinden okur, `app.use(i18n)` kurulumu
 * gerektirmez. Düğmeler başka modüllerin sayfalarına gömülüdür (06, 09b/K7, 03/K3); o sayfaların
 * testleri ve bileşen sınırları eklenti kurmaz (kapı `ReportsGate` kalıbı). Metin yalnız
 * `trReports` ağacından gelir (sunucu `message` gösterilmez).
 */
import { i18n } from '@/shared/i18n'

export function t(key: string, named?: Record<string, unknown>): string {
  return named ? i18n.global.t(key, named) : i18n.global.t(key)
}
