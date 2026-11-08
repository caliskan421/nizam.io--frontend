// Tasarımda olup backend'de karşılığı olmayan değerin işareti (yol haritası K13).
//
// Kullanım: `designStub('BE-001', türetilmişRenk)` — değer aynen döner; kimlik
// `docs/backend-eksikleri/kayit.md` satırına bağlanır. `tests/lint/design-stub.test.ts` koddaki
// her kimliğin kayıtta `açık`/`backend'de` durumunda, işlev eksiği (belge/faz/v1 dışı değil)
// olduğunu denetler; `bağlandı` kimlik kodda kalamaz (ortak-kurallar §3). Kimlik dize literali
// olmalıdır ve fonksiyon takma adla içe aktarılmaz (eslint `nizamio/sozdizimi-yasaklari`).
//
// Statik değer sahte işletme verisi olamaz (kişi adı, tarih, sayı yok — ortak-kurallar §4);
// görsel işaret (geliştirmede kesikli çerçeve) `shared/ui` `DesignStub` bileşenindedir.

/** Eksik kaydı kimliği: `BE-` + üç hane. */
export type DesignStubId = `BE-${number}`

export const DESIGN_STUB_ID_PATTERN = /^BE-\d{3}$/

/** Kimlik biçimi geçerli mi (`BE-NNN`). */
export function isDesignStubId(id: string): id is DesignStubId {
  return DESIGN_STUB_ID_PATTERN.test(id)
}

/**
 * Statik değeri eksik kaydı kimliğiyle işaretler ve aynen döndürür. Geliştirme yapısında biçimsiz
 * kimlik hatadır (üretimde maliyetsiz geçer; asıl denetim kayıt testindedir).
 */
export function designStub<T>(id: DesignStubId, value: T): T {
  if (import.meta.env.DEV && !DESIGN_STUB_ID_PATTERN.test(id)) {
    throw new Error(`designStub: geçersiz kimlik "${id}" (BE-NNN bekleniyor)`)
  }
  return value
}
