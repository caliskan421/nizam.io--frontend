/**
 * "Hızlı işlemler" kutucukları (01 E-01-08…12). Yalnız capability'si olan kutucuk çizilir
 * (P1: mercek değil yetki). Faz dışı eylem açıklamalı devre dışıdır (P2, ortak-kurallar §5):
 * "Toplantı oluştur" F4'e, "Kullanıcı davet et" F2'ye kadar; `designStub` yok (faz ertelemesi,
 * §3). "Rapor oluştur" F6'dır ve F1'de çizilmez (P6); kısayol tuşu yok (E-01-44 ret).
 */
import { canCreateWorkItem } from '@/modules/work/public'
import type { Standing } from '@/shared/scope/standing-facts'
import type { IconName } from '@/shared/ui'

import { canAddUser, canCreateMeeting } from './capabilities'

export type QuickActionKey = 'newTask' | 'meeting' | 'invite'
export type QuickActionPhase = 'F2' | 'F4'

export interface QuickAction {
  key: QuickActionKey
  icon: IconName
  /** Canlı değilse açılacağı faz (devre dışı + faz notu). */
  phase: QuickActionPhase | null
}

const ALL: ReadonlyArray<
  QuickAction & { visible: (s: Standing | null, p: string | null) => boolean }
> = [
  { key: 'newTask', icon: 'plus', phase: null, visible: canCreateWorkItem },
  { key: 'meeting', icon: 'meetings', phase: 'F4', visible: canCreateMeeting },
  { key: 'invite', icon: 'user-plus', phase: 'F2', visible: canAddUser },
]

/** Görünür kutucuklar, tasarım sırasıyla. */
export function quickActions(standing: Standing | null, programId: string | null): QuickAction[] {
  return ALL.filter((a) => a.visible(standing, programId)).map(({ key, icon, phase }) => ({
    key,
    icon,
    phase,
  }))
}
