# WEB-2 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| O1 — F2 kabul tabloları | Tamamlandı — ürün sahibi 2026-11-09'da #13–#18'i önerilen varsayılanlarla cevapladı (#51); 05/08 tabloları **kabul** (ortak-kurallar §12 P12–P17) | `f91f195` |
| O2a — Organizasyon veri katmanı (W71) | Birleşti (#52) | `f0453c5` |
| O2b — 08, 08b, formlar, 05, 05b (W72–W76) | Birleşti (W72 #53 · W73 #54 · W74 #55 · W75 #56 · W76 #57) | `376b404` · `981e6d5` · `1d5359c` · `7ea788a` · `b0451e4` |
| O3 — Program yönetimi (W81) | Birleşti (#58) | `a639d3f` |
| O4 — Entegrasyon turu (W82a, W82b, W82c) | Birleşti (W82a #59 · W82b #60 · W82c #61) | `b1ac19c` · `7ee18fe` · `08e6956` |
| O5 — Kapanış | Adım 1, 2, 5, 6 belgeleri `web2/o5-kapanis` dalında (`rapor-F2.md`, kabul tabloları, ortak-kurallar §6/§7, KESİN 5, `sentez.md`, `../web-3/` iskeleti); adım 3 görsel doğrulama (Docker gerçek imaj + sahte `/v1` turu) ve adım 4 Codex kapısı koordinatörde → `<adım 3 özeti>` · `<Codex hükmü>` | `<kapanış main hash>` |

## Devralınan (WEB-1 O5)

- **F2 borçları** (ayrıntı `../web-1/ilerleme.md` 2026-11-09 O2/O4/O5 kaydı; iş kalemi olarak [oturum-4-entegrasyon.md](oturum-4-entegrasyon.md) W82 (10)–(16); (15) Ö-07 geç bildirim ve (16) Ö-08 sorgu oturum/önbellek ayrımı Codex tur 5–6 koşullarıdır): Ö-02 kalan (üretim router/kabuk harness'i; gerçek 403, kapsam değişimi, çıkış, bekleyen onay) · Ö-04 (koşul/olay tabanlı test beklemeleri) · Ö-05 (dar menü odak/klavye/kaydırma kilidi) · yükleme/hata sırasında sekme sayaçları "(0)" · avatar yığını 72 px / 60 px sütun · K-03 medya eşiği ↔ token eşlemesi · Yönetim menüsü kapısı organization `capabilities.ts`'e (W71). **Hepsi kapandı** — aşağıdaki kayıt.
- **Yeni KESİN kurallar:** [ortak-sozlesme.md](ortak-sozlesme.md) 17–21 (üretim paketi görsel dumanı, e2e provası, iş başına commit, bileşik yazma/onay ortak altyapıdan, atanan süzmesi tek yüklemden).
- **Koordinatör hat kuralı:** PR sonrası temizlik (dal silme vb.) yalnız `&&` zincirinde, birleşme doğrulandıktan sonra (web-1 #45 olayı).

## Kayıtlar

### 2026-11-09 — O2/O3/O4 kayıtları

- **O1 — #51 `f91f195`:** ürün kararları P12–P17 (ürün sahibi #13–#18'in altısını önerildiği gibi cevapladı); 05/08 tabloları `kabul`.
- **O2a — W71 #52 `f0453c5`:** `modules/organization` veri katmanı (api, model, rotalar, bileşen iskeleti); `CURRENT_PHASE` F2; Yönetim menüsü kapısı organizasyon `capabilities.ts`'e (**WEB-0 K-03 kapandı**). vitest 1639 → **1769**. Ek düzeltmeler (ortak):
  - **Atama devri geçersizlemesi:** atama devri uçları görev listelerini geçersizler (eski W14 testi tersini sabitliyordu; bilinçli karar değildi).
  - **Truncation:** `shared/http/truncation.ts` — `X-Result-Truncated` okuyucudan bağımsız.
  - **`departments` tek şekil:** `scoped(['departments'])` tek veri şekli (kenar menüsü `department-code.ts` aynı anahtara dizi yazıyordu — F0'dan kalma hata).
  - **Onay bağlamı taraması:** `confirm-context.test.ts` tüketicileri kaynak taramasıyla bulur.
  - **YENİ-EKSİK → BE-107:** `createUser` 409 `organization.transfer_available` aktarılacak hesap kimliğini sözleşmede taşımıyor → `../../backend-eksikleri/kayit.md`, `rapor-F2.md`.
- **O2b:**
  - **W72 #53 `376b404`** — 08 liste (E-08-02…16, 24…39, 44, 45). **1841** test. Ortak: `routes.test.ts` gövdeden bağımsız (W71 iskelet testi yer tutucu sayfa bekliyordu — web-1 W41b dersinin tekrarı); **i18n tek ağaç** `trOrganization` (`organization.{coordinatorships,coordinatorship,forms,users,tracking}`).
  - **W73 #54 `981e6d5`** — 08b detay (E-08-50…90). **1916** test. Ortak: `shared/navigation/page-crumb.ts` (`usePageCrumb`), `icons.ts` `edit`.
  - **W74 #55 `1d5359c`** — formlar (E-08-05/33/63/70/79, E-05-05/33, geçici parola). **1980** test.
  - **W75 #56 `7ea788a`** — 05 kullanıcılar + yan panel (E-05-01…38). **2052** test. Ortak: `icons.ts` `download`/`mail`/`lock` (tasarımdan), `unlock` (tasarımda yok; `lock`'tan türetildi, P3). Kendi dumanında 390 px'te 220 px taşma bulup düzeltti.
  - **W76 #57 `b0451e4`** — 05b kişisel takip (E-05-40…75). **2118** test. Ek (work modülü): `work.tasks` sorgusuna `atanan`; `yeni=1` ile gelen `koordinatorluk` yetki varsa mercekten bağımsız form hedefi (Koordinatör merceğindeki yönetici düzeltmesi; 08/08b "Görev ata" da yararlanır).
- **O3 — W81 #58 `a639d3f`:** program yönetimi (`modules/program`, `/programlar`, E-00-25). **2201** test. "Program yok" → oluştur yolu (`resolve.ts` `NO_PROGRAM_EXEMPT_ROUTES`, OpenState bağlantısı); `programs.transfers()` anahtarı; `tr/program.ts`.
- **Kabul tabloları:** 05, 08 "Kabul kanıtı" sütunlarına PR numaraları, durum **kabul — uygulandı (2026-11-09)**; 00-ortak E-00-23/24 (W71 #52), E-00-25 (W81 #58).
- **Koordinatör onaylı varsayımlar** (işçi → koordinatör onayı):
  - **W71** — AdminGate sarmalayıcı bileşen (router modül kaydında `beforeEnter` atıyor); pano yazmadan sonra geçersizlenmez (§6 — W82a kararıyla organizasyon yazmaları için değişti, aşağıda); bileşenler `public.ts`'te yok.
  - **W72** — yapı sağlığı kutuları gezinmez; E-08-09 notu "Üye rolünde kimse yok"; "Görev ata" `/gorevler?yeni=1&koordinatorluk=<id>` gezinmesi (`NewTaskDialog` work `public.ts`'te yok); atama/oluşturma sonrası rapor açıkça yeniden okunur (W82a'da kaldırıldı); kapsam değişiminde sıralama varsayılana döner.
  - **W73** — sayaçlar yalnız etkin satırları sayar, silinmişler soluk; ekipten çıkarmada istemci onayı yok (yalnız sunucu `confirmation_required`); Ayarlar sekmesi salt gösterim + Düzenle.
  - **W74** — geçici parola ikinci adımını çağıran açar; katalog açıklaması boşaltılınca `description: ""`; parola kuralı istemcide yalnız "boş olamaz"; `department_exists` eşleşmesi yüklenen sayfalarda.
  - **W75** — süzgeç değişince `secili` temizlenir; iki yönde `updateMembershipRole`; geçici parola kendi hesapta da; oluşturunca seç + parola adımı; yeni kişi yüklü sayfada değilse bilgi notu (BE-043).
  - **W76** — "Bu hafta" = `end_on` ≤ bu pazar ve gecikmesiz; ad önbellekte yoksa tek `listUsers`.
  - **W81** — rota `program.programs` `/programlar`; aktarım kaynağı seçili program; engel/uyarı yalnız sayı; yıl seçenekleri bu yıl + gelecek yıl; kendi bağlama formu (`DepartmentForm` prop'ları yetmedi).
- **Görsel duman özetleri** (işçi beyanı; üretim paketi + üretim CSP'si + sahte `/v1`, süzülmemiş): W71 kabuk/menü 66 + 8 ziyaret · W72 6 ölçüm · W73 36 + 24 ölçüm · W74 36 ölçüm (6 form) · W75 12 + 12 ölçüm · W76 18 + 8 ölçüm · W81 `/programlar` 6 + 10 pencere + "program yok" akışı 4 koşu. Hepsinde taşma 0, CSP ihlali 0.
- **TASLAK satırları (O4 girdisi):** W72 `DepartmentForm`/`CoordinatorAssignDialog`; W73 `FORM_STUBS` (`DepartmentForm`, `MemberAddDialog`); W75 `UserCreateDialog`/`TemporaryPasswordDialog` (iki gerçek senaryo var); W76 `UserPanel` (bir gerçek senaryo var). O4'te hepsi gerçek bileşenle kapsandı.
- **O4 — entegrasyon turu:**
  - **W82a #59 `b1ac19c`** — üretim `App.vue` → `AppShell` + `createAppRouter` + gerçek oturum + durumlu sahte backend harness'i (`src/app/__tests__/integration/`; modüller `app/`'i içe aktaramadığı için burada — **F1 Ö-02 borcu kapandı**). Senaryolar (1)–(10) doğrulandı; 58 entegrasyon + 3 birim test; **2263** test. Bulunan ve düzeltilen **3 entegrasyon hatası (hepsi odak/ARIA):** `UserChip.vue` (onay kapanınca odak gövdeye düşüyordu), `MemberRow.vue` (menü öğesi sökülünce odak kayboluyordu), `PersonPicker.vue` (liste yokken `aria-controls`). **TASLAK satırlarının hepsi gerçek bileşenle kapsandı.** Görsel duman 14 durum × 3 × 2 = 84 koşu, taşma 0, CSP 0, dolgusu 0 düğme 0/348.
  - **W82b #60 `7ee18fe`** — borçlar (11)–(16) kapandı (aşağıda). **2304** test.
  - **W82c #61 `08e6956`** — organizasyonda `useToast()` kurulumda; `department-create` kısmi sonucu → `pushAppNotice`; `program/api/programs.ts` + `home/api/dashboard.ts` (ve aktarım geçmişi) `sessionBound`; `src/app/__tests__/integration` harness `setTimeout(0)` → `settleQueries`. **2316** test.
- **Borçlar (11)–(16) kapanışı (W82b):**
  - **(11) Ö-04** — `shared/http/__tests__/settle.ts` `settleQueries`/`until` (önbellek olayı + koşul); titrek 4 dosya 3 koşu 63/63.
  - **(12) Ö-05** — `narrow-nav.ts` + `AppShell.vue`: odak giriş/dönüş, `<main inert>`, kaydırma kilidi, Esc, rota değişiminde kapanma; 390 px klavye turu 25 Tab'ın 0'ı ana içerikte.
  - **(13)** — sayaçlar veri yokken sayısız ("(0)" değil); avatar yığını en çok 2 yuva (49 ≤ 60 px).
  - **(14) K-03** — `shared/tokens/media-thresholds.test.ts`: tüm `@media` eşikleri `--rp-narrow-max` ile eşli; `matchMedia` eşiği token'dan (KESİN 5 notu güncellendi).
  - **(15) Ö-07** — sökülmüş ekranın geç sonucu bildirim/yeniden okuma üretmez; tek istisna bileşik yazmanın kısmi sonucu → `pushAppNotice` (aynı oturum nesli). Ortak: `markDetached`/`notifyOutcome`/`reachesOwner`; kurulumda alınan `useToast()` sahip yaşamını bilir. Koruma kaldırılınca 3 + 2 test kırmızı. → `../../ekranlar/ortak-kurallar.md` §7.
  - **(16) Ö-08** — `shared/session/query-session.ts` `bindSessionQueries` (nesil/hesap değişiminde — kardeş sekme dahil — tüm sorgular iptal + önbellek boş) + `sessionBound` okuyucu kapısı; `session-isolation.test.ts` (yerel | kardeş) × (geciktirilmiş GET | geçici hata tekrarı) 4/4; iki katman yedekli. → `../../ekranlar/ortak-kurallar.md` §7.
  - **Davranış değişiklikleri:** kardeş sekme çıkışı önbelleği boşaltır; standing okuyucuları `signal` taşır; avatar 2 yuva; sayaçlar veri yokken sayısız; sökülmüş form tam başarıda bildirim/`created` üretmez; Esc belge düzeyinde.
- **Koordinatör kararları:**
  - **Pano geçersizlemesi (W82a):** organizasyon yazmaları (13 uç) eylemin program kapsamındaki `report.dashboard`'ı geçersizler; §6 "pano yazmayla geçersizlenmez" kuralı yalnız work yazmaları için kalır (gerekçe: üyelik/koordinatörlük yazmaları seyrek, pano sayıları doğrudan onlara bağlı; yöneticinin 60 sn eski sayı görmesi kabul edilemez). 08'deki el ile yeniden okuma kaldırıldı. → `../../ekranlar/ortak-kurallar.md` §6 ayrım notu.
  - **"Görev ata" hedef birimi mercekten bağımsız (W76):** `yeni=1` ile gelen `koordinatorluk` yetki varsa mercekten bağımsız form hedefi olur (Koordinatör merceğindeki yönetici; 08/08b "Görev ata" da yararlanır).
- **Kapı:** vitest **1639** (WEB-1 sonu) → **1769** (#52) → **1841** (#53) → **1916** (#54) → **1980** (#55) → **2052** (#56) → **2118** (#57) → **2201** (#58) → **2263** (#59) → **2304** (#60) → **2316** (#61).
- **YENİ-EKSİK:** **BE-107** (W71). Kullanılan `designStub` kimlikleri (F2 kodu): BE-001, 005, 011, 012, 013, 014, 015, 016, 017, 018, 042, 046, 107; BE-043 stub'sız sınırlı gösterim → `../../backend-eksikleri/rapor-F2.md` §1.
- **Süreç olayları ve dersler:**
  - **Scratchpad silindi.** Oturum yeniden başlayınca koordinatör scratchpad'i silindi (F1 görsel doğrulama PNG'leri, Codex ham çıktıları, betikler gitti; hükümler ve özetler depoda). **Önlem:** işçi istemleri `<repo>/.git/worktrees/<wt>/W-PROMPT.md`, koordinatör dosyaları `<repo>/.git/koordinator/`.
  - **İskelet testi tekrarı.** W71 iskelet testi istemde yazmasına rağmen yine gövdeye bağlıydı → W72 düzeltti. **Ders:** iskelet sözleşme/rota testleri için "gövde dolunca kırılır mı" sorusu O2a W'sinin kabul ölçütüne yazılır (web-3 ortak sözleşmesine girdi).
  - **Dal zinciri yöntemi.** Paralel işçiler aynı i18n dosyasını ve token dosyasını oluşturdu → kural ilk raporda kondu ("paylaşılan dosyayı ilk işçi oluşturur"), diğerlerine mesajla iletildi; dallar zincirle (her dal bir öncekinin üzerine merge) uyarlandı; çakışmalar birleşmeden önce çözüldü, CI'lar paralel koştu.
  - **GitHub Actions startup hatası.** İki koşum (main `7ea788a` push, #57 PR) "workflow file issue" ile iş çalıştırmadan düştü; iş akışı dosyası değişmemişti; yeniden koşumda ikisi de yeşil. `pr-merge.sh` yeşil denetim göremediği için birleştirmedi (doğru davranış).
  - **CI'da düşen session-isolation testi ve MSW soket teşhisi (W82b).** `session-isolation.test.ts` CI'da düştü; teşhis: soket düzeyi MSW yakalamasında yarış. Çözüm (`4bf6d32`): `fetch` doğrudan MSW işleyicilerine (`getResponse`), işleyicisiz istek açık hata + kayıt, iptal sinyali anında, test sonunda işleyici çalışmaları beklenir, önceki uygulama sökülür; tekrar senaryosunda çıkıştan önce diğer okumalar yerleşir.
  - **Yük altında zaman aşımı riski.** Bir yük altı zaman aşımı gözlendi (W75 ara koşu, work `events.test.ts` 5,2 sn); tek başına yeşil. Entegrasyon testleri yük altında 5 sn sınırına yaklaşıyor (F3'e devredildi).
- **F3'e devredilenler:**
  - Çip kaldırmada iki bildirim sırayla (onayın devir iletisi + "çıkarıldı"); birleştirme `shared/ui/confirm/use-confirm.ts`'in devir sayısını döndürmesini ister.
  - 08 `DepartmentForm`: kapsam değişiminde sayfada bağlı kalınca başarı bildirimi davranışı netleştirilecek.
  - `unlock` simgesi tasarımda yok (`lock`'tan türetildi, P3) — tuvale geri bildirim.
  - W81 aktarım kaynağı seçili program (varsayım) — ürün onayıyla teyit.
  - Entegrasyon testlerinin yük altında 5 sn'ye yaklaşması — zaman aşımı/bölme kararı.
  - "Gerçek imaj tanığı" (Docker imajı + Caddy CSP başlığı, gerçek backend): koordinatör O5 adım 3'te yapıyor. **O5 sınırı (o anda):** Docker yerelde yoktu → tanık yalnız CI `Web imajı` + `Playwright duman (gerçek backend)` işleri; gerçek yükleme/indirme yerelde sınanmadı.

### 2026-11-09 — O5 (kapanış belgeleri; adım 1, 2, 5, 6)

- **Adım 1:** [`../../backend-eksikleri/rapor-F2.md`](../../backend-eksikleri/rapor-F2.md) — F2'de eklenen tek satır BE-107; pin `v0.11.0-api` değişmedi, `backend'de`/`bağlandı`ya geçen yok; F2 `designStub` kimlikleri; **F3'ün ihtiyaçları önce** (Paket 0.4 BE-052/051/053/019 → 3.1 BE-056 → koşullu 3.2–3.6: BE-054, 055, 058, 059, 057, 020); F2'nin kendi eksikleri (2.1 kullanıcı okuma ailesi — BE-042/043 öne; BE-107; BE-003 ailesi + BE-038 notu); F2'de öğrenilenler.
- **Adım 2:** 05 ve 08 kabul tabloları kabul kanıtı + durum `kabul — uygulandı`; 00-ortak E-00-23/24/25. **F3 kabul tablosu** [`../../ekranlar/03c-zaman-cizelgesi/README.md`](../../ekranlar/03c-zaman-cizelgesi/README.md) dolduruldu (E-03C-01…83 + satır dışı tablo) — **durum geçici kabul**.
- **F3 soruları geçici kabul — ürün onayı bekliyor.** Codex §6 #11–#12 ürün sahibine henüz sorulmadı; oturum-5 adım 2 gereği Codex varsayılanları geçici kabul edildi: #11 mevcut yetkisi olan doğrudan tarih düzenler, ayrı düğme talep açar, üye düzenlemez, gönderilmiş zincire otomatik "geri al" yok · #12 yalnız görünür uçlar arasında gerçek oklar, izinli bağımlılık eylemleri, şerit "görev aralığı" etiketiyle, dışa aktarım pilotla doğrulanır, hazır değilse devre dışı. **P8 bağlayıcı** (koordinatör sürüklemesi talep, admin doğrudan, üye sürükleyemez, "İptal et" = 5 sn gecikme); **kendi SVG Gantt** (`../../architecture/gantt-secimi.md`). Ürün sahibi farklı cevaplarsa tablo F3 O2a'dan (W91) önce güncellenir.
- **Ortak kurallar:** §6 pano geçersizlemesi ayrımı; §7 Ö-07/Ö-08 politikası. [ortak-sozlesme.md](ortak-sozlesme.md) KESİN 5 eşik eşlemesi "kapandı".
- **Adım 5:** `../../ekranlar/sentez.md` durum satırı. Yönetim deposu `program/DURUM.md` + `gunluk/` satırı bu depodan yazılmaz (ürün sahibi / yönetim deposu kuralı).
- **Adım 6:** [`../web-3/`](../web-3/) iskeleti (README, ortak sözleşme — KESİN 1–21 + F2 dersleri, O2 zaman çizelgesi W91–W96, O3 entegrasyon W97, O4 kapanış). **F3 ürün sahibinin uyarısı/onayı olmadan açılmaz** (2026-11-09 talimatı).
- **Bekleyen (koordinatörde):** adım 3 görsel doğrulama → `<adım 3 özeti>`; adım 4 Codex kapısı (`docs/reviews/WEB-2-codex.md`) → `<Codex hükmü>`; kapanış → `<kapanış main hash>`.
