// home modülünün (01 Ana sayfa) dışa açık yüzü. `app/` yalnız bu dosyayı içe aktarır; sayfa
// kaydı `homeRoutes` (`app/router.ts` `MODULE_ROUTES`). F6'da rapor uçları bu modüle bağlanır.
export { HOME_ROUTE, homeRoutes } from './routes'
// F6 (W136): `reportDashboard` okuyucusu rapor modülüyle PAYLAŞILIR (aynı sorgu anahtarı; ikinci
// okuyucu yazılmaz). `modules/reports/api/dashboard.ts` bunu yeniden dışa aktarır.
export { DASHBOARD_STALE_MS, fetchDashboard, useDashboard } from './api'
