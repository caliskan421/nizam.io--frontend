/**
 * K7 açık durumlarının içeriği (00-ortak `mekanizma.md` §6; yol haritası K7). Başlık rota
 * kataloğundan (`OPEN_STATES`); metin ve eylem yetki olgusuna göre (mercekten bağımsız, P1).
 * Yönetici eylemleri rota bağlantısıdır (tıklanabilir ama işlevsiz kontrol yok,
 * ortak-kurallar §5): "program yok" → "Program oluştur" ve "departman yok" → "Departman ekle",
 * ikisi de `/programlar` (E-00-25, W81; departman bağlama program yönetiminde, W98 K-6).
 */
import { OPEN_STATES, type OpenStateName, type RouteName } from '@/app/routes.catalog'
import type { IconName } from '@/shared/ui'

import { statesText, type StatesTextKey } from './messages'

export interface OpenStateCopy {
  title: string
  icon: IconName
  text: string
  /** Yönetici eylemi (hedef rotaya bağlantı); yoksa `null`. */
  action: { label: string; to: RouteName } | null
}

interface CopySpec {
  icon: IconName
  admin?: StatesTextKey
  other: StatesTextKey
  action?: StatesTextKey
  /** Eylemin canlı hedefi (rota adı). */
  to?: RouteName
}

const SPECS: Partial<Record<OpenStateName, CopySpec>> = {
  'state.no-program': {
    icon: 'season',
    admin: 'states.noProgram.admin',
    other: 'states.noProgram.other',
    action: 'states.noProgram.action',
    to: 'program.programs',
  },
  'state.membership-pending': { icon: 'clock', other: 'states.membershipPending.other' },
  'state.no-department': {
    icon: 'coords',
    admin: 'states.noDepartment.admin',
    other: 'states.noDepartment.other',
    action: 'states.noDepartment.action',
    to: 'program.programs',
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
    action: label && spec.to ? { label, to: spec.to } : null,
  }
}
