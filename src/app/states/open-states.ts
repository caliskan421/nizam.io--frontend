/**
 * K7 açık durumlarının içeriği (00-ortak `mekanizma.md` §6; yol haritası K7). Başlık rota
 * kataloğundan (`OPEN_STATES`); metin ve eylem yetki olgusuna göre (mercekten bağımsız, P1).
 * Yönetici eylemleri hedef ekranı gelene dek **devre dışı + faz notu** gösterilir
 * (ortak-kurallar §5; tıklanabilir ama işlevsiz kontrol yok). Hedefi canlı olan eylem rota
 * bağlantısıdır: "program yok" → "Program oluştur" → `/programlar` (E-00-25, W81).
 */
import { OPEN_STATES, type OpenStateName, type RouteName } from '@/app/routes.catalog'
import type { IconName } from '@/shared/ui'

import { statesText, type StatesTextKey } from './messages'

export interface OpenStateCopy {
  title: string
  icon: IconName
  text: string
  /**
   * Yönetici eylemi; yoksa `null`. `to` doluysa hedef rotaya bağlantıdır (not yok); boşsa devre
   * dışı düğme + faz notu.
   */
  action: { label: string; note: string | null; to: RouteName | null } | null
}

interface CopySpec {
  icon: IconName
  admin?: StatesTextKey
  other: StatesTextKey
  action?: StatesTextKey
  /** Eylemin canlı hedefi (rota adı); yoksa devre dışı + faz notu. */
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
  },
  'state.logout-unverified': { icon: 'alert', other: 'states.logoutUnverified' },
}

function actionOf(label: string, to: RouteName | null): NonNullable<OpenStateCopy['action']> {
  if (to) return { label, note: null, to }
  return { label, note: statesText('states.phase.F2', { action: label }), to: null }
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
    action: label ? actionOf(label, spec.to ?? null) : null,
  }
}
