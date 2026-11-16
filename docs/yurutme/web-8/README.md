# WEB-8 — pin yükseltme (v0.23.0-api) ve canlıya alma turu

**F8 KAPANMADI — Codex tur 1 UYGUN DEĞİL, W180 düzeltiyor (2026-11-16; tur 1 HEAD `27587d2`, girdi main `dd71bd6`: O1–O3, W178 #165, W179 #166).** O1–O3 kodu main `b9aab8c`'de (#154–#164; pin `v0.23.0-api` #158, canlıya alma #159–#163, entegrasyon #164); O4 sürüyor (W177 belgeler, W178 gerçek backend `v0.23.0-api` tanığı, Codex 2–3 tur). **Güncel olgu:** backend `v0.24.0-api` (BE-F7: sohbet/bildirim) çıktı; F8 pini v0.23'te kalır (P69/P74), karşılıklar [rapor-F8 §6](../../backend-eksikleri/rapor-F8.md) ve F9 önerisi [web-9](../web-9/README.md). "F8 KAPANDI" yalnız CI SUCCESS + MERGED + Codex hükmü sonrası yazılır.

**F8 AÇILDI — 2026-11-15** (P67; ürün sahibi: "pin yükseltme + canlıya alma turu olsun"). F7 [KAPANDI](../web-7/README.md) (main `31c6ccc`). Backend'i ürün sahibi arka planda ayrı yürütür; yayımlanmış son etiket **`v0.23.0-api`**. Kararlar: [ortak-kurallar §12](../../ekranlar/ortak-kurallar.md) (P67 kesin; P68–P74 koordinatör varsayılanı, geçici kabul). Süreç: [ortak sözleşme](ortak-sozlesme.md) (KESİN 1–36), [ilerleme](ilerleme.md), [pin planı](pin-yukseltme-v023.md).

## Neden bu tur

Pin `v0.15.0-api` iken backend `v0.16 … v0.23` etiketlerine gitti (181 commit): uç 189 → 248 (+59, kaldırılan yok), yol 147 → 199, şema 233 → 326, hata kodu 194 → 227 (+33); `info.version` `v1` kaldı (`api_version` kapısı tetiklenmez). Web'de bu sürede statik/devre dışı/gizli duran parçaların çoğunun backend karşılığı artık var. F8 iki iştir: (a) pini yükseltmek, (b) pinle gelen karşılığı olan parçaları canlıya almak. Yeni ekran yok.

## Kapsam

**(a) Pin `v0.23.0-api` — WP1, tek PR, UI değişmez (P69, KESİN 36).** `api-pin.json` + `pnpm gen:api` + tip/fixture uyumu + kırıcı farklar (`actor` enum `sirket_yoneticisi`; `MyDepartment.role` enum daralması; `TaskStatusDistribution`/`TaskPriorityDistribution` kapalı şema; `createMeeting` 200/404; ~45 şemada yeni ZORUNLU yanıt alanı) + 33 yeni hata kodu için i18n anahtarı + `e2e/backend/up.sh` etiketi. Ayrıntı: [pin-yukseltme-v023](pin-yukseltme-v023.md).

**(b) Canlıya alma — O2b modül grupları (P70, P71, KESİN 35).** Her grup: `designStub` kaldırılır, kayıt Bağ sütunu güncellenir, ilgili E-satırı kanıtı yazılır, gerçek uçla entegrasyon testi.

| Grup | İş | BE kimlikleri (tam) | Kısmi (yalnız gelen alan canlanır) |
| --- | --- | --- | --- |
| (a) W171 | **Arşiv + ZIP**: yönetici S2 arşiv yüzü (P33 geçici yolu kalkar), `programArchive*` uçları, seçimli ZIP, dönem ZIP `include_reports`, klasör özeti, dosya tarihi/yükleyen adı, süzülmüş toplam, etiketi değiştir, dosyasız göreve ilk yükleme | BE-025, 070, 071, 072, 073, 074, 120, 121 | — |
| (b) W172 | **Raporlar**: dönem raporu bölüm seçimi (`sections`) + koordinatörlük süzgeci (`department_ids`), ZIP raporları, toplantı raporunda dönüştürülen görevler, kapalı dağılım şemaları, iş yükü sayaçları, `Retry-After` | BE-122, 124, 125, 132, 133, 134, 135 | BE-123 (PDF şablonu; Gantt okları/içindekiler sayfa numarası yok, GAP-239), BE-136 (dönem tarihi/konum yok, GAP-237) |
| (c) W173 | **K1/Ü1 + görev kodu**: görev satırında dosya sayısı/onaya sunuş, bekleyen bağımlılık, iade sebebi, tarih talebi zamanları/karar notu, birim koordinatör adı; görev kısa kodu (`code`, `sequence_no`) 03 satırlarında ve Gantt'ta | BE-005, 137, 138, 139, 140, 141 | — (sohbet görev özetinde kod yok: GAP-238, F8'de değişmez) |
| (d) W174 | **Silinen kayıtlar (12)**: silen bilgisi, süzgeç/sıra/imleç/`total`, tür sayaçları (`reportDeletedSummary`), CSV, toplu geri yükle/kalıcı sil, çöpü boşalt, silinmiş görev ayrıntısı, silinen hesap alanları, `scope=program/company` | BE-108, 113, 114, 115, 116, 117, 118, 119 | BE-110 (tür sayaçları var; türler arası birleşik liste yok, GAP-234) |
| (e) W175 | **Toplantılar + organizasyon + bildirim sözlüğü**: sekme sayaçları/`when`/`sort`/`total`, not süzgeçleri, katılımcı adayları, departman kodu/silinmişlik/ad alanları, dönüşmüş not görev bağlantısı, `Idempotency-Key` (üç oluşturma ucu); kullanıcı CSV (bilet hedefi); `work.task.reminder` bildirim türü sözlüğe; Hatırlat düğmesi **yalnız tasarımda çizildiyse** | BE-021, 061, 063, 065, 067, 068, 014 | BE-018 (katalog `created_at` + `last_uploaded_at` var; tarihsel kuruluş/görünürlük/etkinlik akışı yok, GAP-240), BE-008 (elle hatırlatma var; zamanlı/otomatik yok, GAP-230) |

