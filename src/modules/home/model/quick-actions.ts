/**
 * "Hızlı işlemler" kutucukları (01 E-01-08…12). Yalnız capability'si olan kutucuk çizilir
 * (P1: mercek değil yetki). F6'da hepsi canlıdır (W145 KUSUR 3): "Toplantı oluştur" 09 Toplantılar
 * listesine (oluşturma düğmesi orada), "Kullanıcı davet et" 05 Kullanıcılar'a (ekleme akışı orada)
 * gider; eski faz etiketleri kalktı. "Rapor oluştur" F6'da canlıdır (E-01-12; P47): yalnız şirket yöneticisi, mercekten bağımsız;
 * kutucuk yönlendirme menüsü açar (`ReportCreateMenu`), faz notu yok. Kısayol tuşu yok (E-01-44 ret).
 */
import { canCreateWorkItem } from '@/modules/work/public'
import type { Standing } from '@/shared/scope/standing-facts'
import type { IconName } from '@/shared/ui'

import { canAddUser, canCreateMeeting, canCreateReport } from './capabilities'

export type QuickActionKey = 'newTask' | 'meeting' | 'invite' | 'report'

export interface QuickAction {
  key: QuickActionKey
  icon: IconName
}

const ALL: ReadonlyArray<
  QuickAction & { visible: (s: Standing | null, p: string | null) => boolean }
> = [
  { key: 'newTask', icon: 'plus', visible: canCreateWorkItem },
  { key: 'meeting', icon: 'meetings', visible: canCreateMeeting },
  { key: 'invite', icon: 'user-plus', visible: canAddUser },
  { key: 'report', icon: 'document', visible: (s) => canCreateReport(s) },
]

/** Görünür kutucuklar, tasarım sırasıyla. */
export function quickActions(standing: Standing | null, programId: string | null): QuickAction[] {
  return ALL.filter((a) => a.visible(standing, programId)).map(({ key, icon }) => ({ key, icon }))
}
