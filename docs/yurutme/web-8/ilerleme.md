# WEB-8 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz (O1–O3 kayıtları O4'te W177 tarafından koordinatör notlarından derlendi; ham kaynak `.git/koordinator/f5-notlar.md` W167–W176 satırları).

**F8 AÇILDI 2026-11-15** (ürün sahibi: "pin yükseltme + canlıya alma turu olsun"; P67 kesin). Kapsam [README](README.md)'de; kararlar P67 kesin, **P68–P74 koordinatör varsayılanı = geçici kabul** ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md)); P75–P76 süreç kararları. F7 [KAPANDI](../web-7/ilerleme.md) (main `31c6ccc`). Pin `v0.23.0-api` (main'de, #158).

**F8 KAPANMADI — Codex bekliyor (2026-11-16).** O1–O3 kod ve belge işleri main `b9aab8c`'de tamamdır; O4 sürüyor: W177 (bu belgeler), W178 (gerçek Docker + backend `v0.23.0-api` tanığı), Codex 2–3 tur, kapanış belge PR'ı. "F8 KAPANDI" yalnız CI SUCCESS + MERGED + Codex hükmü sonrası yazılır; kanıtlanamayanlar (VoiceOver, görsel onay, Safari/iOS/Firefox push, CDN arkası SSE) "yapılamadı" kalır (KESİN 32). **Güncel olgu:** backend `v0.24.0-api` çıktı (BE-F7: sohbet/bildirim); F8 pini v0.23'te kalır (P69/P74), karşılıklar [rapor-F8](../../backend-eksikleri/rapor-F8.md) §6'da, F9 önerisi [web-9](../web-9/README.md)'dadır.

## Durum

| Oturum | Durum | main hash |
| --- | --- | --- |
| O1 W168 ‖ W169 (+ W167 borç turu, W169b) | **Birleşti:** #154 (W168 süreç belgeleri), #155 (W167 borç turu), #156 (W169 canlıya alma matrisi), #157 (W169b tarih sabitleme) | `73cfdcd` |
| O2a W170 | **Birleşti:** #158 (pin `v0.23.0-api`, UI değişmedi) | `b141713` |
| O2b W171–W175 | **Birleşti:** #159 (W173), #160 (W174), #161 (W171), #162 (W172), #163 (W175) | `6e09d7a` |
| O3 W176 | **Birleşti:** #164 (entegrasyon turu + gerçek backend e2e) | `b9aab8c` |
| O4 W177 ‖ W178, W179, Codex | **W178 birleşti:** #165 (gerçek Docker + `v0.23.0-api` tanığı, [dogrulama-F8](dogrulama-F8.md)); **W179** birleşti (#166, `dd71bd6`; KUSUR 1/3/4/5); W177 belgeler sürüyor; Codex bekliyor | `dd71bd6` |

## Kararlar

