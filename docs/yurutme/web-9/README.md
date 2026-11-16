# WEB-9 — pin v0.25.0-api ve sohbet/bildirim canlıya alma turu

**F9 AÇILDI — 2026-11-16 karar (P77), 2026-11-17 yürütme; kapsam 2026-11-17'de v0.25'i de içerecek şekilde güncellendi (P84).** Ürün sahibi: «pinden dolayı pasif kalan özellikler varsa … bunu yükseltelim» (P77), «F9 planını v0.25'i de kapsayacak şekilde güncelle» (P84). F8 [KAPANDI](../web-8/README.md) (main `a48a3e78`, CI 43875579510 SUCCESS). Kararlar: [ortak-kurallar §12](../../ekranlar/ortak-kurallar.md) (P77, P84 KESİN; P78–P83 koordinatör varsayılanı, geçici kabul). Süreç: [ortak sözleşme](ortak-sozlesme.md) (KESİN 1–37). Model düzeni (2026-11-17): işçi Sonnet, test Terra, bağımsız denetçi Opus, koordinasyon Codex.

## Neden bu tur

Pin `v0.23.0-api` iken backend `v0.24.0-api` (BE-F7: sohbet/bildirim) ve aynı gün `v0.25.0-api` (BE-F7b) etiketlerine gitti: uç 248 → 261 (+13), şema 326 → 348 (+22), hata kodu 227 → 227. v0.24 sohbet/bildirim eksiklerinin büyük kısmını, v0.25 kalanları karşıladı (GAP-242/243/244/245/247 kapandı; yalnız GAP-246 karar geri alma ürün kararıyla kalıcı). F8'de sohbet/bildirim stub'ları (15) kalmıştı (P74). F9 iki iştir: (a) pini yükseltmek (tek PR, UI değişmez), (b) etiketle karşılanan sohbet/bildirim parçalarını canlandırmak. Eşleme ve doğrulama: [canlıya alma matrisi](canliya-alma-matrisi.md), [oturum-1-keşif](oturum-1-kesif.md); düzeltilen v0.24 varsayımları (rapor-F8 §6a tarihsel kalır): matris §5.

## Kapsam

**(a) Pin `v0.25.0-api` — WP1 = W182, tek PR, UI değişmez (P80, KESİN 36/37).** `api-pin.json` + `pnpm gen:api` + sohbet/bildirim varsayılan üreticileri (`defaults.ts`) + kırıcı/uyum farkları (`Chat.source`/`auto_kind` `coordinators`, `ChatMessage.forwarded_from`, anket `anonymous`/`mine`, `Notification` zorunlu alanlar, `awaiting_count`, `unread-count` şekli) ayrı commit/test + `e2e/backend/up.sh` + deploy etiketi. Ayrıntı: [pin-yukseltme-v025](pin-yukseltme-v025.md). Ara `v0.24` pini yoktur.

**(b) Canlıya alma — O2b (P81, P83/P84).** Her satır: `designStub` ve geçici istemci yolu kaldırılır, kayıt Bağ güncellenir, E-satırı kanıtı yazılır, gerçek uç testi + "eski yol yok".

| W | İş | BE kimlikleri (tam) |
| --- | --- | --- |
| W183 | **Sohbet A:** sunucu süzgeçleri + `total`, okunmamış ayırıcı/`first_unread_seq`/liste tiki, son mesaj türü, alıntıya git (`reply_to.seq`), "Koordinatörler" grubu, sohbet sessize al (liste yüzü) | BE-081, 082, 086, 162, 160, 027† |
| W184 | **Sohbet B:** rol rozeti/üye alt yazısı, grup bilgisi sayaçları + ekler + görev bağları, mesajdan görev kartı, mesaj bilgisi (kim okudu) + grup tiki, sohbet bildirim seviyesi (ayar yüzü) | BE-083, 084, 085, 028, 027† |
| W185b | **Sohbet C (yeni işçi önerisi):** mesajı ilet (hepsi ya da hiçbiri), dosyayı görev arşivine kaydet, anonim anket | BE-080, 029, 161 |
| W185 | **Bildirimler:** satır sözlüğü (18 tür), hedef çözümleme (P55 soğuk bağlantı, sohbet/program hedefi), "Senden bekleyen" + `awaiting_count`, süzgeçler, satır içi karar, konu durumu, birleştirme (yığın avatar), zamanlı türler, saklama etiketi, kaldır/konu sessize alma | BE-142, 143, 144, 145, 146, 148, 149, 154, 155, 156 |

† BE-027 W183 (liste), W184 (ayar) ve W185 (bildirim zinciri) işlerine bölünür; kayıt `bağlandı` yalnız W185 tamamlandığında.

