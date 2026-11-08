# 08 — Mekanizma (nasıl davranıyor)

Öğe kimlikleri `ozellikler.md` ile aynıdır. Uç adları burada yalnız ipucudur; eşleme `backend.md`'nin işidir.

## 1. Giriş ve gezinme

**Giriş:**
- Kenar menüsü "Koordinatörlükler" öğesi (`Sidebar active="coords"`, `00-ortak`) → `/koordinatorlukler`.
- Ekmek kırıntısı "Koordinatörlükler" (08b'den, E-08-50) → 08.
- Derin bağlantı `/koordinatorlukler/:departmentId[?sekme=…]` → 08b. Kimlik seçili programa bağlı değilse K6/K7 akışı (§6).
- Varsayım: Kenar-Secici'deki "Koordinatörlük: <ad>" kartından birim sayfasına geçiş — `00-ortak`'ta doğrulanır.

**Çıkış (08):**
| Öğe | Hedef |
|---|---|
| E-08-29 birim adı, E-08-38 "Sayfasını aç", E-08-42 yapı düğümü | 08b (`/koordinatorlukler/:id`) |
| E-08-34 üye sayısı | 08b `?sekme=uyeler` |
| E-08-35 görev sayısı | 08b `?sekme=gorevler` (Varsayım; alternatif 03 `department_id` süzgeçli) |
| E-08-36 arşiv sayısı | 08b `?sekme=arsiv` → F5 v1 dışı; v1'de tıklanamaz (Varsayım) |
| E-08-08…E-08-11 sağlık kutuları (`href="#"`) | Varsayım: aynı ekranda listeyi o koşula süzer (ör. `?saglik=koordinatorsuz`); hedef tasarımda yok |
| E-08-38 "Görev ata", E-08-55 | Görev oluşturma formu (F1), departman ön seçili (Varsayım) |

**Çıkış (08b):** E-08-81 üye adı → 05b; E-08-80 "Tüm üyeler" → 05 (Varsayım: birim süzgeçli); E-08-82 "Tümü", E-08-83 satır, E-08-85 → 03 (`department_id`; satır → görev ayrıntı paneli, Varsayım); E-08-86 → 03c (F3); E-08-74, E-08-87 → 07 (F5, v1 dışı); E-08-88 → 09 oluşturma (F4); E-08-89 PDF (F6, v1 dışı); E-08-54 → sohbet (F7, v1 dışı).

**URL'de taşınan durum:** 08: `gorunum`, `q`, `sirala` (ve sağlık süzgeci varsa o). 08b: `departmentId`, `sekme`. Seçim (checkbox), açık menü, grup aç/kapa URL'de değil.

## 2. Kapsam ve rol etkisi (K1, K2)

- Ekran **program kapsamlıdır** (seçili program zorunlu). Departman kapsamı seçili olsa bile liste programın tüm birimlerini gösterir (Varsayım; Koordinatör/Üye merceği için ürün sorusu — README).
- **Admin merceği** (tasarımın çizdiği): tüm birimler, "Yeni koordinatörlük", "Yapıyı düzenle", toplu işlemler, kart menüsü, "Koordinatör ata".
- **Koordinatör merceği:** tasarımda yok. Varsayım: kendi birim(ler)inin 08b'sinde "Üye ekle" ve "Görev ata" görünür; oluşturma, koordinatör atama, toplu işlemler görünmez.
- **Üye merceği:** tasarımda yok. Varsayım: salt okunur ya da ekran menüde yok.
- Eylem görünürlüğü işlem bazında `modules/organization/model/capabilities.ts` içinde hesaplanır; rol dizesi karşılaştırması yapılmaz. **Not:** `istemci-akislari.md` §4 tablosu bugün görev/dosya işlemlerini kapsar; departman oluşturma, üyelik ekleme, koordinatör atama satırları yok. Kurallar `openapi.yaml` açıklamalarından ve modül README'lerinden türetildi: `backend.md` §3; sözleşme eksiği `eksikler.md` yeni-4 (denetim: doğrulandı, `dogrulama.md`).
- **Kapsam değişince** (program): eski programın sorguları iptal, liste/ayrıntı boşaltılır, seçim temizlenir; 08b açıksa yeni programda aynı departman yoksa §6 "bulunamadı" durumu (Varsayım).
- K6: 403 `organization.not_authorized` / `organization.membership_required`, 404 kapsam hataları → `me` + `me/departments` geçersizlenir, kapsam yeniden doğrulanır.

## 3. Durum makinesi

| Durum | Değerler | Yer | Not |
|---|---|---|---|
| Görünüm (E-08-12) | `liste` \| `yapi` | URL | v1'de `yapi` statik (BE-016); seçilince statik ağaç ya da devre dışı (§7 öğe tablosu) |
| Arama (E-08-13) | metin | URL (`q`), girişte gecikmeli (Varsayım 250 ms) | İstemci araması |
| Durum (E-08-14) | `aktif` \| `pasif` | — | v1 statik, "Aktif" sabit seçili |
| Üst birim (E-08-15) | birim kimliği | — | v1 statik |
| Sıralama (E-08-16) | `ad` (diğerleri bilinmiyor) | URL | — |
| Sağlık süzgeci (E-08-08…11) | koşul adı \| yok | URL (Varsayım) | — |
| Seçim (E-08-17, E-08-31) | birim kimlikleri kümesi | bellek | Süzgeç/kapsam değişince temizlenir (Varsayım) |
| Grup aç/kapa (E-08-24) | grup → açık mı | bellek | v1'de grup yok (Varsayım) |
| Açık kart menüsü (E-08-38) | birim kimliği \| yok | bellek | Tek menü açık |
| 08b sekme (E-08-57) | `genel` \| `uyeler` \| `gorevler` \| `arsiv` \| `toplantilar` \| `ayarlar` | URL | Varsayılan `genel` |

Hiçbiri `storage-adapter` ile hatırlanmaz (K2 istisnası yalnız kapsam + tema).

## 4. Etkileşim akışları

Tüm yazmalar K5 `shared/http/mutation` üzerinden: `Idempotency-Key`, gerekiyorsa `expected_revision`, 409 çakışma, "sonuç bilinmiyor", 429. **Bu ekranın departman/ekip/bağ uçlarında `expected_revision` ve `Idempotency-Key` yoktur** (şemalarda sürüm alanı yok; anahtar yalnız README §5'te sayılan oluşturma uçlarında) — son yazan kazanır; ayrıntı `backend.md` §2.

**4.1 Yeni koordinatörlük (E-08-05)** — form tasarımda yok.
1. Tık → pencere. Sözleşme alanları (`createDepartment`): `name` (zorunlu), **`kind` (zorunlu: `koordinatorluk` | `calisma_grubu`; tasarımda karşılığı yok — Varsayım: v1'de değer `koordinatorluk` sabit, seçici gösterilmez; ürün onayı)**, `code` (isteğe bağlı, `^[A-Z0-9]{2,10}$`, Türkçe harf geçmez), `description` (isteğe bağlı). Programdaki ad (`display_name`) bağlama adımında verilir (yoksa katalog adı).
2. zod doğrulama (K11).
3. İstek: **iki ayrı uç, atomik değil** — `createDepartment` (katalog, S1) sonra `linkDepartment` (bu programa bağ, S2); tek uç yok (`backend.md` §2, `eksikler.md` yeni-3). Adım 2 başarısız olursa katalogda bağsız departman kalır.
4. Başarı → liste sorgusu geçersizlenir, yeni kart görünür (Varsayım: 08b'ye yönlenmez).
5. Hata `organization.department_exists` → K7: "Bu adla bir departman zaten var — mevcut departmanı bu programa ekle" seçeneği; onayla bağlama isteği atılır. Hata gövdesi mevcut departmanın kimliğini taşımaz; aday `listDepartments`/`listDeletedDepartments` içinde adla eşleştirilir (`backend.md` §2, yeni-3). Bağlama arayüzü tasarımda yok (`ozellikler.md` §3).

**4.2 Koordinatör ata (E-08-33 kart, E-08-18 toplu)** — kişi seçici tasarımda yok.
1. Tık → kişi seçici. Koordinatör atamayı yalnız şirket yöneticisi yapar → aday listesi `listUsers` (şirket geneli, imleçli, `search`). (`listAssignable` yalnız koordinatörün "Üye ekle" havuzudur, §4.3; yöneticiye 403.)
2. İstek: tekil koordinatör atama. Toplu sürüm (E-08-18) için toplu uç yok (`eksikler.md` yeni-6); N tekil istek K3 konusu değildir (ortak-kurallar §9); atomiklik, kısmi başarı ve kota (ADR-0028) ayrı ürün/teknik karardır (CX-T-06) → ürün/backend sorusu. Varsayım: v1'de toplu düğme devre dışı, kart üzerinden tekil atama canlı.
3. Başarı → kart (E-08-32), sağlık şeridi (E-08-08), 08b ekip (E-08-81 rozet) yenilenir; ayrıca `me/departments` (atanan oturumdaki kullanıcıysa) geçersizlenir.
4. Atamada `organization.confirmation_required` **yoktur** (409 olarak yalnız `organization.membership_exists`, `platform.conflict_retry`); onay diyaloğu `removeCoordinator`, `removeMember` ve `updateMembershipRole`'de döner (§4.4); `assignMembership`/`assignCoordinator` döndürmez (CX-T-09; ortak-kurallar §7).

**4.3 Üye ekle (E-08-79)** — pencere tasarımda yok.
1. Kişi seçici + rol. Yönetici adayı `listUsers`'tan, koordinatör `listAssignable`'dan seçer. Koordinatör gönderse bile rol sunucuda `uye`'ye zorlanır (openapi `assignMembership`; doğrulandı) → koordinatör formunda rol seçici gösterilmez.
2. İstek → başarı: ekip listesi, sayılar (E-08-59, E-08-78, kart E-08-34, sağlık E-08-09) yenilenir.
3. 422 departman programa bağlı değil → K7 "programa departman katılmamış" iletisi.

**4.4 Üye çıkar / ekip rolü değiştir / koordinatör kaldır** — tasarımda **düğme yok**. Varsayım: Üyeler sekmesinde (çizilmemiş) satır menüsünde olur. Rol kaybında görev devri ORGANIZATION-K18 → 409 onay olası. Koordinatör kaldırma (`removeCoordinator`) ve üye çıkarma (`removeMember`) 409 `organization.confirmation_required` + `?confirm=true`; rol değiştirme (`updateMembershipRole`) `confirm` gövdede (`backend.md` §2).

**4.5 Düzenle (E-08-70, E-08-38 "Ayarları düzenle", E-08-56 "düzenle")** — form yok. Ad **iki ayrı kavramdır**: programdaki ad `renameDepartmentLink` (`display_name`, yalnız bu program) ve katalog adı/kod/açıklama/tür `updateDepartment` (şirket geneli, bütün sezonlar). Form bu ayrımı göstermeli (`backend.md` §2). Departman uçlarında `expected_revision` yoktur (denetim: doğrulandı) → son yazan kazanır.

**4.6 Görev ata (E-08-55, E-08-38)** — F1 görev oluşturma akışı, departman alanı ön dolu.

**4.7 v1 statik eylemler** — E-08-04, E-08-15, E-08-19…E-08-22, E-08-26, E-08-38 son iki öğe, E-08-56 birleştir/pasifleştir, E-08-76: `aria-disabled="true"` + `title` açıklaması (tasarımın kendi devre dışı biçimi: `opacity:.5`), `designStub('BE-016' | 'BE-017', …)`. İstek atılmaz.

## 5. Liste davranışı

- **Kaynak:** seçili programa bağlı departmanlar (programdaki adla). Varsayım: sayfasız, 200 tavanlı tek liste; tavan aşılırsa "sınıra ulaşmış olabilir" bilgisi (K4 diliyle).
- **Sayfalama:** yok; tüm kartlar tek seferde. Sayım satırı E-08-45 "`N` / `M`" = süzgeç sonrası / toplam (istemcide).
- **Arama (E-08-13):** istemcide; ad, kod, koordinatör adı (yer tutucu "kişi" diyor; üye adları liste ekranında yok — birim başına `listMembers` fan-out olur, `backend.md` §4; yani yalnız koordinatörler, yalnız ŞY'de). Türkçe büyük/küçük harf katlama GAP-036 bağımlılığı; istemci `tr` yerel ayarıyla katlar (Varsayım).
- **Sıralama:** "Ada göre" (tr yerel ayarlı karşılaştırma). Diğer seçenekler bilinmiyor.
- **Gruplama:** tasarım üst birime göre gruplar; v1 düz ızgara (Varsayım, K14).
- **Kart sayaçları:** üye ve koordinatör → ekip/üyelik verisi; görev → görev listesi ya da rapor ucu (koordinatörlük istatistikleri adlı bir rapor ucu mevcut, ancak REPORTING-K01'e göre yalnız yönetici). Birim başına ayrı istek (fan-out) önerilmez; kaynak `backend.md`'de seçilir. Arşiv sayısı v1 dışı.
- **Sağlık sayaçları** (E-08-08…E-08-10) yüklü kartlardan istemcide; E-08-11 `last_activity_at`'ten (yalnız ŞY; anlamı görev hareketi) ya da statik — karar `backend.md` §4.
- **08b sayaçları:** sekme sayıları, KPI'lar ve Dikkat listesi aynı departman için `department_id` süzgeçli görev listesinden türetilir (Varsayım); 200 tavanında yaklaşık.
- **Dikkat gerektirenler (E-08-83):** geciken görevler; sıralama Varsayım: en çok gecikenden; kesme sayısı bilinmiyor (örnek 3).

## 6. Boş / yükleniyor / hata durumları

| Durum | Tasarımda | Davranış |
|---|---|---|
| Süzgeç sonucu boş | var — E-08-39 "Bu filtrelerle eşleşen koordinatörlük yok." | Araç çubuğu kalır |
| Program seçili değil / program yok | tasarımda yok — K7 varsayılanı | Yönetici: "Program oluştur"; diğerleri: bilgi |
| Programa hiç departman bağlı değil | tasarımda yok — K7 varsayılanı | "Programa departman katılmamış"; yönetici: "Yeni koordinatörlük" + "mevcut departmanı bu programa ekle" |
| `organization.membership_required` | tasarımda yok — K7 varsayılanı | "Departman ataması bekleniyor" (metin istemcide) |
| `organization.department_exists` (oluşturmada) | tasarımda yok — K7 | §4.1 adım 5 |
| Yükleniyor | tasarımda yok | Varsayım: kart iskeleti (`rp-ccard` biçiminde yer tutucu), KPI şeridinde iskelet |
| Ağ / 5xx hatası | tasarımda yok | Ortak hata kutusu + yeniden dene (`00-ortak`/`shared/ui`) |
| 08b departman bulunamadı / programa bağlı değil | tasarımda yok | "Bu koordinatörlük seçili programda yok" + 08'e dönüş (Varsayım) |
| Koordinatörsüz birim | var — E-08-33, E-08-37 altın renk | — |
| Üyesiz birim | dolaylı (E-08-34 = 0) | Ekip kartında boş durum metni tasarımda yok |
| Alt birim yok | tasarımda yok | v1'de kart statik |
| Son etkinlik yok | var — "—" / "Henüz dosya yüklenmedi" | v1 statik |
| 429 | tasarımda yok | K5: `Retry-After`, otomatik tekrar yok |

## 7. Öğe → davranış tablosu

| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-08-01 | Ekmek kırıntısı | tık (program) | Program sayfası/ana sayfa (`00-ortak`) | §1 |
| E-08-03 | Alt satır | — | Sayılar istemcide; "üst birim" statik | §5, BE-016 |
| E-08-04 | Yapıyı düzenle | tık | Devre dışı | §4.7, BE-016 |
| E-08-05 | Yeni koordinatörlük | tık | Oluşturma penceresi | §4.1 |
| E-08-06 | Diğer işlemler | tık | Menü (içerik bilinmiyor) | ozellikler §7 |
| E-08-08…10 | Sağlık kutuları | tık | Listeyi koşula süz (Varsayım) | §1, §5 |
| E-08-11 | 30+ gündür sessiz | — | `last_activity_at` ŞY'de var (görev hareketi; dosya değil) → metin/statik kararı bekler; K/Ü statik | BE-018 (düzeltme önerildi) |
| E-08-12 | Liste/Yapı | tık | `gorunum` değişir; Yapı v1 statik | §3, BE-016 |
| E-08-13 | Arama | yazma | İstemci süzmesi, URL `q` | §5 |
| E-08-14 | Aktif/Pasif | tık | Devre dışı (Aktif sabit) | BE-017 |
| E-08-15 | Üst birim | tık | Devre dışı | BE-016 |
| E-08-16 | Sırala | tık | Açılır seçim | §5 |
| E-08-17 | Seçim sayısı | — | Seçim kümesinin boyu | §3 |
| E-08-18 | Toplu koordinatör ata | tık | v1 devre dışı (Varsayım) | §4.2 |
| E-08-19…22 | Üye taşı / Üst birime bağla / Birleştir / Pasifleştir | tık | Devre dışı | §4.7, BE-016/BE-017 |
| E-08-23 | Seçimi temizle | tık | Seçim boşalır | §3 |
| E-08-24 | Grup başlığı | tık | Aç/kapa (v1'de grup yok — Varsayım) | §5 |
| E-08-25 | Tümünü seç | tık | Gruptaki tüm kartları seç / kaldır | §3 |
| E-08-26 | Buraya ekle | tık | Devre dışı | BE-016 |
| E-08-29 | Birim adı | tık | 08b | §1 |
| E-08-31 | Seçim kutusu | değişim | Seçime ekle/çıkar | §3 |
| E-08-32 | Avatar | hover/odak | Tam ad ipucu | — |
| E-08-33 | Koordinatör ata | tık | Kişi seçici → atama | §4.2 |
| E-08-34/35 | Üye/görev sayısı | tık | 08b ilgili sekme | §1 |
| E-08-36 | Arşiv sayısı | tık | v1 dışı (F5) | §1 |
| E-08-37 | Durum bayrağı | — | Koordinatörsüz canlı; son etkinlik: ŞY'de `last_activity_at` var (görev hareketi), metin/statik kararı bekler | BE-018 (düzeltme önerildi) |
| E-08-38 | Kart menüsü | tık / öğe | Sayfasını aç → 08b; Ayarları düzenle → §4.5; Görev ata → §4.6; Üst birimi değiştir, Pasifleştir → devre dışı | §4, BE-016/017 |
| E-08-39 | Boş durum | — | Süzgeç sonucu boşken | §6 |
| E-08-40…43 | Yapı ağacı | — | v1 statik | BE-016 |
| E-08-45 | Sayım satırı | — | Görünen/toplam | §5 |
| E-08-46 | `perms` | — | Uygulanmaz | ozellikler §7 |
| E-08-50 | Ekmek kırıntısı | tık | 08 | §1 |
| E-08-53 | Alt satır | — | Kişi sayısı canlı; üst/alt birim ve "Aktif" statik | BE-016/017 |
| E-08-54 | Ekibe mesaj | tık | v1 dışı (F7) | §1 |
| E-08-55 | Görev ata | tık | Görev oluşturma, departman ön dolu | §4.6 |
| E-08-56 | Diğer işlemler | tık | Düzenle canlı; birleştir/pasifleştir devre dışı | §4.5, BE-017 |
| E-08-57…63 | Sekmeler | tık | `sekme` değişir; Arşiv v1 dışı; Toplantılar F4'te bağlanır | §3 |
| E-08-64…68 | KPI'lar | — | Görev verisinden istemcide; "sezon ortalaması" = `reportDashboard` (`completed_tasks`/`total_tasks`, ŞY, fan-out yok; K/Ü'de kaynak yok) | §5, `backend.md` E-08-67 |
| E-08-69 | Arşiv KPI | — | v1 dışı | BE-025 |
| E-08-70 | Düzenle | tık | Düzenleme formu | §4.5 |
| E-08-71 | Açıklama | — | Alan varsa canlı, yoksa statik | ozellikler §7 |
| E-08-72/73/75 | Üst birim / Kuruluş / Görünürlük | — | Statik | BE-016, BE-018 |
| E-08-74 | Arşiv klasörü | tık | v1 dışı (F5) | §1 |
| E-08-76/77 | Alt birimler | — | Statik | BE-016 |
| E-08-79 | Üye ekle | tık | Kişi seçici → üyelik | §4.3 |
| E-08-80 | Tüm üyeler | tık | 05 (ya da Üyeler sekmesi) | §1 |
| E-08-81 | Üye kutucuğu | tık (ad) | 05b | §1 |
| E-08-82/83 | Dikkat gerektirenler | tık | 03 / görev ayrıntısı | §1, §5 |
| E-08-85…89 | Kısayollar | tık | 03 / 03c / 07 / 09 / PDF | §1 |
| E-08-90 | Son etkinlik | — | Statik | BE-018, GAP-002 |

## 8. Bağımlılıklar

- **`00-ortak`:** kenar menüsü (`active="coords"`), Kenar-Secici (program/rol/koordinatörlük kapsamı), üst çubuk (geri/ileri, ekmek kırıntısı kabı, tema, bildirim), açık durum ekranları (K7), etkili işlem onayı diyaloğu (K5), devre dışı + `designStub` deseni (K13).
- **`shared/ui`:** `rp-seg`, `rp-tabs`, `rp-pop`/`rp-menuitem`, `rp-av`/`rp-avstack` + ipucu, `t-check`, `rp-empty`, `rp-timeline`, `rp-dl`, `rp-kpistrip`; yerel `rp-ccard`, `rp-code`, `rp-health`, `rp-selbar` modül bileşeni olur.
- **Diğer ekranlar:** 03 (görev listesi, `department_id` süzgeci; görev oluşturma formu), 03c (F3), 05 / 05b (kişi sayfaları; aynı kişi seçicinin paylaşımı — 05 grubuyla ortak bileşen olabilir), 07 (F5), 09 (F4), sohbet (F7), PDF (F6).
- **Paylaşılan durum:** seçili program (+ departman) kapsamı; `me` + `me/departments` (koordinatör atama/üyelik sonrası geçersizlenir).
- **Yol haritası bağımlılıkları:** GAP-033 (programa bağımsız üyelik), GAP-036 (Türkçe katlama), ORGANIZATION-K18 (rol kaybında görev devri), silinmiş departman görevlerinin görünürlüğü.
