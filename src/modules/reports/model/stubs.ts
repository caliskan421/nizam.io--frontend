/**
 * Raporlarda tasarımda olup backend'de karşılığı olmayan öğelerin veri katmanı olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`; koşul ortak-kurallar §3).
 * Değerler yalnız "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı)
 * taşımaz (§4). Çizim W138/W139'dadır; bu dosya yalnız kimlik ve olguyu sabitler.
 */
import { designStub } from '@/shared/design-stub'

/**
 * 01f önizlemesinin hedef şablonu (E-13-28, 31, 34…36): Gantt, iş yükü, görev detay kartları,
 * toplantılar ve dosyalar bölümleri statik yer tutucu; indirilen PDF v0.15 şablonudur.
 */
export const SEASON_TEMPLATE = designStub('BE-123', {
  gantt: false,
})

/** 01f kapak dönem aralığı ve detay bölümleri için dönem JSON'unda alan yok (E-13-21, 34…36). */
export const SEASON_DETAIL_FIELDS = designStub('BE-136', {
  periodRange: false,
  taskDetailCards: false,
  meetings: false,
  files: false,
})

/** "Rapor hazırlanıyor…": ilerleme yok — belirsiz şerit + "ilerleme yakında" (E-13-68). */
export const REPORT_PROGRESS = designStub('BE-131', { available: false })
