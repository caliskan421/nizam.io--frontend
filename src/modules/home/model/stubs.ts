/**
 * 01 F6 koordinatörlük kartında tasarımda olup backend'de karşılığı olmayan öğelerin olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`). Değerler yalnız "kullanılabilir
 * mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı) taşımaz (ortak-kurallar §4).
 */
import { designStub } from '@/shared/design-stub'

/** Kart "arşiv" sayısı (E-01-37): yönetici için S3 başlığı yok (P33) → sayı `—`, bağlantı 06/07. */
export const CARD_ARCHIVE_COUNT = designStub('BE-072', { available: false })

/** Kart "Son yükleme" satırı (E-01-38) ve "Son yükleme" sıralama ölçütü (E-01-26). */
export const CARD_LAST_UPLOAD = designStub('BE-025', { available: false })

/** Kart durum çubuğu: "onayda" ve "iade" ayrı sayılamaz (E-01-33/34) → tek nötr artık dilim. */
export const CARD_APPROVAL_SPLIT = designStub('BE-078', { separate: false })

/** Kart avatar yığını: bütün üyelerin avatarı yok (E-01-31) → koordinatörler + "+N üye". */
export const CARD_MEMBER_AVATARS = designStub('BE-079', { allMembers: false })
