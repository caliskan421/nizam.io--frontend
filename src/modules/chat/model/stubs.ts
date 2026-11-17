/**
 * Kayıtlı eksikler (yalnız kayıtlı kimlikler; ortak-kurallar §3; sahte veri yok, §4). Her değer
 * "bu işlev backend'de yok → öğe devre dışı/gizli" olgusudur; ekran `disabled` + ipucu çizer.
 *  - BE-027 sessize al / yalnız @ bildir · BE-028 grupta kim okudu / mesaj bilgisi (grup)
 *  - BE-029 görev arşivine de kaydet · BE-080 ilet · BE-161 anonim anket
 *  - BE-083 rol rozeti · BE-084 paylaşılan sayaçları · BE-085 mesaj↔görev kartı
 * (BE-081/082/086/160/162 canlandı — W183 — kimlikleri kaldırıldı.)
 */
import { designStub } from '@/shared/design-stub'

export const CHAT_STUBS = {
  mute: designStub('BE-027', { enabled: false }),
  whoRead: designStub('BE-028', { enabled: false }),
  archiveSave: designStub('BE-029', { enabled: false }),
  forward: designStub('BE-080', { enabled: false }),
  roleBadge: designStub('BE-083', { available: false }),
  sharedCounts: designStub('BE-084', { available: false }),
  taskCard: designStub('BE-085', { summary: false }),
  anonymousPoll: designStub('BE-161', { enabled: false }),
} as const
