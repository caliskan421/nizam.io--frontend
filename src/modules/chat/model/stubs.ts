/**
 * Kayıtlı eksikler (yalnız kayıtlı kimlikler; ortak-kurallar §3; sahte veri yok, §4). Her değer
 * "bu işlev backend'de yok → öğe devre dışı/gizli" olgusudur; ekran `disabled` + ipucu çizer.
 *  - BE-029 görev arşivine de kaydet · BE-080 ilet · BE-160 "Koordinatörler" sistem grubu
 *  - BE-161 anonim anket · BE-081 süzgeç (sunucu) · BE-082 kendi okundu imleci
 *  - BE-086 ek/anket son mesaj türü · BE-162 alıntıda `seq`
 * W184 canlandırdı (pin v0.25.0-api): BE-027 ayar yüzü, BE-028, BE-083, BE-084, BE-085 (stub kalktı).
 */
import { designStub } from '@/shared/design-stub'

export const CHAT_STUBS = {
  archiveSave: designStub('BE-029', { enabled: false }),
  forward: designStub('BE-080', { enabled: false }),
  filters: designStub('BE-081', { server: false }),
  ownReadSeq: designStub('BE-082', { available: false }),
  lastMessageKind: designStub('BE-086', { available: false }),
  coordinatorsGroup: designStub('BE-160', { available: false }),
  anonymousPoll: designStub('BE-161', { enabled: false }),
  quoteSeq: designStub('BE-162', { available: false }),
} as const
