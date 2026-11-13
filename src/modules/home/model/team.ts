/**
 * 01 ekip şeridi ve alt bilgi (E-01-19/20/39) — saf türetim. Sayılar `reportDashboard` alanlarıdır;
 * `total_admins` şirket geneli, diğerleri program kapsamlıdır ve bir hesap birden çok rolde
 * sayılabilir (toplam `total_users`'ı aşabilir; REPORTING-K02). İstemci toplamaz.
 */
import { USER_ROLE_TABS, type UserRoleTab } from '@/modules/organization/public'
import type { IconName } from '@/shared/ui'

import type { DashboardReport } from './types'

export interface TeamFacts {
  users: number
  coordinatorships: number
  admins: number
  coordinators: number
  members: number
}

export function teamFacts(report: DashboardReport): TeamFacts {
  return {
    users: report.total_users,
    coordinatorships: report.total_coordinatorships,
    admins: report.total_admins,
    coordinators: report.total_coordinators,
    members: report.total_members,
  }
}

export interface RoleCard {
  key: 'admin' | 'coordinator' | 'member'
  /** 05 `rol` sekmesi süzgeci (E-01-20; değer kümesi `organization` capability dosyasından). */
  tab: Exclude<UserRoleTab, 'tumu'>
  icon: IconName
  count: (facts: TeamFacts) => number
}

/** 05 rol sekmeleri (rol dizesi karşılaştırması yalnız organizasyon capability dosyasında, K1). */
const [, ADMIN_TAB, COORDINATOR_TAB, MEMBER_TAB] = USER_ROLE_TABS

export const ROLE_CARDS: readonly RoleCard[] = [
  { key: 'admin', tab: ADMIN_TAB, icon: 'shield', count: (f) => f.admins },
  { key: 'coordinator', tab: COORDINATOR_TAB, icon: 'coords', count: (f) => f.coordinators },
  { key: 'member', tab: MEMBER_TAB, icon: 'user-plus', count: (f) => f.members },
]
