/**
 * Raporlarda tasarımda olup backend'de karşılığı olmayan öğelerin veri katmanı olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`; koşul ortak-kurallar §3).
 * Değerler yalnız "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı)
 * taşımaz (§4). Çizim W138/W139'dadır; bu dosya yalnız kimlik ve olguyu sabitler.
 */
import { designStub } from '@/shared/design-stub'

/**
 * Gantt bağımlılık okları ve içindekiler sayfa numaraları (E-13-28; GAP-239): PDF'te de önizlemede
 * de yoktur (karar: oklar çizilmez). Gantt çubukları ve iş yükü pin v0.23.0-api ile canlıdır
 * (`ganttModel`, `workload_summary`); kalan boşluk yalnız oklardır.
 */
export const SEASON_TEMPLATE = designStub('BE-123', {
  gantt: false,
})

/** "Rapor hazırlanıyor…": ilerleme yok — belirsiz şerit + "ilerleme yakında" (E-13-68). */
export const REPORT_PROGRESS = designStub('BE-131', { available: false })
