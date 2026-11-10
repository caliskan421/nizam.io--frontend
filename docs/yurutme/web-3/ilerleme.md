# WEB-3 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F3 ürün sahibinin onayıyla 2026-11-10'da AÇILDI** (2026-11-09 talimatındaki ön koşul karşılandı).

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| O1 — F3 kabul tablosu (03c) | **Tamam — kabul** (2026-11-10: Codex §6 #11–#12 → P18–P19; P8 bağlayıcı, kendi SVG Gantt) | #65 `fdeaf3e` |
| O2a — Zaman çizelgesi veri katmanı (W91) | **Tamam** (2026-11-10) | #66 `61c8420` |
| O2b — Gantt çekirdeği, çerçeve, panel, sürükleme, 03d (W92–W96) | **Tamam** (2026-11-10; birleştirme sırası W92 → W93 → W94 → W96 → W95) | #67 `b83e2c6`, #68 `846b2d5`, #69 `cebc8a7`, #70 `cc16afb`, #71 `ee6de60` |
| O3 — Entegrasyon turu (W97a + W97b devri) | **Tamam** (2026-11-10; senaryolar 1–10, devir (11)–(15)) | #72 `be4b8a5`, #73 `dc3f84f` |
| O4 — Kapanış | **Belgeler tamam** (rapor-F3, kabul tabloları, F4 kabul tablosu, `web-4/` iskeleti); **doğrulama (`dogrulama-F3.md`) ve Codex kapısı bekliyor** | bu PR |

## Devralınan (WEB-2 O5)

- **Ürün onayı (kapandı 2026-11-10):** F3 geçişi, Codex §6 #11 (P18) ve #12 (P19) onaylandı. **Hâlâ açık:** 03 E-03-14 "Talepleri incele" hedefi (öneri).
- **W97 iş kalemleri** ([oturum-3-entegrasyon.md](oturum-3-entegrasyon.md) (11)–(15)): çip kaldırmada çift bildirim (`use-confirm` devir sayısı); 08 `DepartmentForm` kapsam değişiminde başarı bildirimi; entegrasyon testlerinin yük altında 5 sn'ye yaklaşması; **K-7** giriş formunda istemci doğrulaması yok (boş kimlik bilgisi sunucuya gidiyor); **K-8** 05 yan panel 390 px'te listenin altında açılıyor (görünür alan dışında) — ikisi WEB-2 O5 adım 3 kusurları ([`../web-2/dogrulama-F2.md`](../web-2/dogrulama-F2.md) §5; Codex CX-F2-Ö-03).
- **Codex WEB-2 tur 1 (KOŞULLU UYGUN) koşulları:** CX-F2-Ö-01/Ö-02/K-01/K-03 → W84 (PR #63 `d52510c`, F3 açılmadan); yeni Gantt okuyucuları ilk günden `sessionBound` + signal taşır (`../../reviews/WEB-2-codex.md` "F3 için riskler").
- **Tasarım/ürün kalemleri:** `unlock` simgesi tasarımda yok (`lock`'tan türetildi, P3); W81 aktarım kaynağı seçili program (varsayım).
- **Backend:** `../../backend-eksikleri/rapor-F2.md` §2 — Paket 0.4 (BE-052/051/053/019) ve 3.1 (BE-056) F3 O2a'dan önce bağlanırsa tablo "Şimdilik" yolları canlı alanla güncellenir.
- **Yeni KESİN kurallar:** [ortak-sozlesme.md](ortak-sozlesme.md) 22–27 (iskelet/rota testi gövdeden bağımsız, paylaşılan dosyada ilk işçi, i18n tek ağaç, dal zinciri, `pushAppNotice`/`sessionBound`/`settleQueries`, odak/ARIA dönüşü).

## Bekleyen (O4 sonrası, koordinatör)

- **O4 Codex kapısı bekliyor:** `codex exec -s read-only` tek koşum henüz koşmadı; hüküm `docs/reviews/WEB-3-codex.md` (dosya henüz yok). Koşulları kapatılana dek F3 "kapandı" denmez.
- **Doğrulama:** `dogrulama-F3.md` (paralel işçi, ayrı dal) — tam kapı, iki tema × 390/1024/1440 görsel tur, Admin/Koordinatör/Üye turu, sürükleme + gecikmeli gönderim, 250+ görev kaydırma ölçümü, gerçek imaj tanığı. 03c açık 5 "geçici kabul" satırı (E-03C-19, 27, 41 görsel; E-03C-63, 68 metin) bu sonuçla kapanır.
- **Yönetim deposu:** `program/DURUM.md` tek satır + `gunluk/` satırı koordinatörde (bu depodan yazılmaz).
- **F4 ürün sahibi sorusu:** 09 kabul tablosundaki F4-S1…S10 (cevapsız → geçici kabul; `../../ekranlar/09-toplantilar/README.md`). F4 ürün sahibinin uyarısı/onayı olmadan açılmaz.

## Kayıtlar

### O1 — 2026-11-10 (belge işçisi, dal `web3/o1-kararlar`, taban main `dea40f8`)

- **Kararlar:** ürün sahibi Codex §6 #11 ve #12'yi önerilen varsayılanlarla aynen onayladı → `ortak-kurallar.md` §12 **P18** (tarih düzenleme/talep/iptal 5 sn/otomatik geri al yok) ve **P19** (görünür uçlar arası oklar, bağımlılık eylemleri Admin + Koordinatör, "görev aralığı" şeridi, dışa aktarım pilotla/devre dışı "yakında").
- **03c tablosu:** "geçici kabul (Codex §6 #11/#12)" → "kabul — P18/P19"; durum paragrafı onaylandı olarak yeniden yazıldı. 21 satır "geçici kabul (koordinatör)" (P3 yorumu) olduğu gibi kaldı.
- **F3 açıldı** (2026-11-10): ön koşul (1) ve (3) karşılandı.
- **Backend pini:** hâlâ `v0.11.0-api`; Paket 0.4 / 3.1 BE paketleri yayımlanmadı → 03c "Şimdilik" yolları geçerli.
- **O2a:** W91 başladı (dal `web3/o2-w91`).

### O2a — 2026-11-10 (W91, PR #66 `61c8420`)

- **Kapsam:** `src/modules/timeline` veri katmanı: üç yüz Gantt sorgusu (`adminGantt` S2, `coordinatorGantt`/`memberGantt` S3; yüz kapsamdan türetilir), tarih/talep/bağımlılık yazma sarmalayıcıları (anahtarsız uçlarda kör tekrar yok), tarih talebi okumaları, `capabilities.ts` (**P1: yönetici her yüzde Admin politikası**; P8 yüz × rol × `company_admin` tablo testi), rota `/zaman-cizelgesi` + menü + `CURRENT_PHASE` F3, O2b bileşen iskeleti (`components/index.ts`, on üç bileşen).
- **Ders (KESİN 22 sınandı):** iskelet testi bileşeni bağlamaz, `props`/`emits` bildirimini denetler → W92–W96 gövdeleri dolarken `index.test.ts` kırılmadı.

### O2b — 2026-11-10 (PR #67–#71)

- **W92 (#67 `b83e2c6`):** kendi SVG Gantt çekirdeği — saf hesap (`timeline.ts`, `rows.ts`, `links.ts`), `GanttView`/`Axis`/`Rows`/`Bars`/`Links`, `treegrid` + klavye gezinme, tutamaç çizimi, sanallaştırma (250 görev + 60 bağ testi).
- **W93 (#68 `846b2d5`):** sayfa çerçevesi (`TimelineHead`, `Toolbar`, `RangeStrip`, `Legend`), URL durumu, tam ekran, tavan uyarısı, boş/yükleniyor/hata; 03 E-03-05 segmenti, **03 E-03-14 "Talepleri incele" (P20)**, 08 E-08-86.
- **W94 (#69 `cebc8a7`):** seçili görev paneli, `DateRequestForm` (03 E-03-54/63 aynı form), Admin Kaydet + Onayla/Reddet, bağımlılık ekle/kaldır, Hatırlat stub (BE-008).
- **W96 (#70 `cc16afb`):** 03d alt görev bileşenleri (`SubtaskToggle/Progress/Chip/Mode/Rows`); tek satırda isteğe bağlı okuma, kapalıda istek 0. **Gantt'a bağlama W97a'ya kaldı** (aşağıda).
- **W95 (#71 `ee6de60`):** `useEdgeDrag`/`use-bar-drag`, `useDelayedSend` (5 sn), `useDateChange` (P8 politika), `DateChangeSnack`, klavyeyle tarih (Shift/Alt+Shift+→/←).
- **Zincir:** dal zinciri (KESİN 25) W92 → W93 → W94 → W96 → W95; her PR CI yeşil birleşti.
- **YENİ-EKSİK:** hiçbir W bildirmedi (F3 boyunca yok, `rapor-F3.md` §1).

### O3 — 2026-11-10 (PR #72 `be4b8a5`, #73 `dc3f84f`)

- **W97b (#72):** web-2 devri — (11) çip kaldırmada tek birleşik bildirim; (12) 08 `DepartmentForm` kapsam sonrası davranışı sabitlendi; (13) test `QueryClient` `retryDelay 0` (3 sn gecikmeler); (14) **K-7** giriş formunda istemci doğrulaması; (15) **K-8** 05 yan panel dar ekranda seçimde panele kaydırma + odak (ara genişlikte sarma). **(12) notu:** kapsam değişiminde bağlı sayfa başarı bildirimi + `saved` davranışı sabitlendi (karar borcu aşağıda).
- **W97a (#73):** entegrasyon harness'i (zaman çizelgesi uçları, `seedTimeline`) ve senaryolar 1–10 (`src/app/__tests__/integration/timeline-{views,requests,faces,drag,a11y}.test.ts`). **Entegrasyon turunun bulduğu hatalar (hepsi düzeltildi):** (a) talep/onay sonrası kenar menüsü talep rozeti bayat — `query-keys` `report` geçersizlemesi eklendi; (b) 390 px'te yüzen panel tutamaçları örtüyordu → dar ekranda seçili görev paneli Gantt'ın **altında** akar; (c) 03d bileşenleri Gantt'a bağlı değildi → `buildLayout` alt satır girdisi, `SubtaskToggle/SubtaskRows`, `GanttBar` ilerleme + çip, araç çubuğunda `SubtaskMode`; (d) panel bitişi iki kaynaktı → **tek kaynak `end_on`**, `planned_end_on` salt okunur not. O2b'den kalan TASLAK satırlarının hepsi gerçek bileşenle en az bir senaryoda kapsandı.
- **Test süresi (13):** yük altında 5 sn'ye yaklaşma `retryDelay 0` ile kapandı (süre gevşetilmedi, KESİN 10).

### O4 — 2026-11-10 (belge işçisi, dal `web3/o4-kapanis`, taban main `dc3f84f`)

- **Çıktılar:** `../../backend-eksikleri/rapor-F3.md` (F3 kayıt değişikliği 0 yeni BE; pin yükselince web adımları; **F4 toplantı paketleri önce**); 03c "Kabul kanıtı" sütunu PR numarası + test adıyla dolduruldu; 03 E-03-05/14/54/63 ve 08 E-08-86 kanıtları; F4 kabul tablosu (`../../ekranlar/09-toplantilar/README.md`, E-09-01…84, F4-S1…S10); `../web-4/` iskeleti; `sentez.md` durum satırı.
- **Geçici kabul yeniden değerlendirme (03c):** 20 "geçici kabul (koordinatör)" hücresi (19 tablo satırı + 1 satır dışı varsayım) → **15'i `kabul (koordinatör, F3 kapanışı)`** (kodlandığı haliyle, test adlarıyla); **5'i AÇIK:** E-03C-19, 27, 41 (tasarım artboard farkı → görsel yan yana tur, `dogrulama-F3.md`), E-03C-63, 68 (Admin/Koordinatör bildirim ve yardım metinleri → ürün sahibi metin onayı). Düzeltme: E-03C-56 hedefi `/gorevler?gorev=‹id›` (03'ün gerçek parametresi; belgede `secili` yazıyordu).
- **Kod değişikliği yok** (yalnız `docs/**`). Codex kapısı henüz koşmadı → **O4 Codex kapısı bekliyor**; `docs/reviews/WEB-3-codex.md` bu çalışmada oluşturulmadı.

### Bilinen borçlar (F3 kapanışında)

1. **05 panel kapanışında odak satıra dönmez** (05 kullanıcı satırı odaklanabilir değil).
2. **Ekran okuyucu gerçek cihaz denemesi yapılmadı** (VoiceOver + Safari / NVDA + Firefox; ortamda yok) — `gantt-secimi.md` §8 borcu; `treegrid` rolleri ve klavye turu entegrasyon testlerinde (`timeline-a11y.test.ts`) doğrulandı, gerçek cihaz kanıtı eksik.
3. **`GanttView.vue` 250 satır sınırında** — yeni özellik (ör. 03d genişlemesi) bileşen bölmeden eklenemez.
4. **03d alt görev bloğu satır sayısı** liste gelene kadar 1'dir (kısa kayma); BE-051 (`subtask_counts`) bağlanınca sayıdan hesaplanır (`rapor-F3.md` §2).
5. **W97b (12) kararı:** `DepartmentForm`'da kapsam değişiminde sayfada bağlı kalınınca başarı bildirimi + `saved` davranışı; ürün sahibi aksini söylerse güncellenir.
6. **Yeni dersler → F4 sözleşmesi:** bkz. `../web-4/ortak-sozlesme.md` KESİN 28–32.

