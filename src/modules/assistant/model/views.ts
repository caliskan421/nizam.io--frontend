import type { RouteLocationRaw } from 'vue-router'

import type { ScopeSnapshot } from '@/shared/scope/scope'

import type { SuggestedView } from './types'

const ID = /^[A-Za-z0-9_-]{1,128}$/
const DAY = /^\d{4}-\d{2}-\d{2}$/
const STATUS = new Set(['baslanmadi', 'devam_ediyor', 'onaya_sunuldu', 'iade_edildi', 'tamamlandi'])

export interface ViewLink {
  label: string
  to: RouteLocationRaw
}

function unitFilter(filter: Record<string, unknown>, scope: ScopeSnapshot) {
  if (!Object.hasOwn(filter, 'departman')) return {}
  const unit = filter.departman
  if (typeof unit !== 'string' || !ID.test(unit)) return null
  if (scope.lens === 'admin') return { koordinatorluk: unit }
  return unit === scope.departmentId ? {} : null
}

function taskStatus(filter: Record<string, unknown>) {
  const current = filter.durum
  if (current !== undefined && (typeof current !== 'string' || !STATUS.has(current))) return null
  const overdue = filter.yalniz_geciken
  if (overdue !== undefined && overdue !== 'true' && overdue !== 'false') return null
  // The frontend status slot cannot represent both filters independently.
  if (overdue === 'true' && current) return null
  return overdue === 'true' ? 'geciken' : current
}

function workView(filter: Record<string, unknown>, scope: ScopeSnapshot): ViewLink | null {
  const unit = unitFilter(filter, scope)
  if (!unit || Object.hasOwn(filter, 'oncelik')) return null
  const durum = taskStatus(filter)
  if (durum === null) return null
  return {
    label: 'Görevler',
    to: { name: 'work.tasks', query: { ...unit, ...(durum ? { durum } : {}) } },
  }
}

function meetingView(filter: Record<string, unknown>, scope: ScopeSnapshot): ViewLink | null {
  const unit = unitFilter(filter, scope)
  if (!unit) return null
  const { baslangic: from, bitis: to } = filter
  if (from !== undefined && (typeof from !== 'string' || !DAY.test(from))) return null
  if (to !== undefined && (typeof to !== 'string' || !DAY.test(to))) return null
  if (from && to && from > to) return null
  return {
    label: 'Toplantılar',
    to: { name: 'collaboration.meetings', query: { ...unit, from, to } },
  }
}

export function resolveView(
  view: SuggestedView,
  scope: ScopeSnapshot,
  admin: boolean,
): ViewLink | null {
  if (!scope.programId || view.filtre.program !== scope.programId) return null
  switch (view.gorunum) {
    case 'gorev_listesi':
      return workView(view.filtre, scope)
    case 'toplantilar':
      return meetingView(view.filtre, scope)
    case 'pano':
      return admin && scope.lens === 'admin' ? { label: 'Ana sayfa', to: { name: 'home' } } : null
    case 'sezon_raporu':
      return admin ? { label: 'Dönem sonu raporu', to: { name: 'reports.season' } } : null
    default:
      return null
  }
}

export const SOURCE_LABELS: Readonly<Record<string, string>> = {
  bugun: 'Programın takvim günü',
  kapsamim: 'Program ve kapsam',
  gorev_dagilimi: 'Görev dağılımı',
  gorev_listesi: 'Görev listesi',
  toplanti_ozeti: 'Toplantı özeti',
  is_yuku: 'İş yükü',
  sezon_ozeti: 'Sezon özeti',
  hafiza_ara: 'Kurumsal hafıza',
  goster: 'Görünüm kataloğu',
}
