/**
 * K1/Ü1'de tasarımda olup backend'de karşılığı olmayan öğelerin olguları (`designStub`, K13;
 * kimlikler `docs/backend-eksikleri/kayit.md`; koşul ortak-kurallar §3). Değerler yalnız
 * "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı) taşımaz (§4).
 * `false` alan arayüzde GİZLİDİR (kabul tablosu "gizli"); `—` yer tutucuları ilgili bileşendedir.
 */
import { designStub } from '@/shared/design-stub'

/** "Son etkinlik" (E-K1-40): audit okuma yok; rol kapsamlı okuma BE-091'e bağlı. */
export const RECENT_ACTIVITY = designStub('BE-010', { available: false })

/** Görev satırında dosya sayısı ve onaya sunuş zamanı (E-K1-15/16, E-Ü1-11): alan yok. */
export const ROW_FILES_AND_SUBMITTED = designStub('BE-137', {
  fileCount: false,
  submittedAt: false,
})

/** Görev satırında bekleyen bağımlılık özeti / kilit rozeti (E-K1-20/23/25, E-Ü1-15/17). */
export const ROW_DEPENDENCY_LOCK = designStub('BE-138', { available: false })

/** İade sebebi (E-Ü1-08/11): görev satırında/okuma ucunda yok. */
export const RETURN_REASON = designStub('BE-139', { available: false })

/** Tarih talebi zaman damgaları ve yönetici karar notu (E-K1-39). */
export const REQUEST_TIMES_AND_NOTE = designStub('BE-140', {
  createdAt: false,
  decidedAt: false,
  decisionNote: false,
})

/** Üyeye birim koordinatör adı (E-Ü1-21/31): `MyDepartment.coordinators[]` yok. */
export const UNIT_COORDINATOR_NAME = designStub('BE-141', { available: false })

/** Görev kısa kodu (E-K1-16/20/24/39, E-Ü1-11): kod yerine `—`. */
export const TASK_SHORT_CODE = designStub('BE-005', { available: false })