| # | Konu | Durum |
| --- | --- | --- |
| P67 | F8 = pin v0.23.0-api + canlıya alma turu; yeni ekran yok | **KESİN** (ürün sahibi 2026-11-15) |
| P68 | Kapsam ölçütü: yalnız v0.23'te karşılığı olan BE satırları canlanır; kısmi olanlarda yalnız gelen alan | geçici kabul (itiraz yok) |
| P69 | Pin tek PR'da (WP1), UI değişmez | geçici kabul; uygulandı (#158) |
| P70 | Canlıya alma sırası (a)–(e) | geçici kabul; uygulandı (W171–W175) |
| P71 | Canlıya alma tanımı + kayıt kuralı | geçici kabul; [karşılanan satır kuralı](../../backend-eksikleri/README.md#karşılanan-satır-kuralı-f8) işledi (35 satır `bağlandı`) |
| P72 | Yeni artboard yok | geçici kabul |
| P73 | Gerçek backend e2e/Docker tanığı `v0.23.0-api` imajıyla | geçici kabul; W176 e2e + W178 tanığı |
| P74 | Sohbet/bildirimde `work.task.reminder` dışında değişiklik yok; BE-F7 sonra | geçici kabul; v0.24 çıktı, F9'a taşındı |
| P75 | Actions kesintisinde yerel CI kanıtıyla birleştirme (kullanıcı 2026-11-16) | uygulandı (#161–#163); Actions dönünce main doğrulandı |
| P76 | Hızlı mod (yalnız etkilenen testler; duman tek koşum; e2e yalnız W178/CI; geri alma teyidi yalnız Codex bulgularında; eşzamanlı en çok 2 işçi; Codex en çok 2 tur, UYGUN DEĞİL → 3) | koordinatör önerisi, itiraz yok; O4'te yürürlükte |

## Kayıtlar

### F8 açıldı — O1 (2026-11-15)

- **Keşif** (`v0.15.0-api` → `v0.23.0-api`): uç 189 → 248, yol 147 → 199, şema 233 → 326, hata kodu 194 → 227 (+33), 181 commit; kırıcı: `actor` enum `sirket_yoneticisi`, `MyDepartment.role` daraldı, rapor dağılım şemaları kapalı, `createMeeting` 200/404, ~45 şemada yeni zorunlu yanıt alanı. Ayrıntı: [pin planı §Envanter](pin-yukseltme-v023.md#wp1-envanter).
- **W168** (#154, `da938eb`): web-8 belgeleri, ortak sözleşme KESİN 1–36, pin planı v0.23, ortak-kurallar §5 F8 eki + §12 P67–P74, `kayit.md` 46 Bağ notu (Durum `açık` kalır), `backend-eksikleri/README` kuralı. #154 CI'sı ilk koşumda `archive lifecycle.test` zaman aşımıyla kırmızı (kararsız test), yeniden koşuldu.
- **W167** (#155, `9cc65c8`; 7 commit; 771 dosya/5539 test): F7 devir borçları (aşağıda #2, #9): `password.test` bölme + lifecycle ısınma, `unregisterPushTarget` çıkışta (`target_id` bellekte, `onBeforeSignOut` kancası), `push.snoozeUntil` 14 gün (K2 anahtar listesi), `manifest.webmanifest` + 4 PNG + `icon.svg` + `scripts/gen-pwa.ts` + Caddy manifest tipi, `up.sh` parametrik, `topbar-dot*` kaldırıldı, pin olayı ve Ö-03 sökülme testleri.
- **W169** (#156, `73cfdcd`): canlıya alma matrisi (174 yer: 111 canlanır / 5 kısmi / 58 kalır; 88 BE: 39 tam / 10 kısmi / 39 yok), ekran README "F8 eki" bölümleri. #156 CI'sı iki kez kırmızı: `archive lifecycle.test` zaman aşımı (kararsız), sonra `notifications-panel.test` 'Bugün' → 'Dün' (gece yarısı; takvime bağlı test) → W169b (#157, `2806568`; tarih sabit `2026-11-14T12:00Z`).

### O2a — W170 (#158, `b141713`; dal ucu `fc9765f`; 9 commit)

Pin `v0.23.0-api`: `pnpm gen:api` (+12251/−3881), 248 uç / 227 hata kodu; K-5 `defaults.ts` varsayılan üreticileri (37 fixture dosyası); 36 i18n hata anahtarı; `work.task.reminder` sözlüğü (13 tür); K-1 `SERVER_ACTOR_TO_CLIENT` (ŞY → `null`, davranış aynı); K-2 `MyDepartment` (7 dosya); K-3 `Partial<Record>` dağılım; K-4 kod değişikliği gerekmedi (test); `messaging.auto_group_protected` failure sınıfı. 776 dosya/5617 test; gerçek backend v0.23 e2e 7/7; piksel farkı main↔W170 67/72 birebir, 5 sahne ≤28 px render gürültüsü (main↔main da aynı).

### O2b — beş işçi

| W | PR · main hash (dal ucu) | Teslim | Kapı (işçi raporu, dosya/test) |
| --- | --- | --- | --- |
| W173 | #159 · `29adb11` (`48efcde`; 11 commit) | BE-005 görev kodu (03/03c/05b/08b/K1/Ü1; kodsuz `#seq`), BE-137 dosya sayısı/sunuş, BE-138 kilit (yalnız sayı), BE-139 iade gerekçesi (K1 penceresi + Ü1), BE-140 talep zamanları/yönetici notu, BE-141 koordinatör adı; 12 stub kalktı | 784/5649; duman 6 senaryo 0/0/0 |
| W174 | #160 · `7ea3502` (`5144388`; BE-163 kayıt `552ce0b`) | Silinenler: BE-117 sunucu süzgeç/sıra, BE-118 hesap alanları, BE-108 `deleted_by`, BE-119 `scope=program`, BE-113 ayrıntılar, BE-110 kısmi (tür sayaçları), BE-114 toplu geri yükle/kalıcı sil (≤100 parça), BE-115 kısmi (koordinatörlük → BE-163), BE-116 CSV bilet | 786/5725; duman 30/30 0/0/0 |
| W171 | #161 · `f7bfba2` (`4687c0c`; e2e düzeltmesi `fe83ee4`) | Arşiv: BE-070/071/072/073 (S2 `programArchive*`, P33 yolu kalktı), BE-025 kısmi, BE-121 `include_empty`, BE-074 `retagFile`, BE-120 dönem ZIP + onay penceresi, BE-124 raporlu ZIP testleri | 783/5682; duman 5 senaryo 30/30 0/0/0 |
| W172 | #162 · `440dfd4` (`065205f`) | Raporlar: BE-122 bölüm seçimi, BE-125 dönüştürülen görev tablosu, BE-132 kesme, BE-133 kapalı dağılım, BE-134 iş yükü tablosu, BE-123 Gantt çubukları (oklar GAP-239), BE-136 kısmi (GAP-237), BE-135 `Retry-After` (503 dahil) | 803/5873; duman 18/18 0/0/0 |
| W175 | #163 · `6e09d7a` (`1b70089`; W175b) | Toplantılar + organizasyon: BE-021/061/063/065/067/068, kullanıcı CSV (BE-014), BE-018 kısmi, BE-008 elle hatırlatma, 03 iade gerekçesi (`RevertReasonDialog` variant=return), `MeetingNotes.vue` bölme (250 satır sınırı), W175b: 3 gerçek kırmızı düzeltme (remind import, design-stub test örneği, `use-status-transition` 60 satır) | 799/5788; duman 42/42 0/0/0 |

Zincir: W170 → {W171, W173, W174} → W172 (W171 sonrası sert), W175 (W173 sonrası yumuşak). Her W'nin varsayımları kabul edildi (çoğu geçici kabul: BE-110/036 kısmen; BE-010/006/046 F8'de yapılmaz; ADR-0041 ŞY aktör F8 dışı).

**P75 — Actions kesintisi:** GitHub Actions 2026-11-16 00:12–07:17 arasında koşmadı. #161/#162/#163 yerel CI kanıtıyla birleşti (kullanıcı onayı 2026-11-16 06:40): ci.yml üç işi birebir (verify = install/gen:check/typecheck/lint/format/test/build/check-isolation dist/audit --prod; image = docker build + `check-image.sh`; e2e = gerçek backend v0.23 `up.sh` + playwright), kanıt `.git/koordinator/yerel-ci/pr161-c8ae0ab`, `pr162-c1c3d88`, `pr163-6aaa9fb` (11/11 adım yeşil; 801/5822, 804/5877, 809/5908 test; e2e 7/7), PR yorumlarında özet. 07:17 UTC Actions döndü ve **main `6e09d7a` CI SUCCESS** ile doğrulandı: P75 penceresinde birleşen üç PR bu koşumla main'de sınanmış oldu. Bundan sonra normal izleyici. Çakışmalar koordinatörce çözüldü (`kayit.md` BE-113…121 satırları: main W174 + W171 BE-120/121).

### O3 — W176 entegrasyon turu (#164, `b9aab8c`; dal ucu `bdecd00`; 18+ commit; 819 dosya/5963 test)

Ayrıntı [oturum-3-entegrasyon](oturum-3-entegrasyon.md). KUSUR 1 (period-zip kopyası → `shared/download` `truncated`), KUSUR 2 (`reports.spec` dışa aktarım kotası bekçisi), KUSUR 3 (`checkReturnReason` tek kaynak `work/public`), KUSUR 4 (`notifications.spec` e2e izolasyonu; tam e2e 14/14 × 3 ardışık). #164 CI'sı ilk koşumda `notifications.spec` ile kırmızı (live-* spec'leri aynı üyeye bildirim üretiyordu) → düzeltilip birleşti.

### O4 — belgeler (W177, `web8/o4-kapanis`)

`rapor-F8` (pin envanteri, canlanan/kısmi satırlar, v0.24 farkı, §6 F9 web işi + backend paket adayları), bu kayıt (borçlar numaralı), `oturum-3-entegrasyon`, `oturum-4-kapanis`, README durumu, ekran README kanıt/Sürüm satırları, `kayit.md` v0.24 Bağ notları, `WEB-8-codex` iskeleti, `web-9` iskeleti, yol haritası §4, tasarım README notu. Yalnız belge; kod yok. W178 `dogrulama-F8.md` ayrı ve kendisinindir.

## Borçlar

Hiçbiri F8'in kapanışını kendiliğinden engellemez. Sınıflar: **kapandı**, **kapanış sonrası borç**, **F9 adayı**, **karar bekler**, **açık BE**, **uygulama notu**, **deploy borcu**. Numaralar bu dosyada tektir (1–15 F7'den devreden, 16–30 F8'de doğan). F7 numaraları: [web-7 ilerleme](../web-7/ilerleme.md) (orada karşılık sütunu eklendi).

### F7'den devreden

| # | Borç / not | Sınıf | Kaynak |
| --- | --- | --- | --- |
| 1 | Gerçek cihaz ekran okuyucu (VoiceOver) ve kullanıcı görsel onayı: F7, F8 ve önceki fazlar için **yapılamadı**; sessiz geçilmez (KESİN 32) | kapanış sonrası borç | web-7 #1, #29 |
| 2 | Kararsız testler (`password.test.ts`, `archive/api/lifecycle.test.ts`): bölme ve ısınma | **kapandı (W167, #155)**; yük altı kararsızlık için #26 | web-7 #2 |
| 3 | Ü1 iade/onay/tarih notları ve K1 ApprovalsCard sayacı pending dışı kısmi kümede "≥" almıyor | kapanış sonrası borç | web-7 #3 |
| 4 | Soğuk `?gorev=` derin bağlantıda hedef birim/kapsam çözümleme UX borcu (P55) | UX borcu açık (F9: bildirim `action.program_id`/`department_id` ile kısmen) | web-7 #4 |
| 5 | Gerçek backend'de gezinme sonrası K/Ü mercek-parametre tanığı yok | kapanış sonrası borç (W178 kapsamına eklenebilir) | web-7 #5 |
| 6 | Ağır okuyucu bekleme denetimi `useReportSeason` içinde; yeni ağır okuyucu aynı denetimi yapar | uygulama notu | web-7 #6 |
| 7 | ZIP onayı (E-13-10), 390 px ZIP düğmesi (E-13-12), dosya boyutu (E-13-72), iade gerekçesi (E-K1-17/18) | **kapandı (F8 W171/W172/W173)**: BE-120/124/139 canlı | web-7 #9 |
| 8 | 09/05 "oluştur" URL parametresi (01 kutucukları), ek önizleme penceresi | F9 adayı | web-7 #10, #17 |
| 9 | "Şimdi değil" 14 gün (`push.snoozeUntil`), `unregisterPushTarget` çıkışta, `up.sh` parametrik, `manifest.webmanifest` + `apple-touch-icon`, `topbar-dot*`, pin olayı testi, Ö-03 sökülme testi | **kapandı (W167, #155)**. Kalan: iOS ana ekran PWA gerçek cihaz denemesi (kullanıcı), `push.snoozeUntil` tarayıcıya bağlı (kardeş sekmede DELETE yok, kabul) | web-7 #8, #12, #13, #21, #27 |
| 10 | Safari/iOS/Firefox push, `notificationclick` OS bildirimi, `typing` hız kovası, CDN arkası SSE kanıtı yok | kapanış sonrası borç | web-7 #11, #14, #29 |
| 11 | Ters vekil `flush_interval -1` + ≥6 dk okuma zaman aşımı (SSE) | deploy borcu (SAHİPLİK-DIŞI) | web-7 #15 |
| 12 | Okunmamış ayırıcı `unread_count`'tan yaklaşık | **F9'da kapanır** (backend v0.24 `first_unread_seq`, BE-082) | web-7 #20 |
| 13 | Otomatik izin tetiği (03/03c kancası; E-14-64) | F9 adayı | web-7 README |
| 14 | Sohbet/bildirim BE: BE-027/028/029, BE-080…086, BE-142…156, BE-160…162 | **backend v0.24'te büyük kısmı karşıladı** (kısmi: 028, 085, 156; açık kalan: 027, 029, 080, 160, 147…154); F9 canlıya alma ([rapor-F8 §6](../../backend-eksikleri/rapor-F8.md)) | [rapor-F7](../../backend-eksikleri/rapor-F7.md) |
| 15 | Duman konsolu: sahte uç 404 ve incognito Push uyarısı ürün hatası değil; "konsol hatası 0" diye sunulmaz | uygulama notu | web-7 #26 |

### F8'de doğan

| # | Borç / not | Sınıf | Kaynak |
| --- | --- | --- | --- |
| 16 | 01f büyük dönem (5000 görev + 2000 dosya) render 2,5–2,7 sn (jsdom); DOM sanallaştırma yok. `reports-live-large` testi 40 sn/10 sn **KESİN 32 istisnası onaylı** | F9 adayı (sanallaştırma) | W172, W176 |
| 17 | ADR-0041 `sirket_yoneticisi` aktörü: istemci salt okunur, ŞY aktör sayılmaz; `SERVER_ACTOR_TO_CLIENT` dışa aktarımının üretim tüketicisi yok (yalnız test) | karar bekler | W169, W170, W176 |
| 18 | E-03C-22 "Yalnız kodları göster" düğmesi | karar bekler | W173 |
| 19 | Kilit ipucu yalnız sayı (BE-138 bekleyen görevin adı/kodunu vermez) | açık BE / kapanış sonrası borç | W173 |
| 20 | 09 `MeetingsPage` hâlâ `/v1/meetings/deleted`; W174'ün `admin/deleted/meetings` kullanım durumuyla aynı küme (birleştirme notu) | kapanış sonrası borç | W174, W175 |
| 21 | 06 yükleyen süzgeci arayüzü yok (`programArchiveUploaders` var; tasarımda çizim yok); depolama dağılımı E-06-23/24 stub (BE-025 kalanı) | karar bekler / açık BE | W171 |
| 22 | `DeletedWorkItem` kod taşımıyor (E-12-26/42 gizli) | açık BE (sözleşme) | W174 |
| 23 | Silinenler sıralaması bellekte, URL'de değil | kapanış sonrası borç | W174 |
| 24 | `X-Result-Truncated` bilet tüketiminde canlı tetiklenemedi | **kapandı (W178)**: gerçek ZIP'te `true` geldi (42 koordinatörlük) | W171, W176, W178 |
| 25 | Bilet aşamasında 429 (`organization.export_in_progress`, kota) genel toast; geri sayım yok | kapanış sonrası borç | W176 |
| 26 | Yük altında 5 sn'ye yaklaşan ağır entegrasyon testleri (sistemik); W176 üç bölme (`meetings-conversion` 2678 → 503 ms, `archive-upload`, `deleted-records-o3`) yaptı; tam paket yük altında hâlâ duyarlı | uygulama notu (KESİN 32) | W167, W176 |
| 27 | Marka ikonu tasarımı (W167'nin eklediği manifest/`apple-touch-icon` ikonları için tasarım kararı bekler) | karar bekler (tasarım) | W167 |
| 28 | BE-163 yeni kayıt (program kapsamlı departman purge, ADR-0045); BE-164 öneri (departman silme etki özeti) | açık BE | W174, W177 |
| 29 | Kısmi satırlar: BE-025 (dağılım), 018 (GAP-240), 110 (GAP-234), 115 (BE-163), 123 (GAP-239), 127 (GAP-236), 136 (GAP-237), 010/030/088/130 (BE-091), 036 | açık BE ([rapor-F8 §2.2](../../backend-eksikleri/rapor-F8.md)) | W171–W175 |
| 30 | F8 gerçek cihaz/üretim kanıtları: VoiceOver, Safari/iOS, CDN SSE F8'de de **yapılamadı**; W178 yalnız Docker + Chrome tanığıdır | kapanış sonrası borç | W177 |
| 31 | W178 kusurları: KUSUR 1 (01f 390 px taşma), 3 (silinenler dar ekran), 4 (Ü1 son bildirimler/"Koordinatörüme yaz", K1 son etkinlik metni), 5 (iki küçük görsel) | **kapandı (W179, #166, main `dd71bd6`)**: KUSUR 1 `2361f99`, 3 `f083886`, 4 `fea8f02`, 5 `16ef2ff`; etkilenen testler ve CI yeşil. KUSUR 1 yan etkisi: 01f kâğıdındaki görev kartları 1440'ta tam genişlik → tasarım farkı (#35) | W178, W179 |
| 35 | 01f dönem raporu kâğıdında görev kartları 1440'ta tam genişlik (KUSUR 1 düzeltmesinin yan etkisi; tasarımda yan yana) | tasarım farkı (kabul/karar bekler) | W179 |
| 32 | KUSUR 2: dönem ZIP onay ağacı ASCII adlar, gerçek ZIP Türkçe/boşluklu | tasarım farkı (W171 varsayımı, kabul) | W178 |
| 33 | BE-165 (silinmiş görev dosyaları arşiv/ZIP'te), BE-166 (görev PDF'inde kod yok) | açık BE | W178 |
| 34 | 503 `reporting.capacity_full`, `reporting.export_too_large` üretilemedi; ölçülü piksel karşılaştırması yapılmadı | kapanış sonrası borç | W178 |

## Açık sorular

1. **F9** açılacak mı, kapsamı: önerilen = pin `v0.24.0-api` + sohbet/bildirim canlıya alma ([web-9](../web-9/README.md)). Kullanıcı kararı.
2. **ADR-0041 ŞY aktör** ve **E-03C-22** ürün kararları (#17, #18).
3. Backend sonraki paket sırası ([rapor-F8 §6b](../../backend-eksikleri/rapor-F8.md)); kullanıcı backend'i ayrı yürütüyor.
4. P68–P74 geçici kabullerinin kesinleştirilmesi (ürün sahibi itiraz etmedi).
