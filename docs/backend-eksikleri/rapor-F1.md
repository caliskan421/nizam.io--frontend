# Backend devir raporu — F1 kapanışı (WEB-1), 2026-11-09

**Tür:** faz kapanış devri (`rapor-F<N>.md` kalıbı). **Pin:** `v0.11.0-api` (F1 boyunca değişmedi).
**Önceki raporlar:** [`rapor-F0.md`](rapor-F0.md) (F1 öncelik sırası) · [`rapor-tespit-2026-11-08.md`](rapor-tespit-2026-11-08.md) (paketlerin uç/alan önerileri ve kabul ölçütleri; burada **tekrar yazılmaz**, paket numarasıyla anılır).
**Kaynak:** [`kayit.md`](kayit.md) · PR #32–#41 gövdeleri · [`../yurutme/web-1/ilerleme.md`](../yurutme/web-1/ilerleme.md).
**Not:** Uç/alan adları **öneridir**; backend onayı ve sözleşme etiketi gelene kadar web uydurmaz.

## 1. F1'de kayıt değişikliği

| Kalem | Sayı / satır |
|---|---|
| Eklenen BE satırı | **0** — W41/W41b/W41c, W42–W47, W51 uygulayıcılarından hiçbiri `YENİ-EKSİK` bildirmedi |
| Durumu değişen satır | **0** — `backend'de`ye geçen yok (pin değişmedi), `bağlandı` yok |
| Kodda kullanılan stub kimlikleri | **BE-001** (kabuk program avatarı) · **BE-003** (sayaçlar, "yüklenen kayıtlar içinde", K/Ü rozetleri) · **BE-004** (arama istemcide) · **BE-005** (kısa kod "‹KOD›-—") · **BE-006** (alt görev zorunluluk kutuları) · **BE-007** (ilerleme çizgisi nötr kısmı) · **BE-008** (Hatırlat) · **BE-010** (Son işlemler) · **BE-038** (kişi süzgeci) · **BE-040** (sıralama istemcide) · **BE-091** (yönetici dışı etkinlik) |
| CI denetimi | `tests/lint/design-stub.test.ts` kod ↔ kayıt tutarlı (her kimlik `açık`); main `050ca8e` CI yeşil |

F1 rapor-F0'daki "hiçbir yeni uç beklemeden" varsayımını doğruladı: 03 ve 01 ekranları dürüst sınırlı gösterimle (yüklenen kümede sayım/arama/sıralama, "Daha fazla yükle", kapsam etiketi — P4, ortak-kurallar §10) canlıya çıktı. Rapor-F0 §2 sırası (BE-003 → BE-036 → BE-038 → BE-040 → BE-004 → BE-001 → BE-051) **geçerliliğini korur**; F1 ekranlarını iyileştirmek için hâlâ doğru sıradır.

## 2. F2'nin ihtiyaç duyacakları — önce bunlar

F2 (kullanıcılar 05, koordinatörlükler 08, program yönetimi) **yeni uç beklemeden başlar**: eksik alanlar statik/devre dışı, liste sınırları F1 kalıbıyla (`docs/ekranlar/05-kullanicilar/README.md`, `08-koordinatorlukler/README.md` uygulama kararı tabloları, durum **geçici kabul**). Ancak aşağıdaki paketler F2 ekranlarındaki statik öğelerin çoğunu kaldırır. Sıra = F2 gösterimini en çok iyileştiren sıra. Kabul ölçütünün tam metni tespit raporu Paket 2'dedir; burada tek cümle.

