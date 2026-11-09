/**
 * Ana sayfa (01) tip sözlüğü. Sunucu şekilleri yalnız üretilmiş şemadan türetilir (elle DTO yok);
 * görev satırı tipi görev modülünün dışa açık yüzünden gelir.
 */
import type { components } from '@/shared/api/schema'
import type { WorkItem } from '@/modules/work/public'

/** `reportDashboard` yanıtı (yalnız şirket yöneticisi, REPORTING-K01). */
export type DashboardReport = components['schemas']['DashboardReport']

/** KPI sayımı için gereken görev alanları (`listProgramWorkItems` satırı). */
export type KpiItem = Pick<WorkItem, 'status' | 'is_overdue' | 'assignee_account_ids'>
