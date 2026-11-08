# 05 — Mekanizma (nasıl davranıyor)

Kaynak: `ozellikler.md` öğe kimlikleri. Tasarım statik bir anlık görüntüdür; aşağıdaki davranışların çoğu öğe biçiminden çıkarımdır ve **Varsayım:** ile işaretlidir. Backend uç adları bu dosyada verilmez (backend.md'nin işi).

## 1. Giriş ve gezinme

**Giriş:**
- 05: kenar menüsündeki "Kullanıcılar" öğesi (`Sidebar active="users"`, 00-ortak); 05b kırıntısındaki "Kullanıcılar" (E-05-40); derin bağlantı `/kullanicilar?...`.
- 05b: tablodaki ad bağlantısı (E-05-16), yan paneldeki "Profil ve kişisel iş takibi" (E-05-30), **Varsayım:** görev özeti şeridi (E-05-29); derin bağlantı `/kullanicilar/:hesapId`.

**Çıkış (öğe → hedef):**
| Öğe | Hedef |
|---|---|
| E-05-01 / E-05-40 ilk kırıntı (program adı) | **Varsayım:** ana sayfa (01); 00-ortak karar verir |
| E-05-16, E-05-30 | 05b `/kullanicilar/:hesapId` |
| E-05-29 | **Varsayım:** 05b, `kart` = ilgili sayaç (tasarımda `#`) |
| E-05-62, E-05-67 | Görev ayrıntısı (03 ekranının ayrıntı paneli/rotası; F1) |
| E-05-48 Görev ata | 03'ün görev oluşturma formu, atanan önceden dolu (**Varsayım**) |
| E-05-46 Mesaj | 10 Mesajlar (F7, v1 dışı) — v1'de statik/devre dışı |

**URL'de taşınan durum (öneri, K10):**
- 05: `rol`, `q`, `koordinatorluk`, `sayfa`, `secili`. Yan panel açıkken sayfa yenilenirse aynı kişi seçili gelir.
- 05b: `sekme`, `kart`, `grupla`, `ay`.
- Seçili program URL'de değil, kapsam deposunda (K2, 00-ortak).

## 2. Kapsam ve rol etkisi (K1, K2)

- Tasarım her iki ekranı **Admin merceğiyle** çizer (tüm kullanıcılar, rol düzenleme, hesap işlemleri). Koordinatör/Üye merceği tasarımda yoktur.
- **Eylem görünürlüğü** (davet, dışa aktar, rol kaydet, koordinatörlük ekle/kaldır, şifre sıfırla, kilitle, sil, görev ata, kişisel rapor) rol dizesiyle değil, `istemci-akislari.md` §4'teki yöntemle **işlem bazında** olgulardan (`company_admin`, seçili kapsamdaki `koordinator`/`uye` satırı) hesaplanır ve modülün `capabilities.ts` dosyasında toplanır (K1). §4 tablosu bugün yalnız görev/dosya/not işlemlerini kapsar; **kullanıcı/hesap/üyelik işlemleri için satır yok** — backend analisti bu işlemlerin olgularını sözleşmeden çıkarmalı, gerekiyorsa eksik önerir.
- "Admin / Koordinatör / Üye" rozetleri ve sekmeleri **gösterimdir** (K1): rozet içeriği sunucunun olgusundan (`company_admin` + üyelik satırları) türetilir; istemci başka kararı rozetten vermez.
- **Kapsam bağımlılığı:**
  - 05 listesi: şirket geneli mi, seçili program mı — **bilinmiyor**; BE-011'e göre bugün şirket geneli, rol sayıları istemcide. Koordinatörlük sütunu ve E-05-08 süzgeci departman/üyelik bilgisi ister; üyelik programa bağlıdır → **Varsayım:** koordinatörlük sütunu **seçili programdaki** üyelikleri gösterir. Program değişince (K2) liste ve panel sorguları iptal edilir, yan panel kapanır (**Varsayım**).
  - 05b görevleri seçili programın görevleridir; K3 departmanlar arası fan-out'u yasaklar → kişinin birden çok departmandaki görevleri tek uçtan "atanan = bu kişi" süzgeciyle gelmelidir; backend teyidi: `listProgramWorkItems`'ta atanan süzgeci **yoktur** (yalnız `department_id`, `limit`, `cursor`); program görevleri tek uçtan sayfalanıp kişiye istemcide süzülür (K3 "bana atananlar" istemci süzgecini kabul eder; fan-out değildir), maliyet için eksikler `yeni-5`.
- **`listUsers` yalnız şirket yöneticisine açıktır** (ORGANIZATION-K33, organization modül README'si; `openapi.yaml` yalnız 403 `organization.not_authorized` der, ŞY kısıtını açıkça yazmaz — **Varsayım:** backend teyidi beklenir). `listUsers` yetkisi `company_admin` olgusuna bağlıdır, merceğe değil (ortak-kurallar §1): şirket yöneticisi Koordinatör merceğine geçse de çağırabilir; yalnız koordinatör (`company_admin=false`) 403 alır (CX-T-04). Koordinatör için liste `listMembers` ile kurulabilir (eksikler §3), Üye'de ekran yoktur.
- Yetki kaybı (403/404 K6) sonrası `me` + `me/departments` geçersizlenir; panel açıksa kapanır.

## 3. Durum makinesi

**05 Kullanıcılar:**
| Durum | Değerler | Nerede |
|---|---|---|
| Rol sekmesi (E-05-06) | `tumu` (varsayılan) · `admin` · `koordinator` · `uye` | URL |
| Arama (E-05-07) | metin | URL (gecikmeli yazım, **Varsayım:** ~300 ms) |
| Koordinatörlük süzgeci (E-05-08) | departman kimliği / boş | URL |
| Sıralama (E-05-10) | ad artan (varsayılan) / azalan | **Varsayım:** URL `sirala`; tasarımda yalnız ↑ |
| Sayfa (E-05-23) | 1…n | URL; süzgeç/arama/sekme değişince 1'e döner |
| Seçili kullanıcı | hesap kimliği / yok | URL `secili` |
| Yan panel taslağı (E-05-31…33) | roller kümesi, eklenecek/kaldırılacak birimler | bellek; Vazgeç ya da başka satır seçimiyle atılır (**Varsayım:** kirliyken satır değişiminde uyarı — tasarımda yok) |
| Satır seçimleri (E-05-09, E-05-14) | hesap kimlikleri kümesi | bellek; amacı bilinmiyor |

Yan panel durumları: **kapalı** (tasarımda hiç çizilmedi — panelin her zaman açık olup olmadığı bilinmiyor) → **açık / temiz** → **açık / kirli** (Kaydet etkin) → **kaydediliyor** → temiz | hata.

**05b Kişisel takip:**
| Durum | Değerler | Nerede |
|---|---|---|
| Sekme (E-05-53…56) | `gorevler` (varsayılan) · `dosyalar` · `etkinlik` · `hesap` | URL |
| Özet kart süzgeci (E-05-49…52) | `acik` (varsayılan) · `tamamlanan` · `geciken` · `onayda` — tekli seçim (**Varsayım**: `aria-pressed` tek kartta) | URL |
| Gruplama (E-05-57) | `son-tarih` (varsayılan) · `durum` | URL |
| Takvim ayı (E-05-69) | YYYY-AA; varsayılan bugünün ayı | URL ya da bellek |

K2 depolama istisnası bu ekranda kullanılmaz; hiçbir durum `localStorage`'a yazılmaz.

## 4. Etkileşim akışları

Tüm yazmalar ortak `shared/http/mutation` üzerinden (K5): `Idempotency-Key`, sürüm alanı varsa `expected_revision`, 409 `*.edit_conflict` → alan alan seçim, 429 `Retry-After`, "sonuç bilinmiyor" (taslak + anahtar korunur), 409 `organization.confirmation_required` → ortak etkili işlem onayı.

1. **Kullanıcı davet et (E-05-05):** düğme → form (tasarımda yok) → doğrulama (ad, e-posta biçimi) → oluşturma isteği → başarı: liste ve sayaçlar tazelenir, yeni kişi seçili açılır (**Varsayım**) → hata: alan hataları forma. E-posta daveti yok (BE-013); v1'de geçici parola akışı: `createUser` parolayı sunucuda üretir ve **yanıtta döndürmez** (`UserResult`'ta parola alanı yok; GAP-024); kullanıcıya iletilebilen parola yalnız ŞY'nin `updateAccount` `{password, force_password_change}` çağrısıyla belirlenir. Koordinatör için ileticisi yoktur (backend.md §2, §6).
2. **Rolleri kaydet (E-05-31 → E-05-38):** kutular işaretlenir/kaldırılır → panel kirli → Kaydet → **tek istek değildir**; dört uca ayrışır (Admin → `updateUser.company_admin`; yeni çip → `assignMembership`/`assignCoordinator`; rol değişimi → `updateMembershipRole`; kaldırma → `removeMember`/`removeCoordinator`), işlemler atomik değildir (backend.md §6) → Admin kutusu `company_admin` değişikliğidir; Koordinatör/Üye bir departman bağlamı ister (ozellikler §7-1) → başarı: satırdaki rozetler, sekme sayaçları, panel alt satırı tazelenir → kısmi başarısızlıkta (birden çok istek) hangi değişikliğin uygulandığı gösterilmeli; bu uçlar `Idempotency-Key`/`expected_revision` almaz, yanıtsız yazma kör tekrarlanmaz (backend.md §2).
3. **Koordinatörlük ekle (E-05-33):** seçici (tasarımda yok) → departman (+ rol?) seçimi → çip eklenir (taslak) → Kaydet ile üyelik oluşturulur. Departman seçili programa katılmamışsa K7 metni.
4. **Koordinatörlük kaldır (E-05-32 X):** çip taslaktan çıkar → Kaydet ile üyelik kaldırılır. Rol kaybında görev devri (ORGANIZATION-K18) etkili işlem onayı doğurabilir (K5).
5. **Şifre sıfırlama bağlantısı (E-05-34):** BE-013 nedeniyle bağlantı seçeneği devre dışı + `designStub`; v1'de mevcut geçici parola akışı ayrı öğe olarak mı sunulacağı ürün sahibine (README).
6. **Hesabı kilitle (E-05-35):** BE-012 — devre dışı + `designStub`. Kilit açma tasarımda yok.
7. **Kullanıcıyı sil (E-05-36):** istemci kendi yıkıcı onayını gösterir (tasarımda yok; ad yazdırma gerekmez — **Varsayım**) → `deleteUser` → başarı: panel kapanır, liste tazelenir, sayfa boşaldıysa önceki sayfaya düşer. **Sunucu onay istemez:** `deleteUser` `organization.confirmation_required` dönmez (sözleşmede 409 listesinde yok, `confirm` parametresi yok); kişinin açık görevleri **silen kişiye** devredilir — onay metni bunu söyler. 409 `organization.last_admin`, 403 kendini silemez.
8. **Vazgeç (E-05-37):** taslak atılır, panel sunucu hâline döner (panel kapanmaz — **Varsayım**).
9. **Dışa aktar (E-05-04):** BE-014 — devre dışı + `designStub`.
10. **05b Görev ata (E-05-48):** görev oluşturma akışı (03, F1) kişiyi atanan olarak önceden doldurur; hangi departmanda açılacağı seçili kapsamdan (birden çok ortak departmanda seçim gerekir — bilinmiyor).
11. **05b Profili düzenle (E-05-45):** bilinmiyor (form yok). **Varsayım:** "Hesap ve roller" sekmesine geçer.
12. **05b Kişisel rapor (E-05-47):** bilinmiyor (biçim, uç). Eksik olarak backend analistine.
13. **05b Mesaj (E-05-46):** v1 dışı (K14) — statik/devre dışı.

## 5. Liste davranışı

**05:**
- Numaralı sayfalama, sayfa boyutu sabit 10, "`<a>–<b>` / `<N>` kullanıcı" ve son sayfa numarası → **toplam sayı** gerekir. Backend imleçli ise toplam yoktur → eksik (backend analisti). **Varsayım:** istemci tüm listeyi çekip yerelde sayfalarsa sayaçlar ve süzgeç istemcide (BE-011 "şimdilik" bunu söylüyor).
- Sıralama: yalnız ad, Türkçe harf sırasıyla (`localeCompare('tr')`; GAP-036 I/ı katlama bağımlılığı).
- Arama: sunucu `search` yalnız **görünen adı** arar, e-postayı **aramaz** (kod okuması; sözleşme alanı tanımsız bırakır) — tasarımın "Ad, e-posta…" yer tutucusu v1'de "Ad…" olmalı; Türkçe büyük/küçük harf katlaması sunucudadır (ORGANIZATION-K33), GAP-036 I/ı notu.
- Rol sekmesi sayıları: sekme seçiminden bağımsız, arama/süzgeçten etkilenip etkilenmediği **bilinmiyor** (**Varsayım:** etkilenmez, toplam sayılardır).
- Koordinatörlük süzgeci: tek departman (**Varsayım**; tasarımda çoklu seçim izi yok).

**05b:**
- Görev listesi sayfalanmaz; tüm satırlar gruplu tek tabloda. Kişinin görevleri listeleme tavanını (`listProgramWorkItems` varsayılan 50 / tavan 200) aşabilir → istemci "daha fazla yükle" mi gösterir, bilinmiyor.
- Gruplar "Son tarihe göre": Gecikmede (bitiş < bugün, açık) → Bu hafta → Sonra; grup içi bitiş artan (**Varsayım**, örnek sırası). "Duruma göre": durum başına grup (**Varsayım**).
- Kart süzgeci tabloyu daraltır; E-05-58 metni ve sekme sayacı süzgeçle uyumlu olmalı (**Varsayım**).
- Göreli tarih ("`<n>` gün gecikti/kaldı") istemcide bugüne göre takvim günü farkıyla hesaplanır; saat dilimi kuralı backend gecikme etiketiyle uyumlu olmalı.
- Kanıt "`<n>` dosya" (E-05-66) listeden alınamaz: `istemci-akislari.md` §7 "listede dosya sayısı yoktur ve eklenmeyecektir"; satır başına `listWorkItemFiles` N+1'dir → statik "—". Dosyalar sekmesi sayacı (E-05-54) kişi bazında fan-out gerektirir (K3 yasağı) → statik.
- Durum sözlüğünde `iade_edildi` (sözleşmede var) tasarımda yok; özet kartları, grup ve dağılım için 03 ile ortak karar (eksikler §3).
- Özet sayaçları, durum dağılımı ve takvim noktaları aynı görev kümesinden istemcide türetilebilir (**Varsayım**); tamamlananlar (E-05-49) için kapalı görevler de gerekir.

## 6. Boş / yükleniyor / hata durumları

Tasarımda hiçbiri yok — K7 ve ortak varsayılanlar:
| Durum | Davranış |
|---|---|
| Yükleniyor (05 tablo) | tasarımda yok — ortak iskelet satırları (10 satır, `hint-placeholder-count="10"`) |
| Yükleniyor (05b) | tasarımda yok — kart ve tablo iskeleti |
| Liste boş (süzgeç sonucu) | tasarımda yok — "sonuç yok" + süzgeçleri temizle (**Varsayım**) |
| Kişinin açık görevi yok (05b) | tasarımda yok — tablo yerine boş metin; takvim noktasız; dağılım çubuğu boş |
| Program yok (K7) | 05 listesi şirket geneliyse ekran çalışır; koordinatörlük sütunu/süzgeci "Program yok" ile pasif (**Varsayım**). 05b görevleri K7 "Program yok" (yönetici: program oluştur) |
| `membership_required` (K7) | Koordinatör/Üye merceğinde ilgili K7 metni |
| Programa departman katılmamış (K7) | E-05-08 ve E-05-33 seçicisi boş + "departman ekle" yönlendirmesi |
| 403/404 (K6) | kapsam yeniden doğrulanır; 05b kişi bulunamazsa 404 ekranı (ortak) |
| Hesap silinmiş | 05b'ye derin bağlantıyla gelinirse — bilinmiyor |
| Yazma hatası | K5 ortak protokol (alan hataları forma, çakışmada alan alan seçim) |

## 7. Öğe → davranış tablosu

| Kimlik | Öğe | Olay | Davranış | Bağ |
|---|---|---|---|---|
| E-05-01 | Kırıntı | tık | program adı → ana sayfa (**Varsayım**) | 00-ortak |
| E-05-03 | Alt başlık sayısı | — | toplam kullanıcı sayısı | §5; BE-011 |
| E-05-04 | Dışa aktar | tık | devre dışı + `designStub('BE-014')` | §4-9 |
| E-05-05 | Kullanıcı davet et | tık | oluşturma formu (tasarımda yok) | §4-1; BE-013 |
| E-05-06 | Rol sekmeleri | tık | süzgeç değişir, sayfa=1, URL güncellenir | §3, §5; BE-011 |
| E-05-07 | Arama | yazım | gecikmeli süzgeç, sayfa=1 | §5 |
| E-05-08 | Koordinatörlük | tık | departman açılır listesi (tasarımda yok) | §2, §5 |
| E-05-09 | Tümünü seç | değişim | sayfadaki satırları seçer; amaç bilinmiyor | §3 |
| E-05-10 | Sıralama | tık | ad artan/azalan geçişi | §5 |
| E-05-13 | Satır | tık (ad dışı) | bilinmiyor; **Varsayım:** paneli açar | ozellikler §7-6 |
| E-05-14 | Satır seç | değişim | seçim kümesi | §3 |
| E-05-16 | Ad | tık | 05b'ye git | §1 |
| E-05-18/19 | Rol rozetleri | hover (+N) | `title` ipucu | K1 gösterim |
| E-05-20 | Koordinatörlük hücresi | — | seçili programdaki birimler (**Varsayım**) | §2 |
| E-05-21 | Ayrıntı aç | tık | `secili` ayarlanır, yan panel açılır | §3 |
| E-05-23 | Sayfa düğmeleri | tık | sayfa değişir | §5 |
| E-05-28 | Paneli kapat | tık | `secili` temizlenir (kirliyse uyarı **Varsayım**) | §3 |
| E-05-29 | Görev özeti şeridi | tık | 05b (kart süzgeciyle **Varsayım**) | §1 |
| E-05-30 | Profil ve kişisel iş takibi | tık | 05b'ye git | §1 |
| E-05-31 | Roller | değişim | taslak kirlenir | §4-2; K1 |
| E-05-32 | Çip X | tık | taslaktan kaldır | §4-4 |
| E-05-33 | Ekle | tık | departman seçici (tasarımda yok) | §4-3 |
| E-05-34 | Şifre sıfırlama bağlantısı | tık | devre dışı + `designStub('BE-013')` | §4-5 |
| E-05-35 | Hesabı kilitle | tık | devre dışı + `designStub('BE-012')` | §4-6 |
| E-05-36 | Kullanıcıyı sil | tık | onay → silme | §4-7 |
| E-05-37 | Vazgeç | tık | taslağı at | §4-8 |
| E-05-38 | Kaydet | tık | taslağı yaz (K5) | §4-2…4 |
| E-05-40 | Kırıntı | tık | "Kullanıcılar" → 05 | §1 |
| E-05-43 | Rol rozeti | — | gösterim (K1) | §2 |
| E-05-45 | Profili düzenle | tık | bilinmiyor (**Varsayım:** "Hesap ve roller" sekmesi) | §4-11 |
| E-05-46 | Mesaj | tık | v1 dışı, statik | §4-13; K14 |
| E-05-47 | Kişisel rapor | tık | bilinmiyor | §4-12 |
| E-05-48 | Görev ata | tık | görev oluşturma (03), atanan dolu | §4-10 |
| E-05-49…52 | Özet kartları | tık | kart süzgeci (tekli), tablo/başlık güncellenir | §3, §5 |
| E-05-53 | Görevler sekmesi | tık | görev görünümü | §3 |
| E-05-54 | Dosyalar sekmesi | tık | içerik tasarımda yok — statik/boş; sayaç fan-out gerektirir, statik | §3, §5 |
| E-05-55 | Etkinlik sekmesi | tık | statik + `designStub('BE-015')` | §3 |
| E-05-56 | Hesap ve roller sekmesi | tık | içerik tasarımda yok (**Varsayım:** 05 panelinin içeriği) | §3 |
| E-05-57 | Gruplama | tık | gruplar yeniden kurulur | §5 |
| E-05-60 | Grup satırı | — | grup adı + sayı; daraltma yok | §5 |
| E-05-62/67 | Görev başlığı / aç | tık | görev ayrıntısı (03) | §1 |
| E-05-63 | Görev anahtarı | — | gösterim; kaynak bilinmiyor | ozellikler §7-11 |
| E-05-65 | Bitiş | — | tarih + istemcide göreli gün | §5 |
| E-05-66 | Kanıt | — | statik "—" (listede dosya sayısı yok, §7) | §5 |
| E-05-69 | Önceki/sonraki ay | tık | takvim ayı değişir | §3 |
| E-05-71 | Gün hücresi | — | bugün vurgusu, son tarih noktası; tık davranışı yok | ozellikler §7-12 |
| E-05-74/75 | Durum dağılımı | — | durum sayıları, oranlar | §5 |

## 8. Bağımlılıklar

- **00-ortak:** kenar menüsü (`active="users"`), Kenar-Secici kapsamı (program, rol merceği, koordinatörlük), üst çubuk (geri/ileri, kırıntı, tema, bildirim), etkili işlem onayı diyaloğu, K7 açık durum ekranları, `designStub`.
- **03 Görevler:** görev ayrıntısı (E-05-62/67), görev oluşturma formu (E-05-48), durum adları/noktaları ve gecikme kuralları ortak sözlük.
- **08 Koordinatörlükler:** departman listesi (E-05-08, E-05-33), üyelik/koordinatör atamaları aynı veri — iki ekranda tutarlı tazelenmeli (aynı sorgu anahtarları).
- **10 Mesajlar (F7):** "Mesaj" düğmesi; v1 dışı.
- **Paylaşılan durum:** seçili program (K2), tema; `me` (`company_admin`) ve `me/departments` (capabilities hesabı).
- **Yol haritası §6:** GAP-036 (arama/sıralama Türkçe katlama), ORGANIZATION-K18 (rol kaybında görev devri), GAP-033 (programa bağımsız üyelik).
