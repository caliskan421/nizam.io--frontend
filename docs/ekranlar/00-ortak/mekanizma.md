# 00 — Mekanizma (nasıl davranıyor)

Kaynak: `Sidebar.dc.html` `renderVals()` (seçim mantığı, menü grupları), `Kenar-Secici.dc.html` (kural notları), `Main/Gorevler-Liste/Toplantilar.dc.html` (üst çubuk), `theme.css` (tema). Tasarım prototip mantığı örnek veriyle çalışır; aşağıda kural olarak yalnız davranış şekli alınmıştır.

## 1. Giriş ve gezinme
- Kabuk oturum açıldıktan sonra her rotayı sarar; giriş/şifre ve açık durum ekranları (K7) kabuk içinde mi dışında mı — tasarımda **bilinmiyor**.
- Kenar menüsü öğesi → rota (K10 tipli ad; yol önerisi yalnız, kesin değil):

| Öğe | Sidebar kimliği (`active`) | Hedef | Rota önerisi |
|---|---|---|---|
| E-00-12 Ana sayfa | `home` | 01 Ana sayfa | `/` |
| E-00-13 Görevler | `tasks` | 03 Görevler › Liste (03c zaman çizelgesi de bu öğeyi etkin yapar) | `/gorevler` (zaman çizelgesi `/zaman-cizelgesi`, K10) |
| E-00-19 Toplantılar | `meetings` | 09 | `/toplantilar` |
| E-00-23 Kullanıcılar | `users` | 05 | `/kullanicilar` |
| E-00-24 Koordinatörlükler | `coords` | 08 | `/koordinatorlukler` |
| E-00-25 Teknofest ve sezon | `season` | program yönetimi (artboard yok) | bilinmiyor |
| E-00-18 Arşiv | `archive` | 06 (F5) | `/arsiv` |
| E-00-20 Mesajlar | `messages` | 10 (F7) | `/mesajlar` |
| E-00-16/17/22/26 | `calendar`, `memory`, `sheets`, `sim` | v1 dışı | — (menüde yok) |
| E-00-27 Yardım | — | bilinmiyor | — |

- **Etkin öğe** rotadan türetilir (alt rotalar ana öğeyi etkin yapar: 08b → Koordinatörlükler, 09b → Toplantılar, 05b → Kullanıcılar, 07 → Arşiv, 01b → Ana sayfa). Tasarımda `Toplanti-Kucuk.dc.html` küçük görüşme penceresi açıkken Görevler etkin — görüşme penceresi başka ekranın üstünde yüzer.
- **Geri / İleri (E-00-33/34)** tarayıcı geçmişiyle eşleşir (`router.back()` / `router.forward()`); geçmiş yoksa devre dışı. **Varsayım:** "geçmiş yok" uygulama içi gezinme yığınıyla izlenir (tarayıcı `history.length` güvenilir değildir); doğrulanacak.
- **Konum izi (E-00-35):** ilk parça program tam adı, bağlantıdır → **Varsayım:** program ana sayfasına (`/`) gider. Son parça geçerli sayfa adı (bağlantı değil). Detay ekranlarındaki ara parçalar ilgili grupta yazılır.
- **URL'de taşınan durum:** kabuk URL'ye bir şey yazmaz. Kapsam (program, departman, mercek) URL'de değil (K2: kapsam deposu + depolama istisnası). Derin bağlantıyla kapsam dışı bir kayda gelinirse davranış bu grupta tanımsız (ekran gruplarına ve K6'ya bırakılır).

## 2. Kapsam ve rol etkisi (K1, K2)
**Mercek ≠ sunucu rolü.** Rol kartı, aynı kullanıcının bu programdaki bakış açısını seçer:
- **Admin merceği:** yalnız `GET /v1/me` → `company_admin` doğruysa listelenir. Kapsam = seçili program, departman yok. Koordinatörlük kartı gizli.
- **Koordinatör merceği:** `me/departments` satırlarından, seçili programa katılmış ve kullanıcının koordinatör olduğu birimler. Kapsam = program + seçili departman.
- **Üye merceği:** aynı kaynaktan, üye olduğu birimler. Kapsam = program + seçili departman.
- Rol menüsü yalnız kullanıcının **bu programda sahip olduğu** mercekleri listeler; sağdaki sayı o mercekteki birim sayısıdır.
- `me/departments` satırı `(program_id, department_id, role)` üçlüsünü taşır (`role`: `koordinator` / `uye`); program ↔ departman eşlemesi ve rol ayrımı bu uçtan okunur — **doğrulandı** (`MyDepartment` şeması, `backend.md` §1). Kapsam isteklerinde başlıklar `X-Nizamio-Program` (S2/S3) ve `X-Nizamio-Department` (S3) olarak gider (`backend.md` başı).