BE-036 (belge paketi) yalnız madde (7) toplantı belgesi için karşılandı; kalan maddeler açık. Kayıt notları: [kayit.md](../../backend-eksikleri/kayit.md) ve [karşılanan satır kuralı](../../backend-eksikleri/README.md#karşılanan-satır-kuralı-f8).

**(c) DIŞI (P67, P68, P74).**
- Sohbet ve bildirim stub'ları değişmez: BE-027/028/029, BE-080…086, BE-142…156, BE-160…162 (bekleyen backend paketi **BE-F7**). Tek istisna `work.task.reminder` türünün sözlüğe girmesi.
- Yeni ekran yok: Takvim, Kurumsal hafıza, Tablolar (backend `tables` modülü var, web ekranı yok), 01b işlem geçmişi (`listAuditEntries` v0.19'da var ama yalnız şirket yöneticisi; BE-091 rol kapsamı yok), Ü2–Ü7, K2–K8, Asistan, profil/bildirim tercihleri (backend `getNotificationPreferences`/`updateNotificationPreferences`/`registerDeviceToken` var) → **F9 adayları**.
- Açık kalan BE: BE-002/004/038–040, BE-024/026 (etiket oluşturma, önizleme türevi: GAP-233), BE-069/075…079, BE-109/111/112, BE-126…129/131, BE-032/033, BE-091 (rapor-F6/rapor-F5 önerileri).
- BE-F7 etiketi gelirse F8'e **alınmaz** (kısmi pin yok; plan karar P74).

**Tasarım:** yeni artboard yok (P72). Canlanan parçaların tasarımı v85/v87'de zaten çizili; statik hâli aynı görünümdeydi. Tek ek: 01f dönem raporu yer tutucu bölümleri (Gantt/iş yükü/dosyalar) gerçek veriyle dolar.

## Sıra ve roller

Her W ayrı worktree ve dal (`web8/<oturum>-<wid>`); [ortak sözleşme](ortak-sozlesme.md) geçerlidir. Her geçiş öncekinin yeşil CI + MERGED kanıtını bekler. Hiçbir işçi push/PR açmaz.

| Oturum | İş | İşçi |
| --- | --- | --- |
| **O1** ([hazırlık](oturum-1-hazirlik.md)) | **W168** web-8 süreç belgeleri, pin planı v0.23, ortak-kurallar F8 eki (P67–P74), kayıt Bağ notları ‖ **W169** canlıya alma matrisi + ekran grubu README F8 ekleri (yalnız belge) | W168, W169 |
| **O2a** | **W170 pin WP1**: tek PR, UI değişmez (KESİN 36), kırıcı farklar ayrı commit/test | W170 |
| **O2b** | **W171** arşiv + ZIP · **W172** raporlar · **W173** K1/Ü1 + görev kodu · **W174** silinenler · **W175** toplantılar + organizasyon CSV + bildirim sözlüğü. Zincir ya da bağımsız: W169 matrisindeki dosya kesişimine göre koordinatör karar verir (KESİN 23–25). | W171–W175 |
| **O3** | **W176** entegrasyon: yetki testleri (P33 yolu kaldırma, S2/S3 başlıkları, bilet hedefleri), gerçek bileşen + durumlu sahte sunucu | W176 |
| **O4** | **W177** belgeler (rapor-F8, kapanış; P76 hızlı mod) ‖ **W178** Docker gerçek backend **v0.23.0-api** tanığı → Codex 2–3 tur → kapanış belge PR | W177, W178, Codex |

O1–O3 durumu: O1 #154–#157, O2a #158, O2b #159–#163, O3 #164 birleşti ([ilerleme](ilerleme.md)); P75 (Actions kesintisinde yerel CI) ve P76 (hızlı mod) süreç kararlarıdır.

W167 (F7 devir borçları: kararsız testler, `unregisterPushTarget`, `up.sh` parametrik, `topbar-dot*`, manifest, `push.snoozeUntil`) F8'den bağımsız yürüdü ve **kapandı** (#155, `9cc65c8`); sonuçları [ilerleme](ilerleme.md) borç tablosuna işlendi (web-7 ilerleme #2, #8, #12, #13, #21, #27 kapandı).

## Başlatma koşulları (karşılandı)

1. Kullanıcı onayı ✓ (2026-11-15).
2. F7 kapalı ✓ (kapanış PR #153 MERGED, main `31c6ccc`).
3. Etiket kapısı: **`v0.23.0-api` sabit**; BE-F7 etiketi F8'e alınmaz.

## Açık sorular

1. **BE-F7 etiketi** (sohbet/bildirim paketi) **çıktı: `v0.24.0-api`** (2026-11-16; 29 commit, 6 yeni uç). F8 pini v0.23'te kalır; öneri: F9 = pin v0.24.0-api + sohbet/bildirim canlıya alma ([web-9](../web-9/README.md)). Ürün sahibi kararı.
2. **F9 adayları** ve sırası: Takvim, Kurumsal hafıza, Tablolar ekranı, profil sayfası (Ü7: tercihler, cihazlar, sessiz saatler), 01b işlem geçmişi, Ü2–Ü7/K2–K8, Asistan. Kapsam kullanıcı kararıdır.
3. 01f dönem raporunda konum/dönem tarihi (GAP-237) ve Gantt okları (GAP-239) backend'de kalır: web'de nötr kalacak (P68 kısmi kuralı); onay P72 ile sürer.
4. BE-110 birleşik "Tümü" listesi (GAP-234): backend'de yok; sekme sayaçları gelir, "Tümü" birleşik sırası istemci birleşimi olarak kalır — ürün sahibine ayrıca sorulmaz (varsayılan: değişmez).

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| README.md | Bu belge (F8 açıldı; kapsam, sıra, açık sorular) |
| [ilerleme.md](ilerleme.md) | Durum tablosu (O1–O3 birleşti, O4 sürüyor), kararlar P67–P76, kayıtlar, numaralı borçlar (F7'den devreden + F8'de doğan) |
| [ortak-sozlesme.md](ortak-sozlesme.md) | Her uygulayıcı isteminin başına eklenen sözleşme (KESİN 1–36) |
| [pin-yukseltme-v023.md](pin-yukseltme-v023.md) | WP0–WP4 planı, kırıcı farklar envanteri, fixture stratejisi (web-5 planının devamı) |
| [oturum-1-hazirlik.md](oturum-1-hazirlik.md) … [oturum-4-kapanis.md](oturum-4-kapanis.md) | Oturum iskeletleri; [oturum-3](oturum-3-entegrasyon.md) (W176 sonucu) ve [oturum-4](oturum-4-kapanis.md) (kapı sonuçları) dolu |
| [canliya-alma-matrisi.md](canliya-alma-matrisi.md) | W169 stub → v0.23 ucu → ekran satırı matrisi |
| [rapor-F8](../../backend-eksikleri/rapor-F8.md) | Backend devir raporu (bağlanan/kısmi/açık, v0.24 farkı, F9 web işi, backend paket adayları) |
| [web-9](../web-9/README.md) | F9 iskeleti (**F9 AÇILMADI**) |
