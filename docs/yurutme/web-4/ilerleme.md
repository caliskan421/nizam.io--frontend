# WEB-4 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F4 ürün sahibinin uyarısı/onayı olmadan AÇILMAZ.** Onay henüz verilmedi (2026-11-10 itibarıyla); bu dosya WEB-3 O4'te hazırlanan iskelettir.

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| O1 — F4 kabul tablosu (09) | **Geçici kabul** (2026-11-10, WEB-3 O4: E-09-01…84 dolu; F4-S1…S10 ürün sahibi cevabı bekliyor) | — |
| O2a — Toplantılar veri katmanı (W101) | Bekliyor (F4 onayı yok) | — |
| O2b — Liste, detay + gündem, notlar, katılımcılar, pencereler (W102–W106) | Bekliyor | — |
| O3 — Entegrasyon turu (W107) | Bekliyor | — |
| O4 — Kapanış | Bekliyor | — |

## Devralınan (WEB-3 O4)

- **Ürün onayı (açık):** F4 geçişi ve **F4-S1…S10** (`../../ekranlar/09-toplantilar/README.md` "Açık sorular"): video şeridi/Canlı-Bekliyor/09d-09e, sağlayıcı adı, kişi seçici, "Kişiler" davet modu, düzenle formu, dosyalar, tarih metni, not sınırı, tarih süzgeci, yetki kaynağı. Cevapsız → önerilen varsayılan geçici kabul.
- **Kapı:** WEB-3 O4 Codex kapısı ve `dogrulama-F3.md` beklenir (`../web-3/ilerleme.md` "Bekleyen"); WEB-3 açık 5 "geçici kabul" satırı (03c E-03C-19, 27, 41, 63, 68) F4'ü bloklamaz.
- **Backend:** `../../backend-eksikleri/rapor-F3.md` §4 — Paket 4.1 (BE-021) + BELGE (BE-036 madde 7) önce; pin hâlâ `v0.11.0-api` olabilir → tablo "Şimdilik" yolları. Pin yükseldiyse `rapor-F3.md` §2 (F3 web adımları) ayrı küçük PR olarak F4'ten önce.
- **F3 borçları (F4'ü etkilemez, izlenir):** 05 panel kapanışında odak satıra dönmez; ekran okuyucu gerçek cihaz denemesi yapılmadı; `GanttView.vue` 250 satır sınırında; 03d alt görev bloğu kısa kayma (BE-051); W97b (12) kararı.
- **Yeni KESİN kurallar:** [ortak-sozlesme.md](ortak-sozlesme.md) 28–32 (bağlama noktası istemde adıyla, türev sayaç/rozet geçersizleme, dar ekran etkileşimli duman, tek kaynak alan, sınırdaki dosya/test süresi).

## Kayıtlar

(henüz kayıt yok)