**Menü görünürlüğü.** Tasarım "Yönetim" ve "Deneysel" gruplarını yalnız Admin merceğinde gösterir. Uygulamada rol dizesi karşılaştırılmaz: her menü öğesinin görünürlüğü, hedef ekranın ana okuma/yazma işleminin `istemci-akislari.md` §4 eylem görünürlüğü tablosundan türetilen capability'siyle (modülün `capabilities.ts`) belirlenir; mercek yalnız kapsamı belirler. **Karar (ortak-kurallar §1):** `me.company_admin` mercekten bağımsızdır; şirket yöneticisi Koordinatör veya Üye merceğine geçince de Yönetim grubu görünür kalır ve `listUsers` 403 dönmez. Tasarımın "Yönetim yalnız Admin merceğinde" gruplaması bu noktada **bilinçli sapmadır** (kabul testi: yönetici + Koordinatör merceği → Yönetim grubu görünür). Mercek değişimi capability hesabını değiştirmez (CX-T-04). Gizleme güvenlik değildir (K6).

**K14 süzgeci** capability'den bağımsızdır: Takvim, Kurumsal hafıza, Tablolar, Simülasyon v1'de hiçbir mercekte görünmez. Arşiv/Mesajlar durumu README açık sorusunda.

**Kapsam değişince (K2):** eski kapsamın sorguları iptal edilir, eski veri hiç gösterilmez (yükleniyor/iskelet), yeni kapsamla `scopedKey()` sorguları yeniden kurulur. Geçerli rota korunur; **Varsayım:** detay rotasında (örn. 08b, 09b) kapsam değişirse kayıt yeni kapsamda yoksa liste rotasına dönülür — ekran grupları doğrular.

