/**
 * Arşivde tasarımda olup backend'de karşılığı olmayan öğelerin veri katmanı olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`). Değerler yalnız
 * "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı) taşımaz
 * (ortak-kurallar §4); UI işçileri bu olgularla devre dışı/statik `—` durumu kurar.
 */
import { designStub } from '@/shared/design-stub'

/** Etiket oluşturma (E-06-19…21): kapalı küme, ağ isteği yok. */
export const CREATE_TAG = designStub('BE-024', { available: false })

/** Tam ekran önizleme (E-06-50). */
export const FULLSCREEN_PREVIEW = designStub('BE-026', { available: false })
