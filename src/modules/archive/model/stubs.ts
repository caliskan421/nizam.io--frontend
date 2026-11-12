/**
 * Arşivde tasarımda olup backend'de karşılığı olmayan öğelerin veri katmanı olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`). Değerler yalnız
 * "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı) taşımaz
 * (ortak-kurallar §4); UI işçileri bu olgularla devre dışı/statik `—` durumu kurar.
 */
import { designStub } from '@/shared/design-stub'

/** Yönetici merceği: klasör düzeyi "Son eklenen dosyalar" ve "Tüm arşivde ara" (P33, E-06-06/26/38). */
export const ADMIN_FOLDER_LEVEL = designStub('BE-072', {
  recentFiles: false,
  globalSearch: false,
  /** Boş durum metni anahtarı: "Görev klasörü seçin". */
  emptyKey: 'archive.admin.selectTask',
})

/** Klasör özeti: görev sayısı, bayt toplamı, son yükleme, depolama dağılımı (E-06-12…14, 22…24). */
export const FOLDER_SUMMARY = designStub('BE-025', {
  taskCount: false,
  totalBytes: false,
  lastUploadedAt: false,
  storageBreakdown: false,
})

/** Göreve bağsız yükleme (E-06-05): görev seçilmeden yükleme yok → pencere görev seçtirir. */
export const UNATTACHED_UPLOAD = designStub('BE-069', { available: false })

/** Dosya yükleme tarihi (E-06-55): alan yok, tarih tahmin edilmez. */
export const UPLOAD_DATE = designStub('BE-070', { available: false })

/** Yükleyen adı arşiv listesinde yok (E-06-54): yalnız önizlemede `listWorkItemFiles` ile. */
export const UPLOADER_NAME_IN_LIST = designStub('BE-071', { available: false })

/** Süzülmüş toplam (E-06-38/46): süzgeçlide "n+" yaklaşık. */
export const FILTERED_TOTAL = designStub('BE-073', { available: false })

/** Etiket oluşturma (E-06-19…21): kapalı küme, ağ isteği yok. */
export const CREATE_TAG = designStub('BE-024', { available: false })

/** Küçük resim / önizleme türevi (E-06-41, 49, 50): ızgarada yok; tam ekran devre dışı. */
export const THUMBNAIL = designStub('BE-026', { grid: false, fullscreen: false })

/** Etiketi değiştir (E-06-58). */
export const RETAG_FILE = designStub('BE-074', { available: false })

/** Başka göreve/klasöre taşı (E-06-59). */
export const MOVE_FILE = designStub('BE-075', { available: false })

/** Silinen dosya geri yükleme (E-06-63): silme kalıcıdır, geri alma yok (BE-076 olgusu). */
export const RESTORE_FILE = designStub('BE-076', { available: false, permanentDelete: true })

/** Arama kapsamı (E-06-06/26): yalnız dosya adı; görev/kişi/etiket adı araması yok. */
export const SEARCH_SCOPE = designStub('BE-077', { fileNameOnly: true })
