# Backend devir raporu — ekran tespitleri (faz öncesi), 2026-11-08

**Tür:** faz öncesi tespit devri (`rapor-F<N>.md` kalıbı; F0 başlamadan). **Pin:** `v0.11.0-api`.
**Kaynak:** [`kayit.md`](kayit.md) · [`../ekranlar/sentez.md`](../ekranlar/sentez.md) §3 · [`../reviews/EKRANLAR-codex.md`](../reviews/EKRANLAR-codex.md) §4, §6, §8 (hüküm: KOŞULLU UYGUN). Çakışmada Codex kararı uygulandı.
**Not:** Aşağıdaki uç/alan adları **öneridir**; backend onayı ve sözleşme etiketi gelene kadar web bunları uydurmaz.

## 1. Özet

| Kalem | Sayı |
|---|---|
| Düzeltilen mevcut satır | 30 (BE-001…BE-031, BE-014 hariç; BE-032…035 değişmedi) |
| Durumu değişen | BE-023 → `vazgeçildi` (backend eksiği değil, W7). BE-008 `açık` kalır (sentezin "vazgeçildi" önerisi Codex §8 ile reddedildi) |
| Bölünen | BE-020 → +BE-051 · BE-025 → +BE-069 · BE-028 → +BE-080 · BE-030 şemsiye → BE-087…092 · BE-031 şemsiye → BE-093…106 |
| Eklenen satır | **71** (BE-036…BE-106) |
| …bunlardan belge (BELGE) | 1 satır, **11 madde** (BE-036) |
| …bunlardan koşullu (ürün kararına bağlı BE) | 20 yeni satır (+ mevcutlarda koşullu bağ: BE-006, BE-008, BE-020, BE-022, BE-031) |
| Kayda girmeyen ürün kararı kalemi | 18 (§4.1) |
| Kayda girmeyen tasarım (tuval) kalemi | 13 (§5) |
| Kayda girmeyen "BE değil" kalemi | 5 (§4.3) |

**F1'in başlaması için hiçbir yeni ucun bitmesi zorunlu değil** (Codex §7): dürüst sınırlı gösterim (yüklenen kümede sayım, "daha fazla yükle", kapsam etiketi) kabul edildi. Ancak **BE-036 belge paketi** ve **BE-003 çekirdek sayaçlar** F0/F1 gösterimini en çok iyileştiren iki iştir. **BE-072 (yönetici arşivi S3)** F5 için engelleyicidir.

## 2. Backend iş paketleri — önerilen sıra

Her paket yönetim deposunda ayrı backend fazı olarak açılabilir; sonuç yeni API etiketi → web pin yükseltir → satır `bağlandı`.

### Paket 0 — F0/F1 öncesi (önce bunlar)

| # | Paket | BE | Boyut | Bağımlılık | Kabul ölçütü (tek cümle) |
|---|---|---|---|---|---|
| 0.1 | **Belge paketi** | BE-036 | S (belge) | yok | 11 maddenin her biri openapi açıklaması / `istemci-akislari.md` satırı olarak yeni bir sözleşme etiketinde yayımlanmış ve kod gözlemiyle çelişmiyor. |
| 0.2 | **Görev sayaçları çekirdeği** | BE-003 (+BE-009) | M | WORK-K82 görünürlük kuralı | `GET /v1/program/work-items/counts` (S2) aynı görünürlükle toplam, beş durum, `overdue` ve görünür `pending_date_requests` döndürür ve `department_id` süzgeciyle liste ucuyla birebir tutarlıdır. |
| 0.3 | **Atanan süzgeci** | BE-038 | S–M | 0.2 ile aynı süzgeç semantiği | `listProgramWorkItems?assignee_account_id=` (çoklu) görünürlükle kesişen sonucu imleçli döndürür, yetkiyi genişletmez. |
| 0.4 | **GanttTask alanları** (F0 Gantt pilotu da tüketir) | BE-052, BE-051, BE-053, BE-019 | S+S+S+S | yok | `adminGantt`/`coordinatorGantt` satırları `pending_date_request`, `subtask_counts`, `dates_revision` taşır ve 200 kesilmesi yanıtta sinyallenir. |
| 0.5 | **Web uyumluluk alanı** (koşullu) | BE-037 | S–M | BE-036 madde 11 | Politika alan gerektiriyorsa `InstanceProfile.minimum_web_version` yayımlanır; gerektirmiyorsa satır `vazgeçildi`. |
| 0.6 | **Program kısa ad + renk** | BE-001 | S | yok | `Program.short_name` + `Program.color` okuma/yazma uçlarında isteğe bağlı alan olarak döner. |