## 3. Durum makinesi
| Durum | Değerler | Nerede tutulur | Hatırlanır mı |
|---|---|---|---|
| `scope.programId` | program kimliği / yok | kapsam deposu (Pinia) | **evet** — K2 istisnası (`storage-adapter.ts`, yalnız kimlik) |
| `scope.lens` | `admin` · `coordinator` · `member` | kapsam deposu | evet — **Varsayım:** mercek de "kapsam kimliği" sayılır; izinli anahtar listesine girmeli |
| `scope.departmentId` | departman kimliği / yok (Admin'de daima yok) | kapsam deposu | evet |
| `theme` | `dark` (varsayılan) · `light` | arayüz deposu + `<html>`/kök `data-theme` | **evet** — K2 istisnası |
| `openSwitcher` | `null` · `program` · `role` · `coord` | bileşen belleği | hayır |
| `sidebarCollapsed` | `false` · `true` | arayüz deposu | **hayır** — **Karar (ortak-kurallar §12 P10):** yalnız oturum belleği; K2 izinli anahtar listesi genişlemez |
| `navHistory` | geri/ileri yapılabilir mi | yönlendirici | hayır |

**Kapsam seçimi akışı (Sidebar mantığı + Kenar-Secici kuralları):**
1. Başlangıç: `me` + `me/departments` + programlar yüklenir. Hatırlanan kimlikler hâlâ geçerliyse kullanılır; değilse düşer.
2. Program seçimi: tek program varsa otomatik seçilir (K2). Birden çoksa ve hatırlanan yoksa → **bilinmiyor** (ilk program mı, seçim istemi mi; K2 "varsayılan kapsam yok" der → seçim istemi beklenir).
3. Program değişince: mercek ve departman yeniden çözülür (Kenar-Secici notu "o programdaki ilk uygun seçim" der; K2 "varsayılan kapsam yok" kuralı bununla çelişir). **Karar (ortak-kurallar §1):** seçenek tek ise otomatik seçilir; birden çoksa ve hatırlanan kimlik bu programda geçerli değilse **ilk öğe sessizce seçilmez** — seçici açılır ve K7 boş durumu gösterilir (CX-M-02, CX-T-04). Önceki mercek bu programda varsa korunur mu — **bilinmiyor**.
4. Mercek değişince: departman, o merceğin birimi tekse otomatik; hatırlanan departman yeni listede varsa korunur; yoksa ve birden çok birim varsa seçici açılır / K7 boş durumu (tasarım prototipi `coords[0]` seçer; K2 gereği uygulanmaz, ortak-kurallar §1; CX-M-02).
5. Departman değişince: yalnız departman değişir.
6. Her değişiklik → menü kapanır → kapsam değişim olayı (sorgu iptali, §2) → kimlikler hatırlanır.

**Tema:**
- Kaynak: `tokens.css` `:root` (yalnız koyu, `@layer` içinde) + `theme.css` `:root, [data-theme="dark"]` ve `[data-theme="light"]` blokları. Tasarımda öznitelik `.rp-page` üzerinde; Sidebar alt bileşeni aynı ağaçta olduğundan miras alır. Uygulamada öznitelik kökte (`<html>`) tutulmalı ki ışınlanan (teleport) menü/pencere de etkilensin — **Varsayım**.
- Düğme (E-00-37) `dark ↔ light` çevirir; simge yalnız CSS ile değişir (koyu: güneş, açık: ay).
- İlk açılış: hatırlanan değer; yoksa `dark` (K9 "koyu varsayılan"). Sistem tercihi (`prefers-color-scheme`) tasarımda yok — kullanılmaz (**Varsayım**; ürün sahibi teyidi).
- İstisna: `.rp-call`, `.rp-pip` (09d/09e görüşme) açık temada da koyu token'ları yeniden tanımlar.
- `color-scheme` her temada ayarlı (form denetimleri, kaydırma çubukları uyumlu).

**Menü daraltma:** E-00-03 → `.rp-side--rail` (76px) + `.rp-rail` içeriği; E-00-30 → geri genişlet. Dar ekranda (≤900px) kenar menüsü üstte tam genişlik yığılır; daraltmanın orada anlamı tasarımda tanımsız.

## 4. Etkileşim akışları
Kabukta sunucuya yazan tek eylem **çıkış**tır; K5 yazma protokolü (revizyon, idempotency) uygulanmaz.
- **Çıkış yap (E-00-29):** tık → (onay penceresi tasarımda yok) → oturum sonlandırma isteği → bellekteki erişim belirteci silinir, sorgu önbelleği temizlenir, kapsam deposu bellekten boşaltılır → giriş ekranına yönlenir. İstek başarısız/zaman aşımı olursa durum "sunucu çıkışı doğrulanamadı" olur, sessiz yenileme yapılmaz (`backend.md` §2, ortak-kurallar §8; CX-S-10). **Varsayım:** hatırlanan kapsam kimlikleri ve tema çıkışta silinmez (kullanıcıya özgü olmadıkları varsayılırsa); farklı kullanıcı aynı tarayıcıda girerse kimlikler geçersiz düşer (§3 adım 1). Doğrulanacak: çıkışta kapsam kimlikleri temizlenmeli mi.
- **Kapsam seçimi:** sunucu yazması yok; yalnız istemci durumu + depolama (§3).
- **Tema:** yalnız istemci; sunucuda tercih saklama tasarımda yok.
- **Bildirim zili (E-00-38):** v1'de panel statik (BE-002); tıklama davranışı README açık sorusunda.
- **Asistan (E-00-39):** F8; v1'de gizli önerilir (README açık soru).

## 5. Liste davranışı
- Program, mercek ve birim listeleri sayfalanmaz, aranmaz, süzülmez; tam liste menüde. Sıralama tasarımda örtük (veri sırası). **Varsayım:** programlar ad sırasına, birimler ada göre (GAP-036 Türkçe katlama bağımlılığı ile) sıralanır.
- Uzun liste davranışı (kaydırma, tavan) tasarımda yok; menü kenar menüsünün yüksekliğini aşarsa iç kaydırma gerekir (**Varsayım**).
- **Rozet sayaçları** (E-00-14 geciken, E-00-15 tarih talebi, E-00-21 okunmamış sohbet, E-00-38 okunmamış bildirim) kapsamla değişir (E-00-38 hariç); sorgu tazelemesiyle (K8: SSE yalnız sohbet) ve pencere odağa dönünce (K6) yenilenir. Kaynak uçları `backend.md`'de. **Admin merceği:** geciken ve tarih talebi sayacı `reportDashboard` (`overdue_tasks`, `pending_date_changes`) ile gerçektir (yalnız `company_admin`). **Koordinatör/Üye merceği:** ayrı sayaç ucu yok → BE-003 (`eksikler.md`); liste üzerinden istemcide sayım v1'de yapılmaz: aynı ucun imleçli sayfalaması K3 fan-out yasağı **değildir** (ortak-kurallar §9), ama rozet her ekranda göründüğü için tam tarama maliyeti kabul edilmez; doğru çözüm sayaç ucudur (CX-T-05). E-00-21 sayısı okunmamış **sohbet** sayısıdır (`unread_chats`). E-00-38 sayacı hesap geneli olup kapsamla değişmez.

## 6. Boş / yükleniyor / hata durumları
Tasarımda kabuk için hiçbiri yok — **tasarımda yok, K7 varsayılanı**:
- **Program yok:** kapsam kartları boş; Admin'e "program oluştur" açık durumu (K7), diğerlerine bilgilendirme. Program kartının boş görünümü tasarlanmamış.
- **`membership_required` / departman ataması bekleniyor:** hiçbir programda ekip satırı olmayan, yönetici olmayan hesapta `listPrograms` doğrudan 403 `organization.membership_required` döner (program kartı da yüklenemez); `myDepartments` 200 ve boş/`null` döner (bu kodu döndürmez). Açık durum ekranı (K7, metin istemcide) `listPrograms` 403'üyle tetiklenir; mercek yok, kartların hiçbiri gösterilmez (`backend.md` §6).
- **Programa departman katılmamış:** Koordinatör/Üye merceği bu programda yok; Admin'e "departman ekle" (K7).
- **Yükleniyor:** `me`/`me/departments` gelene kadar kartlar ve Yönetim grubu gösterilmez (görünüp kaybolma olmasın) — **Varsayım**.
- **Yetki kaybı (K6):** 403/404 kapsam hatalarında `me` + `me/departments` geçersizlenir, kapsam yeniden doğrulanır, seçili birim artık yoksa §3 adım 3–4 kuralı uygulanır (tek seçenekte otomatik, aksi halde seçici / K7 boş durumu; ortak-kurallar §1, CX-M-02); menü öğeleri capability'ye göre yeniden hesaplanır.
- **Rozet sayacı hatası:** rozet gizlenir (sayı yerine hata gösterilmez) — **Varsayım**.
- **API sürüm uyumsuzluğu:** kabuk yerine "güncelleme gerekli" ekranı (CLAUDE.md kuralı).

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ |
|---|---|---|---|---|
| E-00-01/02 | Logo, ürün adı + sürüm | — | statik; tıklanamaz | ozellikler §2.1 |
| E-00-03 | Menüyü daralt | tık | dar hâle geç | §3 daraltma |
| E-00-04 | Program kartı | tık | program menüsünü aç/kapat (diğerini kapatır) | §3 |
| E-00-05 | Rol kartı | tık | rol menüsünü aç/kapat; tek mercekli kullanıcıda salt gösterim, menü açılmaz — **Karar (ortak-kurallar §12 P11)** | §2, §3 |
| E-00-06 | Koordinatörlük kartı | tık | birim menüsünü aç/kapat; Admin'de yok | §2 |
| E-00-07 | Program satırı | tık | programı seç → mercek/birim §3 adım 3 kuralıyla (tek seçenekte otomatik, aksi halde seçici) → kapsam değişimi → kapat | §3 adım 3, §2 |
| E-00-08 | Rol satırı | tık | merceği seç → birim §3 adım 4 kuralıyla → kapsam değişimi → kapat | §3 adım 4 |
| E-00-09 | Birim satırı | tık | departmanı seç → kapsam değişimi → kapat | §3 adım 5 |
| E-00-10 | Perde | tık | açık menüyü kapat | §3 |
| E-00-11 | Grup başlıkları | — | grubun görünür öğesi yoksa başlık gizlenir; Yönetim görünürlüğü capability'den | §2, ozellikler §7.7 |
| E-00-12…26 | Menü öğeleri | tık | rotaya git; etkin öğe rotadan | §1; görünürlük §2 |
| E-00-14/15/21 | Rozetler | — | kapsam sayaçlarını göster; 0'da gizli | §5 |
| E-00-27 | Yardım | tık | bilinmiyor | README açık soru |
| E-00-28/32 | Oturum kartı, dar avatar | — | statik bilgi; tıklanamaz (kullanıcı menüsü tasarımda yok) | ozellikler §2.4 |
| E-00-29 | Çıkış yap | tık | oturumu kapat → giriş | §4 |
| E-00-30 | Genişlet | tık / hover | genişlet; hover'da simge değişir | §3 |
| E-00-31 | Dar menü öğesi | tık | rotaya git | §1 |
| E-00-40 | Dar menü kapsam simgeleri | — / tık | geçerli kapsamı (program, mercek, birim kodu) gösterir; kapsam değişince güncellenir; tık → kapsam seçicisini açar — **Karar (ortak-kurallar §12 P11)** | §2, §3; ozellikler §7 madde 1 |
| E-00-33/34 | Geri / İleri | tık | geçmişte geri/ileri | §1 |
| E-00-35 | Konum izi program parçası | tık | **Varsayım:** ana sayfa | §1 |
| E-00-36 | Tarih | — | Türkçe biçim; saat kaynağı: tasarım istemci saati, **Varsayım:** `instanceProfile.timezone` | ozellikler §4, `backend.md` §4 |
| E-00-37 | Tema | tık | `dark ↔ light`, hatırla | §3 tema |
| E-00-38 | Bildirim zili | tık | v1: bilinmiyor / statik panel | §4, BE-002 |
| E-00-39 | Asistan | tık | F8; v1 gizli önerisi | §4 |

## 8. Bağımlılıklar
- **Tüm ekran grupları** bu kabuğu kullanır: kapsam (program/departman/mercek) her `scopedKey()` sorgusunun girdisi; ekranların `rp-sub` alt satırındaki mercek ifadeleri (örn. Toplantılar "Admin olarak … görüyorsun") kabuktaki merceği okur.
- `src/shared/scope` (+ standing), `src/shared/session` (`me`), `src/shared/preferences/storage-adapter.ts` (kapsam kimlikleri + tema), `src/app/routes.catalog.ts` (menü → rota), modül `capabilities.ts` dosyaları (menü görünürlüğü), K7 açık durum ekranları.
- Tasarım sistemi token kopyası (K9) + `design/web-tokens.json` (`rp-*` yerleşim ölçüleri, rol renkleri önerisi).
- Bildirim paneli ve okunmamış mesaj rozeti F7 (`10-mesajlar`); Asistan F8.
- Program kısa ad/renk: BE-001.


---

## 9. F6: menü tanımı rol taşır (WEB-6; P46 (d), P47, P53; W135)

Kaynak: `Sidebar.dc.html` (v85, `groups`/`koordGroups`/`uyeGroups`), `Kenar-Roller.dc.html` (`Ortak · Kenar menüsü › Program, rol, koordinatörlük`: "Aynı kabuk, üç menü"). Bugünkü kod tek menü kullanır (`routes.catalog.ts` `menu: {group, key, order}`; etiket sabit); F6'da **menü tanımı rol taşır** (W141 uygular): her menü girdisi `roles` kümesi ve gerekirse rol etiketi (`Görevler` → `Görevlerim`, `Arşiv` → `Dosyalarım`) alır; rozet kaynağı rolün kendi sayılarıdır.

**Menü seçimi (kural).** Menü grubu **yetki olgusundan** seçilir, mercek yalnız içeriği daraltır (P1/P11): `company_admin` → yönetici menüsü (mercek Admin/Koordinatör/Üye olsa da; Yönetim grubu kaybolmaz, K/Ü merceğinde yalnız sayfa içeriği ve rozet sayıları merceğe göre süzülür, P53); `company_admin` değilse mercek Koordinatör → koordinatör menüsü, mercek Üye → üye menüsü. Birleşik rolde (hem koordinatör hem üye) mercek karar verir. Gizleme güvenlik değildir; sunucu her istekte denetler.

**Ortak kural.** F6 dışı ya da fazı gelmemiş girdiler **menüde gizlidir** (ortak-kurallar §5): Takvim, Kurumsal hafıza, Mesajlar (F6'da; **F7'de görünür**, aşağıdaki §9 tablolarında), Tablolar, Simülasyon, Birimim, Ekibim. **"Raporlar" öğesi hiçbir menüde yoktur (P47).**

### 9.1 Yönetici menüsü (admin)
| Etiket | Hedef rota | Rozet kaynağı | Görünürlük (F6) |
|---|---|---|---|
| Ana sayfa | `/` (`home`) | — | görünür; 01 yönetici sayfası |
| Görevler | `/gorevler` | 1) geciken `reportDashboard.overdue_tasks` (`--danger`); 2) tarih talebi `pending_date_changes` (nötr, çerçeveli) | görünür (E-00-14/15 aynen) |
| Zaman çizelgesi | `/zaman-cizelgesi` | — | görünür (F3 canlı; v85 `Sidebar` admin grubunda yok → **geçici kabul: korunur**, aşağıdaki not) |
| Takvim | — | — | **gizli** (F6 dışı, K14; v85 yeni) |
| Kurumsal hafıza | — | — | **gizli** (F6 dışı; BE-033) |
| Arşiv | `/arsiv` | — | görünür (F5) |
| Toplantılar | `/toplantilar` | — | görünür (F4) |
| Mesajlar | `/mesajlar` | `unread_chats` (F7; P59 taslak) | **görünür (F7)** — F6'da gizliydi; tek menü tanımı W154 |
| Tablolar | — | — | **gizli** (F6 dışı; BE-031) |
| Kullanıcılar | `/kullanicilar` | — | görünür; Yönetim grubu `company_admin` ile (P1) |
| Koordinatörlükler | `/koordinatorlukler` | — | görünür; Yönetim |
| Teknofest ve sezon | `/programlar` | — | görünür; Yönetim |
| Simülasyon (Deneysel) | — | — | **gizli** (K14) |
| **Raporlar** | **YOK** | — | **menüde öğe ve rota yok (P47)**; raporlar kendi ekranlarında |

