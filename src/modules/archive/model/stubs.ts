/**
 * Arşivde tasarımda olup backend'de karşılığı olmayan öğelerin veri katmanı olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`). Değerler yalnız
 * "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı) taşımaz
 * (ortak-kurallar §4); UI işçileri bu olgularla devre dışı/statik `—` durumu kurar.
 */
import { designStub } from '@/shared/design-stub'

/** Etiket oluşturma (E-06-19…21): kapalı küme, ağ isteği yok. */
export const CREATE_TAG = designStub('BE-024', { available: false })

/** Küçük resim / önizleme türevi (E-06-41, 49, 50): ızgarada yok; tam ekran devre dışı. */
export const THUMBNAIL = designStub('BE-026', { grid: false, fullscreen: false })
