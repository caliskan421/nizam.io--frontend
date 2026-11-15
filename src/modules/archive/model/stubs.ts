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

/** Göreve bağsız yükleme (E-06-05): görev seçilmeden yükleme yok → pencere görev seçtirir. */
export const UNATTACHED_UPLOAD = designStub('BE-069', { available: false })

/** Etiket oluşturma (E-06-19…21): kapalı küme, ağ isteği yok. */
export const CREATE_TAG = designStub('BE-024', { available: false })

/** Küçük resim / önizleme türevi (E-06-41, 49, 50): ızgarada yok; tam ekran devre dışı. */
export const THUMBNAIL = designStub('BE-026', { grid: false, fullscreen: false })

/** Başka göreve/klasöre taşı (E-06-59). */
export const MOVE_FILE = designStub('BE-075', { available: false })

/** Silinen dosya geri yükleme (E-06-63): silme kalıcıdır, geri alma yok (BE-076 olgusu). */
export const RESTORE_FILE = designStub('BE-076', { available: false, permanentDelete: true })

/** Arama kapsamı (E-06-06/26): yalnız dosya adı; görev/kişi/etiket adı araması yok. */
export const SEARCH_SCOPE = designStub('BE-077', { fileNameOnly: true })