### 9.2 Koordinatör menüsü
| Etiket | Hedef rota | Rozet kaynağı | Görünürlük (F6) |
|---|---|---|---|
| Ana sayfa | `/` | — | görünür; K1 (F6) |
| Görevler | `/gorevler` | 1) geciken `countProgramWorkItems.overdue` (`department_id` = seçili birim; `--danger`); 2) **onay bekleyen** `by_status.onaya_sunuldu` (`title`: "‹n› görev onay bekliyor") | görünür; ikinci rozet F6'da tarih talebinden onay bekleyene döner (v85 `Sidebar`/`Kenar-Roller`) |
| Tarih talepleri | `/zaman-cizelgesi` (03c; tarih talepleri bölümü) | altın rozet `countProgramWorkItems.pending_date_requests` (seçili birim) | tasarım ayrı öğe + K6 sayfası ister; K6 F6 dışı → **geçici kabul:** ayrı öğe gizli, rozet "Zaman çizelgesi" öğesine taşınır (E-00-15 davranışı) |
| Zaman çizelgesi | `/zaman-cizelgesi` | (yukarıdaki talep rozeti) | görünür (F3 canlı; v85 koordinatör grubunda yok, `Kenar-Roller` açıklama metni hâlâ "Zaman çizelgesi" der → **geçici kabul: korunur**) |
| Takvim | — | — | **gizli** (F6 dışı) |
| Birimim (Birim grubu) | — (K2 `Koord-Birim`) | — | **gizli** (K2 F6 dışı, §5) |
| Ekibim (Birim grubu) | — (K5 `Koord-Ekip`) | — | **gizli** (K5 F6 dışı) |
| Kurumsal hafıza | — | — | **gizli** |
| Toplantılar | `/toplantilar` | — | görünür (F4) |
| Arşiv | `/arsiv` (P40: doğrudan kendi klasörüne) | — | görünür; etiket "Arşiv" |
| Mesajlar | `/mesajlar` | `unread_chats` (F7; P59 taslak) | **görünür (F7)** — F6'da gizliydi; tek menü tanımı W154 |
| Tablolar | — | — | **gizli** |
| Yönetim grubu | — | — | **yok** (`company_admin` değil); yönetici bu mercekte yönetici menüsünü korur (P1) |
| **Raporlar** | **YOK** | — | menüde öğe yok (P47); K1'de rapor girişi yok (P53); K7/K3 düğmeleri |

