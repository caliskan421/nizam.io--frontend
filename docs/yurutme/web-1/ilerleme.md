# WEB-1 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| O1 — F1 kabul tabloları | Tamamlandı (WEB-0 O5 adım 1b) | — |
| O2a — Veri katmanı (W41, W41b, W41c) | Birleşti (W41 #32 · W41b #33 · W41c #35) | `7a5c5aa` · `3fc4a9e` · `2e43eb7` |
| O2b — Görevler ekranı (W42–W47) | Birleşti (W42 #34 · W43 #36 · W44 #37 · W45 #38 · W46 #40 · W47 #41) | `1d1aab9` · `0429c80` · `318223d` · `be0ed4d` · `2fc5f5e` · `050ca8e` |
| O2 entegrasyon turu (W48) | Birleşti (#42) | `e34a22c` |
| O3 — Sade ana sayfa (W51) | Birleşti (#39) | `b74b8ab` |
| O4 — Temizlik (W61) | Birleşti (#43; CSS katman sırası düzeltmesi dahil) | `67d31b4` |
| O5 — Kapanış | Belgeler (adım 1, 2, 5, 6) + görsel doğrulama (adım 3, main `67d31b4`) + Codex tur 1 **UYGUN DEĞİL** (adım 4); tur 2 `<tur 2 hükmü>` | `<kapanış main hash>` |
| O5 düzeltme turu (W62, W63) | Birleşti (W63 #44 · W62 #45) | `a3ffe64` · `<#45 hash>` |

## Kayıtlar

### 2026-11-09 — O2 (görevler, W41 → W42–W47) ve O3 (sade ana sayfa, W51)

- **Yapılanlar (O2a):** W41 #32 `7a5c5aa` — `modules/work` veri katmanı (her okuma ucu için sorgu, her yazma ucu için `useProtectedMutation` sarmalayıcısı), `capabilities.ts` tablosu (`backend.md` §3 tamamı), `shared/ui/conflict` alan alan çakışma diyaloğu, O2b bileşen iskeleti (`components/index.ts`), `client.ts` isteğe özel kapsam başlığı — **Codex CX-F0-E-06'dan kalan mikro görev boşluğu kapandı** (`scope-race.test.ts`). W41b #33 `3fc4a9e` — iskelet sözleşme testi bileşenleri bağlamadan doğrular + `useWorkItemTarget` reaktif. W41c #35 `2e43eb7` — `useProtectedMutation` yazma değişkenlerindeki Vue vekillerini açar; indirme bileti (`useDownloadTicket`) `gcTime` 0 — bilet mutasyon önbelleğinde kalmaz.
- **Yapılanlar (O2b):** W42 #34 `1d1aab9` — `TasksPage` (tablo, Tümü + 5 durum + Geciken, arama, tek koordinatörlük süzgeci, istemci sıralaması, "Daha fazla yükle", talep bandı) + `CURRENT_PHASE` F1 · W43 #36 `0429c80` — ayrıntı paneli · W44 #37 `318223d` — alt görevler (blok + sekme aynı sorgu) · W45 #38 `be0ed4d` — yeni görev formu, durum menüsü, silme; K11 `vee-validate@4.15` + `zod@4.6`; `useDepartmentMembers` · W46 #40 `2fc5f5e` — dosyalar (multipart, etiket seçici, bilet, ad değiştir, sil) · W47 #41 `050ca8e` — notlar.
- **Yapılanlar (O3):** W51 #39 `b74b8ab` — sade ana sayfa (`modules/home`): selamlama, KPI şeridi (Admin `reportDashboard`, K/Ü istemci sayımı), hızlı işlemler, nötr "Son işlemler".
- **Kapı:** her PR ve main CI'da üç iş yeşil; vitest **903 → 1480** (main `050ca8e`).
- **YENİ-EKSİK:** yok. Kullanılan `designStub` kimlikleri: BE-001, 003, 004 (arama istemcide), 005, 006, 007, 008, 010, 038, 040, 091 → `../../backend-eksikleri/rapor-F1.md`.
- **Koordinatör onaylı varsayımlar** (03 ve 01 kabul tablolarına "kabul (koordinatör, 2026-11-09)" olarak işlendi, Kabul kanıtı sütununda PR):
  - W42 — "geciken" katalog `durum` değeri (E-03-07); talep süzgeci/bandı `companyAdmin ∨ koordinatör` olgusuna bağlı (E-03-09, E-03-13); yeni görev departmanı: Admin'de koordinatörlük süzgeci, K/Ü'de seçili birim yalnız koordinatörse (E-03-06); derin bağlantıda panel ilk liste sayfasından sonra (E-03-19); varsayılan sıralama sunucu sırası, "bitiş artan" öneri kalır (E-03-16).
  - W43 — "Kanıt yükle" + `FileUploadDialog` panelde (E-03-52); salt okunur durum etiketi panelde (E-03-44); "Hatırlat" herkese devre dışı (E-03-53); kısa kod "KOD-—" (E-03-41); `completed_on` olayı ilerleme çizgisinde (E-03-51); "Tam sayfada aç" gizli (E-03-42).
  - W44 — "Başlığı düzenle" menüde (E-03-36); kanıt yuvası yalnız blokta (E-03-60); IK'sız uçlarda yeniden okuma ve çakışma döngü koruması (E-03-33).
  - W45 — yalnız `transitionWorkItem`; `requestEvidence` yayını (E-03-58); Admin'de çok seçenekte departman otomatik seçilmez; açıklama + öncelik formda; retry başarısından sonra ek atama koşar (E-03-57).
  - W46 — bilet `<a download>` yalnız `/v1/downloads/{bilet}` göreli yol (E-03-61); "son dosya" sunucu sırası (E-03-50); yuvada son dosya / "ad +n" (E-03-35).
  - W47 — not uzunluk sınırı yok (openapi vermiyor → BE-036 madde 8 genişletmesi); kurulum saat dilimi; ghost Düzenle/Sil (E-03-62).
  - W51 — KPI tıklaması `durum` süzgeciyle; tek dinamik `--home-kpi-fill`; "Kapsam seçin" notu (E-01-03); "Yeni görev" görünürlüğü `canCreateWorkItem` (E-01-09).
- **Süreç dersleri:**
  - **İskelet testi kırığı → W41b.** W41'in iskelet sözleşme testi bileşeni bağlayıp `data-placeholder` arıyordu; O2b W'leri gövdeyi (Pinia/VueQuery gerektiren) doldurunca kaçınılmaz kırıldı → test derlenmiş `props`/`emits` bildirimlerini bağlamadan denetler; `useWorkItemTarget` reaktif yapıldı. Ders: paylaşılan iskeletin testi gövdeye bağımlı olmamalı.
  - **Vue vekili / `structuredClone` → W41c.** Reaktif formdan gelen (`ref`/`reactive`, içinde `File`) yazma değişkenleri K5 tekrar nesnesinin `structuredClone`'unda kırıldı → `useProtectedMutation` vekilleri motora vermeden derin açar (`File`/`Blob`/`FormData` aynen); tek kullanımlık bilet önbellekte tutulmaz. Ders (web-2 ortak sözleşmesine KESİN olarak girdi): yazma değişkenleri düz nesne; vekiller hook'ta açılır.
  - **Hat betiği zsh argüman hatası.** Koordinatörün kapı/PR hat betiği zsh'de argüman hatası verdi. Ders: hat betikleri açıkça `bash` ile çağrılır, argümanlar tırnaklı geçilir; betik hatası kapı sonucu sayılmaz, adım elle tekrarlanır.
  - **Yük altında titrek testler.** Paralel worktree kapıları aynı makinede koşarken zamanlamaya duyarlı testler ara ara düştü; tek başına koşumda yeşil. Ders: gerçek süre beklemesi yok (sahte saat), paralel kapı sayısı sınırlı, düşen test tek başına yeniden koşulup kayda yazılır.
  - **Taslakla test → entegrasyon turu (W48).** O2b sayfa testleri komşu bileşenleri taslakla değiştirdi; gerçek bileşenlerle olay zinciri (kapsam değişimi, dört kişilik yetki, iç içe `aside`/`role`, `?yeni=1`) ayrı turda doğrulanıyor. Ders (web-2'de zorunlu oturum): paralel işçiler komşu bileşeni taslakla test ettiyse entegrasyon turu zorunludur.
- **Sürüyor → kapandı:** W48 (O2 entegrasyon turu) #42 `e34a22c` · W61 (O4 temizlik: yazı tipleri, ölçüler → `web-tokens`, statik i18n, `ci.yml` metni, avatar, ≤900 px menü, zil noktası, giriş formu, kardeş sekme bayrağı) #43 `67d31b4` — ayrıntı aşağıdaki 2026-11-09 O2/O4/O5 kaydında.

### 2026-11-09 — O5 (kapanış belgeleri; adım 1, 2, 5, 6)

- **Adım 1:** `docs/backend-eksikleri/rapor-F1.md` — F1'de BE satırı eklenmedi/değişmedi; F2 öncelik sırası (Paket 2.1 kullanıcı okuma ailesi, 2.2 departman oluştur + bağla, BE-001, BE-048, BE-036 F2 maddeleri, koşullu ve diğer F2, BE-038); F1'de öğrenilenler.
- **Adım 2:** `05-kullanicilar/README.md` ve `08-koordinatorlukler/README.md` uygulama kararı tabloları dolduruldu — durum **geçici kabul**.
- **F2 soruları geçici kabul — ürün onayı bekliyor.** Codex §6 #13–#18 ürün sahibince henüz cevaplanmadı; oturum-5 adım 2 gereği Codex'in önerdiği varsayılanlar geçici kabul edildi: #13 Admin anahtarı ayrı, çip başına tek üyelik rolü, çip işlemleri anında ve ayrı onaylı, toplu atomik Kaydet yok · #14 yöneticiye şirket listesi, seçili program üyelikleri etiketli, koordinatöre admin ekranı taklidi yok · #15 "Kullanıcı oluştur" + yöneticinin belirlediği geçici parola, kilit durumu tahmin edilmez, silinenler ayrı akış (F2'de yok) · #16 görev atamada hedef departman açık seçilir, profil düzenleme yönetim paneline, Mesaj/Rapor/Etkinlik fazını bekler, Dosyalar sayısız · #17 08 yönetim ekranı yöneticide, koordinatör birim görünümü ayrı tanım, üyeye ekip yönetimi yok, düz ızgara · #18 eksik formlar ortak bileşenlerle, yapı kopyası ≠ görev aktarımı. Ürün sahibi farklı cevaplarsa tablolar F2 O2a'dan (W71) önce güncellenir.
- **W22 / WEB-0 F2 devirleri** kabul tablolarına girdi: yönetim rotaları `NO_DEPARTMENT_EXEMPT_ROUTES`'a; Yönetim grubu kapısı `menu.ts` → organizasyon `capabilities.ts` (CX-F0-K-03); yöneticide "departman katılmamış" tespiti hazır (`DepartmentGap`) → 08 boş durumu.
- **Adım 5:** `sentez.md` §8 durum satırı. **Adım 6:** `docs/yurutme/web-2/` iskeleti (O2a W71; O2b W72–W76; O3 W81; O4 W82 entegrasyon; O5).
- **Bekleyen (o anda; adım 3 ve 4 aşağıdaki kayıtta):** adım 3 (görsel doğrulama, tam kapı) ve adım 4 (Codex kapısı `docs/reviews/WEB-1-codex.md`) W48 ve W61 birleşince; yönetim deposu `program/DURUM.md` + `gunluk/` satırı; ürün sahibi cevapları (#13–#18).

### 2026-11-09 — O2 entegrasyon turu, O4 temizlik, O5 doğrulama ve Codex kapısı

- **W48 — O2 entegrasyon turu, #42 `e34a22c`.** Gerçek bileşenlerle (taslaksız) olay zinciri; bulunan ve düzeltilen 5 entegrasyon kusuru: (1) Admin merceğinde derin bağlantıyla açılan ayrıntı panelinin kendiliğinden kapanması; (2) iç içe `role="row"`; (3) silmede panelin çift kapanması + yanlış bildirim; (4) kapsam değişiminde yeni görev formunun açık kalması; (5) `?yeni=1` derin bağlantısı. vitest 1480 → **1505**.
- **W61 — O4 temizlik, #43 `67d31b4`.** Yazı tipleri (kendi sunucudan), ölçek dışı px'ler → `design/web-tokens.json` (`*-metrics.css` kaldırıldı), `ui.*` → statik `tr/ui.ts`, `ci.yml` hata metni, program avatarı, ≤ 900 px dar menü, zil noktası, giriş formu, kardeş sekme bayrağı; **CSS katman sırası düzeltmesi** (aşağıda). vitest 1505 → **1544**.
- **CSS katman sırası olayı.** #37'den (W44) itibaren Vite ortak bir CSS parçasını giriş CSS'inden önce bağladı; `@layer components` ilk katman oldu, Tailwind taban katmanı bileşen stillerini ezdi (dolgular 0, iki tema simgesi). Birleşmiş üretim derlemesi #37–#43 arası görsel olarak bozuktu ve **hiçbir kapı yakalamadı**; W61 işçisi görsel dumanda buldu. Çözüm #43: `public/layers.css` ilk stil kaynağı + `src/app/styles/layers.test.ts`, `e2e/layers.spec.ts`, `e2e/smoke.spec.ts` hesaplanmış stil iddiaları. **Ders:** her UI PR'ında üretim paketi görsel dumanı (hesaplanmış stil, yatay taşma, iki tema) zorunlu (web-2 ortak sözleşmesine KESİN olarak girdi).
- **Adım 3 — görsel doğrulama** (main `67d31b4`; üretim paketi + üretim CSP'si + Playwright + sahte `/v1`; gerçek backend yok): 53 senaryo, 96 görüntü (88 uygulama + 8 tasarım), iki tema × 1440/1024/390 × Admin/Koordinatör/Üye. Kusurlar: **yüksek 1** — alt görev onay kutusu 2 px'e çöküyor (E-03-31); **orta 2** — `/gorevler` 390 px'te 10 px yatay taşma; not çakışmasında tutarsız sunucu yanıtında sınırsız yeniden gönderim (ölçüm ~1,5 sn'de 19.594 PATCH); **düşük 5** — KPI "Onay bekleyen" hizası; 4 atananlı satırda avatar kırpılması; yükleniyor/hata başlığında "0+ görev · 0 kişi"; Dosyalar sekmesinde kanıt satırı; zod `Function('')` yoklamasının CSP `script-src` ihlali (53 senaryonun 38'inde). Bilinçli fark 22. Yazı tipleri kendi sunucudan; stil/yazı tipi CSP ihlali yok; katman sırası sağlam. **Yapılamayan:** gerçek yükleme/indirme; tasarımla piksel karşılaştırması (şablonlarda ham `{{ }}`); E-01'in görüntüde yeniden üretimi (sahte sunucu zaten süzüyordu). Görüntüler depo dışında (koordinatör scratchpad), git'e girmedi.
- **Adım 4 — Codex tur 1** (main `67d31b4`, model `gpt-6-astra`, `-s read-only`): **UYGUN DEĞİL** → [`../../reviews/WEB-1-codex.md`](../../reviews/WEB-1-codex.md) (tam metin). Engelleyiciler: E-01 Üye merceği liste süzmesi; E-02 istemci onayının kapsam/oturum yaşam döngüsü; E-03 oluştur → ek atama bağlamı; E-04 görsel kabul + 390 px taşma. Ayrıca Ö-01…Ö-05, K-01…K-04.
- **Düzeltmeler:**
  - **W63 #44 `a3ffe64`** — E-01 (`work/model/assignment.ts` tek yüklem; liste, sekme sayaçları, talep sayısı, sayfalayıcı, boş durum, ana sayfa KPI aynı kümeden; pinli spec'te sunucu atanan süzgeci yok → istemci süzmesi); Ö-01 (talep bandı kısmi etiketi); Ö-02 kısmen (sahte backend sunucu görünürlüğünü uygular, atanmamış üye testi sözleşmeye uygun, `entry.test.ts` gerçek tıklama; üretim `createAppRouter`/`AppShell` harness'e alınamadı — modül → `app/` sınır kuralı → F2 borcu); K-04 (bilet `reset` `finally`); görsel kusurların 8'i de (yeniden ölçüm: taşma 390/1024/1440 = 0/0/0; CSP ihlali 30 senaryoda 0; onay kutusu satırda 18×18, panelde 16×16; çakışmada eylem başına en fazla bir diyalogsuz yeniden gönderim; `z.config({ jitless: true })`). vitest 1544 → **1569**.
  - **W62 #45 `<#45 hash>`** — E-02 (`shared/ui/confirm/use-confirm.ts` onay açılırken kapsam + oturum nesli + hesap yakalar; kapsam değişimi, çıkış/hesap değişimi, bileşen sökülmesi bekleyen onayı vazgeç sayar; bayat bağlamda kabul de vazgeç; tüketiciler değişmedi); E-03 (`submit(vars, { context })`, `MutationSuccess.context`; ardıl adım ilk eylemin bağlamıyla; değişimde ek atama gönderilmez, ilk başarı korunur, kısmi sonuç bildirilir); Ö-03 (`/layers.css` `no-cache`; duman testi `/` ve `/gorevler`'de tüm CSP ihlalleri 0). vitest 1569 → **1583** (#45 dalı).
  - **Belge (`web1/o5-kapanis`)** — K-01 (bu kayıt, durum tablosu, `README.md` durum ifadesi); K-02 (`03-gorevler-liste/backend.md` sekme sayaçları ve `sentez.md` G3 pinli spec'le uzlaştırıldı); K-03 (px kuralının medya koşulu istisnası belgelere yazıldı; eşik ↔ token eşlemesi F2 borcu).
- **Kapı:** vitest **1480** (#41 sonrası) → **1505** (#42) → **1544** (#43) → **1569** (#44) → **1583** (#45 dalı). Codex tur 2: `<tur 2 hükmü>`; kapanış main `<kapanış main hash>`.
- **YENİ-EKSİK:** yok — düzeltme turunda (W62/W63) BE satırı eklenmedi; `listProgramWorkItems`'ta atanan süzgeci yok → BE-038 notu `../../backend-eksikleri/rapor-F1.md` §1.
- **Süreç olayları ve dersler:**
  - **#45 ilk CI koşumunda "Playwright duman" kırmızı.** W62'nin duman testine eklediği `/gorevler` adımından sonra `goto('/')` kimlik sayfası yerine ana sayfayı açıyordu (`session-status` yalnız `/oturum`'da); üretim kodu değil test hatası; düzeltildi (`c13a1bb`). İşçi e2e'yi yerelde gerçek backend'siz koşamamıştı. **Ders:** e2e değişikliği sahte `/v1` ile tam akış provası olmadan PR'a girmez.
  - **Hat komutu birleştirme başarısızken uzak dalı sildi; #45 kapandı.** Dal yeniden gönderilip PR yeniden açıldı. **Ders:** temizlik adımları yalnız `&&` zincirinde, birleşme doğrulandıktan sonra.
  - **Üç işçi oturumu 04:56'da yarıda kesildi** (commit'lenmemiş değişikliklerle); 11:49'da kaldıkları yerden sürdürüldü, iş kaybı yok. **Ders:** işçiler iş başına erken commit atar.
  - **Birleşmiş üretim paketi #37–#43 arası bozuktu, kapı yakalamadı** (katman sırası olayı). **Ders:** her UI PR'ında üretim paketi görsel dumanı; işçi raporunda ölçüm zorunlu.
- **F2'ye devredilen borçlar** (`../web-2/` ortak sözleşme ve O4 W82'ye işlendi):
  - Ö-02 kalan — entegrasyon harness'i üretim `createAppRouter`/`AppShell` ile; gerçek 403, kapsam değişimi, çıkış ve bekleyen onay senaryoları.
  - Ö-04 — test beklemeleri: `setTimeout(0)` yerleşme döngüleri → koşul/olay tabanlı.
  - Ö-05 — dar menü kaplaması: odak dönüşü, arka içerik klavye erişimi, kaydırma kilidi.
  - Yükleme/hata sırasında sekme sayaçları "(0)"; avatar yığını 3 avatarda 72 px (60 px sütun).
  - Codex önerisi: her UI PR'ı için üretim paketi görsel kapısı + faz sonunda gerçek imaj tanığı.
  - K-03 — medya koşulu eşiklerinin token değerleriyle eşlenmesi; Yönetim menüsü kapısı organization `capabilities.ts`'e (W71).
  - Yeni bileşik işlemler `followUps(data, context)` + `submit(…, { context })` kullanır; F2 `confirmation_required` akışları `use-confirm` yaşam döngüsünü tüketir.
- **Bekleyen:** Codex tur 2 (`<tur 2 hükmü>`) → `docs/reviews/WEB-1-codex.md`; #45 birleşme hash'i `<#45 hash>`; kapanış main `<kapanış main hash>`; yönetim deposu `program/DURUM.md` + `gunluk/` satırı; ürün sahibi cevapları (#13–#18).
