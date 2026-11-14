/**
 * Kayıtlı eksikler (yalnız kayıtlı kimlikler; ortak-kurallar §3; sahte veri yok, §4). Her değer
 * "bu işlev backend'de yok → öğe devre dışı/gizli" olgusudur; ekran `disabled` + ipucu çizer.
 *  - BE-027 sessize al / yalnız @ bildir · BE-028 grupta kim okudu / mesaj bilgisi (grup)
 *  - BE-029 görev arşivine de kaydet · BE-080 ilet · BE-160 "Koordinatörler" sistem grubu
 *  - BE-161 anonim anket · BE-081 süzgeç (sunucu) · BE-082 kendi okundu imleci
 *  - BE-083 rol rozeti · BE-084 paylaşılan sayaçları · BE-085 mesaj↔görev kartı
 *  - BE-086 ek/anket son mesaj türü · BE-162 alıntıda `seq`
 */
import { designStub } from '@/shared/design-stub'

export const CHAT_STUBS = {
  mute: designStub('BE-027', { enabled: false }),
  whoRead: designStub('BE-028', { enabled: false }),
  archiveSave: designStub('BE-029', { enabled: false }),
  forward: designStub('BE-080', { enabled: false }),
  filters: designStub('BE-081', { server: false }),
  ownReadSeq: designStub('BE-082', { available: false }),
  roleBadge: designStub('BE-083', { available: false }),
  sharedCounts: designStub('BE-084', { available: false }),
  taskCard: designStub('BE-085', { summary: false }),
  lastMessageKind: designStub('BE-086', { available: false }),
  coordinatorsGroup: designStub('BE-160', { available: false }),
  anonymousPoll: designStub('BE-161', { enabled: false }),
  quoteSeq: designStub('BE-162', { available: false }),
} as const
