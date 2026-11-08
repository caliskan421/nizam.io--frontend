# 01b — Backend eşlemesi (nereden geliyor)

Kaynak: `../../../../nizam.io--backend/docs/api/openapi.yaml` (pin `v0.11.0-api`), `istemci-akislari.md`, `error-codes.json`. İstemci uydurmaz; uyuşmazlık `eksikler.md`'ye gider.

Ek kaynaklar (sözleşme dışı, yalnız gereksinim çıkarmak için okundu): backend `docs/known-gaps.md` (GAP-002, GAP-067, GAP-094, GAP-182, GAP-049), `docs/architecture/data-model.md` §4.9, `docs/security/data-classification.md`, `internal/modules/audit/README.md` (AUDIT-K01…K09) ve `domain/audit.go`, modül README'lerinin §5 "Audit eylemleri" satırları; yönetim deposu `program/KARARLAR.md` (KR-05, KR-09) ve `project-control/decision-register.md` (K-15, D-0174).

**Ana hüküm:** sözleşmede audit okuma ucu **yoktur** (184 operationId'de `audit`/`history`/`activity` okuma yüzü yok; audit modülü README §4: "Bu modülün HTTP ucu yoktur. Okuma yüzü yok"). Ekranın ana verisi (tablo, şerit, sayaçlar, süzgeç seçenekleri, CSV) tümüyle `eksikler.md`'dedir. Bu dosya yalnız mevcut uçlarla eşlenebilen azınlığı (kabuk, ad/departman çözümü, hedef nesne bağlantıları, saat dilimi, indirme bileti kalıbı) kaydeder.

## 1. Okuma uçları
| Kimlik | Öğe | operationId | Yol | Kapsam başlıkları / parametreler | Yanıt alanı → öğe | Sayfalama / tavan | Not |
|---|---|---|---|---|---|---|---|
| E-01B-01..05 | Kabuk (menü, gezinme, tema, zil) | `me`, `myDepartments`, `countUnreadNotifications` | `/v1/me`, `/v1/me/departments`, `/v1/notifications/unread-count` | S1 / S1 / (00-ortak) | `00-ortak/backend.md` | — | Bu ekrana özgü değil. |
| E-01B-03 | Kırıntı kökü (program adı) | — (kabuğun `['programs']` verisi: `listPrograms`) | — | — | `name` → kök metni | — | Ayrı `readProgram` çağrısı **yok**; program adı kabukta `['programs']`'tan okunur (ortak-kurallar §6; CX-T-02). Kapsam kararı (eksikler §4) kuruluş kapsamı çıkarsa kırıntı kökü programdan bağımsız olur (kabuk verisi yine kullanılır). |
| E-01B-07..12, 14, 15, 27, 35 | Tablo satırları, şerit, sayaçlar | **uç yok** | — | — | — | — | → `eksikler.md` E-01B-27..35, yeni-1, yeni-4. |
| E-01B-12, 13, 15, 27, 28 | Gün sınırı, "Bugün", saat | `instanceProfile` | `GET /v1/instance/profile` | S0 | `timezone` (IANA) → yerel gün/saat hesabı | — | Sözleşmedeki tarih-saatler UTC RFC 3339'dur (`istemci-akislari.md` §3 WORK-K83). Gün gruplaması ve "bugün" işareti kurulum saat diliminde yapılmalı; sunucu toplulaştırması (şerit, gün sayacı) **aynı** saat dilimiyle kovalamalı (eksikler yeni-4). |
| E-01B-16, 32 | "Yapan" seçenek adları; yapan hücresi adı | **dolaylı:** `listUsers` | `GET /v1/admin/users` | S1; `search`, `role`, `limit`, `cursor` | `users[].account_id`, `full_name` | imleçli, 50/200 | **Yetmez:** kimlikle toplu okuma yok, yalnız metin araması; satır başına ad çözmek fan-out olur (K3 ruhu). Ad audit yanıtında gelmeli (`actor.full_name`, WORK-K83 `created_by_full_name` kuralıyla: hesap yoksa `null`, silinmiş hesabın adı döner). → yeni-1. |
| E-01B-17, 33 | Koordinatörlük seçenekleri ve hücre adı | `listProgramDepartments` (program kapsamı) / `listDepartments` (kuruluş kapsamı) | `GET /v1/program/departments` / `GET /v1/departments` | S2 / S1 | `departments[].department_id`, `display_name` (programdaki ad) / `name` (katalog adı) | imleçsiz, 200 tavanı + `X-Result-Truncated` (GAP-027) | Yalnız ad sözlüğü olarak kullanılabilir; "yalnız kaydı olan departmanlar" ve seçenek başına sayı bu uçlarda yok (yeni-4). Silinmiş departmanın adı bu listelerde yok (`listDeletedDepartments` ayrı, yalnız yönetici) → ad audit yanıtında gelmeli. |
| E-01B-32 | Yapan → kişi sayfası (05b) | — (gezinme) | `/kullanicilar/:hesapId` (05 rota önerisi) | — | audit `actor_account_id` = 05b `hesapId` | — | Kimlik biçimi uyumlu: audit aktörü değişmez hesap kimliğidir (AUDIT-K02, data-model §4.9); 05b `account_id` ile açılır (`KnownUser.account_id`, `MeResponse.account_id`). Aktörsüz kayıtlar (sistem, kurulum, `revoked_all`, kilit) bağlantısız olmalı. |
| E-01B-41 | Hedef: görev | `getWorkItem` | `GET /v1/work-items/{id}` | **S3**: `X-Nizamio-Program` + `X-Nizamio-Department` = görevin kendi değerleri (`istemci-akislari.md` §2) | — | — | Work audit kayıtlarında program/departman kapsamı **NULL** yazılır (work README §5) → hedef bağlantısı için audit yanıtı görevin `program_id` + `department_id`'sini taşımalı (yeni-1 `target`). |
| E-01B-41 | Hedef: toplantı | `getMeeting` | `GET /v1/meetings/{id}` | S2 `X-Nizamio-Program` | — | — | Meetings kayıtları program kapsamını taşır (audit README §5) → `program_id` yeterli. |
| E-01B-41 | Hedef: dosya | `archiveFolders` (klasör görünümü) / `downloadFile` | `GET /v1/records/archive/folders`, `GET /v1/files/{id}/download` | S3 / S3 | — | — | Records kayıtları program + departman taşır; klasör (07) için dosyanın bağlı olduğu görev kimliği de gerekir — envelope'ta yok (konu dosyadır). Silinmiş dosyada bağlantı yok. |
| E-01B-41 | Hedef: sohbet / mesaj | `getChat` | `GET /v1/chats/{chatId}` | S2 | — | — | Messaging audit ayrıntısı "yalnız kimlik ve sayı" taşır; konu türünün (sohbet mi mesaj mı) ve sohbet kimliğinin hangi alanda olduğu **bilinmiyor** — koddan doğrulanmalı. |
| E-01B-08 | CSV indir (kalıp) | `issueDownloadTicket` → `redeemDownloadTicket` | `POST /v1/download-tickets`, `GET /v1/downloads/{ticket}` | S1 + CSRF / S0 | `url` | oturum başına 16 açık bilet | **Hedef kapalı listede değil** (dokuz desen; README §6). CSV ucu (yok) bu listeye eklenmeli → yeni-5. |
| E-01B-19 | Arama (`q`) | **uç yok** | — | — | — | — | → `eksikler.md` yeni-1 (`q`: eylem görünen adı + hedef adı + aktör adı; Türkçe katlama GAP-036). |
| E-01B-22 | "saat" başlık süzgeci (tarih aralığı) | **uç yok** | — | — | — | — | → `eksikler.md` yeni-1 (`from`/`to`, kurulum saat dilimi) + yeni-4 (`range` faset sayıları). |
| E-01B-23 | "tür" başlık süzgeci | **uç yok** | — | — | — | — | → `eksikler.md` yeni-1 (`category[]`) + yeni-2 (kategori kümesi) + yeni-4 (`category` faset). |
| E-01B-24 | "işlem" başlık süzgeci | **uç yok** | — | — | — | — | → `eksikler.md` yeni-1 (`action[]`) + yeni-2 (görünen ad, türe göre grup) + yeni-4 (`action` faset). |
| E-01B-36 | Daha fazla göster | **uç yok** | — | — | — | — | → `eksikler.md` yeni-1 (`limit` + `cursor` / `next_cursor`; sözleşme kalıbı README §4). |
| E-01B-37 | Değişmezlik notu | — (sabit metin) | — | — | — | — | Metin bugünkü backend'le doğru değil (GAP-067, AUDIT-K07) → `eksikler.md` §4-5. |
| E-01B-38 | Başlık süzgeç paneli (seçenekler + sayılar) | **uç yok** | — | — | — | — | → `eksikler.md` yeni-2 (seçenek sözlüğü) + yeni-4 (`facets`, `range`). |
| E-01B-40 | Seçenek sayıları (faset) | **uç yok** | — | — | — | — | → `eksikler.md` yeni-4 (`facets.*[].count`). |

## 2. Yazma uçları
| Kimlik | Eylem | operationId | Gövde alanları | expected_revision / Idempotency-Key | Başarı → yenilenecek sorgular | Hata kodları (error-codes.json) → ekran davranışı |
|---|---|---|---|---|---|---|
| — | Ekranda yazma eylemi yok (kayıtlar salt okunur; AUDIT-K03) | — | — | — | — | — |
| E-01B-08 | CSV üretimi için bilet alma (yazma sayılır: CSRF) | `issueDownloadTicket` | `{method:"GET", path:"<CSV ucu + süzgeç sorgusu>"}` | yok | — | 422 `identity.download_target_invalid` (hedef listede değilken bugün kesin döner), 429 `platform.rate_limited` + `Retry-After: 60`, 404 `identity.download_ticket_invalid` (tüketimde). Ekran: hata bandı, otomatik tekrar yok (K5). |

Not: audit yazan yazma uçlarının yanıt listesinde `audit.entry_rejected` (500) bulunur — audit yazılamazsa o işlemin iş yazımı da geri alınır (AUDIT-K01: audit yazan işlemin transaction davranışı). Bu, **her yazmanın kaydedildiğinin kanıtı değildir**: örneğin `sendChatTyping` (openapi `O:10288`) `audit.entry_rejected` taşımaz (CX-S-07). Kaydın eksiksizliği ayrı doğrulanmadan iddia edilmez; bu ekranın kendisi bu kodu almaz.

## 3. Eylem görünürlüğü (istemci-akislari.md §4)
| Kimlik | Eylem | Kim görür (satır no §4) | Koşul alanları (yanıt içinde) |
|---|---|---|---|
| — (ekranın tamamı) | Ekrana giriş, okuma | **§4'te satır yok.** Okuma yetkisi tanımsız (GAP-002, KR-09, K-15 kırmızı). Öneri: `MeResponse.company_admin === true` (REPORTING-K01 emsali) — kesinleşmeden varsayım. | `company_admin` |
| E-01B-08 | CSV indir | §4'te satır yok; okumayla aynı kural önerilir. | `company_admin` |
| E-01B-32 | Yapan → 05b | 05b'nin kendi görünürlüğü (05 grubunda açık soru). | `actor.account_id != null` |
| E-01B-41 | Hedefe git | Hedef ekranın kendi yetkisi; yönetici her hedefi görür (görev §2, toplantı, arşiv). Not yazma/dosya yükleme yöneticiye kapalıdır ama okuma açıktır. | `target.navigable` (önerilen alan) |

## 4. Türetilen değerler (istemcide hesap)
- **Baş harfler** (E-01B-32): `actor.full_name` ilk iki sözcüğünden; ad `null` ise nötr etiket ("Bilinmeyen kullanıcı" — metin ürün kararı) ve aktörsüz kayıtta "Sistem" (öneri; tasarımda yok).
- **Saat** (E-01B-28) ve **gün grubu** (E-01B-27): `occurred_at` (UTC) → `instanceProfile.timezone`'da yerel saat/gün. "Bugün/Dün" göreli adı istemcide.
- **Şerit yüzdesi ve yükseklik** (E-01B-12, E-01B-14): sunucunun gün × tür sayılarından istemcide oran; en yoğun gün = 100 %. Sayıların kendisi istemcide **hesaplanamaz** (yüklenen satırlardan sayım yanıltıcı) → yeni-4.
- **Tür rengi / rozet** (E-01B-29): sunucunun döndüğü `category` → tasarım renk tablosu (ozellikler §2.3). Kategori → renk eşlemesi istemcide; kategori kümesi sunucuda (yeni-2).
- **Gösterilen sayısı** (E-01B-35 sol): yüklenen satır sayısı istemcide; sağ taraf (eşleşen toplam) sunucudan (yeni-4).
- Bugün hiçbir sayı istemcide **doğru** türetilemez; v1'de ekran yok (K14).

## 5. Sorgu anahtarları ve geçersizleme
Öneri (uç gelince): `scopedKey(['audit','entries', süzgeçler])` (sonsuz sorgu, imleç), `scopedKey(['audit','summary', süzgeçler])` (toplamlar + faset), `scopedKey(['audit','activity30'])` (şerit), `['audit','action-types']` (sözlük; kapsamdan bağımsız, uzun ömürlü). Kapsam türü kararına göre: kuruluş kapsamıysa anahtar program kimliği taşımaz, program değişince iptal edilmez; program kapsamıysa K2 iptali geçerli. Yazma yok → mutasyon geçersizlemesi yok; odak dönüşünde tazeleme (K6) yeterli. Ana sayfa "Son işlemler" (BE-010) aynı `entries` anahtarının `limit=N` biçimini paylaşabilir.

## 6. Sözleşme notları
- **Okuma yüzü yok:** GAP-002 ("Audit kaydı yazılır …; kayıtları okuyan bir API ucu ve okuma yetkisi tanımı yoktur … Okuma yüzü açılırsa eylem kodlarının görünen ad sözlüğü de birlikte tanımlanır"); KR-09 açık, "program dışı (audit ekranı — D-0174)" — karar istemci/açılış çalışmasına devredilmiş; K-15 kırmızı: okuma yetkisi + saklama süresi hukuk/KVKK teyidi bekler, varsayılan **yok**.
- **Kayıt zarfı (yazılan, okunamayan):** `audit_entries`: `id` (zaman sıralı), `actor_account_id` (nullable), `instance_id`, `subject_kind`, `subject_id`, `action_code`, `outcome` (`succeeded`/`failed`), `request_id`, istemci kategorisi (`web`/`mobile`/`ops`), `program_id` (nullable), `department_id` (nullable), `details` (≤ 300 rune, kararlı değer; serbest metin ve kişisel veri yok), `occurred_at` (UTC). Sözlük `audit_action_types`: `code`, `module`, ilk görülme (S-B sınıfı).
- **Kapsam sütunları modüle göre (audit README §5):** identity, organization, program, work, provisioning → **boş**; messaging, meetings, reporting → program; records → program + departman. Eski satırlar doldurulmaz (AUDIT-K06).
- **Reddedilen girişimler audit'te yok** (AUDIT-K04): başarısız giriş vb. merkezi güvenlik log kanalındadır (`security_attempt`), tablo değil.
- **Değişmezlik:** uygulamada güncelleme/silme yolu yok, ama DB düzeyinde zorlanmaz (GAP-067) ve `NIZAMIO_AUDIT_RETENTION` > 0 ise süresi dolan kayıt silinir (varsayılan 0 = süpürme kapalı).
- **Geçmiş kayıt taşınmaz:** KR-05 varsayılanı "hayır" (D-0162/2, veri göçü kapsam dışı) → kayıtlar kurulumla başlar.
- **İndeksler:** `audit_entries` üzerinde `subject_kind` ve `actor_account_id` önekli iki indeks var, `occurred_at` önekli yok (GAP-182). Zaman sıralı liste ve 30 gün histogramı yeni indeks ister.
- **Sayfalama kalıbı:** `limit` (50/200) + opak `cursor` / `next_cursor`, sayfa numarası yok (README §4). Uyumsuz imleç 422 `<mod>.invalid_cursor` emsali var (decision-register: identity/records).
- **Okuma yeri:** audit modülü hiçbir iş modülüne bağımlı değildir (AUDIT-K08); ad/hedef çözümü audit içinde yapılamaz. `reporting` modülünün audit'e `Sr+T` kenarı zaten vardır (modules.md) — okuma yüzünün doğal yeri (öneri; mimari karar backend'in).
- **Hata kodları:** bugün `audit.entry_rejected` (yalnız yazma). Okuma için yeni kod gerekir (öneri `audit.not_authorized` 403, `audit.input_invalid` 422, `audit.invalid_cursor` 422) — `error-codes.json`'da yok.
