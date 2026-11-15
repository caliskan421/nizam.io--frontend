/**
 * K1/Ü1'de tasarımda olup backend'de karşılığı olmayan öğelerin olguları (`designStub`, K13;
 * kimlikler `docs/backend-eksikleri/kayit.md`; koşul ortak-kurallar §3). Değerler yalnız
 * "kullanılabilir mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı) taşımaz (§4).
 * `false` alan arayüzde GİZLİDİR (kabul tablosu "gizli"); `—` yer tutucuları ilgili bileşendedir.
 */
import { designStub } from '@/shared/design-stub'

/** "Son etkinlik" (E-K1-40): audit okuma yok; rol kapsamlı okuma BE-091'e bağlı. */
export const RECENT_ACTIVITY = designStub('BE-010', { available: false })

/** Üyeye birim koordinatör adı (E-Ü1-21/31): `MyDepartment.coordinators[]` yok. */
export const UNIT_COORDINATOR_NAME = designStub('BE-141', { available: false })
