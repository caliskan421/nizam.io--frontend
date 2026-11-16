# O3 — W176 zorunlu entegrasyon turu (tamam, #164 `b9aab8c`)

**Durum (2026-11-16):** birleşti. Dal `web8/o3-w176`, taban main `6e09d7a` (O2b birleşik: #158–#163); uç `bdecd00`. Girdi: O2b `TASLAK:` satırları (KESİN 16) ve koordinatör kusur adayları. Yöntem [web-7 O3](../web-7/oturum-3-entegrasyon.md) kalıbıdır: gerçek router/AppShell/oturum, durumlu sahte sunucu (görünürlüğü **süzmeden** döner; süzme istemcide sınanır), gerçek bileşenler. P76 hızlı mod: yerelde etkilenen testler, tam paket CI'da; gerçek backend e2e yalnız bu turda ve W178'de.

## Sonuç

| Ölçü | Değer |
| --- | --- |
| Tam paket (işçi raporu) | **819 dosya / 5963 test**; typecheck · lint · format · build yeşil. Bu belge yazılırken yeniden koşulmadı (belge turu); CI #164 üç işi tek doğruluk kaynağıdır |
| Yeni entegrasyon testleri | `home-live-actor`, `home-live-task-code`, `home-live-units`, `work-live-actions`, `deleted-live-csv`, `users-live-export`, `meetings-live-idempotent`, `reports-live-large`; ayrıca `tests/lint/download-targets.test.ts` (22) ve `tests/lint/live-register.test.ts` |
| e2e (gerçek backend `v0.23.0-api`) | `live-archive.spec.ts` (4: arşiv ZIP, bölüm seçimi, S2 yetkisi ŞY 200 / K-Ü 403 `records.not_authorized`), `live-records.spec.ts` (3: silinenler CSV + toplu geri yükle, toplantı adayları + idempotent tekrar, K1 iade sebebi), `reports.spec.ts` (dönem ZIP etkin + onay + bilet isteği yok), Ü1 koordinatörlüklerim (`department_code`, `coordinators`) kanıtı; tam e2e **14/14, 3 ardışık koşum** (KUSUR 4 sonrası) |
| Görsel duman (gerçek backend) | 6 rota × 390/1024/1440 × açık + koyu tema: taşma 0, CSP ihlali 0, pageerror 0; ham kanıt `.git/koordinator/web8-w176/` (yerel) |
| Kota | `e2e/export-quota.ts` bekçisi + `up.sh` `NIZAMIO_RECORDS_EXPORT_PER_MINUTE=30` (yalnız non-prod; dışa aktarım kotası 5/dk, hesap başına) |


## Senaryo kapsamı (planlanan liste; kanıt yukarıdaki tablo ve testlerdedir)

1. **Yetki:** yönetici arşivi S2 yolu (P33 geçici yolu **yok**: `listProgramDepartments` + `archiveTasks` ∩ görev kesişimi çağrılmaz); koordinatör/üye S3 başlığı (`X-Nizamio-Department`) kapsamı; kapsam dışı erişim 403/404; yönetici merceği ≠ yetki (P1); `actor` `sirket_yoneticisi` geçişleri; `MyDepartment.role` daralması.
2. **Bilet hedefleri:** ZIP (dönem, seçimli, `include_reports`), silinenler CSV, kullanıcı CSV (`exportUsersCsv`, 10000 satır bütçesi, `organization.export_*`), dosya indirme — bilet alınıp hedefe yönlendirilir; kesinti/aşım hata kodu → i18n.
3. **Arşiv:** klasör özeti, süzülmüş toplam ("‹i› / ‹N›"), etiket değiştirme (`retagFile`), dosyasız göreve ilk yükleme (`include_empty`).
4. **Raporlar:** `sections` + `department_ids`, 429/503 `Retry-After` geri sayımı (BE-135), kapalı dağılım şeması, ZIP raporları.
5. **K1/Ü1 + görev kodu:** kod 03 satırı/panel/Gantt'ta; dosya sayısı, onaya sunuş, bağımlılık özeti, iade sebebi, tarih talebi zamanları, birim koordinatör adı.
6. **Silinenler:** süzgeç/sıra/imleç, tür sayaçları, toplu geri yükle/kalıcı sil kısmi başarı, çöpü boşalt onayı, CSV.
7. **Toplantılar:** `tab_counts`, `when`/`sort`, not süzgeçleri, katılımcı adayları (kesilme uyarısı kalkar), `Idempotency-Key` (üç oluşturma ucu: aynı anahtarla yeniden gönder tek kayıt).
8. **Bildirim sözlüğü:** `work.task.reminder` 13. tür; diğer 12 tür ve sohbet/bildirim stub'ları **değişmez** (P74).
9. **Pin yokluk testleri:** kaldırılan her `designStub` için "eski yol yok" testi (KESİN 35).

## Kusurlar (sınıf → commit; hepsi düzeltildi, test sabitledi)

| # | Sınıf | Düzeltme | Commit |
| --- | --- | --- | --- |
| 1 | Yerel kopya (dönem ZIP bilet akışı `archive/api/period-zip.ts` ortak akışı çoğaltıyordu; `X-Result-Truncated` yalnız onda okunuyordu) | `shared/download` ortak akışına `truncated`, kopya kalktı | `c32a397` |
| 2 | Ardışık e2e kararsızlığı (`reports.spec` dönem PDF indirme: dışa aktarım kotası 5/dk, hesap başına) | `e2e/export-quota` bekçisi; `up.sh` kota 30 (non-prod) | `474d53e`, `85f4727` |
| 3 | İki kaynaklı iade gerekçesi denetimi (`home` ve `work` kopyaları) | `checkReturnReason` tek kaynak `work/public` (KESİN 21 kalıbı) | `1332b28` |
| 4 | e2e izolasyonu (`notifications.spec` ilk satırı başka `live-*` spec'inin bildirimi; taban-0 varsayımı) | görev kimliğiyle satır seçimi; başkalarının okunmamışları okundu | `bdecd00` |

Ek: `DetailActions` saplama `TASLAK` kapanışı (`2da389f`: görev paneli eylem satırı gerçek bileşenlerle); kayıt Durum `bağlandı` ↔ kodda stub yok ↔ matris tutarlılık testi (`893eca5`); istemci bilet hedefleri ↔ backend kapalı liste (14 desen, IDENTITY-K52) uyum testi (`553f679`); KESİN 32 bölmeler: `meetings-conversion` 2678 → 503 ms (üçe bölündü), `archive-upload`, `deleted-records-o3` (`a9e669c`, `c411c2b`); 01f büyük dönem (5000 görev + 2000 dosya) ölçümü ve gerileme bekçisi (`ae53439`): **jsdom'da render 2,5–2,7 sn**, sanallaştırma yok → F9 borcu; `reports-live-large` KESİN 32 istisnası (40 sn test / 10 sn bekleme) koordinatörce onaylıdır (ilerleme #16).

## Varsayımlar ve açık

- **Varsayımlar 1–4 kabul** (koordinatör, 2026-11-16). ŞY aktör (`sirket_yoneticisi`) canlı davranışı: salt okunur durum korunur, koordinatör olan ŞY geçişi sorunsuz (`4b2d997`); ADR-0041 ürün kararı bekler (ilerleme #17).
- **Açık / kanıtlanamadı:** `X-Result-Truncated` bilet tüketiminde canlı tetiklenemedi (sözleşme güvence etmiyor; W178 dener, `BE-YENI-W171-1`); bilet aşamasında 429 genel toast (#25); 01f render süresi (#16); VoiceOver/Safari/iOS yapılamadı. Borç listesi: [ilerleme](ilerleme.md).
