# Pin yükseltme planı — v0.15.0-api → hedef

**Durum (2026-11-12): HAZIRLIK; BAŞLATMA KULLANICI ONAYINA BAĞLI.** Bu belge bir başlatma yetkisi değildir; yeni backend etiketinin varlığı pin yükseltme yetkisi sayılmaz. Mevcut pin `api-pin.json` = `v0.15.0-api` (F4 ve F5 boyunca yükseltilmedi). Kalıp: [WEB-4 "Pin aşaması" (WEB-P)](../web-4/ilerleme.md); kaynak envanterleri: [rapor-F4](../../backend-eksikleri/rapor-F4.md) §3 (K79–K84) ve [rapor-F5](../../backend-eksikleri/rapor-F5.md) §3.

## Hedef seçimi

| Seçenek                                   | İçerik                                                                                                                                                                                         | Not                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v0.17.0-api** (yayımlanmış)             | v0.16 toplantı alanları (K79–K84) + v0.17 Tablolar çekirdeği (`/v1/tables…`, ADR-0032; web F5 dışı) + silinen toplantı sırası belgesi                                                         | F4 toplantı "Şimdilik" yollarını kapatır; arşiv ve silinenler eksiklerinin neredeyse hiçbiri kapanmaz (rapor-F5 §3). Tablolar ekranı web'de yok.     |
| **BE-072 paketi sonrası (örn. v0.18)**    | rapor-F5 Paket 6.1–6.2 (+ 6.3–6.7 ve 6.8 hangileri girdiyse)                                                                                                                                  | Yönetici arşiv P33 geçici yolu bu hedefte kalkar. Etiket henüz yok: hedef kullanıcı/koordinatör kararıyla seçilir; etiket çıkınca bu plan yeniden doğrulanır. |

Karar kullanıcıdadır. Yalnız v0.17'ye yükseltmek istenirse WP2 yalnız toplantı grubunu içerir; arşiv/silinenler "Şimdilik" yolları olduğu gibi kalır (envanterde "değişmedi" yazılır).

## Kaldırılacak "Şimdilik" yolları ve açılacak alanlar

**Toplantılar (v0.16, F4 raporu §3 / K79–K84):**

| BE     | Kaldırılacak / değişecek istemci yolu                                                                                    | Açılacak alan / uç                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| BE-021 | Tüm sayfaları yükleyip sekme toplamı/tarih sırası hesaplama (`n+` → kesin)                                               | K79 `when`, `sort`, `total`, `tab_counts` (`deleted` dahil)                                  |
| BE-061 | Yüklenen kümeden not sayaçları                                                                                           | K80 `converted/author` süzgeci, `total/counts`                                               |
| BE-063 | Nötr ad/kod alanları                                                                                                     | K81 `department_code`, `deleted`, `created_by_full_name`, `checked_by_full_name`             |
| BE-065 | Dönüşmüş görev etiketi bağlantısız                                                                                       | K82 `converted_work_item_department_id`                                                      |
| BE-067 | K/ŞY aday kümesi listUsers/listMembers birleşimi + kesilme uyarısı                                                       | K83 `listMeetingParticipantCandidates`                                                       |
| BE-068 | Oluşturma/gündem/katılımcı anahtarsız; belirsiz sonuçta kör tekrar yok                                                   | K84 üç oluşturma ucunda optional `Idempotency-Key`; v0.15 uçlarına şimdiden anahtar eklenmez |

**Silinen kayıtlar (v0.16/v0.17, rapor-F5 §3):** Toplantı sekmesi sayacı `tab_counts.deleted` ile kesinleşir (BE-110 yalnız toplantı için kısmen); `listDeletedMeetings` sırası belgelenmiş (`deleted_at` azalan, `meeting_id`); diğer silinen listeleri, `deleted_records` sayacı ve BE-108/113–119 **değişmedi**. Silinmiş toplantı satırında departman `deleted` bayrağı (K81) sahip koordinatörlük gösterimine yansır.

**Arşiv (BE-072 paketi hedefiyse):**