**(c) Kalır (kod/kayıt değişmez):** BE-147 (GAP-246 kabul edilmiş sınır), BE-150 (Tablolar), BE-151/152/153 (Ü7 profil: olay×kanal matrisi, cihaz listesi, sessiz saat).

**(d) DIŞI (P77, P84):** yeni ekran yok. Tablolar (GAP-224), 01b (BE-091), Ü7 profil, Takvim, Kurumsal hafıza, Ü2–Ü7/K2–K8 panelleri, Asistan; **v0.25 karşılıkları F10'a bırakılmaz** (P84). P86 ile W184 mevcut görev detayına kaynak mesaj bağlantısını, W185 mevcut bildirim paneline sessize alınan konular alt görünümünü ortak bileşenlerle ekler; ayrı sayfa/artboard yoktur.

**SSE (P82, KESİN 34):** sohbet olayı yalnız `shared/sse`; yeni SSE olay türü yok; bildirimlerde SSE yok. Sohbet mesajı artık kalıcı bildirim zinciri üretir (ADR-0050) — zil/liste pencere odağı + aralıklı tazelemeyle yenilenir.

## Sıra ve roller

Her W ayrı worktree ve dal (`web9/<oturum>-<wid>`); [ortak sözleşme](ortak-sozlesme.md) geçerlidir; eşzamanlı en çok 2 işçi (P78). Hiçbir işçi push/PR açmaz.

| Oturum | İş | İşçi |
| --- | --- | --- |
| **O1** ([keşif](oturum-1-kesif.md)) | **W181** web-9 belgeleri, matris, pin planı v0.25, ekran README F9 ekleri, kayıt Bağ hedefleri, ortak-kurallar P77–P84, yol haritası | W181 |
| **O2a** | **W182** pin v0.23 → v0.25 (WP1), UI değişmez | W182 |
| **O2b** | **W183 ‖ W184** (sohbet A/B), sonra **W185b ‖ W185** (sohbet C / bildirimler); W185b W184 dalından (`MessageMenu.vue`) | W183, W184, W185b, W185 |
| **O3** | **W186** entegrasyon: `chat-*`/`notifications-*`, e2e güncellemesi, tek duman 390+1440 koyu (10, 10b, 10c, 14 panel) | W186 |
| **O4** | **W187** belgeler (`rapor-F9`, ilerleme/oturum-4, `WEB-9-codex.md` iskeleti, web-10 "F10 AÇILMADI") ‖ **W188** Docker + gerçek backend **v0.25.0-api** tanığı (`dogrulama-F9.md`) → Codex (en çok 2 tur, P78) → kapanış PR | W187, W188, Codex |

## Başlatma koşulları (karşılandı)

1. Kullanıcı kararı ✓ (P77 2026-11-16; P84 2026-11-17).
2. F8 kapalı ✓ (kapanış PR #168 MERGED, main `a48a3e78`; açık PR/worktree yok).
3. Etiket kapısı: **`v0.25.0-api` sabit** (KESİN 37a).

## Açık sorular

Matris §6 ve [oturum-1-keşif §6](oturum-1-kesif.md#6-açık-sorular-ürün-sahibine-f9u-bloklamaz): P86 ile ters bağ ve sessize alınan konular mevcut yüzeylerde kapsama alındı; adet tavanı 200 grup, sessiz sohbet sayacı sunucu yanıtından aynen okunur, daha yeni etiket bu faza otomatik alınmaz. F8'den devreden: ADR-0041 ŞY aktör kararı ve E-03C-22 ([ilerleme #17, #18](../web-8/ilerleme.md)).

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| README.md | Bu belge (F9 açıldı; kapsam, sıra, açık sorular) |
| [ilerleme.md](ilerleme.md) | Durum tablosu, kararlar P77–P84, kayıtlar, borç devri |
| [ortak-sozlesme.md](ortak-sozlesme.md) | Her uygulayıcı isteminin başına eklenen sözleşme (KESİN 1–37) |
| [pin-yukseltme-v025.md](pin-yukseltme-v025.md) | WP0–WP4, yeni uçlar, kırıcı farklar, fixture stratejisi |
| [canliya-alma-matrisi.md](canliya-alma-matrisi.md) | 28 BE satırı: stub → v0.25 → E-satırı → W, dosya kesişimi, düzeltmeler |
| [oturum-1-kesif.md](oturum-1-kesif.md) | Etiket doğrulaması, fark özeti, GAP durumu, açık sorular |
| [rapor-F8](../../backend-eksikleri/rapor-F8.md) | Backend devir raporu (tarihsel; v0.24 eşlemesi matris §5'te düzeltildi) |
