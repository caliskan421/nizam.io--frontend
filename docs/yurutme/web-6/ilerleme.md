# WEB-6 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F6 AÇILDI 2026-11-13** (kullanıcı onayı; pin `v0.15.0-api` yeterli — eksikler kayıt; backend paketi açılmaz). Kararlar P46–P53 ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md)). **F6 kodu main'de (#119–#128, son main `a3b31e3`, 658 dosya / 4590 test); O4 kapanış sürüyor: belgeler (W143), gerçek sunucu tanığı (W144), Codex ve kapanış PR'ı bekliyor — F6 henüz KAPANMADI.** F7 AÇILMADI ([web-7](../web-7/README.md)).

## Durum

| Oturum               | Durum                                                                                                                                     | main hash |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| O1 tespit + kararlar | Birleşti: #119 (W135 kararlar), #120 (W134 13 Raporlar tespiti + BE-122…141), #121 (WT1 açık tema v85)                                    | `7224383` |
| O2a W136             | Birleşti: #122 (rapor veri katmanı, paylaşılan bilet indirme, F6 rotaları, `CURRENT_PHASE` F6)                                            | `76bc9ab` |
| O2b W137–W141        | Birleşti: #123 (W141), #124 (W139), #125 (W137), #126 (W138), #127 (W140)                                                                 | `21e49a5` |
| O3 W142              | Birleşti: #128 (97 entegrasyon testi, 5 kusur düzeltmesi, e2e/reports.spec.ts)                                                            | `a3b31e3` |
| O4 kapanış           | W143 belgeler (bu dal `web6/o4-kapanis`) ‖ W144 gerçek imaj + gerçek backend tanığı (`web6/o4-w144`) çalışıyor; Codex ve kapanış PR bekliyor | `a3b31e3` |

## Kayıtlar

### İskelet (2026-11-12)

W131 (WEB-5 O4) bu klasörü hazırlık olarak açtı. Açılış kapısı [oturum-1-hazirlik.md](oturum-1-hazirlik.md)'de.

### F6 açıldı — O1 (2026-11-13)

