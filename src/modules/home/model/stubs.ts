/**
 * 01 F6 koordinatörlük kartında tasarımda olup backend'de karşılığı olmayan öğelerin olguları
 * (`designStub`, K13; kimlikler `docs/backend-eksikleri/kayit.md`). Değerler yalnız "kullanılabilir
 * mi" olgusudur: sahte işletme verisi (sayı, tarih, kişi adı) taşımaz (ortak-kurallar §4).
 */
import { designStub } from '@/shared/design-stub'

/** Kart durum çubuğu: "onayda" ve "iade" ayrı sayılamaz (E-01-33/34) → tek nötr artık dilim. */
export const CARD_APPROVAL_SPLIT = designStub('BE-078', { separate: false })

/** Kart avatar yığını: bütün üyelerin avatarı yok (E-01-31) → koordinatörler + "+N üye". */
export const CARD_MEMBER_AVATARS = designStub('BE-079', { allMembers: false })
