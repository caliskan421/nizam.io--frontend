# 03 — Mekanizma (nasıl davranıyor)

Öğe kimlikleri `ozellikler.md` ile aynıdır. Uç adları ve alanlar `backend.md`'de kesinleşir; burada yalnız davranış ve veri ihtiyacı yazılır.

## 1. Giriş ve gezinme

- **Giriş:** kenar menüsü "Görevler" (E-03-01, `00-ortak`); üst çubuk kırıntısı; derin bağlantı `/gorevler?...`; Görünüm seçicide "Liste" (03c'den dönüş, E-03-05); **Varsayım:** ana sayfa (01) kartlarından süzgeç önceden kurulmuş bağlantı ("Geciken", "Onay bekleyen" gibi) gelir (doğrulanacak: tasarım tuvali `Main.dc.html` — `01-ana-sayfa` grubu).
- **Çıkışlar:**
  - E-03-05 "Zaman çizelgesi" → `/zaman-cizelgesi` (grup `03c-zaman-cizelgesi`). **Varsayım:** kapsam aynen korunur; liste süzgeçleri taşınmaz (03c'nin kendi süzgeçleri var); geri dönüşte liste URL'si tarayıcı geçmişinden gelir (doğrulanacak: `03c-zaman-cizelgesi/mekanizma.md` §1 + rota kataloğu, K10).
  - E-03-14 "Talepleri incele" → hedef çizilmemiş. **Varsayım:** tarih talebi onay akışı F3'te (`03c`); F1'de ya E-03-09 süzgecini açar ya statik/devre dışı (K13) (doğrulanacak: ürün sahibi sorusu / koordinatör faz kararı, K4).
  - E-03-19 görev başlığı → aynı sayfada ayrıntı paneli (URL `gorev=‹id›`), satır `rp-sel` olur.
  - E-03-32 alt görev başlığı → "Görev detayında aç"; **Varsayım:** üst görevin panelini "Alt görevler" sekmesinde açar (doğrulanacak: ürün sahibi sorusu, `ozellikler.md` §7-17).
  - E-03-42 "Tam sayfada aç" → görev tam sayfa rotası — **Varsayım:** `/gorevler/:id` (doğrulanacak: rota kataloğu K10 + ürün sahibi sorusu, `ozellikler.md` §7-10); tasarım yok — v1'de gizlenebilir ya da panel içeriğini tam genişlikte gösteren rota.
  - E-03-50 "Kanıt dosyası" bağlantısı → Arşivde görev klasörü (06/07, F5, v1 dışı) → F1'de statik/devre dışı (K13, kayda koordinatör işler).
  - E-03-43 "Paneli kapat" → `gorev` parametresi silinir; **Varsayım:** panel kapalıyken `rp-col` tam genişliğe yayılır (doğrulanacak: tasarım tuvali — kapalı hâl çizilmemiş).
- **URL'de taşınan durum (K10):** durum sekmesi, tarih talebi süzgeci, arama metni, kişi, koordinatörlük, sıralama (sütun+yön), sayfa/imleç, açık görev. Panel sekmesi (Özet/Alt görevler/…) — **Varsayım:** URL'de değil, bellekte (doğrulanacak: rota kataloğu kararı, K10).

## 2. Kapsam ve rol etkisi (K1, K2)

- **Kapsam:** program zorunlu (kenar menüsü Program kartı, `00-ortak`). Admin merceği → departmansız program kapsamı, tüm departmanların görevleri tek uçtan; Koordinatör/Üye merceği → seçili birim. Satır kümesi tek `listProgramWorkItems` çağrısından gelir (K3), departman süzgeci `department_id`; **departman başına ayrı istek atılmaz** (fan-out yasağı).
- **Koordinatörlük süzgeci (E-03-12):** Admin merceğinde anlamlı; Koordinatör/Üye merceğinde kapsam zaten tek birimse gizli ya da tek değerle kilitli olmalı — **Varsayım** (doğrulanacak: `istemci-akislari.md` §2 kapsam kuralları + ürün sahibi sorusu). Çoklu seçim tasarımı K3 ile çelişir (`ozellikler.md` §7-1): tek değer sunucuya, çoklu ise yalnız yüklenmiş satırlar üstünde istemci süzmesi.
- **Kişi süzgeci (E-03-11):** K3 "Üye merceğinde bana atananlar süzgeci istemcide" der; keyfi kişi süzgecinin sunucu karşılığı **yok** (`listProgramWorkItems` yalnız `department_id` alır; yeni-1) → istemci süzmesi.
- **Eylem görünürlüğü:** "Yeni görev", alt görev ekle/sil/düzenle, zorunlu alan bayrakları, durum seçici, kanıt yükle, hatırlat, tarih değişikliği iste, kopyala, görevi sil, "Talepleri incele", toplu seçim — hepsi işlem bazında `istemci-akislari.md` §4 tablosundan, modülün `capabilities.ts` dosyasında hesaplanır (K1). Rol dizesi karşılaştırması yapılmaz. **Varsayım:** yetkisiz eylem düğmesi gizlenir, devre dışı bırakılmaz (doğrulanacak: `istemci-akislari.md` §4 + ürün sahibi sorusu); BE kaynaklı eksik eylem ise devre dışı + `designStub`.
- **Kapsam değişince:** eski kapsamın sorguları iptal, liste boşalır, açık panel kapanır, sayfa/imleç sıfırlanır; süzgeçlerden kapsam dışı kalan (koordinatörlük, kişi) temizlenir. **Varsayım:** arama metni ve durum sekmesi korunur (doğrulanacak: ürün sahibi sorusu).
- **Yetki kaybı (K6):** 403/404 kapsam hatasında `me` + `me/departments` geçersizlenir, kapsam yeniden doğrulanır.

## 3. Durum makinesi

| Durum | Yer | Varsayılan | Not |
|---|---|---|---|
| Durum sekmesi (E-03-07) | URL | Tümü | tek seçim |
| Tarih talebi süzgeci (E-03-09) | URL | kapalı | **Varsayım:** sekmeyle VE (doğrulanacak: ürün sahibi sorusu) |
| Arama (E-03-10) | URL (gecikmeli yazım; **Varsayım:** ~300 ms (doğrulanacak: F1 uygulama kalibrasyonu)) | boş | |
| Kişi / Koordinatörlük (E-03-11/12) | URL | boş | kapsam değişince temizlenir |
| Sıralama (E-03-16) | URL | bilinmiyor; **Varsayım:** bitiş artan (doğrulanacak: ürün sahibi sorusu; sunucu sıralaması yok, `eksikler.md` yeni-2) | **Varsayım:** sütun başına artan → azalan → varsayılan döngüsü (doğrulanacak: tasarım tuvali — yön göstergesi çizilmemiş, `ozellikler.md` §7-7) |
| Sayfa / imleç (E-03-39) | URL | 1 / ilk | süzgeç, sekme, arama, sıralama değişince sıfırlanır |
| Açık görev (E-03-28/41) | URL `gorev` | yok | |
| Panel sekmesi (E-03-45) | bellek | Özet | **Varsayım:** görev değişince Özet'e döner (doğrulanacak: ürün sahibi sorusu) |
| Açık alt görev blokları (E-03-21) | bellek | hiçbiri | tasarımda bir satır açık; birden çok satır aynı anda açılabilir mi bilinmiyor; **Varsayım:** evet, bağımsız (doğrulanacak: tasarım tuvali / ürün sahibi sorusu) |
| Satır seçimleri (E-03-15/18) | bellek | boş | **Varsayım:** sayfa/süzgeç değişince temizlenir (doğrulanacak: ürün sahibi sorusu — toplu işlem kapsamı, `ozellikler.md` §7-6) |
| Alt görev taslağı (E-03-37) | bellek, satır başına | boş | "Ekle" görünürlüğü taslağa bağlı |
| Açık açılır (tarih E-03-34, menü E-03-36, süzgeç) | bellek | yok | **Varsayım:** aynı anda tek açılır (doğrulanacak: tasarım tuvali) |

Hatırlanan (yerel depolama) durum yok — K2 istisnası yalnız kapsam kimlikleri + tema.

## 4. Etkileşim akışları

Tüm yazmalar `shared/http/mutation` üzerinden (K5): görev/alt görev revizyonu `expected_revision`, tarih alanları için `expected_dates_revision` (varsa), `Idempotency-Key` (aynı gövde = aynı anahtar; **yalnız** `createWorkItem`, `createWorkItemSubtask`, `attachFile`, `addWorkItemNote` ister — durum geçişi, görev/alt görev düzenleme, silme, atama, `requestDateChange` anahtar almaz; bu uçlarda sonuç bilinmiyorsa görev yeniden okunur), 409 `*.edit_conflict` → alan alan seçim, `platform.conflict_retry` tek tekrar, 429 `Retry-After` (otomatik tekrar yok), sonuç bilinmiyor → taslak + anahtar korunur, 409 `organization.confirmation_required` ortak diyaloğu (K5) bu ekranın uçlarında **yoktur** (yalnız üyelik/koordinatör kaldırma uçları, F2); silme onayı istemci diyaloğudur (§4-14). Başarıda **iyimser güncelleme yapılmaz** (`istemci-akislari.md` §8): etkilenen görev `getWorkItem` ile, liste yeniden okunur. Başarıda: liste sorgusu + (açıksa) ayrıntı sorgusu + etkilenen sayaçlar yenilenir. Hangi uçların hangi alanı taşıdığı `backend.md`.

1. **Durum geçişi (E-03-44 → E-03-58):** seçici açılır → yalnız `istemci-akislari.md` §5'teki geçerli hedef durumlar listelenir (tasarım geçiş kümesini göstermez; yalnız "Devam ediyor" hâli çizili) → seçim → (gerekiyorsa ek alan: `tamamlandi → devam_ediyor` geri almada `reason` zorunlu, en az 3 bayt) → `transitionWorkItem` → başarıda görev ve liste yeniden okunur. Açık alt görev varsa sunucu 409 `work.subtasks_open` döner; istemci "Açık alt görevler kapatılsın mı?" diye sorar, onaylanırsa **aynı isteği** `close_subtasks: true` ile yeniden gönderir (açık alt görevler aynı işlemde kapanır; yalnız `to=tamamlandi`) — hedefi devre dışı bırakmak gerekmez (`istemci-akislari.md` §7). Kanıt kuralı **görev düzeyindedir**: `completion_evidence_required` açıkken onaya sunma/tamamlama/onay en az bir dosya ister, yoksa 422 `work.attachment_required` → "Önce kanıt dosyası yükleyin" + yükle eylemi (E-03-52).
2. **Yeni görev (E-03-06 → E-03-57):** form tasarımda yok. K11: vee-validate + zod ilk karmaşık form burada. **Varsayım:** alanlar başlık, koordinatörlük (kapsamdan önseçili), atanan, tarih aralığı, kanıt zorunlu bayrağı (doğrulanacak: openapi `createWorkItem` istek gövdesi, `backend.md` §2). Yönetici `addAssignments` yapamaz (§4 s.140 yalnız koordinatör); yönetici merceğinde formda tek atama alanı. Başarıda liste yenilenir; **Varsayım:** yeni görev panelde açılır (doğrulanacak: ürün sahibi sorusu). `Idempotency-Key` kullanıcı eylemi (Gönder) başına üretilir, form açılışında değil; ağ tekrarında aynı anahtar + aynı gövde, düzeltip yeniden gönderme yeni anahtar (CX-S-02, `ortak-kurallar.md` §7). Çoklu atamada `addAssignments` başarısız olursa ilk `createWorkItem` isteğindeki atanan korunur; kısmi başarı metni ilk yanıta göre yazılır ("görev oluşturuldu, ek atama yapılamadı", CX-S-03).
3. **Alt görev ekle (E-03-37):** başlık yaz → Enter ya da "Ekle" → boş/yalnız boşluk reddedilir → istek → başarıda taslak temizlenir, giriş odakta kalır, sayaç ("‹t›/‹n›", E-03-21/30, E-03-45) güncellenir. Sonuç bilinmiyorsa taslak korunur.
4. **Alt görev tamamla (E-03-31):** kutu → istek (iyimser güncelleme **yapılmaz**, `istemci-akislari.md` §8: istek bitince görev ve alt görevler yeniden okunur; bu yüzden kutu istek sürerken bekleme durumunda gösterilir) → başarıda üstü çizili + `opacity`; tüm alt görevler bitince E-03-21 vurgu rengine döner. İstek `updateWorkItemSubtask` `{done}` (bu gövdede `expected_revision` gerekmez). Alt görev düzeyinde kanıt kuralı sözleşmede **yoktur** (kanıt kuralı görev düzeyinde, §4-1; BE-006); E-03-30 metnindeki "kanıtı zorunlu alt görev" kuralı sunucuda uygulanmaz.
5. **Alt görev kişi ata (E-03-33):** yerel `select` değişimi → istek. Seçenek kümesi yalnız **ana göreve atanmış** hesaplardır (`assignees[]`); başkası gönderilirse 422 `work.subtask_assignee_not_assigned`. Departman üyeleri listelenmez, ek uç gerekmez.
6. **Alt görev tarih (E-03-34):** açılır → başlangıç/bitiş (bitiş ≥ başlangıç, `min` ile) → "Tamam" kaydeder ve kapatır; "Tarihi kaldır" iki tarihi boşaltır. **Varsayım:** değer değişiminde değil "Tamam"da istek atılır (doğrulanacak: tasarım tuvali / ürün sahibi sorusu). Üst görev aralığına sınır doğrulaması: ADR-0024 / BE-020 ile ilişkili, bu ekranda bilinmiyor.
7. **Alt görev kanıt (E-03-35):** "Kanıt yükle" → dosya seçici → yükleme. Alt görev başına kanıt BE-006 → F1'de K13 statik/devre dışı.
8. **Zorunlu alan bayrakları (E-03-36 menüsü):** onay kutusu değişimi → istek → ilgili yuvada "*" ve eksik vurgusu. Kişi/tarih/kanıt bayraklarının backend karşılığı bilinmiyor (kanıt için BE-006).
9. **Alt görevi sil (E-03-36):** menü öğesi → onay (çizilmemiş, E-03-64) → istek → sayaçlar yenilenir.
10. **Kanıt dosyası yükle — görev (E-03-52):** dosya seçici → yükleme → E-03-50 "Yok" yerine dosya bilgisi, "Dosyalar" sayacı (E-03-45) artar. Yükleme görev durumunu **değiştirmez**: `attachFile` yanıtı yalnız `FileRecord`; durum yalnız `transitionWorkItem`/`ownStatusWorkItem` ile geçer (01 Ana sayfadaki "Kanıt yüklendi, onay sırasında" notu bu ekranda otomatik geçiş anlamına gelmez). Yükleme doğrudan `multipart/form-data` (`attachFile`, bilet akışı yok); `tag` zorunlu (`backend.md` §2).
11. **Atanana hatırlat (E-03-53):** uç yok (BE-008) → devre dışı + `designStub('BE-008', …)`.
12. **Tarih değişikliği iste (E-03-54 → E-03-63):** form çizilmemiş; **Varsayım:** alanlar yeni bitiş (+ gerekçe) (doğrulanacak: openapi `requestDateChange` istek gövdesi). Başarıda satırda E-03-26 etiketi, bantta E-03-13 sayısı. F1 mi F3 mü (K4 tarih talepleri F3) — koordinatör kararı; F1'de devre dışı olabilir.
13. **Kopyala (E-03-55):** anlam belirsiz (`ozellikler.md` §7-12); bağlantı kopyalamaysa istek yok, `rp-toast` ile bildirim; görevi çoğaltmaysa yazma isteği.
14. **Görevi sil (E-03-56):** istemci onay diyaloğu (`deleteWorkItem` `confirmation_required` döndürmez; onay yalnız istemcidedir) → `deleteWorkItem`. Başarıda panel kapanır, liste yeniden okunur.
15. **Toplu işlemler (E-03-59):** çizilmemiş; kutular seçim tutar ama eylem yok. **Varsayım:** v1'de seçim kutuları gizli ya da etkisiz (doğrulanacak: ürün sahibi sorusu; toplu işlem ucu sözleşmede yok, `dogrulama.md` B-20).

## 5. Liste davranışı

- **Kaynak:** tek uç `listProgramWorkItems` (K3). Tasarım sayfa numaralı (sayfa başına 10, toplam, son sayfa numarası); sözleşme imleçli + 200 tavan, toplam/sayaç yok (BE-003). Şimdilik (kayıttaki karar): yüklenen satırlardan istemcide sayım + "daha fazla yükle". Görsel uyarlama (`t-pages` yerine "daha fazla yükle" mi, yüklenmiş küme üstünde 10'luk istemci sayfası mı) koordinatör/ürün sahibi kararı; E-03-38 toplamı bilinmediğinde "‹n›+ görev" gibi yaklaşık gösterim gerekebilir — **Varsayım** (doğrulanacak: ürün sahibi sorusu, BE-003).
- **Durum sekmeleri:** sunucu durum süzgeci yok (BE-003) → istemcide yüklenmiş satır süzmesi; sayaçlar yüklenmiş kümeden, 200 tavanında eksik olabilir. "Geciken" = sunucu bayrağı `is_overdue == true` (açık görevde `today > end_on`; tamamlanmışta hep false) — istemci tarih hesabı yapmaz; durumla kesişir. "Onay bekleyen" = `onaya_sunuldu`. Durum kümesi beş değerdir: `baslanmadi`, `devam_ediyor`, `onaya_sunuldu`, `iade_edildi`, `tamamlandi`; `iade_edildi` için sekme yoktur (yalnız "Tümü", satırda "Geri gönderildi" `rp-dot--back`; ayrı sekme ürün sorusu).
- **Tarih talebi süzgeci/bandı:** bekleyen talep her satırda `pending_date_request{request_id, new_start_on, new_end_on}` \| `null` olarak **aynı listede** gelir (ek istek yok; talep uçlarıyla birleştirme yasak). Üyede hep `null` → band/süzgeç üyede gizli. **Varsayım:** band yalnız sayı > 0 iken görünür (doğrulanacak: tasarım tuvali — boş hâl çizilmemiş).
- **Arama:** sunucu araması yok (BE-004) → yüklenmiş satırlarda başlık, kısa kod, kişi adı; Türkçe büyük/küçük harf katlama (GAP-036) istemcide `tr` yerel ayarıyla.
- **Süzgeçler:** koordinatörlük → sunucu `department_id` (tek değer); kişi → istemci. **Varsayım:** istemci süzmesi (doğrulanacak: openapi `listProgramWorkItems` parametreleri — kişi süzgeci yok, `eksikler.md` yeni-1).
- **Sıralama:** `listProgramWorkItems`'ta sıralama parametresi **yok** (sunucu sırası sabit `(created_at, id)` artan; yeni-2) → yalnız yüklenmiş kümede istemci sıralaması.
- **Satır başına türetilenler:** gecikme (E-03-25) sunucudan `is_overdue`/`days_overdue` (tamamlanmışta `days_late`/`days_early`); yalnız "‹n› gün kaldı" istemcide (`end_on − bugün`), alt görev "‹t›/‹n›" (E-03-21) liste yanıtındaki `subtask_counts{total, done}`'dan — satır başına ek istek **gerekmez ve atılmaz**, kısa kod (BE-005), avatar baş harfleri (Türkçe büyük harf).
- **Alt satır (E-03-04):** görev sayısı yüklenmiş kümeden; koordinatörlük = süzgeç seçenek listesinin uzunluğu, kişi = yüklenmiş `assignees[]` tekil sayısı (`backend.md` §1, yaklaşık; BE-003).

## 6. Boş / yükleniyor / hata durumları

Tasarımda hiçbiri yok — K7 varsayılanları:
- **Program yok:** yönetici → "Program oluştur"; diğerleri bilgi metni.
- **`membership_required`:** "Departman ataması bekleniyor" (metin istemcide).
- **Programa departman katılmamış:** yönetici → "Departman ekle".
- **Liste boş (kapsamda hiç görev yok):** `rp-empty` bloğu + (yetkiliyse) "Yeni görev". Metin tasarımda yok.
- **Süzgeç sonucu boş:** `rp-empty` + "süzgeçleri temizle" — **Varsayım** (doğrulanacak: tasarım tuvali — boş hâl çizilmemiş).
- **Yükleniyor:** **Varsayım:** iskelet satırlar (10 satır, 64 px) ve panel için iskelet (doğrulanacak: tasarım tuvali — yükleniyor hâli çizilmemiş).
- **Hata:** genel hata kutusu + yeniden dene; 403/404 kapsam hataları K6 akışı.
- **200 tavanı:** yüklenmiş küme tavana ulaşınca sayaçların yaklaşık olduğu belirtilmeli — **Varsayım:** K4'teki Gantt uyarısının liste karşılığı (doğrulanacak: ürün sahibi sorusu, BE-003).
- **Panel:** görev bulunamazsa (silinmiş/kapsam dışı) panel kapanır + bildirim — **Varsayım** (doğrulanacak: openapi `getWorkItem` 404 `work.item_not_found` yanıtı + ürün sahibi sorusu).

## 7. Öğe → davranış tablosu

| Kimlik | Öğe | Olay | Davranış | Bağ |
|---|---|---|---|---|
| E-03-01/02 | Kabuk | — | `00-ortak` | §8 |
| E-03-04 | Alt satır sayıları | yükleme | türetilmiş sayılar | §5, BE-003 |
| E-03-05 | Görünüm seçici | tık "Zaman çizelgesi" | `/zaman-cizelgesi`'ne geç | §1, 03c |
| E-03-06 | Yeni görev | tık | form aç (E-03-57) | §4-2, K11 |
| E-03-07/08 | Durum sekmeleri + sayaçlar | tık | URL `durum`, sayfa sıfır, istemci süzme | §3, §5, BE-003 |
| E-03-09 | Tarih talebi süzgeci | tık | aç/kapa, URL `talep` | §5 |
| E-03-10 | Arama | yazım | gecikmeli URL `q`, istemci arama | §5, BE-004 |
| E-03-11 | Kişi süzgeci | tık → seçim | URL `kisi`, istemci süzme | §2, §5 |
| E-03-12 | Koordinatörlük süzgeci | tık → seçim | URL `koordinatorluk`, sunucu `department_id` | §2, K3 |
| E-03-13 | Talep bandı | yükleme | sayı > 0 ise görünür | §5 |
| E-03-14 | Talepleri incele | tık | hedef belirsiz (F3 / süzgeç / devre dışı) | §1 |
| E-03-15 | Tümünü seç | değişim | görünen satırları seç | §4-15 |
| E-03-16 | Sıralama | tık | URL `sirala` döngüsü | §3, §5 |
| E-03-18 | Satır seçimi | değişim | seçim kümesi | §4-15 |
| E-03-19 | Görev başlığı | tık | panel aç, URL `gorev` | §1 |
| E-03-20 | Kısa kod | — | gösterim | BE-005 |
| E-03-21 | Alt görev açma | tık | satır altı bloğu aç/kapa | §3 |
| E-03-22–27 | Satır alanları | — | gösterim / türetme | §5 |
| E-03-26 | Talep etiketi | hover | `title` ipucu | — |
| E-03-27 | Avatar | hover/odak | tam ad ipucu | — |
| E-03-28 | Seçili satır | panel açık | vurgu | §1 |
| E-03-29 | Öncelik | — | gösterilmez | `ozellikler.md` §7-4 |
| E-03-31 | Alt görev tamamla | değişim | yazma | §4-4 |
| E-03-32 | Alt görev başlığı | tık | panel / alt görevler sekmesi | §1 |
| E-03-33 | Kişi yuvası | değişim | yazma | §4-5 |
| E-03-34 | Tarih yuvası | tık → Tamam / Tarihi kaldır | yazma | §4-6 |
| E-03-35 | Kanıt yuvası | tık | yükleme (BE-006) | §4-7 |
| E-03-36 | Alt görev menüsü | bayrak / sil | yazma | §4-8, §4-9 |
| E-03-37 | Alt görev ekle | Enter / Ekle | yazma | §4-3 |
| E-03-38–40 | Sayfalayıcı | tık | sayfa/imleç değişimi | §5, BE-003 |
| E-03-42 | Tam sayfada aç | tık | görev tam sayfa (tasarım yok) | §1 |
| E-03-43 | Paneli kapat | tık | URL `gorev` silinir | §1 |
| E-03-44 | Durum seçici | tık → seçim | geçiş (`istemci-akislari.md` §5) | §4-1 |
| E-03-45 | Panel sekmeleri | tık | sekme değişimi (bellek) | §3 |
| E-03-46–49 | Özet alanları | — | gösterim | — |
| E-03-50 | Kanıt dosyası bağlantısı | tık | Arşiv klasörü (F5, v1 dışı → statik) | §1 |
| E-03-51 | İlerleme çizgisi | — | tarih alanlarından türetilmiş kısa çizgi | BE-007 |
| E-03-52 | Kanıt yükle | tık | yükleme | §4-10 |
| E-03-53 | Hatırlat | tık | devre dışı | BE-008 |
| E-03-54 | Tarih değişikliği iste | tık | form (E-03-63) | §4-12 |
| E-03-55 | Kopyala | tık | belirsiz | §4-13 |
| E-03-56 | Görevi sil | tık | onay + yazma | §4-14 |
| E-03-57–64 | Çizilmemiş öğeler | — | `ozellikler.md` §2.11 | §4 |

## 8. Bağımlılıklar

- **`00-ortak`:** kenar menüsü (etkin "Görevler"), Kenar-Secici kapsam kartları (program/rol/koordinatörlük — liste kapsamı buradan), üst çubuk (kırıntı, tema, bildirim), ortak etkili işlem onayı diyaloğu, K7 açık durum ekranları, `rp-toast`.
- **`03c-zaman-cizelgesi`:** Görünüm seçici (E-03-05) her iki ekranda ortak bileşen; "Yeni görev" düğmesi ve formu iki ekranda aynı (paylaşılan bileşen); tarih değişikliği talebi formu/onayı (E-03-14, E-03-54, E-03-63) büyük olasılıkla 03c ile paylaşılır.
- **`01-ana-sayfa`:** hatırlat (BE-008) aynı eylem; ana sayfa kartlarından süzgeçli liste bağlantıları — **Varsayım** (doğrulanacak: tasarım tuvali `Main.dc.html`, `01-ana-sayfa` grubu).
- **`06-arsiv` (F5):** kanıt dosyası klasör bağlantısı (E-03-50).
- **Paylaşılan durum:** seçili program/departman (kapsam deposu), tema. Sorgu anahtarları `scopedKey()` ile kapsam bağlı.
- **Sözleşme:** `istemci-akislari.md` §4 (eylem görünürlüğü), §5 (durum geçişleri), §8 (yazma/çakışma).