- **Kararlar:** P46 (kapsam), P47 (raporlar ayrı sayfa değil, menü öğesi yok), P48 (dönem PDF bölüm seçimi, varsayılan hepsi), P49 (ZIP iki yerde, BE-120 stub), P50 (toplantı raporu içeriği), P51 (01f tek artboard; [BE] statikler), P52 (sekme/listeler uygulanmaz), P53 (K1/Ü1, rol menüleri).
- **Snapshot:** tasarım kopyası `1794590338-3fe0` (v85) — kullanıcı `Bildirimler`, `Asistan`, `Takvim`, `Kurumsal-Hafiza`, `Takvim-Hafiza`'yı ekledi; Raporlar ailesi (`Raporlar`, `Rapor-Donem`, `Rapor-Toplanti`, `Rapor-Pencereler`, `Rapor-Noktalar`, `Raporlar-Acik`); `Sidebar`, `theme.css`, `Koord-Gorevler` değişti ([tasarım README](../../tasarim/README.md)).
- **W135** (`web6/o1-kararlar`): tasarım kopyası, ortak-kurallar §12 P46–P53 + §5 F6 eki, 01 kabul tablosu F6 satırları (E-01-12, 19–39) kapatıldı, K1/Ü1 tespiti (01 README/özellikler/mekanizma/backend/eksikler), 00-ortak rol menüleri, web-6 belgeleri.
- **W134** (`13-raporlar` tespiti + `kayit.md` BE-122…): ayrı dal; sahiplik 13-raporlar, 03/05/06/09 ekleri, `kayit.md`.
- **Geçici kabuller (koordinatör varsayılanları, P53'ün içeriği):** E-01-19 `total_admins` ipucu; E-01-20 rol kartı → 05 rol süzgeci; E-01-26 eşitlikte ad A→Z, "Son yükleme" ölçütü BE-025'e dek devre dışı; E-01-28 koordinatör merceğinde kartlar program geneli; E-01-31 koordinatörler + "+N üye" (BE-079); E-01-33/34 artık dilim nötr "onayda/iade" (BE-078); E-01-37 `archiveFolders` ikinci istek, yönetici P33 kapsamı; E-01-38 satır gizli (BE-025). 01b F6 dışı.
- **Açık / izlenen:** (1) K1/Ü1 sayfa seçimi ve Ü1 "program geneli" kapsamı W135 varsayımıdır, ürün/koordinatör teyidi bekler ([01 README K1/Ü1](../../ekranlar/01-ana-sayfa/README.md)). (2) **Açık tema v85 borcu — KAPANDI 4b2c547 (ürün sahibi kararı 2026-11-13)**; aşağısı tarihsel kayıttır (theme.css v85 kopyalandı, pin e641d2e; kaynak zaten v85 değerlerini taşıyordu): `docs/tasarim/kaynak/theme.css` önceki sürümde (`1794501200-387f`) bırakıldı; `design/web-tokens.json` ve `src/shared/tokens` main ile aynı. Neden: v85 açık tema pinli tasarım sistemi kaynağındaki (`tokens/design-system.tokens.json`) 35 değeri değiştiriyor (aşağıdaki tablo) ve 10 yeni değişken getiriyor (`--glass`, `--glass-line`, `--hi`, `--hi-ink`, `--hi-ink-2`, `--chart-done`, `--av-neutral`, `--av-neutral-ink`, `--nav-on`, `--bar-done`); kaynak + `designTokens` pini güncellenmeden web'e alınamaz. *(Karar verildi, kapandı.)*

| Değişken (açık tema) | Önceki (pinli kaynak) | v85 |
| --- | --- | --- |
| `--bg-base` | `#f6f6f3` | `#eceef1` |
| `--bg-raised` | `#f1f1ed` | `#f2f3f5` |
| `--bg-overlay` | `#e7e7e2` | `#e6e8ec` |
| `--border-subtle` | `#e5e5df` | `#e2e5e9` |
| `--border-strong` | `#d0d0c9` | `#cfd3d9` |
| `--border-control` | `#96968f` | `#bfc4cb` |
| `--ink` | `#161615` | `#121316` |
| `--ink-muted` | `#5c5c57` | `#555a63` |
| `--ink-faint` | `#71716b` | `#70757e` |
| `--accent` | `#c8f53c` | `#cbe83c` |
| `--accent-top` | `#d8f866` | `#d8f05e` |
| `--accent-ink` | `#161615` | `#121316` |
| `--accent-text` | `#4a6a00` | `#4f6e00` |
| `--focus-ring` | `#4a6a00` | `#121316` |
| `--violet` | `#7a26c1` | `#7334d9` |
| `--gold` | `#a86f00` | `#c27400` |
| `--danger` | `#d02b2b` | `#e0441c` |
| `--btn-bottom` | `#f4f4f0` | `#f6f7f8` |
| `--btn-border` | `#d5d5ce` | `#d9dde2` |
| `--scrim` | `#16161566` | `#12131659` |
| `--gp-todo` | `#d3d6dc` | `#bfc4cc` |
| `--gp-doing` | `#d2a2ee` | `#a675f2` |
| `--gp-review` | `#ffdc85` | `#ffbf2e` |
| `--gp-back` | `#ffb4a4` | `#ff8c6e` |
| `--gp-done` | `#d6f56f` | `#c3e33a` |
| `--gp-late` | `#ffa0a0` | `#ff7d5c` |
| `--gp-late-line` | `#d02b2b` | `#e0441c` |
| `--gp-ink` | `#17181c` | `#121316` |
| `--gp-ink-muted` | `#4a4d55` | `#3f434a` |
| `--shadow-card` | `0 1px 2px rgba(22,22,21,0.05), 0 6px 20px rgba(22,22,21,0.06)` | `0 1px 2px rgba(18,19,22,.05),0 6px 18px rgba(18,19,22,.06)` |
| `--shadow-sheet` | `0 24px 64px rgba(22,22,21,0.14)` | `0 24px 64px rgba(18,19,22,.16)` |
| `--role-admin` | `#e57a9a` | `#ec4f86` |
| `--role-uye` | `#73a9e3` | `#3c82ea` |
| `--avatar-1` | `#c8f53c` | `#bfe02f` |
| `--glass-ink` | `#161615` | `#121316` |

(3) v85 `Sidebar`'da Zaman çizelgesi öğesi yok (Takvim geldi); 03c girişi menüde korunur ([00-ortak mekanizma §9.5](../../ekranlar/00-ortak/mekanizma.md)). (4) W134 kayıt bloğuna aday notlar: [01 eksikler §6](../../ekranlar/01-ana-sayfa/eksikler.md).

### O1 — birleşme ve hash'ler (2026-11-13)

- **#119 W135** (`2fff60e`; dal ucu `78b6fea`): P46–P53, tasarım kopyası v85, 01 F6 satırları (22: 9 kabul / 13 geçici kabul), K1 (41 satır) ve Ü1 (33 satır) tespiti, 00-ortak rol menüleri E-00-41…47, web-6 belgeleri; 585 dosya / 4032 test. `theme.css` v85 burada kopyalanmadı (aşağıdaki tablo); token senkronu yarım kaldı, kırmızı `tokens.test` WT1 ile kapandı.
- **#120 W134** (`f44d80e`; zincir `ea2ef32`, dal ucu `2662727`): `13-raporlar` altı dosya, E-13 86 satır (35 kabul / 41 geçici kabul / 4 öneri / 8 ret), `kayit.md` BE-122…BE-141 (K1/Ü1 uçsuz alanları BE-137…141 dahil); 28 bulgu `13-raporlar/dogrulama.md`. Spec bulguları: 429 `export_in_progress` `Retry-After` sabit 1 sn, 503 `capacity_full` başlıksız (BE-135); toplantı PDF not başlığında "Göreve dönüştürüldü" var, tablo yok (BE-125); K yetkisi sahip + dahil departman. Kapı: stubs + design-stub testleri 32/32.
- **#121 WT1** (`7224383`; commit `4b2c547`, dal ucu `3bfd584`): açık tema v85 (aşağıda).

### O2a — W136 (#122 `76bc9ab`; dal ucu `ea44c4d`, ilk teslim `9257a30`)

`src/shared/download/` (bilet GET/POST akışı; arşiv ince sarmalayıcı), `src/modules/reports/` (sorgular, `reportGate`, hata eşlemesi, yetki olguları, `ReportActionButton`, `ReportsGate`, iskelet sayfalar), `query-keys.ts` `report.*`, rotalar `/arsiv/donem-raporu` ve `/toplantilar/:meetingId/rapor`, `CURRENT_PHASE` F6, `trReports`, `designStub` BE-120/122/123/131/136. 602 dosya / 4196 test; duman 10/10 (taşma 0, CSP 0, pageerror 0).

### O2b — beş işçi (zincir ve hash'ler)

| W    | PR · main hash (dal ucu)                | Teslim                                                                                                                                                                      | Kapı (işçi raporu)                          |
| ---- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| W141 | #123 · `ad91368` (`c65f5e8`)            | rol menüleri: `menu-definition.ts`, rozet kaynakları, rol halkası + "‹rol› · ‹e-posta›"; E-00-41…47; F5 borcu #6 kapandı                                                    | 604 dosya / 4220 test; duman 18/18          |
| W139 | #124 · `bafe67b` (`70dab04`)            | 05 iş yükü raporu (çoklu seçim, `member_ids`, 422 temizleme), 05b "Kişisel rapor" (E-13-59…64)                                                                              | 606 dosya / 4220 test; duman 6/6 + 4/4      |
| W137 | #125 · `fd72a69` (`ae5f412`)            | 01 yönetici sayfası: ekip şeridi, koordinatörlük kartları, "Rapor oluştur" menüsü (E-01-12, 19–39); `web-tokens` `home` grubu (21 ölçü)                                     | 617 dosya / 4275 test; duman 6/6            |
| W138 | #126 · `feec396` (`a9ac550`)            | `ReportStateCard`, 06 Arşiv dönem PDF + bölüm seçimi, 01f `SeasonReportPage`, 01g `MeetingReportPage`, `MeetingReportButton` (09b/K7), `TaskReportButton` (03/K3); tasarım kopyası v87 | 635 dosya / 4413 test; duman 36 kare 0/0/0  |
| W140 | #127 · `21e49a5` (`c90ff24`)            | K1 (9 kart) ve Ü1 (7 bölge) ana sayfaları, `HomePage` sayfa seçici; `RoleHomeDraft` kaldırıldı                                                                              | 633 dosya / 4398 test; duman 16/16 + 4 pencere |

Zincir: W141 ve W139 önce, W137 sonra; W138 main'i sonradan birleştirdi (`reports.ts` workload dalı korundu, `7a3acfc`); W140 W137'yi zincirledi (`47533ff`). Test sayıları işçi raporlarındandır; her biri farklı dal ucunda alındığından toplanmaz, tek doğruluk kaynağı main CI'dır.

### O3 — W142 entegrasyon turu (#128 `a3b31e3`; dal ucu `3396644`, 20 commit)

- **97 entegrasyon testi**, hepsi geçti: `reports-*` 65 (lifecycle 7, meeting 12, season-download 7, season-picker 4, season-preview 9, task 8, workload 9; dosya başına `it` sayısı, `it.each` varsa gerçek sayıdan düşük çıkar), `home-*` 22, `menu-roles-shell` 10. (PR gövdesi dökümü 62/18/10 yazmıştı; toplam aynı, dağılım bu belge yazılırken yeniden koşularak düzeltildi.)
- **Kusurlar (sınıf → commit):** KUSUR 1 `ReportActionButton` kilitli/devre dışıyken yuva etiketi varsayılana dönüyordu (`95fe33f`); KUSUR 2 01g'de `ret` olan "Tetikleyiciler" notu üretime sızmıştı (`79a0972`); KUSUR 3 `?gorev=` başka birimin görevinde seçili birim başlığıyla 404, artık görevin kendi birimi (`4435b5e`, yalnız önbellekteki satırlar); KUSUR 4 `work ↔ reports` döngüsü kırıldı, `retryTransient`/`useProgramDepartments` shared'a (`2d00088`); KUSUR 5 390 px bölüm penceresi tam ekran (`e3448b3`). Temizlik: `MEETINGS_ROUTE`/`MEETING_ROUTE` `meetings/public`'ten (`a677af3`).
- **e2e:** `e2e/reports.spec.ts` 3/3 (sahte `/v1`, KESİN 18). **Duman:** üretim dist + gerçek Caddy (nonce CSP) + Playwright, 9 sayfa × 390/1024/1440 × iki tema = 54 kare: taşma 0, CSP 0, pageerror 0, console.error 0. Kapı: 658 dosya / 4590 test. Ayrıntı: [oturum-3-entegrasyon](oturum-3-entegrasyon.md).

### Kararlar P46–P53 (özet; metinler [ortak-kurallar §12](../../ekranlar/ortak-kurallar.md))

| #   | Başlık                                         | Ne diyor                                                                                                                            |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| P46 | F6 kapsamı                                     | 01 tam yönetici ana sayfası, raporlar/PDF, K1 + Ü1, rol menüleri; 01b F6 dışı; backend paketi açılmaz; pin değişmez                  |
| P47 | Raporların yeri                                | Ayrı sayfa ve menü öğesi yok; 06 Arşiv, 09b/K7, 03/K3, 05; "Rapor oluştur" kutucuğu yönlendirme menüsü; K1'de rapor girişi yok; üye hiçbir rapor görmez |
| P48 | Dönem PDF bölüm seçimi                         | Doğrudan tıklama = tam rapor; "Bölüm seç…" penceresi statik (BE-122); hedef içerik 01f (BE-123)                                      |
| P49 | ZIP'in yeri                                    | 06 Arşiv; BE-120 stub; hedef yapı BE-124                                                                                            |
| P50 | Toplantı raporu içeriği                        | 01g çizimi; "göreve dönüştürülenler"; düğme not sayısına bağlı değil                                                                |
| P51 | 01f tek artboard; [BE] statikler               | 01f bölünmez; HTML/CSV/süzgeç/son raporlar/asenkron/K birim raporu statik ya da yok, her biri kayıtta                                |
| P52 | Rapor listeleri/sekmeleri                      | 01e sekmeleri uygulanmaz; `reportDashboardTasks/Meetings`, `reportTaskDetail`, `reportWorkload` JSON kullanılmaz                     |
| P53 | K1/Ü1 ve rol menüleri                          | K1/Ü1 birebir; veri mevcut uçlardan tek yüklemle; yönetici K/Ü merceğinde yönetici menüsü kalır                                       |

### Açık tema v85 (#121)

Ürün sahibi kararı (2026-11-13): yeni açık tema web'e alındı. #121 (`7224383`): tasarım sistemi pini `e641d2e` (kaynak zaten v85 değerlerini taşıyordu, web pini geride kalmıştı); `design/web-tokens.json` `light-v85` grubu (10 değişken + `shadow-card` açık değeri); `docs/tasarim/kaynak/theme.css` v85; `tokens.test.ts` `.16`/`0.16` yazım normalizasyonu. Kapı: 585 dosya / 4032 test; duman 9/9 (taşma 0, CSP 0). Yukarıdaki 35 değişkenli tablo **tarihsel** karşılaştırmadır. Mobil depoya dokunulmadı (mobil `tokens.json` zaten v85).

## F7'ye devredilenler / borçlar

Yeni bir faz açılmadan izlenir; hiçbiri F7'yi kendiliğinden başlatmaz. F5 borç listesinden F6'ya geçenler [web-5 ilerleme](../web-5/ilerleme.md) tablosunda kalır; aşağıdakiler F6'nın kendi borçlarıdır.

| #   | Borç                                                                                                                                                                                                                                                                | Kaynak / sahip                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Gerçek cihaz ekran okuyucu (VoiceOver) kabulü: W136–W142 yapılmadı; kullanıcı görsel onayı otomatik geçti sayılmaz                                                                                                                                                  | W136–W142 raporları                             |
| 2   | Gerçek sunucu bilet tanığı: POST gövdeli bilet (`member_ids`), `Content-Disposition` adı, 429 `Retry-After` gerçek değeri; W142 e2e ve duman **sahte** `/v1` ile. **W144 işliyor** — sonuç [dogrulama-F6.md](dogrulama-F6.md)'de (bu belgeye işlenmedi, doğrulanamadı)    | W136 / W144                                     |
| 3   | E-13-72 "indirildi · ‹boyut›": boyut gösterilmiyor (`Blob.size` yolu kurulmadı), yalnız dosya adı                                                                                                                                                                  | W136                                            |
| 4   | `reports ↔ work` import döngüsü: **kapandı** (W142 KUSUR 4, `2d00088`; `module-boundary.test` korur). Bilerek kalan: `reports` `work/public` pencere bileşenlerini kullanmıyor                                                                                      | W138 / W142                                     |
| 5   | Ü1 → 03 hedefi: program geneli kuyruktaki başka birim görevi `?gorev=` ile 03 panelini açar; W142 KUSUR 3 yalnız önbellekteki satırları kapsar. **Yönetici üye merceğinde** başka birimin görevine derin bağlantı araştırılmadı (`reports-task.test` "mercek ≠ yetki" ikinci yarısı çıkarıldı); W144 gerçek sunucuyla sınar, Codex'e açık | W140 / W142                                     |
| 6   | `MEETINGS_ROUTE`/`MEETING_ROUTE` ihracı: **kapandı** (`a677af3`, `home` yerel sabitleri kaldırıldı). `work/public.ts` pencere bileşenleri dışa açılırsa K1/Ü1 onlara geçer (hâlâ yerel kopya)                                                                         | W137 / W140 / W142                              |
| 7   | ZIP onay penceresi (E-13-10): kodlanmadı (düğme devre dışı, ulaşılamaz); BE-120/BE-124 açılınca                                                                                                                                                                     | W138                                            |
| 8   | 390 px'te ZIP ve "Dosya yükle" düğmeleri tam genişlikte değil (E-13-12, geçici kabul); bölüm penceresi KUSUR 5 ile kapandı                                                                                                                                         | W142                                            |
| 9   | K1 iade gerekçesi yok (E-K1-17/18, BE-139); gerçek backend e2e ilk CI koşumu                                                                                                                                                                                        | W142                                            |
| 10  | Kâğıt genişliği 880 px / tasarım 820, 10,5 pt için token yok (rapor-F6 tasarım farkı)                                                                                                                                                                               | W138                                            |
| 11  | Prototip/tuval notları: 01h hücre kicker'ında "sekmesi" ifadesi, 01i penceresinde "kayda geçer"; kanonik "Raporlar sayfasına dön" bağları; önemsiz, tasarım turunda toplanır                                                                                       | koordinatör (f5-notlar)                         |
| 12  | K1/Ü1 uçsuz alanlar BE-137…141, BE-005 (görev kodu), BE-078/079 (kart dilimi/avatar) açık; "backend dursun" (P46) sürüyor                                                                                                                                          | [rapor-F6](../../backend-eksikleri/rapor-F6.md) |
| 13  | **F7 adayları** (karar ister; [web-7](../web-7/README.md)): Kurumsal hafıza, Takvim, Bildirimler, Asistan panelleri (tuvalde var, F6 dışı); profil sayfası (Ü7); Ü2–Ü7, K2–K8; 01b işlem geçmişi                                                                         | P46 / [web-7](../web-7/README.md)               |
| 14  | Pin yükseltmesi ve "Şimdilik" yollarının kaldırılması hâlâ ayrı karar                                                                                                                                                                                               | [pin-yukseltme-plani](../web-5/pin-yukseltme-plani.md) |

**F7 AÇILMAZ — kullanıcı onayı.** Onay otomatik geçti sayılmaz; "F6 kapandı" ifadesi gerçek sunucu tanığı, Codex hükmü ve kapanış PR'ı MERGED olana kadar kullanılmaz.

### O4 — kapanış (W143, W144; Codex bekliyor)

- **W143** (`web6/o4-kapanis`): rapor-F6, bu kayıt, oturum-3-entegrasyon, oturum-4-kapanis, 13-raporlar mekanizma §4.3 (KESİN 26 hizası), 01/13/00 README kabul kanıtları, `ekranlar/README` durum, web-7 iskeleti, yol haritası §4 ve tasarım README sürüm notu (yalnız belge; kod yok).
- **W144** (`web6/o4-w144`): `dogrulama-F6.md` — **bekliyor** (sonuç bu kayda işlenmedi).
- **Codex** `gpt-6.1-sol` medium `-s read-only` nihai kapı: **bekliyor** (`docs/reviews/WEB-6-codex.md` henüz yok). Hüküm ve kapanış PR satırı hükümden sonra eklenir: **bekliyor**.