### 9.3 Üye menüsü
| Etiket | Hedef rota | Rozet kaynağı | Görünürlük (F6) |
|---|---|---|---|
| Ana sayfa | `/` | — | görünür; Ü1 (F6) |
| **Görevlerim** | `/gorevler` (üye merceği: bana atananlar) | kendi geciken görevleri `countProgramWorkItems.overdue` (`assignee_account_id` = ben; `--danger`); **tarih talebi rozeti hiçbir zaman** (üye için 0 / gizli) | görünür; etiket "Görevlerim" (rol etiketi) |
| Zaman çizelgem | `/zaman-cizelgesi` | — | görünür (F3 canlı; v85 üye grubunda yok, `Kenar-Roller` metni "Zaman çizelgem" der → **geçici kabul: korunur**) |
| Takvim | — | — | **gizli** (F6 dışı) |
| Kurumsal hafıza | — | — | **gizli** |
| Toplantılar | `/toplantilar` | — | görünür (F4) |
| **Dosyalarım** | `/arsiv` → `/arsiv/my-tasks` (P40) | — | görünür; etiket "Dosyalarım" (rol etiketi; F5 borcu #6 kapanır) |
| Mesajlar | `/mesajlar` | `unread_chats` (F7; P59 taslak) | **görünür (F7)** — F6'da gizliydi; tek menü tanımı W154 |
| Yönetim, Birim grupları | — | — | **yok**; görev oluşturma, ekip ve yönetim girişleri yok |
| **Raporlar** | **YOK** | — | üye hiçbir rapor görmez (REPORTING-K01/K07) |

### 9.4 Alt blok ve rozet kuralları (v85 değişiklikleri)
- **Oturum kartı = "Profilim" düğmesi** (`sb-me`; dar hâlde `sb-me__rail`): avatar çevresinde rol rengi halkası (`--role-admin`/koordinatör/`--role-uye` token'ları), ikinci satır "‹rol› · Profilim". Profil sayfası (Ü7) F6 dışı → **geçici kabul:** halka ve rol etiketi canlı; kart tıklanamaz kalır (E-00-28), "· Profilim" ve e-posta satırı ayrımı profil sayfasıyla gelir; çıkış düğmesi aynı.
- **Rozetler role aittir** (`Kenar-Roller`): üyede Görevlerim = kendi gecikenleri; koordinatörde Görevler = birimin gecikenleri + ikinci rozet onay bekleyenler; tarih talebi rozeti koordinatörde (F6'da "Zaman çizelgesi" öğesinde), admin'de Görevler'in ikinci rozeti. Sayı 0 ise rozet gizli. Sayaç kaynakları ve geçersizleme E-00-14/15 ile aynıdır (ortak-kurallar §6; `shell-counts`).
- **Dar menü** (76 px): aynı girdi kümesi, `aria-label` + `title`; rozet dar hâlde yok (E-00-31).
- **Menü etiketi ≠ sayfa başlığı:** rol etiketi (Görevlerim, Dosyalarım) yalnız menüdedir; sayfa başlığı ve kırıntı rota kataloğundan gelir (`Görevler`, `Arşiv`) — tasarımda sayfa başlığı rol ayrımı yoktur.

### 9.5 Notlar
- **F5 borcu kapanışı:** `../../yurutme/web-5/ilerleme.md` "F6'ya devredilenler" #6 ("Menü rol sırası ve 'Dosyalarım' etiketi") bu bölümle **kapanır**; uygulama W141.
- **Zaman çizelgesi/çizelgem** v85 `Sidebar`'ında admin/koordinatör/üye gruplarında yoktur (Takvim gelmiştir) ama `Kenar-Roller` metni ve F3 canlı rota onu varsayar; Takvim F6 dışı olduğundan **03c girişi korunur** (geçici kabul; koordinatör teyidi gerekir, aksi halde F3 işlevine menüden erişilemez).
- **Birimim/Ekibim/Tarih talepleri** hedefleri (K2/K5/K6) F6 dışıdır; bu girdiler tanımda yer alır ama `phase` değeri F6'dan sonrasıdır (faz görünürlüğü tek yerden, `routes.catalog.ts`).
