# F8 yerel doğrulama — W178

**Durum: gerçek ortam kanıtı alındı; 5 kusur (2 orta, 3 düşük), 2 yeni eksik önerisi, bir tasarım farkı listesi aşağıda.** Gerçek Docker web imajı (repo Dockerfile'ı, `b9aab8c`) + üretim Caddy CSP + backend'in kenar Caddy yapılandırmasının türevi + etiketten derlenen gerçek backend (`v0.23.0-api`) + gerçek Chromium (Playwright) ile arşiv/ZIP, raporlar, K1/Ü1 + görev kodu, silinenler, toplantı/organizasyon ve F7 sohbet regresyonu koşuldu. Kod değişikliği yok. P76 hızlı mod: matris kısaltıldı (aşağıda "Matris"). Gerçek VoiceOver turu, kullanıcı görsel onayı ve ölçülü piksel karşılaştırması **YAPILMADI**.

> **Koordinatör düzeltmesi (2026-11-16, Codex tur 1 CX-F8-K-01; W178 ajanı kapandığı için W177 işledi):** satır 61 ve 70'teki "11× `reporting.export_in_progress`" ve "9× `organization.export_in_progress`" iddiaları ham kanıtla uyuşmuyordu. Ham: `.git/koordinator/web8-w178/results-silinenler.json:118–122` → 12× `platform.rate_limited` (`Retry-After: 60`); `results-toplanti-organizasyon.json:134–138` → 16× `platform.rate_limited` (`Retry-After: 60`). Sayılar ham kayda göre yazıldı. **Modüle özgü canlı kota tanığı (`reporting.export_in_progress`, `organization.export_in_progress`) doğrulanmadı;** genel hız kovası tetiklendi. CSV indirmeleri ayrı UI JSON'larıyla (`results-ui-silinenler.json`, `results-ui-kullanici-gorev.json`) doğrulandı (CSV'nin çalışmadığı sonucu çıkmaz). Borç: hedefli gerçek backend kota koşumu ([web-8 ilerleme #36](ilerleme.md)).

## Kaynak, imaj ve ortam

- Test edilen kaynak: dal `web8/o4-w178`, main `b9aab8c` (W176 birleşik, PR #164). Kanıt dosyalarındaki `head` alanı bu kod `HEAD`'idir.
- Backend yalnız `git archive v0.23.0-api` (commit `f51840d2…`), imaj `sha256:f1ca1e63…1896`; web imajı `sha256:3f71bfe5…b904`; `postgres:16` (digest pinli). Docker proje adı `nizamio_web8_w178` (`e2e/backend/up.sh` + `names.sh` env'i: portlar 28781/28782/28783; kenar `http://localhost:38782`). Kaynaklar `nizamio_web8_w178-{db-1,server,server-shortttl,web,edge}`, ağ `nizamio_web8_w178_default`, imajlar `nizamio_web8_w178/backend:v0.23.0-api` ve `nizamio-web8-w178/web:b9aab8c`.
- `deploy/check-image.sh` **GEÇTİ** (uid 65532, salt okunur kök, `--cap-drop ALL`, `no-new-privileges`, nonce başlık = meta ve istek başına farklı, `unsafe-*` yok, belge `no-store`, parmak izli varlık `immutable`, eksik varlık 404, imajda kaynak/node_modules/.env yok). Çalışan web konteyneri `ReadonlyRootfs=true`, `CapDrop=[ALL]`, `no-new-privileges`.
- Kenar: W162 kalıbıyla backend `build/Caddyfile`'ının türevi (`tls`/LiveKit/güvenilir vekil çıkarıldı, `http://:8080`); web CSP'si kenardan geçerken değişmedi (`script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'nonce-…'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'`).
- Backend ortamı: `NIZAMIO_ENV=test`, sahte merkez; `NIZAMIO_RECORDS_EXPORT_PER_MINUTE=30` (up.sh); server deposu **kalıcı hacimli** (`/tmp/nizamio-storage` → `/private/tmp/nizamio_web8_w178/storage`; ilk koşumda sunucu kapsayıcısını yeniden başlatmak yüklenen dosyaları sildi, ortam yeniden kuruldu). Tohum (yalnız API; yazma hız sınırı tohum süresince yükseltildi, kanıt koşumlarında varsayılan 60/dk): **ana program** — 3 departman (MEK/YAZ/ELK), ŞY + 2 koordinatör + 3 üye, 8 görev (kod `MEK-1…`; iade gerekçeli/gerekçesiz, onaya sunulmuş, tamamlanmış, geciken), PNG/PDF dosyalar (etiket kümesi `ister/plan/girdi/analiz/cikti/sonuc`), 3 tarih talebi (onaylı/reddedilen/bekleyen), 3 toplantı + notlar, 6 silinmiş görev (2'sinin dosyası var) + 1 silinmiş toplantı, sohbet grubu; **büyük program** — 42 koordinatörlük, 70 görev, 2100 dosya (>2000 kesme eşiği).
- Betikler ve ham sonuçlar `.git/koordinator/web8-w178/` ("Kalıcı kanıt"). KESİN 33: her senaryo kendi `results-<senaryo>.json` dosyasındadır, `head` ve `run` taşır; hiçbiri başka koşumla üzerine yazılmadı.

## Matris (P76)

| Kalem | Koşum | Sonuç |
|---|---|---|
| ŞY × 390/1440 × koyu: pano, görevler, görev paneli, zaman çizelgesi, arşiv, arşiv klasörü, dönem raporu, toplantılar, toplantı, toplantı raporu, silinenler, kullanıcılar, koordinatörlükler, mesajlar | 28 görünüm | yatay taşma **0** (tek istisna KUSUR 1), CSP ihlali **0**, `pageerror` **0**, konsol hatası **0**, 4xx/5xx **0** |
| ŞY × 1440 × açık: arşiv, silinenler, toplantılar | 3 görünüm | taşma 0, CSP 0, gövde yazı tipi Inter, `data-theme=light` |
| K, Ü × 1440 × koyu: pano (K1/Ü1), arşiv, dönem raporu, silinenler, kullanıcılar, toplantı raporu; K1/Ü1 390 | 14 görünüm | taşma 0, CSP 0, `pageerror` 0 (yetki sonuçları aşağıda) |
| 390 gerçek dokunma: dönem ZIP onayı, bölüm seçimi, silinenler toplu geri yükle, toplantı katılımcı seçici | 4 etkileşim | hepsi tamam; pencereler görünüm alanı içinde; taşma 0, CSP 0 |

Konsol listesi (bütün koşumlar): hata 0, başarısız yanıt 0 (`results-konsol-*`, `results-ui-konsol-*`); beklenen 401 yenileme çağrısı süzüldü. Ham: `results-matris-admin.json`, `results-matris-ku.json` (+ ~60 `shot-*.png`).

## 1. Arşiv / ZIP (`results-arsiv-zip.json`, `results-ui-arsiv-zip-rapor.json`, `results-ui-arsiv-liste.json`, `results-ui-buyuk-program.json`)

- **S2 listeleri (ŞY):** `programArchiveFolders/Attachments/Tasks/Uploaders` 200; klasör `file_count/task_count/total_bytes/last_uploaded_at` + `totals`; arşiv liste imleci (`next_cursor`, `total`) çalışır. Arayüz: klasör ızgarası gerçek sayılarla; "Sırala: Son yükleme" **etkin ve doğru** (en yeni önce); klasörsüz arama `programArchiveAttachments?search=olcum&limit=50` (tek sonuç, `olcum-1.png`); eski P33 yolu çağrılmadı.
- **Satır S3 indirme (bilet, kenar):** `POST /v1/download-tickets` 201 → `GET /v1/downloads/{ticket}` 200, `application/pdf`, `Content-Disposition: attachment; filename="rapor.pdf"; filename*=UTF-8''rapor.pdf`, `Content-Length` = kayıtlı boyut (592), `Cache-Control: no-store`; bayt eşit. (Arayüzden tek satır indirme düğmesi bu koşumda tıklanmadı: görev klasörü sayfasında satırlar önizleme açar; indirme W176 e2e'sinde var.)
- **Dönem ZIP `include_reports=true` (gerçek içerik):** 12 girdi; kök `W178 Dönem …-Donem-Arsivi-2026-11-16/`; `00-Genel/Donem-Raporu.pdf` (13 sayfa), `01-Elektronik …/Koordinatorluk-Raporu.pdf`, `02-Mekanik …`, `03-Yazılım …` (ada göre NN-), her birinin `Dosyalar/<görev>/<dosya>` altında dosyaları, `EKSIK-DOSYALAR.txt`; `X-Result-Truncated` yok; `Content-Type: application/zip`; arayüzden `.zip` inen aynı içerik (12 girdi, 3 birim raporu) 1440 ve **390'da gerçek tıklamayla**. `include_reports` yok/false → eski düzen (8 girdi, PDF yok); `department_id` ile klasör ZIP'i (4 dosya); `include_reports=true&department_id=…` **422** `records.input_invalid` (alan `department_id`); `include_reports=evet` **422** (alan `include_reports`).
- **Kesme (büyük program, 42 koordinatörlük, 2100 dosya):** ZIP 200, `X-Result-Truncated: true`, 2102 girdi (`00-Genel/Donem-Raporu.pdf` 163 sayfa, 2100 dosya, `NOT.txt`: "40'tan fazla koordinatörlük bulunduğu için ayrı koordinatörlük PDF'leri üretilmedi…"), birim PDF'i 0. Arayüz (büyük program): ZIP penceresi "birim raporları ayrı PDF olarak eklenmez (40'tan fazla koordinatörlük)" ve `02–42 arası diğer 41 koordinatörlük klasörü` yazar; indirme sonrası not "İndirildi; gömülü raporların bazı bölümleri sınır nedeniyle kesildi"; `/arsiv/donem-raporu` üstünde "Rapor büyük olduğundan kesildi: dosya 2000 / 2100 gösteriliyor." (`season-truncated`).
- **`retagFile`:** `PATCH /v1/files/{id}/tag` `{tag:"sonuc"}` 200; `attachments?tag=sonuc` yeni etiketi döndürür.
- **K/Ü gerçek yetki:** `/v1/program/archive/*` dört uç ve `download-zip?include_reports=true` koordinatör ve üye için **403** `records.not_authorized`; koordinatör S3 `records/archive/folders` 200 (yalnız kendi birimi); başka birim üyesi aynı birimin S3 arşivinde ve başka birimin görev dosyalarında **403** `records.not_authorized` (varlık gizleme 404 değil 403 döner). Arayüz: koordinatör/üye `/arsiv/donem-raporu`, `/kullanicilar`, toplantı raporuna gidince ana sayfaya yönlenir; `/silinen-kayitlar` "yetki yok" sayfası (`deleted-records-denied`).

## 2. Raporlar (`results-raporlar.json`, `results-ui-arsiv-zip-rapor.json`, `results-rapor-donusum-01g.json`)

| `sections` / `department_ids` | Gerçek PDF |
|---|---|
| yok (tam) | 13 sayfa; "Kapsam: 3 / 3 koordinatörlük"; YÖNETİCİ ÖZETİ, GANTT, PROGRAM GENELİ, KOORDİNATÖRLÜK BÖLÜMLERİ, TOPLANTI VE MESAJLAŞMA, EK: SÖZLÜK VE KURALLAR |
| `summary` | **3 sayfa**; yalnız YÖNETİCİ ÖZETİ |
| `summary,tasks` + Mekanik | 4 sayfa; "Kapsam: 1 / 3 koordinatörlük"; yalnız Mekanik bölümü |
| `meetings,files` + Mekanik,Yazılım | 5 sayfa; "Kapsam: 2 / 3"; toplantı ve etikete göre dosya grupları (PLAN/ÇIKTI/SONUÇ/ANALİZ) |

Dosya adı seçimden bağımsız (`donem-raporu-2026-11-16.pdf`). Arayüz bölüm seçimi (files+meetings kapalı, tek koordinatörlük) 1440 ve 390'da 8 sayfa / "Kapsam: 1 / 3" PDF indirir; pencere kapanınca odak `pick-sections` düğmesine döner. Geçersiz: `sections=foo`, `sections=departments`, yabancı programın departmanı, 51 kimlik → **422** `reporting.input_invalid` (alan `sections` / `department_ids`); `sections=,` → 200 (boş yok sayılır).

- **01f JSON:** `period {start_on,end_on,source:"tasks"}`, `files` (6), `meetings` (3), `workload_summary` (5), `limits {tasks_total 8, tasks_returned 8, files_total 6, files_returned 6, notes_per_task 5}`, `date_change_stats {total 3, approved 1, rejected 1, pending 1, average_shift_days 5, top_requested_tasks[code]}`; yalnız `sections=summary` seçilince `tasks/files/meetings/monthly/workload` **boş**, `limits.*_total` 0. Büyük program: `limits {tasks_total 70, files_total 2100, files_returned 2000}` ve **`X-Result-Truncated: true`**.
- **01g:** `GET /v1/reports/tasks/{id}` `task.code` `MEK-1`, `sequence_no`, `file_count`, `file_bytes`; görev PDF'i 1 sayfa, `gorev-raporu-<8>.pdf`. Toplantı notu göreve dönüştürülünce (`convert-to-task`, 201) toplantı PDF'i `MEK-9 · Motor testi ilerliyor.  Başlanmadı` satırını içerir (kod + durum gerçek). **YENİ-EKSİK 2** aşağıda (görev PDF'inde kod yok).
- **429/503:** tek ŞY hesabıyla 14 eşzamanlı büyük PDF: 1×200, 13×**429 `reporting.export_in_progress`**, `Retry-After: 1`. **503 `reporting.capacity_full` üretilemedi** (slot tek hesapla dolmuyor; ikinci yönetici hesabıyla denenmedi — yapılamadı). **`reporting.export_too_large`** (10 000 silinmiş satır) büyük tohum kurulmadığı için denenmedi.
- K/Ü: `reportSeason` JSON ve PDF **403** `reporting.not_authorized`.

## 3. K1 / Ü1 + görev kodu (`results-k1-u1-kod.json`, `results-ui-k1-u1.json`)

- K1 listesi (gerçek): `code` `MEK-1…5`, `sequence_no`, `file_count`, `submitted_at/by` ("Ayşe Üye"), `last_return {reason, returned_at, returned_by}` (gerekçeli ve `reason:null`), `extension_count 0`. Ü1 `my-tasks` aynı görevler; üye görünümünde `submitted_by` `null` (alan üyeye kapalı, beklenen).
- Arayüz K1: "Onay bekleyen" satırı `Motor testi MEK-1 · AÜ Ayşe Üye · gönderildi 12 dk önce · 2 dosya`; "İade et" → gerekçe penceresi → 200 → satır düşer; Ü1: "İADE EDİLEN 1 — W178 UI gerekçe: imza eksik"; "Koordinatörlüklerim": `MEK Mekanik … Koordinatör: Kerem Koordinatör` (`me/departments.department_code` + `coordinators`). `/v1/me/departments`: üye ve koordinatör satırında kod + koordinatör adı; koordinatörsüz birimde `coordinators: []`; ŞY'de satır yok.
- Tarih talebi: `requested_by`, `created_at`, `reviewed_at`, `review_reason` gerçek ("Yönetici notu: Gerekçe yetersiz", "16.11 karar verildi"); `Idempotency-Key` ile aynı istek **200** (aynı `request_id`), aynı anahtar farklı gövde **409** `work.idempotency_key_reused`. Koordinatör için `GET /v1/date-change-requests` S3'te 403 (liste `mine` ile 200).
- Hatırlat: ŞY/koordinatör `POST /work-items/{id}/remind` **202** `{recipient_count:1}`; üye 403 `work.not_authorized`; ≤ 12 sn içinde atananın bildirim listesinde **`work.task.reminder`** (`subject_ref.kind=work_item`) göründü; arayüzde "Atanana hatırlat" → "1 kişiye hatırlatma gönderildi." (202).

## 4. Silinenler (`results-silinenler.json`, `results-ui-silinenler.json`)

- **Özet ↔ rozet eşitliği:** `reportDeletedSummary` `{tasks:6, meetings:1, departments:0, accounts:0, total:7}`; ana sayfa sayacı **7**, sekmeler Görev 6 / Toplantı 1 / Koordinatörlük 0 / Kullanıcı 0; `GET /v1/meetings` `tab_counts.deleted` 1.
- **Süzgeç/sıralama gerçek:** `q` (1 satır), `department_id` (2), `deleted_by` (6), `deleted_from` RFC 3339 (gelecek → 0; tarih-yalnız biçim 422), `sort=name` + `order=desc` doğru sırada; arayüz araması `görev 3` → 1 satır.
- **CSV bilet:** `GET /v1/admin/deleted/export?kinds=…` bilet akışı 200, `text/csv; charset=utf-8`, **UTF-8 BOM**, `;` ayraç, sütunlar `Tür;Kimlik;Ad;Koordinatörlük;Silinme zamanı;Silen;Silen kimliği`, `Cache-Control` var; bu küçük gövdede (958 B) `Content-Length` **gelir** (akış beklenen "yok" değil; backend küçük yanıtı tek yazımda tamponlar — büyük gövde gözlenmedi). `kinds=foo` → 422 `reporting.input_invalid`. 12 eşzamanlı istek: ham kayda göre **12× 429 `platform.rate_limited`, `Retry-After: 60`** (genel hız kovası; modüle özgü `reporting.export_in_progress` bu koşumda doğrulanmadı — koordinatör düzeltmesi, bkz. başlıktaki not). Arayüz `dr-csv` → `silinen-kayitlar-2026-11-16.csv`, BOM'lu.
- **Toplu işlemler (API):** `restore` 3 kimlik (2 geçerli + `olmayan-kimlik-123`) → 200 `succeeded[2] failed[{work.item_not_found}]`; geri yüklenmiş kimlikle tekrar → `failed[{work.not_deleted}]`; `purge` 200; `purge-all` yanlış onay → 422 alan `confirm`. **390 arayüz:** iki satır seçildi → "Geri yükle" → onay → 200 `succeeded 2`, liste 6 → 4 (taşma 0).
- K/Ü: özet, liste, CSV **403** (`reporting.not_authorized`, `work.not_authorized`).

## 5. Toplantılar / organizasyon (`results-toplanti-organizasyon.json`, `results-ui-toplanti.json`, `results-ui-kullanici-gorev.json`)

- **Katılımcı adayları:** `participant-candidates` (kuruluşta) `items[] {account_id, full_name, teams[], is_participant}` + `next_cursor`; `meeting_id` ile `is_participant` işaretli; **kişi kipinde** ekleme 201 (`Idempotency-Key` 22 karakter), aynı anahtar **200**, başka anahtarla zaten katılımcı **422**, çıkarma 204; koordinatörlük kipi toplantıya ekleme **403** `collaboration.not_authorized`; üye 403. Arayüz 390: `?meeting_id=…&limit=200`, 5 aday, mevcut katılımcı "Katılımcı" işaretli, Uygula → POST + `Idempotency-Key` (22), pencere kapanır.
- **`tab_counts`:** `{upcoming, past, deleted}`; arayüz sekmeleri "Yaklaşan 7 · Geçmiş 0 · Silinenler 1" ve not sekmeleri "Tümü 2 · Göreve dönüşen 0 · Benim 2" API ile aynı (`author=me`, `converted=true/false` süzgeçleri gerçek).
- **Idempotency-Key:** `createMeeting` tekrar → **200**, aynı toplantı; olmayan departman → 403; gündem ekleme tekrar **200** (aynı `agenda_item_id`), farklı gövde 409 `collaboration.idempotency_key_reused`.
- **Kullanıcı CSV (BE-014):** bilet 201 → 200, `kullanicilar-2026-11-16.csv`, BOM, sütunlar `Hesap kimliği;Ad soyad;E-posta;Şirket yöneticisi;Hesap durumu;Ekipler`; `program_id` ve `role` süzgeçleri çalışır (6 / 3 satır); arayüz "Dışa aktar" gerçek indirme. 16 eşzamanlı istek: ham kayda göre **16× 429 `platform.rate_limited`, `Retry-After: 60`** (genel IP kovası; modüle özgü `organization.export_in_progress` bu koşumda doğrulanmadı — koordinatör düzeltmesi).

## 6. F7 regresyon (`results-ui-f7-regresyon.json`)

A (ŞY) gruba gönderir → B (koordinatör) **1514 ms**'de görür (≥1 sn birleştirme dahil; SSE `shared/sse`); zil paneli açılır (17 satır, rozet "9+"; satırlar test sırasında üretilen bildirimlerdir), taşma 0, CSP 0, `pageerror` 0. Web Push kısa turu yapılmadı (W162 kanıtı geçerli).

## Tasarım farkları (gözle: `docs/tasarim/kaynak` yerel oluşturucu ↔ uygulama, 1440; `out/tasarim/`)

Ölçülü piksel karşılaştırması yapılmadı. "Karar" sütunu bilinen kapsam kararıdır (yeni bulgu değil).

| Ekran | Fark | Karar / not |
|---|---|---|
| Arşiv | Tasarımda tek "Tümünü indir"; uygulamada "Dönem sonu raporu (PDF)" + bölüm seç + Önizle + "Dönem arşivi (ZIP)" | F8 canlıya alma (E-06-04, BE-120/124) |
| Arşiv | Etiketler: tasarımda 3 özel etiket + ok; uygulamada sabit 6 etiket, "yeni etiket şimdilik oluşturulamıyor"; "PDF" süzgeç çipi yok; "grup" rozeti yok; depolama kartı alt sınırda | sabit küme (BE) |
| Silinenler | Tasarımda "Tümü" sekmesi, "kalan süre" sütunu, seçili kayıt paneli ayrıntıları, "Yakında kalıcı silinecek" kartı, 30 gün saklama metni; uygulamada Alt görev/Dosya/Not ve gündem sekmeleri devre dışı, saklama "yönetici silene kadar" | BE (otomatik temizlik yok) |
| Toplantılar | Başlıkta yerel biçimli tarih girdileri ("mm/dd/yyyy"); CANLI/BEKLİYOR durum rozeti ve "n kişi" yok; satırda katılımcı sayısı ikonlu | P3/BE |
| K1 | Selamlama tam ad ("Merhaba Kerem Koordinatör"), tasarım ilk ad; "Ekibe üye ekle" statik "Sonraki fazda açılacak"; zil rozeti sayı ("9+"), tasarım nokta | kapsam |
| Ü1 | "Koordinatörüme yaz" → "F7'de açılacak" (F7 kapalı); "Son bildirimler 18 yeni" ama gövde "Henüz bildirim yok · yakında" | KUSUR 4 |
| Kabuk | "Görevler" satırında iki rozet (gri + kırmızı) — W144/W162 KUSUR 5 hâlâ geçerli | F6'dan devir |

## Kusurlar (düzeltilmedi; koordinatör W176'ya/ayrı işçiye verir)

- **KUSUR 1 (orta, görsel):** `/arsiv/donem-raporu` 390 px'te belge yatay taşar (`scrollWidth − innerWidth` = **216 px**); A4 önizleme sayfası ölçeklenmiyor/kapsayıcıda kırpılmıyor. 1440'ta sorun yok. Kanıt: `results-matris-admin.json` (donem-raporu/390), `shot-admin-donem-raporu-390-dark.png`.
- **KUSUR 2 (düşük, metin ↔ gerçek):** Dönem ZIP onay penceresindeki klasör ağacı ASCII'leştirilmiş adlar gösterir (`W178-Donem-mwj1o11x-Donem-Arsivi-2026-11-16/`, `01-Elektronik-mwj1o11x/`); gerçek ZIP kökü ve klasörleri `W178 Dönem mwj1o11x-Donem-Arsivi-2026-11-16/`, `01-Elektronik mwj1o11x/` (boşluk + Türkçe harf). Önizleme ≠ gerçek içerik adı. Kanıt: `shot-ui-arsiv-zip-pencere-1440.png`, `results-arsiv-zip.json`.
- **KUSUR 3 (orta, 390):** `/silinen-kayitlar` 390'da tablo kartı içinde yatay kayar; kayıt adı "Silinecek göre…" okunmaz biçimde kesilir ve "Geri yükle / Kalıcı sil" sütunu kaydırmanın arkasında kalır (toplu işlem çalışır, tekil eylemler zor bulunur). Kanıt: `shot-admin-silinen-kayitlar-390-dark.png`, `shot-ui-silinen-390-secili.png`.
- **KUSUR 4 (düşük, metin):** Ü1 "Son bildirimler" kartı "18 yeni" rozetini gösterirken gövde "Henüz bildirim yok · yakında"; "Koordinatörüme yaz" "F7'de açılacak" yer tutucusu F7 kapandıktan sonra da duruyor; K1 "Son etkinlik · yakında" aynı sınıf. Kanıt: `results-ui-k1-u1.json`.
- **KUSUR 5 (düşük, görsel):** K1 iade penceresinde gerekçe alanındaki metin sol kenara yapışık (iç boşluk yok); katılımcı seçicide "Ad ile ara" etiketi odak halkasına değiyor. Kanıt: `shot-ui-k1-iade-pencere-1440.png`, `shot-ui-toplanti-aday-390.png`.

## Backend gözlemleri / yeni eksik önerisi

- **YENİ-EKSİK 1:** arşiv | silinmiş görevin dosyaları | S2 arşiv listeleri, `depolama` toplamı ve dönem ZIP'i **silinmiş görevin dosyalarını da** içeriyor (başlıksız `ArchiveTask`; ZIP'te `Dosyalar/ (2)/…` ve kimlik adlı klasör; arşiv 8 dosya ↔ rapor `total_attachments` 6) | silinmiş görev dosyaları arşivden/ZIP'ten dışlanmalı ya da başlık/etiket taşımalı | şimdilik görünür (boş başlık).
- **YENİ-EKSİK 2:** raporlar | görev PDF'i | `GET /v1/reports/tasks/{id}/pdf` görev kodunu (`MEK-1`) ve dosya sayısını basmıyor (JSON'da var; dönem/toplantı PDF'lerinde kod var) | PDF'e kod/sıra no eklenmesi | şimdilik yok.
- Gözlem (hata değil): `include_reports`/`department_id` alan hatalarında alan kodu `records.invalid_file`; küçük CSV'de `Content-Length` geliyor; tek hesapla `reporting.capacity_full` yerine hep `export_in_progress` (429).

## Kanıtlanamayanlar / koşmayanlar

- 503 `reporting.capacity_full` ve `reporting.export_too_large` (10 000 satır); Web Push (W162 geçerli); gerçek VoiceOver; ölçülü piksel; tek satır indirme düğmesi arayüzden tıklanmadı (görev klasörü satırı önizleme açar); K/Ü için 390 yalnız K1/Ü1; Safari/Firefox yok.
- Bilet isteğinin gövdesi (`path`) Playwright `postDataJSON` ile yakalanamadı (`bilet.body: null`); program başlığı doğrulandı, hedef yolu API düzeyinde ve W176 e2e'sinde doğrulandı.
- Kod ve Docker dışı değişiklik yok; `e2e/` değişmedi.

## Oluşturulan ve temizlenen kaynaklar

Yalnız `nizamio_web8_w178-*`: ağ, hacim (`-db-1` Compose), konteynerler `-db-1`, `-server`, `-server-shortttl`, `-web`, `-edge`, `-imagecheck`; imajlar `nizamio_web8_w178/backend:v0.23.0-api`, `nizamio-web8-w178/web:b9aab8c`. `nizamio_web_e2e*`, `nizamio-test-pg` ve diğerlerine dokunulmadı. İş sonunda hepsi adla silindi (`cleanup.sh`); `/private/tmp/nizamio_web8_w178` silindi; `e2e/.state` (yoksayılan) temizlendi.

## Kalıcı kanıt

`.git/koordinator/web8-w178/` (ana frontend deposu): `betik/*.mjs` (tohum `seed8*.mjs`, `s1-arsiv`, `s2-rapor`, `s3-k1u1`, `s4-silinenler`, `s5-toplanti-org`, `s6-matris`, `s7-ui`, `s8-arsiv-ui`, `s9-donusum`, `design*.mjs`), `up.log`/`up2.log`, `edge.Caddyfile`, `check-image.log`, `restart-server.sh`, `cleanup.sh`, `results-<senaryo>.json`, `shot-*.png`, `tasarim/`, `dl/` (üretilen PDF/CSV örnekleri). Belirteç, `state.json`, `server.env` kopyalanmadı.
