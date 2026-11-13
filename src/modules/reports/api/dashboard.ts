/**
 * `reportDashboard` (01 ile AYNI anahtar `queryKeys.report.dashboard`): ikinci okuyucu yazılmaz;
 * ana sayfa modülünün okuyucusuna bağlanır (`home/public.ts`). `reportDashboardTasks/Meetings`
 * YAZILMAZ (P52).
 */
export {
  DASHBOARD_STALE_MS as REPORT_DASHBOARD_STALE_MS,
  fetchDashboard as fetchReportDashboard,
  useDashboard as useReportDashboard,
} from '@/modules/home/public'
