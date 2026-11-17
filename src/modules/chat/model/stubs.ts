/**
 * Kayıtlı eksikler (yalnız kayıtlı kimlikler; ortak-kurallar §3; sahte veri yok, §4). Her değer
 * "bu işlev backend'de yok → öğe devre dışı/gizli" olgusudur; ekran `disabled` + ipucu çizer.
 *  - BE-029 görev arşivine de kaydet · BE-080 ilet · BE-161 anonim anket
 * Canlandı (pin v0.25.0-api): W183 BE-081/082/086/160/162; W184 BE-027 ayar yüzü, BE-028, BE-083,
 * BE-084, BE-085 — kimlikleri kaldırıldı.
 */
import { designStub } from '@/shared/design-stub'

export const CHAT_STUBS = {
  archiveSave: designStub('BE-029', { enabled: false }),
  forward: designStub('BE-080', { enabled: false }),
  anonymousPoll: designStub('BE-161', { enabled: false }),
} as const
