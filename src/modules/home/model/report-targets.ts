/**
 * "Rapor oluştur" menüsünün dört hedefi (E-01-12; P47): ayrı sayfa yok, yalnız yönlendirme; PDF
 * indirme eylemleri kendi ekranlarındadır (06, 05, 09b/K7, 03/K3). Hedefler rota ADIyla verilir
 * (yol tek kaynağı rota kaydı). Menü ağ isteği atmaz.
 */
import { ARCHIVE_ROUTE } from '@/modules/archive/public'
import { USERS_ROUTE } from '@/modules/organization/public'
import { TASKS_ROUTE } from '@/modules/work/public'

/** 09 Toplantılar rota adı: `meetings/public.ts` dışa açmıyor (SAHİPLİK-DIŞI İHTİYAÇ, rapor). */
export const MEETINGS_ROUTE_NAME = 'collaboration.meetings'

export type ReportTargetKey = 'season' | 'workload' | 'meeting' | 'task'

export interface ReportTarget {
  key: ReportTargetKey
  routeName: string
}

/** Tasarım sırası (Rapor-Noktalar hücre F). */
export const REPORT_TARGETS: readonly ReportTarget[] = [
  { key: 'season', routeName: ARCHIVE_ROUTE.name },
  { key: 'workload', routeName: USERS_ROUTE.name },
  { key: 'meeting', routeName: MEETINGS_ROUTE_NAME },
  { key: 'task', routeName: TASKS_ROUTE.name },
]
