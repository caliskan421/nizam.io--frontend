# WEB-7 — sohbet, bildirim paneli ve gerçek zamanlı altyapı

**F7 KAPANDI — 2026-11-15 (bu kayıt kapanış PR’ının CI başarılı birleşmesiyle yürürlüğe girer).** W166 [#152](https://github.com/caliskan421/nizam.io--frontend/pull/152) main `ffc29374465e78c8da08ff43f4bf5d2b185144bb` ile birleşti; [CI 43644068102](https://github.com/caliskan421/nizam.io--frontend/actions/runs/43644068102) kalite, web imajı ve gerçek backend Playwright işlerinin üçünde de **SUCCESS**. CI test toplamı ayrıca alınamadı; sayı iddia edilmez. Codex dört turu: tur 1 UYGUN DEĞİL; tur 2 ve tur 3 KOŞULLU UYGUN; tur 4 yalnız Ö-06/Ö-07 düzeltme doğrulaması UYGUN (`68deaa9`), test-only `dc876ed` ek incelemesinde UYGUN korundu. Önceki koşullar kapalı; tur 4 bütün F7’yi baştan denetlemedi. Kapanış kaydı bu belge PR’ı ile teslim edilir; geçerlilik şartı CI SUCCESS ve MERGED, birleşme kanıtı GitHub PR kaydıdır. F8 AÇILMADI; backend paketi ve pin `v0.15.0-api` değişmedi. [Hüküm ve sınırlar](../../reviews/WEB-7-codex.md).

**F7 açılışı:** 2026-11-14 (P54, “F7’yi aç, backend dursun”). W162 gerçek sunucu tanığı #148, W163 #149, W164 #150 ve W165 #151 main’de. P57–P66 kesin: P58 Web Push dahil, P60 backend kazanır, P57 sade liste. Eksikler statik/devre dışı/gizli + BE kaydı olarak kalır. [Ortak sözleşme](ortak-sozlesme.md), [ilerleme](ilerleme.md).

## Kapsam (P54)

- **(a) Sohbet — 10, 10b, 10c** ([10-mesajlar](../../ekranlar/10-mesajlar/README.md), W151 tespiti): sohbet listesi + kabuk, konuşma akışı + yazma, pencereler + ekler + anket; SSE ile canlı akış (K8); 10-mesajlar açık sorularının koordinatör varsayılanı P61, yönetici merceği P64, dar ekran P62, kilitli kart P60 (onaylandı: backend kazanır, kilit çizilmez).
- **(b) Bildirim paneli — 14** ([14-bildirimler](../../ekranlar/14-bildirimler/README.md), W152 tespiti): `listNotifications` imleçli, okundu/tümünü okundu; metinsiz yanıt için istemci sözlüğü şablonu (P57); "Senden bekleyen", satır içi karar, tercihler, cihazlar, sessiz saatler statik/devre dışı/gizli.
- **(c) Kabuk:** menüde **Mesajlar** öğesi üç rolde görünür + `unread_chats` rozeti (E-00-20/21, P59); zil paneli canlı (E-00-38); **SSE altyapısı** (`shared/sse`, KESİN 34); bildirimlerde SSE yok.
- **(d) Web Push (P58 dahil) ve DIŞI listesi:** panel içi Web Push önerme kutusu + izin akışı + `public/sw.js` F7'ye DAHİL (W159 uygulaması; gerçek Chrome/FCM teslimi W162 ile kanıtlandı). **F7 DIŞI:** Takvim, Kurumsal hafıza, profil sayfası (Ü7) ve bildirim tercihleri/cihazlar/sessiz saatler (P63), Ü2–Ü7, K2–K8, Asistan, 01b işlem geçmişi, Tablolar, pin yükseltmesi.

**Tasarım:** v85/v87 kopyası ([tasarım README](../../tasarim/README.md)): Mesajlar (10, 10b, 10c, A3) ve `Bildirimler` artboard'ları; **dar ekran çizimi yok** (P62 → KESİN 30 tek sütun akış).

## Sıra ve roller

Güncel kullanıcı onaylı Codex devralma ve tarihsel Fable/Sonnet dağılımı [O4 Roller](oturum-4-kapanis.md#roller) bölümünde kayıtlıdır. Her W ayrı worktree/dal (`web7/<oturum>-<wid>`); [ortak sözleşme](ortak-sozlesme.md) geçerlidir. Her geçiş öncekinin yeşil CI ve MERGED kanıtını bekler.

| Oturum | İş | İşçi |
| --- | --- | --- |
| **O1** ([hazırlık](oturum-1-hazirlik.md)) | W151 10-mesajlar tespiti ‖ W152 14-bildirimler tespiti ‖ W153 kararlar, ortak-kurallar F7 eki, web-7 süreç belgeleri (yalnız belge) | W151, W152, W153 |
| **O2a** ([plan](oturum-2-uygulama.md)) | **W154 veri katmanı:** `shared/sse`, `modules/chat` api/model/public, `modules/notifications` api/model, `query-keys`, rotalar F7, `CURRENT_PHASE` F7, menü Mesajlar + `MenuBadgeKind 'unread'` | W154 |
| **O2b** | paralel UI: **W155** sohbet listesi + kabuk · **W156** konuşma akışı + yazma · **W157** pencereler + ekler + anket · **W158** bildirim paneli + zil · **W159** Web Push (P58 dahil, son işçi) | W155–W159 |
| **O3** ([entegrasyon](oturum-3-entegrasyon.md)) | **W160** zorunlu entegrasyon turu (gerçek router/AppShell/oturum, durumlu sahte sunucu, SSE akışı, TASLAK satırları) | W160 |
| **O4** ([kapanış](oturum-4-kapanis.md)) | **W161** belgeler (rapor-F7, kapanış) ‖ **W162** Docker gerçek backend tanığı (SSE gerçek akış, 429/çakışma) → W163–W166 düzeltmeleri ve Codex dört tur → kapanış belge PR | W161, W162, Codex |

## Ürün sahibine açık sorular

1. **Karar verildi (P54):** F7 sohbet + bildirimlerle açıldı; rol panelleri sonraki faz.
2. **Karar verildi (P54):** Takvim ve Kurumsal hafıza F7 DIŞI.
3. **Karar verildi (P54):** profil sayfası F7 DIŞI; bildirim tercihleri P63 ile DIŞI.
4. **Karar (BE paketi): kapandı — "backend dursun"** (BE paketi açılmaz; 01b audit okuma BE-030/BE-091/BE-010 dahil sonraki karar). (Eski soru: 01b işlem geçmişi için audit okuma backend paketi açılsın mı?)
5. **Kapandı — "backend dursun" F7'de de sürer** (kullanıcı 2026-11-14); F7 kapsamı yalnız mevcut uçlarla sınırlıdır.
6. **Karar verildi (P55, P56):** derin bağlantı AÇILIR; soğuk bağlantı UX borcu açık ([ilerleme #22](../web-6/ilerleme.md)); program seçici böyle kalır.
7. **Kapandı (P66):** duman betikleri senaryo başına ayrı `results-<senaryo>.json` → KESİN 33.
8. **Karar verildi (P58 dahil, 2026-11-14):** Web Push F7'ye dahil; W159 uygulanır.
9. **Karar verildi (P60 backend, 2026-11-14):** backend kazanır, kilit çizilmez (MESSAGING-K31/K32); `available:false` "artık yok" kartı.
10. P57 (bildirim sade liste kabul, 2026-11-14), P59, P61–P65 koordinatör varsayılanıydı; P57–P66 hepsi KESİN (W153b).

## Aday kapsam (F7 dışı kalanlar ve devredenler)

> **F8 notu (2026-11-16):** devreden borçların W167 kısmı (kararsız testler, manifest, `push.snoozeUntil`, `unregisterPushTarget`, `up.sh`, `topbar-dot*`) F8'de kapandı; BE-F7 `v0.24.0-api` çıktı (F9 önerisi [web-9](../web-9/README.md)). Güncel durum [web-8 ilerleme](../web-8/ilerleme.md).

**F7'de olanlar:** Mesajlar (10, 10b, 10c) ve Bildirimler (zil paneli; Web Push P58 dahil). Aşağıdaki tablonun diğer satırları F7 DIŞIDIR (sonraki faz) ve aday listesi olarak kalır. Tuvale sonradan eklenen ekranlar ve F6'dan devreden satırlar aşağıdadır.

| Aday                                                             | Tasarım artboard / ekran grubu                                                 | Not (kaynak)                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Üye panelleri Ü2–Ü7                                              | `Uye-*` (Görevlerim, Görev pencereleri, Zaman çizelgem, Toplantı detayı, Dosyalarım, Bildirimler ve profil) | F5/F6 kapsamı dışı (P46); Ü1 F6'da uygulandı. Ü7 profil sayfası ile bildirimler birlikte düşünülür                                                                                                          |
| Koordinatör panelleri K2–K8                                      | `Koord-*` (Birimim, Görevler, Görev pencereleri, Ekibim, Zaman çizelgesi ve tarih talepleri, Toplantı detayı, Toplantılar ve pencereler) | K1 F6'da uygulandı; K3 ve K7'de yalnız rapor düğmeleri vardır. `Koord-Gorevler` v85'te kullanıcı tarafından değişti (kayıtlı görünüm segmenti, tarih talebi süzgeci)                                        |
| **F7:** Bildirimler (zil paneli; Web Push P58 dahil) | `Bildirimler`, `14-bildirimler` | **F7 kapsamında** (P54): sayaç canlı, panel F7'de canlı (E-00-38, W158); Web Push P58 dahil (2026-11-14); profil/tercihler DIŞI (P63) |
| **F7:** Mesajlar / sohbet | `10-mesajlar` (10, 10b, 10c, A3) | **F7 kapsamında** (P54): sohbet SSE (KESİN 34) ve okunmamış rozeti (E-00-21, P59); menüde üç rolde görünür |
| Asistan paneli                                                   | `Asistan`                                                                      | Yol haritası F8 (F46 paneli, rota kataloğu); menüde gizli (P2)                                                                                                                                             |
| Takvim                                                           | `Takvim`, `Takvim-Hafiza`                                                      | v85 `Sidebar` K/Ü'de "Zaman çizelgesi" yerine Takvim koydu; F6'da menüde gizli, 03c girişi korundu (E-00-46) — **karar ister**: Takvim 03c'nin yerine mi geçer, yanına mı gelir                               |
| Kurumsal hafıza                                                  | `Kurumsal-Hafiza`, `Takvim-Hafiza`                                             | Prototipten import; yol haritasında kalem yok ("sonra"); K14 v1 dışı modül                                                                                                                                 |
| Profil sayfası                                                   | Ü7 (`Uye-Profil`) ve `Sidebar` "Profilim"                          | F6'da oturum kartı rol halkası + "‹rol› · ‹e-posta›", tıklanamaz (E-00-47); profil sayfası olmadan düğme çalışmaz                                                                                          |
| 01b işlem geçmişi                                                | `01b-islem-gecmisi`                                                            | F6 dışı (P46); BE-030/BE-091/BE-010 (audit okuma) backend'siz — "Son işlemler" nötr yer tutucu kalır                                                                                                       |
| Tablolar                                                         | `11-tablolar` (11–11e, A4)                                                     | Backend v0.17'de `tables` modülü var (GAP-224); web pini v0.15 — pin yükseltmesi ayrı karar ([plan](../web-5/pin-yukseltme-plani.md))                                                                      |
| Pin yükseltmesi, F6 borçları                                     | —                                                                              | [F6 borç tablosu](../web-6/ilerleme.md): gerçek cihaz ekran okuyucu, gerçek sunucu e2e, ZIP onayı (BE-120/124), kâğıt ölçüleri, iade gerekçesi (BE-139), BE-122/123/124/125 önceliği                         |

Bu belge karar vermez; yalnız kararın gerektiği yerleri listeler.

| Dosya | İçerik |
| --- | --- |
| [ilerleme.md](ilerleme.md) | Koşullu yürürlükle F7 KAPANDI (bu belge PR’ının CI başarılı birleşmesi); O1–O3 hash'ler, P54–P66, numaralı borçlar |
| [ortak-sozlesme.md](ortak-sozlesme.md) | Her uygulayıcı isteminin başına eklenen sözleşme (KESİN 1–34) |
| [oturum-1-hazirlik.md](oturum-1-hazirlik.md) | O1 adımları |
| [oturum-2-uygulama.md](oturum-2-uygulama.md) | O2a/O2b iş listesi (uygulandı) |
| [oturum-3-entegrasyon.md](oturum-3-entegrasyon.md) | O3 W160 sonucu: 125 entegrasyon testi, 13 kusur, e2e 3/3, duman |
| [oturum-4-kapanis.md](oturum-4-kapanis.md) | O4 akış tablosu (W161, W162, Codex, kapanış PR) ve kapı sonuçları |
| [Backend devir raporu](../../backend-eksikleri/rapor-F7.md) | F7'de bağlanan uçlar, BE-027/028/029, 080…086, 142…156, 160…162 durumları, öneri sırası, deploy notları |
| [WEB-7-codex.md](../../reviews/WEB-7-codex.md) | Codex tur 1–3 hükümleri ve sınırlı tur 4 düzeltme doğrulaması; W165/W166 teslim kaydı; tur 3 koşulları kapalı; tur 4 sınırlı UYGUN; W166 #152 main’de, CI SUCCESS |
| [web-8](../web-8/README.md) | F8 iskeleti (F8 AÇILMADI; adaylar) |
| [dogrulama-F7.md](dogrulama-F7.md) | W162 gerçek imaj + gerçek backend tanığı (main `4457bd3`) |
