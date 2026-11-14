# WEB-7 — sohbet, bildirim paneli ve gerçek zamanlı altyapı

**F7 AÇILDI 2026-11-14 (ürün sahibi: "F7'yi aç, backend dursun").** Kapsam P54 ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md)); P55/P56 kayıtlı; P57–P66 KESİN (koordinatör varsayılanı, ürün sahibi onayı 2026-11-14: "Web Push dahil olsun, kilitli kart backend, bildirim sade liste tamam"; **P58 Web Push dahil, P60 backend kazanır, P57 sade liste**). [WEB-6](../web-6/README.md) KAPANDI (2026-11-14; Codex 3 tur UYGUN). **Backend dursun:** yalnız pin `v0.15.0-api` uçları; sohbet ve bildirim sözleşmesi v0.11→v0.17 değişmedi, pin yükseltmesi yok; eksikler statik/devre dışı/gizli + BE kaydı (bildirimler BE-142…BE-159, 10-mesajlar yeni satırlar BE-160'tan); backend paketi açılmaz (§3 `designStub` koşulu, §4 statik ≠ sahte veri). Ortak sözleşme: [ortak-sozlesme.md](ortak-sozlesme.md) (KESİN 1–34). İlerleme: [ilerleme.md](ilerleme.md).

## Kapsam (P54)

- **(a) Sohbet — 10, 10b, 10c** ([10-mesajlar](../../ekranlar/10-mesajlar/README.md), W151 tespiti): sohbet listesi + kabuk, konuşma akışı + yazma, pencereler + ekler + anket; SSE ile canlı akış (K8); 10-mesajlar açık sorularının koordinatör varsayılanı P61, yönetici merceği P64, dar ekran P62, kilitli kart P60 (SORU).
- **(b) Bildirim paneli — 14** ([14-bildirimler](../../ekranlar/14-bildirimler/README.md), W152 tespiti): `listNotifications` imleçli, okundu/tümünü okundu; metinsiz yanıt için istemci sözlüğü şablonu (P57); "Senden bekleyen", satır içi karar, tercihler, cihazlar, sessiz saatler statik/devre dışı/gizli.
- **(c) Kabuk:** menüde **Mesajlar** öğesi üç rolde görünür + `unread_chats` rozeti (E-00-20/21, P59); zil paneli canlı (E-00-38); **SSE altyapısı** (`shared/sse`, KESİN 34); bildirimlerde SSE yok.
- **(d) Web Push (P58 dahil) ve DIŞI listesi:** panel içi Web Push önerme kutusu + izin akışı + `public/sw.js` F7'ye DAHİL (W159, O2b'nin son işçisi; zaman yetmezse F7 kapanışında "geçici kabul: F8"). **F7 DIŞI:** Takvim, Kurumsal hafıza, profil sayfası (Ü7) ve bildirim tercihleri/cihazlar/sessiz saatler (P63), Ü2–Ü7, K2–K8, Asistan, 01b işlem geçmişi, Tablolar, pin yükseltmesi.

**Tasarım:** v85/v87 kopyası ([tasarım README](../../tasarim/README.md)): Mesajlar (10, 10b, 10c, A3) ve `Bildirimler` artboard'ları; **dar ekran çizimi yok** (P62 → KESİN 30 tek sütun akış).

## Sıra ve roller

Koordinatör Fable (kod yazmaz; özet alır, birleştirir, kaydeder); işçiler Sonnet 5.5; Codex yalnız nihai salt okunur kapıda. Her W ayrı worktree/dal (`web7/<oturum>-<wid>`), kalıcı W-PROMPT.md; [ortak sözleşme](ortak-sozlesme.md) her isteme aynen eklenir. Her geçiş öncekinin yeşil CI ve MERGED kanıtını bekler.

| Oturum | İş | İşçi |
| --- | --- | --- |
| **O1** ([hazırlık](oturum-1-hazirlik.md)) | W151 10-mesajlar tespiti ‖ W152 14-bildirimler tespiti ‖ W153 kararlar, ortak-kurallar F7 eki, web-7 süreç belgeleri (yalnız belge) | W151, W152, W153 |
| **O2a** ([plan](oturum-2-uygulama.md)) | **W154 veri katmanı:** `shared/sse`, `modules/chat` api/model/public, `modules/notifications` api/model, `query-keys`, rotalar F7, `CURRENT_PHASE` F7, menü Mesajlar + `MenuBadgeKind 'unread'` | W154 |
| **O2b** | paralel UI: **W155** sohbet listesi + kabuk · **W156** konuşma akışı + yazma · **W157** pencereler + ekler + anket · **W158** bildirim paneli + zil · **W159** Web Push (P58 dahil, son işçi) | W155–W159 |
| **O3** ([entegrasyon](oturum-3-entegrasyon.md)) | **W160** zorunlu entegrasyon turu (gerçek router/AppShell/oturum, durumlu sahte sunucu, SSE akışı, TASLAK satırları) | W160 |
| **O4** ([kapanış](oturum-4-kapanis.md)) | **W161** belgeler (rapor-F7, kapanış) ‖ **W162** Docker gerçek backend tanığı (SSE gerçek akış, 429/çakışma) → Codex 2–3 tur → kapanış PR | W161, W162, Codex |

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
| [ilerleme.md](ilerleme.md) | Durum: F7 AÇILDI, O1 sürüyor; borç listesi başlangıcı |
| [ortak-sozlesme.md](ortak-sozlesme.md) | Her uygulayıcı isteminin başına eklenen sözleşme (KESİN 1–34) |
| [oturum-1-hazirlik.md](oturum-1-hazirlik.md) | O1 adımları |
| [oturum-2-uygulama.md](oturum-2-uygulama.md) | O2a/O2b iş listesi iskeleti (bekliyor) |
| [oturum-3-entegrasyon.md](oturum-3-entegrasyon.md) | O3 W160 iskeleti (bekliyor) |
| [oturum-4-kapanis.md](oturum-4-kapanis.md) | O4 akış tablosu iskeleti (bekliyor) |