**Kayıt satırı olmayan F0 soruları (backend'e iletilecek, web işidir):** (a) `logout` başarısız/bilinmeyen sonuçta HttpOnly yenileme çerezinin durumu — web bunu "sunucu çıkışı bilinmiyor" diye modelleyecek, sessiz yenilemeyle oturumu geri açmayacak (CX-S-10); (b) K6 yetki kaybı kodları: `program.not_found`, `reporting.not_authorized` eklenir; kaynak silinmesi / eylem yasağı / program görünürlüğü kaybı ayrımının backend tarafında tutarlı olduğu teyit edilmeli (Codex §5). İkisi de yeni uç istemez; sözleşme teyidi gerekirse BE-036'ya madde olarak eklenir.

### Paket 1 — F1 görev sorgu ailesi

| # | Paket | BE | Boyut | Bağımlılık | Kabul ölçütü |
|---|---|---|---|---|---|
| 1.1 | Sunucu araması | BE-004 | M | GAP-036 (Türkçe katlama) | `q` başlık + kısa kod + atanan adında arar ve imleçle tutarlıdır. |
| 1.2 | Sıralama | BE-040 | S–M | 0.2/0.3 süzgeç ekseni | `sort`/`order` imleçle birlikte kararlı sayfalama verir. |
| 1.3 | Atanan aday dizini | BE-039 | S–M | 0.3 | Görev atanan seçenekleri yetkili kümeyle sınırlı tek uçtan gelir; toplantı/tablo adaylarıyla birleşmez. |
| 1.4 | Görev kısa kodu | BE-005 | M | yok (09, 10, 11 de tüketir) | Görev satırı ve sohbet özeti kararlı kısa kod taşır. |
| 1.5 | Hatırlat (koşullu) | BE-008 | S–M | ürün §6 s.10 | Alıcı/sıklık/kanal kuralıyla dürtme ucu, kota ile. |

### Paket 2 — F2 organizasyon

| # | Paket | BE | Boyut | Bağımlılık | Kabul ölçütü |
|---|---|---|---|---|---|
| 2.1 | **Kullanıcı okuma ailesi** (ayrı kabul ölçütleriyle) | BE-041, BE-042, BE-043, BE-044, BE-045 (koşullu), BE-011, BE-012 | toplam M | önce "Tümü"nün anlamı (§6 s.14) | `listUsers`/tekil okuma e-posta, `company_admin`, kilit durumu taşır; her alan ayrı test edilir. |
| 2.2 | **Departman oluştur + bağla** | BE-049, BE-050 | S + M | yok | Tek departman okuması S2'de açılır; `department_exists` mevcut kimliği taşır ve oluştur/bağla tekrar güvenlidir. |
| 2.3 | Ekip özeti (yönetici dışı) | BE-048 | M | yetki ayrımı: görev sayaçları BE-003'te | `listProgramDepartments` ya da özet ucu yapısal `coordinators[]`, `member_count` döndürür, üyeye iş sayacı açmaz. |
| 2.4 | Koşullu F2 kalemleri | BE-046, BE-047 | M / S–M | ürün §6 s.16; BE-036 madde 5 | Karar sonrası. |
| 2.5 | Diğer F2 | BE-013, BE-014, BE-016, BE-017, BE-018 | M / S / L / M / M | — | Satır tanımına göre. |

### Paket 3 — F3 zaman çizelgesi

| # | Paket | BE | Boyut | Bağımlılık | Kabul ölçütü |
|---|---|---|---|---|---|
| 3.1 | Tarih yazımı tekrar güvenliği | BE-056 | M | ADR-0027 | `extendWorkItem`/`requestDateChange` `Idempotency-Key` alır; aynı anahtarla tekrar çift uzatma yapmaz. |
| 3.2 | Talep geri çekme (koşullu) | BE-054 | S–M | ürün §6 s.11 | Açan, bekleyen talebini geri çekebilir. |
| 3.3 | Zincir geri alma (koşullu) | BE-055 | L | ürün §6 s.11 | — |
| 3.4 | Çoklu birim Gantt / birimler arası bağ (koşullu) | BE-058, BE-059 | M / M | ürün; yetki genişlemez | — |
| 3.5 | Gantt dışa aktarım (koşullu) | BE-057 | S–M | §6 s.12; istemci üretimi seçilirse vazgeçilir | — |
| 3.6 | Tarihli alt görev modeli (koşullu) | BE-020 | M–L | ürün + ADR-0024 değişikliği (K4) | — |

### Paket 4 — F4 toplantılar

| # | Paket | BE | Boyut | Bağımlılık | Kabul ölçütü |
|---|---|---|---|---|---|
| 4.1 | Liste süzgeci + toplamlar | BE-021 | M | yok | `listMeetings` departman süzgeci, `meeting_date` sırası ve sekme toplamları döner. |
| 4.2 | Satır ve not sayaçları | BE-060, BE-061 | S / S–M | yok | Satır başına gündem/not/katılımcı sayacı; not listesi `converted`/`author=me` süzgeci ve toplamı. |
| 4.3 | Okuma zenginleştirmeleri | BE-063 | S | yok | Kod/silinmişlik ve oluşturan/işaretleyen/silen adı yanıtta. |
| 4.4 | Dönüşmüş not → görev | BE-065 | S–M | yok | Not, görevin `department_id`'sini taşır; bağlantı S3 başlığıyla açılır. |
| 4.5 | Aday listesi + tekrar güvenliği | BE-067, BE-068 | M / M | K21 | Koordinatör aday kümesini tek uçtan okur; oluşturma/gündem/katılımcı ekleme anahtarlıdır. |
| 4.6 | Koşullu F4 | BE-064, BE-066, BE-022, BE-062 | M / M / S–M / S–M | §6 s.21–22; W7 | F4 engeli değil. |

### Paket 5 — F5 arşiv (**BE-072 engelleyici**)

| # | Paket | BE | Boyut | Bağımlılık | Kabul ölçütü |
|---|---|---|---|---|---|
| 5.1 | **Yönetici arşivi S3 çelişkisi** | BE-072 | M | ürün §6 s.19 (teknik departman mı S2 mi) | Yönetici, departman seçmeden tek klasörün içini listeler ve her dosya için doğru kapsamla indir/yeniden adlandır yapabilir. |
| 5.2 | Dosya alanları | BE-070, BE-071 | S / S | BE-071'de kırıcı olmayan paralel alan | Dosya satırları `created_at` ve `uploaded_by_full_name` taşır; `archiveUploaders` tipi değişmez. |
| 5.3 | Klasör özeti + süzülmüş toplam | BE-025, BE-073 | S–M / S–M | aynı sayım sorgusu | `ArchiveFolder` görev sayısı, bayt, son yükleme; süzgeçli dosya listesi toplam döner. |
| 5.4 | Etiket | BE-024, BE-074 (koşullu) | M / S | GAP-108 etiket kararı | — |
| 5.5 | Önizleme türevi | BE-026 | S | bilet hedefi | Küçük resim ucu. |
| 5.6 | Koşullu F5 | BE-069, BE-075, BE-076, BE-077 | L / M / M–L / M | §6 s.19–20 | — |

### Paket 6 — F6 pano

BE-078 (S, `CoordinatorshipStat` onayda/iade), BE-079 (S–M, koşullu §6 s.7). Kabul: koordinatörlük kartı beş durumu ayrı alanlardan çizebilir.

### Paket 7 — F7 sohbet

| # | Paket | BE | Boyut | Bağımlılık | Kabul ölçütü |
|---|---|---|---|---|---|
| 7.1 | Liste süzgeci + okundu imleci + önizleme türü | BE-081, BE-082, BE-086 | S+S+S | yok | `listChats` `kind`/`unread` süzgeci; `read_seq`, `peer_read_seq`; `ChatLastMessage` türü. |
| 7.2 | Rol + paylaşılanlar + görev bağı | BE-083, BE-084, BE-085 | S–M / S–M / S | ADR-0026 | Ayrı alt işler; aile toplamı L. |
| 7.3 | Okundu bilgisi / iletme / birleşik yükleme | BE-028, BE-080, BE-029 | M / M / M | ADR-0026 | Her biri ayrı teslim. |
| 7.4 | Sohbet bildirimi | BE-027 | L | Web Push | Sohbet bildirimi üretilir; sessize alma bunun tercihidir. |

### Paket 8 — sonra (v1 dışı modüller)

**Audit (BE-030 şemsiye):** P0 karar (yetki, kapsam S1/S2, kategori, saklama, IP varsayılan hayır) → BE-087 P1 (M) → BE-088 P2 (L) → BE-089 P3 (M) ∥ BE-090 P4 (M) → BE-091 P5 (M–L, ayrı yetki genişlemesi; BE-007/010/015/018'i kapatır) · BE-092 P6 (S–M, yalnız P0 "toplansın" derse). Kabul: P2 sonunda yönetici imleçli, süzgeçli ve sözlüklü okuma yapabilir; eski kayıtlar uydurulmuş kapsamla gelmez.

**Tablolar (BE-031 şemsiye):** yeni-1 kapsam ADR'si (ürün) → BE-093 (2a) → BE-094 ∥ BE-095 → BE-097 (6+11a) → BE-098 → BE-099 ∥ BE-100 ∥ BE-102 → BE-101 (2b). Paralel: BE-096 (BE-098'den önce biter), BE-004/BE-005. 11e: BE-103, BE-104, BE-105, BE-106 (koşullu). Kabul: MVP (11, 11b, 11c, 11d) sahip yetkili ACL, sürümlü hücre yazımı ve aynı transaction'da değişiklik kaydıyla çalışır.

**Diğer:** BE-032 Takvim, BE-033 Kurumsal hafıza, BE-034 Simülasyon, BE-035 Bütçe/talep.

## 3. Belge paketi ayrıntısı (BE-036)

Davranış backend'de var; sözleşmede (openapi açıklaması ya da `istemci-akislari.md`) yazılması istenen anlamlar:

1. **`WorkItem.is_overdue` / `days_overdue`** — açık görevde `bugün > end_on`, tamamlanmışta her zaman `false`; gün sınırı ve saat dilimi (kurulum saat dilimi mi UTC mi). Admin Gantt `overdue` parametresinin tamamlanmış geç görevi de döndürdüğü (GAP-053) aynı yerde not edilsin. *(03/yeni-6)*
2. **Rapor alan anlamları** — `CoordinatorshipStat.member_count` koordinatörleri saymaz; `last_activity_at` = son görev hareketi; `active_tasks` = total − completed; `total_*` rol sayaçları kesişebilir; `coordinatorship_stats` sırası; `deleted_records` şirket geneli hesapları içerir. Kod gözleminden sözleşme garantisine yükseltilsin. *(01/yeni-6)*
3. **`X-Result-Truncated`** — `reportDashboard` yanıtında tanımlı değil; REPORTING-K03'ün gömülü dizileri (`coordinatorship_stats`, `overdue_tasks_list`) de kesip kesmediği yazılsın. Davranış farkı çıkarsa ayrı BE açılır. *(01/yeni-7)*
4. **`listUsers` yalnız şirket yöneticisi** (ORGANIZATION-K33) ve yalnız canlı departmanda ekip satırı olan hesapları döndürdüğü. *(05)*
5. **`istemci-akislari.md` §3/§4 — kullanıcı/hesap/üyelik** işlemleri (rol sütunu, koordinatörün hedef hesap yetkisi ORGANIZATION-K26/K27). *(05/yeni-10; veri gerekirse BE-047)*
6. **§3/§4 — departman/ekip/bağ/koordinatör** işlemleri (oluştur, düzenle, bağla, ad değiştir, bağ kaldır, koordinatör ata/kaldır, üye ekle/çıkar/rol, ekip görme, rapor okuma). *(08/yeni-4)*
7. **§3/§4 — toplantılar** (eylem görünürlüğü, üye görünürlüğü K19/K45, katılımcı ekleme K21); `title` 255, gündem 300 `maxLength`; liste sırası. *(09/yeni-15)*
8. **Not sınırı 5000 rune** — `MeetingNote` şemasında `maxLength`. *(09)*
9. **Departman kodu** — `CreateDepartmentRequest.code`/`UpdateDepartmentRequest.code` için `pattern: ^[A-Z0-9]{2,10}$`, büyük harfe çevirme, boşaltılamama (ORGANIZATION-K10). *(08/yeni-5)*
10. **`archiveAttachments.sort`** — izinli değerler (`name` artan, `size` azalan, boş = `created_at` azalan), varsayılan sıra, `limit` varsayılanı/tavanı. *(06/yeni-8)*
11. **Web uyumluluk politikası** — hangi API/web sürüm çifti uyumlu; `api_version` ana sürüm kapısı dışında kural; ürün minörü ↔ API minörü eşitlenmez. Alan gerekirse BE-037. *(00/yeni-2)*

Ek (Codex §5 K1): nihai hedef `istemci-akislari.md` §4'ün organization, records, reporting ve chat kurallarını da kapsamasıdır; geçişte web, sürümlü modül kural kimliklerini kaynak gösterir.

## 4. Ürün kararı bekleyen kalemler

### 4.1 Kayda girmeyen ÜRÜN kalemleri (Codex §4 "ÜRÜN")

| Kalem | Konu | Codex §6 sorusu |
|---|---|---|
| 00/yeni-1 | Mesajlar rozeti okunmamış sohbet mi mesaj mı (varsayılan sohbet; mesaj seçilirse `unread_messages` açılır) | §4 kararı (doğrudan soru yok; s.25 bağlamı) |
| 03/yeni-3 | "Kopyala" = bağlantı mı görev çoğaltma mı | s.9 |
| 03/yeni-5 | Toplu seçim / toplu işlem | s.9 |
| 03/yeni-4 + BE-006 genişletmesi | Ayrı kanıt işareti, üç zorunluluk bayrağı (TASARIM/ÜRÜN) | s.5 |
| 03c/yeni-4 | Gerçek sezon aralığı (`Program` alanı) | s.12 |
| 08/yeni-6 | Toplu koordinatör atama — atomiklik, kısmi başarı, kota | CX-T-06, s.17–18 |
| 08/yeni-7 | "Sezona kopyala" = yapı kopyası mı görev aktarımı mı | s.18 |
| 08/yeni-9 | `meeting_count` dashboard'da 0 — önce uç bazlı anlam/test talebi | (doğrulama; soru yok) |
| 08/yeni-10 | Üye kendi biriminin ekibini görsün mü | s.17 |
| 06/yeni-11 | "grup" / "çalışma grubu" rozeti anlamı | s.20 |
| 06/yeni-12 | 07 meta satırındaki kişi adları kim | s.20 |
| 10/yeni-2 | "Koordinatörler" sistem grubu | s.25 |
| 10/yeni-5 | Tepki kümesi 4 → 6 (ÜRÜN/TASARIM) | s.25 |
| 10/yeni-6 | Anonim anket | s.25 |
| 10/yeni-10 | Kullanıcının konuşma sabitlemesi | s.25 |
| 10/yeni-11 | Başka hesap gözüyle okuma (MSG-043) | s.24 |
| BE-030 P0 | Audit yetki, kapsam, kategori, saklama, IP | s.27–28 |
| BE-031 yeni-1 | Tablolar kapsam/yaşam döngüsü/ADR | s.29–31 |

### 4.2 Koşullu BE satırlarının beklediği kararlar

BE-006 (s.5) · BE-008 (s.10) · BE-020 (K4/ADR-0024) · BE-022, BE-062 (W7, s.21) · BE-031 (s.29–31) · BE-037 (BE-036 madde 11) · BE-045 (s.14) · BE-046 (s.16) · BE-047 (BE-036 madde 5) · BE-054, BE-055 (s.11) · BE-057, BE-059 (s.12) · BE-058 (§5 K3) · BE-064, BE-066 (s.22) · BE-069, BE-074, BE-075, BE-076 (s.19; BE-076 ayrıca §5 F5) · BE-077 (§4 `06:yeni-6`) · BE-079 (s.7) · BE-092 (s.27–28) · BE-106 (s.31). BE-072 koşullu değildir ama çözüm yolu s.19'a bağlıdır.

### 4.3 Kayda girmeyen "BE değil" kalemleri (Codex kararı)

01/yeni-4 (arşiv sayısı mevcut arşiv yüzünden alınır; optimizasyon) · 03c/yeni-3 (departman adı mevcut sözlükten) · 05/yeni-6 (görev listesine dosya sayısı eklenmez, §7 kararı korunur) · 11/yeni-15 (şablonlar ilk aşamada istemcide) · BE-026'nın tek dosya önizleme kısmı (`downloadFile` + blob ile mümkün).

## 5. Tuvale geri bildirim (TASARIM)

1. Görev durumu 4 değil **5** (`iade_edildi`); 01 kart çubuğu dört dilime beş durum sığdırmasın (01/yeni-1 tasarım kısmı).
2. Sohbet "kilitli kart / n kişi kilitli görür" — paylaşılan özet her üyeye açık (MESSAGING-K31/K32).
3. "Koordinatörler" sistem grubu "hazır gelir" metni (karar çıkana kadar).
4. Tepki seçicisi 6 emoji → sözleşmedeki 4 tür (`like/heart/check/star`).
5. "Tarih yalnız ileri alınabilir" metni — sözleşme geri çekmeye izin verir.
6. Türkçe harfli departman kodları ("İDA", "EĞİ") → ASCII `^[A-Z0-9]{2,10}$` (08/yeni-5).
7. Not sayacı 2000 → 5000.
8. Toplantı "Kişiler" davet modu (`department_ids` ≥1).
9. Arşiv tür segmentinde "PDF" ayrı kategori değil (06/yeni-10).
10. 05 yan panel tek "Kaydet" → çip başına işlem (05/yeni-8).
11. "Kanıt dosyası" ayrı kavram gibi çizilmiş; kural "herhangi uygun dosya" (03/yeni-4).
12. Sayı tutarsızlıkları: 08b 9 kişi / 6 kutu; 06/07 ağaçta 9+8 düğüm, başlıkta 21; 05 rol sayıları toplamı kullanıcı sayısını aşıyor; 01 ↔ 01b tür adları/renkleri; sabit hex renkler (K9).
13. Çizilmemiş pencereler: yeni görev formu, durum menüsü, toplu işlem, yeni koordinatörlük formu, toplantı düzenle/kişi seçici, yükleme penceresi, davet formu, Admin/Üye Gantt yüzleri, K/Ü ana sayfası, 08b ve 05b sekmeleri; dar menüde kapsam kartları.

## 6. Codex'in reddettiği ve kayda alınmayan öneriler (§8)

- "BE-008 kapansın, ana sayfada yok" — 03 ve 03c tuvalinde Hatırlat var; satır açık kaldı.
- "Video uçları var; video işi vazgeçildi" — BE-023 yalnız backend eksiği olarak kapandı; W7 web işi sürüyor.
- "Admin panosu mevcut; tam ana sayfa F1'e alınsın" — teknik olanak faz kapsamını büyütmez (ürün §6 s.7).
- "Her N istek K3'e aykırı" — sayfalama, tek detay, N+1 ve toplu yazma ayrı sorunlar.
- "Admin arşivi için ilk departmanı teknik kapsam seçelim" — K2'yi aşar, S3 yönlendirmesini çözmez (BE-072).
- "`cascade_count=0` ise ters güncelleme güvenli geri alır" — garantili geri alma değil (BE-055 koşullu).
- "200'den sonrası yaklaşık; aramayı daralt" — sayfa tavanı toplam tavanı değil.
- "Eksikteki her satır stub; örnek akış gösterilebilir" — belge/ürün kalemine stub yok; sahte geçmiş yok.
- "Sohbetin kilitli referans kuralını Tablolar'a taşı" — sohbet kuralı öyle çalışmıyor; Tablolar için ayrı karar.
- "Arşiv zenginleştirmesinin tamamı kırıcı değil" — string → nesne kırıcıdır (BE-071 paralel alan).
- "Ürün minörünü API pin minörüyle karşılaştır" — tanımlı eşdeğerlik yok (BE-036 madde 11).
- "Sonnet açık bulgularının tamamı hâlâ açık" — denetim kaydı güncellenmeli, eski bulgu yeniden raporlanmaz.