| BE            | Kaldırılacak istemci yolu                                                                                                                                                                      | Açılacak alan / uç                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| BE-072        | P33 geçici yolu: `listProgramDepartments` adlarından yönetici klasör kartları, `archiveTasks` ∩ `listProgramWorkItems(department_id)` (200 tavan), yalnız görev klasöründe dosya; `ADMIN_FOLDER_LEVEL` stub | Yönetici S2 / `department_id` + klasör süzgeci; yönetici klasör düzeyi "son eklenen" ve arama canlanır |
| BE-120        | `PeriodZipButton` `target` null → devre dışı (`designStub('BE-120')`)                                                                                                                          | `archiveFullZip` yönetici yolu; `/arsiv`'te "Tümünü indir"                  |
| BE-121        | Yükleme seçicisi dosyalı görevlerle sınırlı                                                                                                                                                     | Dosyasız görevleri de döndüren uç/parametre                                 |
| BE-070/071/073 | Tarih `—`, ad yalnız önizlemede, süzgeçli "n+"                                                                                                                                                 | `created_at`, `uploaded_by_full_name`, süzülmüş `total`                     |
| BE-025        | `FOLDER_SUMMARY` stub, `—` sayılar, sıra menüsünde devre dışı seçenekler                                                                                                                       | Klasör özeti alanları                                                       |
| BE-024/074    | Kapalı etiket sözlüğü (istemci), devre dışı "Yeni etiket"/"Etiketi değiştir"                                                                                                                   | Etiket oluşturma/değiştirme sözleşmesi                                      |
| BE-026        | `blob:` tek dosya önizlemesi, ızgarada tür simgesi                                                                                                                                              | Önizleme türevi (CSP `img-src` kararı yeniden değerlendirilir)              |

**Silinenler (BE-108/113–119 paketi hedefe girdiyse):** istemci süzgeçleri ve aralık için otomatik sayfa yükleme, "n+" sayaçları, hesap "—" tarihi, `designStub` BE-108…BE-118 işaretleri, BE-119 kapsam notu.

Her kaldırma, ilgili `designStub` olgusunun ve kayıttaki "Şimdilik" sütununun güncellenmesiyle birlikte yapılır; kayıt durumu yalnız bağlandığında `bağlandı (pin vX.Y.Z-api)` olur.

## WP adımları (WEB-P kalıbı)

| Adım                                  | İş                                                                                                                                                                                                   | Kapı                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| WP0 devralınanlar                     | Codex F5 koşulları, `dogrulama-F5.md` kusurları, rapor-F5 §4 borçları (ekran okuyucu hariç)                                                                                                         | Ayrı PR; kodsuz borçlar belgede kalır                                                                    |
| WP1 envanter + pin                    | Hedef etiket seçimi (kullanıcı), `api-pin.json`, `pnpm gen:api`, `gen:check`, derleme uyumu, BE bazında envanter (WEB-P kalıbı: bağlanan / kısmen / değişmedi) (bağlanan / kısmen / değişmedi); `e2e/backend/up.sh` yeni etiketin Dockerfile'ını denetler | typecheck, lint, test, build, gen:check; yeni etiketin `error-codes.json` farkı i18n anahtar testinde      |
| WP2 modül grupları                    | (a) toplantılar K79–K84; (b) arşiv BE-072 paketi (06/07, yönetici yolu, ZIP, yükleme seçicisi); (c) dosya alanları BE-070/071/073/025; (d) silinenler 12 (BE-108/110/113–119 girdiyse); (e) etiket/önizleme (girdiyse) | Her grup ayrı W/PR; "Şimdilik" yolu kaldırma testi + eski yol yokluğu testi                              |
| WP3 entegrasyon + gerçek imaj         | Gerçek bileşen entegrasyon senaryoları (yönetici üç rol, departman seçmeden klasör, kapsam dışı erişim kapalı), Docker web imajı + yeni etiketli backend, 390/1024/1440 × iki tema, G4 429          | `dogrulama-pin-<hedef>.md`; taşma/CSP/pageerror 0                                                         |
| WP4 Codex                             | gpt-6.1-sol medium `-s read-only`, ilk eylem HEAD, araç izi; sınıf soruları: yaşam döngüsü, kapsam sızıntısı (yönetici), idempotency                                                                | `docs/reviews/WEB-P2-codex.md` benzeri; KOŞULLU ise koşullar kapatılır; kapanış PR MERGED                 |

## Başlatma koşulları

1. Kullanıcı açık onayı ve **hedef etiketin** seçimi.
2. F5 kapanmış olmalı (Codex hükmü ve kapanış PR'ı MERGED); F6'yı açmaz ve F6'dan önce yapılması zorunlu değildir.
3. Hedef etiket için backend paket kapısı (OpenAPI, `error-codes.json`, README sürüm ilkesi) ve etiketin uzakta doğrulanması.
4. Geri dönüş: pin geri alma `api-pin.json` + `pnpm gen:api` ile yapılır; kaldırılan "Şimdilik" yolları WP2 testleriyle sabitlenir (kısmi pin yükseltmesi yapılmaz).
