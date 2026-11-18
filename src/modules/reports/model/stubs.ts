/**
 * Raporlarda tasarımda olup backend'de karşılığı olmayan öğelerin veri katmanı olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`; koşul ortak-kurallar §3).
 * Değerler yalnız "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı)
 * taşımaz (§4). Çizim W138/W139'dadır; bu dosya yalnız kimlik ve olguyu sabitler.
 */
import { designStub } from '@/shared/design-stub'

/** "Rapor hazırlanıyor…": ilerleme yok — belirsiz şerit + "ilerleme yakında" (E-13-68). */
export const REPORT_PROGRESS = designStub('BE-131', { available: false })
