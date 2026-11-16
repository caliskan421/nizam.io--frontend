# WEB-8 — Codex nihai kapı (iskelet)

**F8 KAPANMADI — Codex bekliyor (2026-11-16).** Bu belge F8 (pin `v0.23.0-api` + canlıya alma turu) için Codex nihai kapı kayıtlarının iskeletidir; hüküm yoktur. "F8 KAPANDI" yalnız (a) Codex hükmü (UYGUN ya da koşulları kapanmış KOŞULLU UYGUN), (b) kapanış belge PR'ı CI SUCCESS ve MERGED olduğunda yazılır; birleşme kanıtı GitHub PR kaydıdır. Her tur kaydı HEAD, araç izi ve kanıt sınırlarıyla gelir; araç izi olmayan çıktı kapı sayılmaz.

## Kapsam ve girdiler

- **Kod HEAD adayı:** main `b9aab8c` (O1 #154–#157, O2a #158, O2b #159–#163, O3 #164) ve W177 belge dalı `web8/o4-kapanis`; W178 dalı `web8/o4-w178` (`dogrulama-F8.md`, gerçek Docker + backend `v0.23.0-api` tanığı).
- **Kabul ölçütleri:** ekran README'lerinin "F8 eki" tabloları (`kabul` / `geçici kabul` satırları; 00, 01, 03, 03c, 05/05b, 06, 08, 09, 12, 13, 14), [ortak-kurallar §5 F8 eki ve §12 P67–P76](../ekranlar/ortak-kurallar.md), KESİN 17/21/22/26/29/30/32/35/36 ([ortak sözleşme](../yurutme/web-8/ortak-sozlesme.md)); [canlıya alma matrisi](../yurutme/web-8/canliya-alma-matrisi.md); [pin planı](../yurutme/web-8/pin-yukseltme-v023.md); [rapor-F8](../backend-eksikleri/rapor-F8.md).
- **Tur sayısı (P76):** en çok 2 tur; tur 1 UYGUN DEĞİL ise 3. Model `gpt-6.1-sol`, orta çaba, `-s read-only`; ilk eylem HEAD teyidi (araç izi). Geri alma deneyi yalnız bulgularda. Uygulayıcı kendi değişikliğine nihai onay vermez.

## Sınıf soruları (tur istemine girer)

1. **Yetki ve kapsam sızıntısı:** S2 `programArchive*` uçları yalnız şirket yöneticisi; satır işlemi S3 başlığı = satırın `department_id`'si; P33 geçici yolunun (`listProgramDepartments` adlarından kart, `archiveTasks` ∩ `listProgramWorkItems`, 200 tavan) kodda ve testte **yokluğu**; yönetici merceği ≠ yetki (P1); koordinatör/üye S3 başlığı; 403/404 gerçek sonuç.
2. **Bilet hedefi ve indirme:** istemci hedef listesi ↔ backend kapalı liste (14 desen, IDENTITY-K52); `shared/download` (`X-Result-Truncated`, `Content-Disposition`, 429/503 `Retry-After`); dönem ZIP `include_reports`, silinenler CSV, kullanıcı CSV.
3. **`Idempotency-Key` yaşam döngüsü:** yalnız sözleşmenin istediği uç (`createWorkItem`, `transferWorkItems`, toplantı/gündem/not oluşturma), kullanıcı eylemi başına; belirsiz sonuçta aynı anahtarla güvenli tekrar; anahtarsız organizasyon uçlarında kör tekrar yok.
4. **Toplu yazma güvenliği:** silinenler toplu geri yükle/kalıcı sil ≤100 parça, kısmi başarı, tür adı yazılarak onay, çöpü boşalt `remaining` döngüsü; ortak onay (`confirmWrite`), sökülmüş sahip (`owner_disposed`), geç sonuç (KESİN 26).
5. **Pin ↔ fixture uyumu:** `defaults.ts` üreticileri spec varsayılanından; uydurulmuş alan yok; kırıcı farklar (`actor` `sirket_yoneticisi`, `MyDepartment.role`, kapalı dağılım, `createMeeting` 200/404) ayrı commit/testle; 33 yeni hata kodu → i18n (sunucu `message` gösterilmez).
6. **Stub kaldırma bütünlüğü ("eski yol yok"):** matristeki "canlanır" yerlerinde `designStub` kalmadı; `kayit.md` Durum `bağlandı` ↔ kodda kimlik yok (`tests/lint/design-stub.test.ts`, `live-register.test.ts`); kısmi satırlarda kalan stub ve Durum `açık`.
7. **Türev sayaçlar (KESİN 29):** toplu işlem ve iade/teslim → liste + rozet + 01 pano + K1/Ü1.
8. **ŞY aktör (ADR-0041):** `SERVER_ACTOR_TO_CLIENT.sirket_yoneticisi = null`; ürün kararı bekler, davranış değişmedi; ölü dışa aktarım.
9. **Görsel:** üretim paketi duman (W176 gerçek backend, W178 Docker), CSS katman sırası, taşma/CSP/pageerror; 390 px etkileşim (KESİN 30).

## Kanıt sınırları (baştan yazılır)

- **P75:** GitHub Actions 2026-11-16 00:12–07:17 arasında koşmadı; #161/#162/#163 yerel CI kanıtıyla (ci.yml üç iş birebir; kanıt `.git/koordinator/yerel-ci/pr16N-<hash>/`, PR yorumlarında özet) birleşti. Actions dönünce **main `6e09d7a` CI SUCCESS** ile doğrulandı: bu üç PR bu koşumla main'de sınanmış sayılır; yerel kanıt tek başına CI yerine geçmez ve bu belge onu CI SUCCESS diye anmaz.
- **P76 hızlı mod:** işçi yerelde yalnız etkilenen testler; tam paket CI'da; gerçek backend e2e yalnız W176/W178/CI; duman tek koşum; geri alma teyidi yok (yalnız Codex bulgularında). İşçi tam paket sayıları (W176 819/5963) işçi raporudur; CI toplamı ayrıca alınmadıkça sayı iddia edilmez.
- **W178 tanığı (#165, main `30a4f14`; [dogrulama-F8](../yurutme/web-8/dogrulama-F8.md)):** gerçek Docker imajı + Caddy CSP + gerçek backend `v0.23.0-api`, gerçek Chromium; P76 kısaltılmış matris (ŞY 31, K/Ü 14 görünüm, 4 dokunma); Chrome dışı tarayıcı yok. Kusur düzeltmeleri W179 (PR #166) bu tanıktan sonradır; W178 ölçümleri W179 HEAD'inde yeniden koşulmadı. KUSUR 2 tasarım farkı olarak kabul. Üretilemeyen: 503 `reporting.capacity_full`, `reporting.export_too_large`.
- **Yapılamadı (KESİN 32):** VoiceOver ve kullanıcı görsel onayı; ölçülü piksel karşılaştırması; Safari/iOS/Firefox push ve `notificationclick` OS bildirimi; CDN arkası SSE; ekran okuyucu dahil gerçek cihaz kanıtı.
- **Bu belgenin yazıldığı oturumda** (W177, yalnız belge) kod, tam paket, build ve e2e koşulmadı; kapı: prettier, lint, `tests/lint`.
- Duman PNG'leri ve ham sonuç dosyaları yerel (`.git/koordinator/web8-w17N/`); git'e girmez.

## Tur 1 — 2026-11-16, HEAD 27587d2

HEAD: `27587d26f4449857ca87ba0ecb09f2fd9a10e192` (girdi main `dd71bd6`; ham çıktı koordinatör kaydında: `.git/koordinator/web8-codex-tur1.md`, yerel)

**UYGUN DEĞİL** — dönem ZIP'inde kapsam değişimi ve sökülme sonrasında indirmeyi sürdürebilen engelleyici yaşam döngüsü kusuru (E-01); ayrıca tüketim hatasında süre kaybı (Ö-01) ve belge/süreç bulguları (K-01, K-02). Codex dosya değiştirmedi, çalışma ağacı temiz kaldı.

### Bulgular

| Kimlik | Ağırlık | Özet | Sahip / durum |
| --- | --- | --- | --- |
| CX-F8-E-01 | Yüksek / engelleyici | Ortak indirme akışında (`shared/download/flow.ts`, `redeem.ts`; `archive/.../use-period-zip.ts`, `PeriodZipButton.vue`) kapsam/oturum/sökülme iptali yok: bilet beklenirken program değişirse eski programın ZIP'i kaydedilebilir; tüketim başladıktan sonra bileşen sökülürse `owner.alive()` yeniden denetlenmez. Düzeltme: eyleme bağlı iptal yaşamı (kapsam, oturum nesli/hesap, sahip sökülmesi) + tüketim/kaydetme öncesi bağlam denetimi. Kabul: bilet yanıtını tut → program değiştir → bırak: tüketim isteği ve dosya kaydı 0 | **W180** |
| CX-F8-Ö-01 | Orta | Tüketim hatasında `Retry-After` kullanıcıya ulaşmıyor: kullanıcı CSV (`UsersExportButton.vue`) 429 `organization.export_in_progress` / 503 `organization.capacity_full`, raporlu ZIP (`zip-status.ts`) 503 `reporting.capacity_full` genel metne düşüyor. Bilet üretimi aşamasındaki genel-toast borcundan farklıdır. Düzeltme: ortak süreli hata sınıflandırması, bekleme süresi görünür, otomatik tekrar yok | **W180** |
| CX-F8-K-01 | Orta (belge) | `dogrulama-F8.md:61,70` modüle özgü kota sayıları ham sonuçlarla uyuşmuyor (ham: 12× ve 16× `platform.rate_limited`, `Retry-After: 60`). CSV'nin çalışmadığı sonucu çıkmaz | **W177 düzeltti** (`dogrulama-F8.md` koordinatör düzeltmesi, sayılar ham kayda göre; borç: hedefli gerçek backend kota koşumu, ilerleme #36) |
| CX-F8-K-02 | Düşük / süreç | W170 "UI değişmedi" hükmü mutlak değil: `9a8ed02` `work.task.reminder` için özel metin/simge/ton ve push metni ekledi (`notifications/model/dictionary.ts`, `public/sw.js`); pin planı bunu W175'e ayırmıştı. Mevcut F8 sözlük davranışı ürün kusuru sayılmaz | **W177 işledi** (ilerleme, oturum-2: W170 kanıtı daraltıldı; sapma notu) |

### Bağımsız sınıf taraması (özet)

| Sınıf | Değerlendirme |
| --- | --- |
| Yetki/kapsam | Arşiv yollarında S2/S3 ayrımı ve satır `department_id` tutarlı; P33 kesişimi kaldırılmış; W178 K/Ü gerçek 403 sonuçları mevcut; yeni sızıntı yok |
| Bilet/indirme | Hedef üreticileri kapalı listeyle uyumlu; dönem ZIP'i yalnız program başlığı taşıyor; yaşam döngüsü engeli E-01 |
| Stub/kayıt | 35 bağlı kimlikte kalan stub yok; kısmi satırlar `açık` ve GAP/BE bağlı |
| Pin | `v0.23.0-api` ile **birebir**: 248 işlem, 227 hata kodu (bellekte karşılaştırma); kırıcı farklar ayrı commit/testle |
| Türevler/modül sınırları | Toplu işlem geçersizleme ilişkileri ve rozet senaryoları mevcut; lint bu HEAD'de geçti; kural gevşetmesi yok |
| Faz/gövde | Faz anahtarı F7'de kalmış; F8 yeni ekran açmıyor; gövdesiz parça yok |

### Kanıt sınırları (tur 1)

- Codex hedefli testleri koşamadı (salt okunur ortamda Vitest geçici dizin oluşturamadı; testler başlamadan durdu): **test geçti iddiası yok**.
- W178 gerçek Docker/backend tanığı bu HEAD'in yeniden koşumu değildir (W178 HEAD `b9aab8c`; W179 sonrası ölçüm yok).
- Bu HEAD'in uzak CI durumu bağımsız doğrulanmadı; `../program/` erişilebilir değildi.
- VoiceOver, kullanıcı görsel onayı, Safari/iOS push, ölçülü son görsel eşitlik doğrulanmış sayılmadı. Bilinen kapsam dışı borçlar yeniden bulgu sayılmadı. Tüm dosyaların satır satır kapsandığı iddiası yoktur.
- K-02 kaydı: W170'in "UI değişmedi" ifadesi `work.task.reminder` sözlük girişi (`9a8ed02`) hariç doğrudur; bu görünür değişiklik P69/KESİN 36'dan sapmadır, ürün kusuru değildir.

## Tur 2 — bekliyor

_(W180 birleşince; kapsam: E-01 ve Ö-01 düzeltme doğrulaması + yeniden sınıf taraması; P76: en çok 2 tur, UYGUN DEĞİL → 3)_

## Koşulların kapanışı

_(boş)_

## F8 main birleşmesi ve kapanış kaydı

_(boş; kapanış PR CI SUCCESS ve MERGED sonrası yazılır)_
