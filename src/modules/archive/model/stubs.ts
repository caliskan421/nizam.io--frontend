/**
 * Arşivde tasarımda olup backend'de karşılığı olmayan öğelerin veri katmanı olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`). Değerler yalnız
 * "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı) taşımaz
 * (ortak-kurallar §4); UI işçileri bu olgularla devre dışı/statik `—` durumu kurar.
 */
import { designStub } from '@/shared/design-stub'

/**
 * Klasör özeti (BE-025, kısmi): görev sayısı, bayt toplamı ve son yükleme v0.21'de canlandı
 * (`ArchiveFolder`/`totals`); KALAN: depolama dağılımı çubuğu/listesi (E-06-23/24) — tür/etiket
 * bazlı bayt alanı yok (GAP-240 notu; `last_uploaded_at` da yükleme olay günlüğü değildir).
 */
export const FOLDER_SUMMARY = designStub('BE-025', { storageBreakdown: false })

/** Etiket oluşturma (E-06-19…21): kapalı küme, ağ isteği yok. */
export const CREATE_TAG = designStub('BE-024', { available: false })

/** Küçük resim / önizleme türevi (E-06-41, 49, 50): ızgarada yok; tam ekran devre dışı. */
export const THUMBNAIL = designStub('BE-026', { grid: false, fullscreen: false })
