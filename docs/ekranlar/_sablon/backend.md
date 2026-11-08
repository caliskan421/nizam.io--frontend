# <NN> — Backend eşlemesi (nereden geliyor)

Kaynak: `../../../../nizam.io--backend/docs/api/openapi.yaml` (pin `v0.11.0-api`), `istemci-akislari.md`, `error-codes.json`. İstemci uydurmaz; uyuşmazlık `eksikler.md`'ye gider.

## 1. Okuma uçları
| Kimlik | Öğe | operationId | Yol | Kapsam başlıkları / parametreler | Yanıt alanı → öğe | Sayfalama / tavan | Not |
|---|---|---|---|---|---|---|---|

## 2. Yazma uçları
| Kimlik | Eylem | operationId | Gövde alanları | expected_revision / Idempotency-Key | Başarı → yenilenecek sorgular | Hata kodları (error-codes.json) → ekran davranışı |
|---|---|---|---|---|---|---|

## 3. Eylem görünürlüğü (istemci-akislari.md §4)
| Kimlik | Eylem | Kim görür (satır no §4) | Koşul alanları (yanıt içinde) |
|---|---|---|---|

## 4. Türetilen değerler (istemcide hesap)
Sayaç, yüzde, gruplama vb. hangi yanıt alanlarından, hangi kuralla. Tavan/imleç nedeniyle yaklaşık olanlar işaretlenir.

## 5. Sorgu anahtarları ve geçersizleme
`scopedKey()` önerisi: hangi anahtar, hangi mutasyon sonrası geçersizlenir. Kapsam değişince iptal.

## 6. Sözleşme notları
İlgili `istemci-akislari.md` bölümleri (§ numaralarıyla), ADR/GAP/KR kimlikleri, sözleşmede dikkat çeken sınırlar (200 tavanı, imleç biçimi, tarih biçimi).
