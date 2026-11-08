/**
 * K7 açık durumlarının içeriği (00-ortak `mekanizma.md` §6; yol haritası K7). Başlık rota
 * kataloğundan (`OPEN_STATES`); metin ve eylem yetki olgusuna göre (mercekten bağımsız, P1).
 * Yönetici eylemleri hedef ekranı gelene dek (F2) **devre dışı + faz notu** gösterilir
 * (ortak-kurallar §5; tıklanabilir ama işlevsiz kontrol yok).
 */
import { OPEN_STATES, type OpenStateName } from '@/app/routes.catalog'
import type { IconName } from '@/shared/ui'

import { statesText, type StatesTextKey } from './messages'

export interface OpenStateCopy {
  title: string
  icon: IconName
  text: string
  /** Devre dışı yönetici eylemi ve faz notu; yoksa `null`. */
  action: { label: string; note: string } | null
}

interface CopySpec {
  icon: IconName
  admin?: StatesTextKey
  other: StatesTextKey
  action?: StatesTextKey
}

const SPECS: Partial<Record<OpenStateName, CopySpec>> = {
  'state.no-program': {
    icon: 'season',
    admin: 'states.noProgram.admin',
    other: 'states.noProgram.other',
    action: 'states.noProgram.action',
  },
  'state.membership-pending': { icon: 'clock', other: 'states.membershipPending.other' },
  'state.no-department': {
    icon: 'coords',
    admin: 'states.noDepartment.admin',
    other: 'states.noDepartment.other',
    action: 'states.noDepartment.action',
  },
  'state.logout-unverified': { icon: 'alert', other: 'states.logoutUnverified' },
}

/** Açık durumun görünür içeriği; kabukta çizilmeyen durumda (güncelleme gerekli) `null`. */
export function openStateCopy(name: OpenStateName, admin: boolean): OpenStateCopy | null {
  const spec = SPECS[name]
  if (!spec) return null
  const useAdmin = admin && spec.admin !== undefined
  const label = useAdmin && spec.action ? statesText(spec.action) : null
  return {
    title: OPEN_STATES[name].title,
    icon: spec.icon,
    text: statesText(useAdmin && spec.admin ? spec.admin : spec.other),
    action: label ? { label, note: statesText('states.phase.F2', { action: label }) } : null,
  }
}