| Sıra | Paket (tespit raporu) | BE | Amaç | Uç/alan önerisi | Kabul (özet) | F2 tüketicisi |
|---|---|---|---|---|---|---|
| 1 | **2.1 Kullanıcı okuma ailesi** | BE-041, BE-042, BE-043, BE-044, BE-045 (koşullu), BE-011, BE-012 | Kullanıcı listesinin ve tekil kullanıcının yönetici ekranını kuracak alanları taşıması | `KnownUser`'a `email`, `company_admin`, kilit/hesap durumu; `search` e-postayı da kapsar; `role=company_admin`; `program_id` + `department_id` süzgeci; `total` + rol sayaçları; `GET /v1/admin/users/{id}` (aynı alanlar + bütün programlardaki ekip satırları); kilitleme ucu (BE-012) | Her alan **ayrı** test edilir (tek dev ölçüt yok, Codex `05:yeni-1…9`); BE-045 ancak "Tümü"nün anlamı kararlaşınca (Codex §6 #14) | 05 E-05-03/06/07/17/18/21/22/31/35/40…44 |
| 2 | **2.2 Departman oluştur + bağla** | BE-049, BE-050 | 08b derin bağlantı ve "Yeni koordinatörlük" akışının güvenli kurulması | `GET /v1/program/departments/{departmentId}` (S2; `display_name`, `code`, `description`, `kind`); 409 `organization.department_exists` zarfında mevcut kimlik + silinmişlik (`fields[]` alan kodu ya da yapılandırılmış alan; `organization.transfer_available` emsal) ya da tek uçta oluştur-ve-bağla + işlem anahtarı | Tek departman S2'de okunur; `department_exists` mevcut kimliği taşır; oluştur/bağla tekrarı güvenlidir | 08 E-08-05; 08b E-08-30/50…53/71 |
| 3 | **0.6 Program kısa ad + renk** | BE-001 | Kabuk avatarı (F0'dan beri stub) ve F2 program formu | `Program.short_name` (≤4) + `Program.color`, okuma/yazma uçlarında isteğe bağlı | Okuma/yazma uçlarında döner; web stub'ı kaldırır | Kabuk E-00-04/07/40; F2 program yönetimi (W81) |
| 4 | **2.3 Ekip özeti (yönetici dışı)** | BE-048 | Koordinatörün kendi birim görünümü (ürün kararı sonrası, Codex §6 #17) | `listProgramDepartments`'a yapısal `coordinators[]`, `member_count` (S2) ya da özet ucu; görev sayaçları BE-003'te | Üyeye bütün birim iş sayaçları açılmaz | 08 K merceği (F2'de kurulmaz; ürün onayı bekliyor) |
| 5 | **0.1 Belge paketi** (yalnız F2 maddeleri) | BE-036 madde 4, 5, 6, 9 | Organizasyon eylem görünürlüğünün sözleşmeden okunması | `istemci-akislari.md` §3/§4'e kullanıcı/hesap/üyelik ve departman/ekip/bağ/koordinatör satırları; `listUsers` ŞY + ekip satırsız hesap kuralı; `code` `pattern` `^[A-Z0-9]{2,10}$` | Yeni sözleşme etiketinde yayımlanır, kod gözlemiyle çelişmez | W71 `modules/organization/model/capabilities.ts` (bugün modül README kural kimliklerinden) |
| 6 | **2.4 Koşullu F2** | BE-046, BE-047 | Kişinin dosyaları; koordinatörün hedef hesap yetkisi | 05/yeni-7, `listMembers.manageable` | Codex §6 #16 kararı ve BE-036 madde 5 sonrası | 05b Dosyalar sekmesi; 08b Üyeler |
| 7 | **2.5 Diğer F2** | BE-013, BE-014, BE-016, BE-017, BE-018 | Davet/sıfırlama bağlantısı, CSV, hiyerarşi, aktif/pasif, kuruluş/görünürlük/etkinlik | Satır tanımına göre | Satır tanımına göre | 05 E-05-04/34; 08 E-08-04/12/38/56/73/75/90 — F2'de statik/gizli kalır |
| 8 | **0.3 Atanan süzgeci** | BE-038 | 05b kişisel takip ve 05 panel özetinin tüm programı taramaması | `listProgramWorkItems?assignee_account_id=` (çoklu, görünürlükle kesişir) | Rapor-F0 sıra 3 ile aynı | 05 E-05-29, 05b E-05-49…75 (kapanana dek tek uçla sonuna dek sayfalama) |

Sıra 1 ile 2 birbirinden bağımsızdır, paralel açılabilir. Sıra 1'in başlaması için ürün sahibinin Codex §6 #14 ("Tümü" = şirket geneli mi) kararı beklenir; web bugün geçici kabulle (şirket geneli + seçili program etiketleri) ilerler.

## 3. F1 uygulamasında öğrenilenler (backend'e iletilecek)

1. **`attachFile` gövdesi ve tekrar:** K5 tekrar nesnesi gövdeyi `structuredClone` ile sabitler; `File`/`Blob` klonlanabilir, Vue reaktif vekili klonlanamaz → web `useProtectedMutation`'da vekilleri açar (W41c, #35). Web içi ders; backend'e yük yok. Bilgi: multipart tekrar aynı `Idempotency-Key` ve aynı dosyayla gelir; sunucunun tekrar eşitliğini multipart gövdede nasıl denetlediği sözleşmede yazmıyor — gerekirse BE-036'ya madde adayı (yeni satır açılmadı).
2. **`listMembers` koordinatör dışına 403:** atanan seçici (`useDepartmentMembers`, W45 #38) yalnız yönetici ve o birimin koordinatörü için çalışır; atanmış üye için seçenek yok. F1'de sorun değil (üye görev açamaz), ama F4 toplantı adayı (BE-067) ve atanan aday dizini (BE-039) aynı boşluğu taşır — aday kümesi yetkiyle ayrı tanımlanmalı (BE-039 tanımı yeterli, değişiklik yok).
3. **Not uzunluk sınırı openapi'de yok:** görev notu (`addWorkItemNote`/`updateWorkItemNote`) şemasında `maxLength` yok; web sınırı uydurmadı (W47 #41), sunucu 422'sini alan hatası olarak gösterir. **BE-036 madde 8 genişletmesi:** madde bugün yalnız `MeetingNote` 5000 rune'u anar; görev notu sınırı da şemaya yazılmalı. Yeni satır açılmadı.
4. **`is_overdue` tanımı (BE-036 madde 1):** web "Geciken" sekmesini ve 01 "Gecikmede" KPI'sını `is_overdue` + istemcide `status ≠ tamamlandi` ile kurdu; gün sınırı **kurulum saat dilimi** varsayımıyla ("gün kaldı" istemci hesabı, `InstanceProfile.timezone`). Sunucunun gün sınırı UTC ise "gün kaldı" ↔ "gün gecikti" sınırda bir gün kayabilir — madde 1'in saat dilimi kısmı F3 Gantt'tan önce kapanmalı.
5. **GAP-075 (rapor-F0 §3 madde 1):** Admin Görevler rozetleri ve 01 Admin KPI'sı F1'de `reportDashboard`'dan canlı; `pending_date_changes`/`overdue_tasks` sayaçlarının backend testi hâlâ yok. Görsel doğrulama (O5 adım 3) elle karşılaştırma yapar; test kapsamı backend'de kapanmalı.
6. **`GanttTask` alanları hâlâ F3:** BE-051, BE-052, BE-053, BE-019 (tespit raporu Paket 0.4) F1'de tüketilmedi; 03 listesi sayaçları `listProgramWorkItems.subtask_counts`'tan aldı. Paket 0.4 F3 açılışından önce bitmeli (kendi SVG Gantt kararı aynı alanları bekler).
7. **Rapor-F0 §3 madde 3 (`MyDepartment.code` yok)** F1'de de geçerli: 03 kısa kod öneki yalnız `listProgramDepartments` ile çözülür (G13); K/Ü yüzünde ek istek sürüyor.

## 4. Sonraki adım

Ürün sahibinin backend ajanı §2 sırasıyla paket açar (Paket 2.1 ile 2.2 paralel olabilir); yeni API etiketi → web pin yükseltir (`api-pin.json`) → satır `bağlandı`, `designStub` kaldırılır. F2 kapanışında `rapor-F2.md`.
