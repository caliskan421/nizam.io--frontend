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
- **Kapı:** F3 KAPANDI 2026-11-10 — Codex tur 2 KOŞULLU UYGUN (HEAD `768f22b`; `../../reviews/WEB-3-codex.md`); `dogrulama-F3.md` tamam. WEB-3'ten açık "geçici kabul": 03c E-03C-27, 41 (görsel nihai kabul, ürün sahibi onayı) — F4 borcu, F4'ü bloklamaz. **F4'e aktarılan borçlar:** Ö-07 gerçek ekran okuyucu, K-04 05 odak dönüşü, E-03C-27/41 görsel nihai kabul. **Pin aşamasına devredilen koşullar (F4'ten önce, ilk iş):** Codex CX-F3-Ö-03 (ARIA alt satır `aria-rowindex`/sıra), Ö-04 (sürükleme ön okumasında kapsam değişimi), Ö-08 (ortak `useProtectedMutation` başarı bekleyişinde sahip yarışı); kabul ölçütleri `../../backend-eksikleri/rapor-F3.md` §2 ve `../../reviews/WEB-3-codex.md` tur 2.
- **Backend / F4 ön koşulu — pin aşaması (AÇIK, henüz yapılmadı; `api-pin.json` hâlâ `v0.11.0-api`):** `v0.13.0-api`…`v0.15.0-api` yayımlandı; ürün sahibi: F3 `v0.11.0-api` ile kapanır, pin yükseltmesi **F3 kapandıktan sonra F4'ten önce ayrı aşama** (kendi Codex kapısı; `../../backend-eksikleri/rapor-F3.md` §2). Backend notları: kesilme `X-Result-Truncated` başlığından; uzatma tekrarında `replayed:true`, `dates_revision` ilk sonuç; aktarım kimliği `fields[field=account_id]` `message`. `../../backend-eksikleri/rapor-F3.md` §4 — Paket 4.1 (BE-021) + BELGE (BE-036 madde 7); 09 tablosunun "Şimdilik" yolları pin aşamasından sonra yeniden okunur.
- **F3 borçları (F4'ü etkilemez, izlenir):** 05 panel kapanışında odak satıra dönmez; ekran okuyucu gerçek cihaz denemesi yapılmadı; `GanttView.vue` 250 satır sınırında; 03d alt görev bloğu kısa kayma (BE-051); W97b (12) kararı.
- **Yeni KESİN kurallar:** [ortak-sozlesme.md](ortak-sozlesme.md) 28–32 (bağlama noktası istemde adıyla, türev sayaç/rozet geçersizleme, dar ekran etkileşimli duman, tek kaynak alan, sınırdaki dosya/test süresi).

## Kayıtlar

(henüz kayıt yok)
