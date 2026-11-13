// reports modülünün (13 Raporlar; F6) dışa açık yüzü. Diğer modüller ve `app/` yalnız bu dosyayı
// içe aktarır. Sayfa kaydı `reportsRoutes` (`app/router.ts` `MODULE_ROUTES`; faz açılınca).
export { REPORT_MEETING_ROUTE, REPORT_SEASON_ROUTE, reportsRoutes } from './routes'
export {
  REPORT_DASHBOARD_STALE_MS,
  fetchReportDashboard,
  useReportDashboard,
} from './api/dashboard'
export { useReportDownloads } from './api/downloads'
export {
  fetchMeetingDetail,
  fetchSeason,
  fetchTaskDetail,
  useReportMeetingDetail,
  useReportSeason,
  useReportTaskDetail,
} from './api/queries'
export { default as ReportActionButton } from './components/ReportActionButton.vue'
export * from './model/capabilities'
export * from './model/failure'
export { createReportGate, reportGate, type ReportGate, type ReportLease } from './model/gate'
export * from './model/settle'
export * from './model/stubs'
export * from './model/targets'
export * from './model/types'
