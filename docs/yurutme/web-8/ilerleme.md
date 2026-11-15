# WEB-8 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F8 AÇILDI 2026-11-15** (ürün sahibi: "pin yükseltme + canlıya alma turu olsun"; P67 kesin). Kapsam [README](README.md)'de; kararlar P67 kesin, **P68–P74 koordinatör varsayılanı = geçici kabul (P6x taslak)** ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md)). F7 [KAPANDI](../web-7/ilerleme.md) (main `31c6ccc`). Pin şimdi `v0.15.0-api`; hedef `v0.23.0-api` ([plan](pin-yukseltme-v023.md)).

## Durum

| Oturum | Durum | main hash |
| --- | --- | --- |
| O1 W168 ‖ W169 | **W168 sürüyor** (`web8/o1-w168`: web-8 süreç belgeleri, pin planı v0.23, ortak-kurallar F8 eki, kayıt Bağ notları, yol haritası/README notları; yalnız belge); W169 canlıya alma matrisi (ekran grubu README'leri) paralel | taban `31c6ccc` |
| O2a W170 | bekliyor (pin WP1: tek PR, UI değişmez) | — |
| O2b W171–W175 | bekliyor (arşiv+ZIP, raporlar, K1/Ü1+görev kodu, silinenler, toplantılar+organizasyon CSV+bildirim sözlüğü) | — |
| O3 W176 | bekliyor (entegrasyon) | — |
| O4 W177 ‖ W178, Codex | bekliyor (belgeler; Docker gerçek backend `v0.23.0-api` tanığı; Codex 2–3 tur) | — |

## Kararlar

| # | Konu | Durum |
| --- | --- | --- |
| P67 | F8 = pin v0.23.0-api + canlıya alma turu; yeni ekran yok | **KESİN** (ürün sahibi 2026-11-15) |
| P68 | Kapsam ölçütü: yalnız v0.23'te karşılığı olan BE satırları canlanır; kısmi olanlarda yalnız gelen alan | geçici kabul (P68 taslak) |
| P69 | Pin tek PR'da (WP1), UI değişmez | geçici kabul (P69 taslak) |
| P70 | Canlıya alma sırası (a)–(e) | geçici kabul (P70 taslak) |
| P71 | Canlıya alma tanımı + kayıt kuralı | geçici kabul (P71 taslak); **W168 kararı:** [karşılanan satır kuralı](../../backend-eksikleri/README.md#karşılanan-satır-kuralı-f8) |
| P72 | Yeni artboard yok | geçici kabul (P72 taslak) |
| P73 | Gerçek backend e2e/Docker tanığı `v0.23.0-api` imajıyla | geçici kabul (P73 taslak) |
| P74 | Sohbet/bildirimde `work.task.reminder` dışında değişiklik yok; BE-F7 sonra | geçici kabul (P74 taslak) |

## Kayıtlar

### F8 açıldı — O1 (2026-11-15)

- **Keşif** (`v0.15.0-api` → `v0.23.0-api`): uç 189 → 248, yol 147 → 199, şema 233 → 326, hata kodu 194 → 227 (+33), 181 commit; kırıcı: `actor` enum `sirket_yoneticisi`, `MyDepartment.role` daraldı, rapor dağılım şemaları kapalı, `createMeeting` 200/404, ~45 şemada yeni zorunlu yanıt alanı. Ayrıntı: [pin planı §Envanter](pin-yukseltme-v023.md#wp1-envanter).
- **W168** (bu dal): README, ilerleme, ortak sözleşme (KESİN 1–36), oturum iskeletleri, pin planı v0.23, ortak-kurallar §5 F8 eki + §12 P67–P74, kayıt Bağ notları (`kayit.md`), `backend-eksikleri/README` kuralı, yol haritası §4, ekranlar README ve tasarım README notları.
- Hash'ler ve PR numaraları oturumlar kapandıkça eklenir.

## Borçlar

Hiçbiri F8'in kapsamını kendiliğinden genişletmez. Sınıflar: **W167** (paralel borç turu, F8'den bağımsız), **kapanış sonrası borç**, **F9 adayı**, **açık BE**, **kapandı**. Kaynak: [web-7 ilerleme](../web-7/ilerleme.md) (numaralar orada).

### F7'den devreden

| # | Borç / not | Sınıf | Kaynak |
| --- | --- | --- | --- |
| 1 | Gerçek cihaz ekran okuyucu (VoiceOver) ve kullanıcı görsel onayı: F7 ve önceki fazlar için yapılamadı; sessiz geçilmez (KESİN 32) | kapanış sonrası borç | web-7 #1, #29 |
| 2 | Kararsız testler (`password.test.ts`, `archive/api/lifecycle.test.ts`, yük altında tam paket): bölme | W167 | web-7 #2 |
| 3 | Ü1 iade/onay/tarih notları ve K1 ApprovalsCard sayacı pending dışı kısmi kümede "≥" almıyor | kapanış sonrası borç | web-7 #3 |
| 4 | Soğuk `?gorev=` derin bağlantıda hedef birim/kapsam çözümleme UX borcu (P55) | UX borcu açık | web-7 #4 |
| 5 | Gerçek backend'de gezinme sonrası K/Ü mercek-parametre tanığı yok | kapanış sonrası borç (W178 kapsamına eklenebilir) | web-7 #5 |
| 6 | Ağır okuyucu bekleme denetimi `useReportSeason` içinde; yeni ağır okuyucu aynı denetimi yapar | uygulama notu | web-7 #6 |
| 7 | ZIP onayı (E-13-10), 390 px ZIP düğmesi (E-13-12), dosya boyutu (E-13-72), kâğıt ölçüsü, iade gerekçesi (E-K1-17/18): backend karşılığı v0.21/v0.22'de **geldi** (BE-120/124/139) → W171/W172/W173'te canlanır | F8 (canlıya alma) | web-7 #9 |
| 8 | 09/05 sayfalarına "oluştur" URL parametresi (01 kutucukları), ek önizleme penceresi | F9 adayı | web-7 #10, #17 |
| 9 | "Şimdi değil" 14 gün kalıcı (`push.snoozeUntil`), `unregisterPushTarget` çıkışta, `up.sh` parametrik, `manifest.webmanifest` + `apple-touch-icon`, `topbar-dot*`, pin olayı testi, Ö-03 sökülme testi | W167 | web-7 #8, #12, #13, #21, #27 |
| 10 | Safari/iOS/Firefox push, `notificationclick` OS bildirimi, `typing` hız kovası, CDN arkası SSE kanıtı yok | kapanış sonrası borç | web-7 #11, #14, #29 |
| 11 | Ters vekil `flush_interval -1` + ≥6 dk okuma zaman aşımı (SSE) | deploy borcu (SAHİPLİK-DIŞI) | web-7 #15 |
| 12 | Okunmamış ayırıcı `unread_count`'tan yaklaşık (BE-082); sahte akış düzeneği | kapanış sonrası borç (düşük) | web-7 #20 |
| 13 | Otomatik izin tetiği (03/03c kancası; E-14-64) | F9 adayı | web-7 README |
| 14 | Sohbet/bildirim BE: BE-027/028/029, BE-080…086, BE-142…156, BE-160…162 | açık BE (BE-F7) | [rapor-F7](../../backend-eksikleri/rapor-F7.md) |
| 15 | Duman konsolu: sahte uç 404 ve incognito Push uyarısı ürün hatası değil; "konsol hatası 0" diye sunulmaz | uygulama notu | web-7 #26 |

### F8'de doğan

Henüz yok (W170'ten itibaren eklenir).

## Açık sorular

[README §Açık sorular](README.md#açık-sorular): BE-F7 etiketi ne zaman alınır; F9 adayları. Karar bekleyen başka ürün sorusu yok (P68–P74 geçici kabul; ürün sahibi itiraz ederse değişir).
