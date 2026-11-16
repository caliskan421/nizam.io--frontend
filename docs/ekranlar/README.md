# Ekran dosyaları — tasarımdan uygulamaya tespit kaydı

Bu klasör, **"(Doğan) RoketPortal — Yeniden Tasarım"** tuvalindeki her ekranın web'de birebir uygulanması için
gereken tespitleri ekran başına toplar. Uygulama oturumları kodu buradaki dosyalardan yazar; tasarım kopyasını
(`../tasarim/kaynak/`) yalnız şüphede açar.

Kaynak sırası çelişkide: backend sözleşmesi (`../../../nizam.io--backend/docs/api/`) → yol haritası
(`../architecture/yol-haritasi-web.md`, K1–K15) → bu klasör → tasarım kopyası. Bu klasör karar vermez;
tespit eder ve kararı gereken yere (yol haritası, eksik kaydı) işaret eder.

## Klasör düzeni

```
docs/ekranlar/
  README.md                 bu dosya — düzen, akış, durum tablosu
  ortak-kurallar.md         gruplar arası TEK sözleşme: mercek≠yetki, varsayım durumları, designStub sınırı, statik≠sahte veri,
                            faz görünürlük matrisi, ortak sorgu anahtarları, yazma protokolü ayrıntıları, logout hatası (Codex CX-M/CX-T)
  sentez.md                 koordinatör sentezi: bağlayıcı sözleşme gerçekleri, yol haritası etkisi, eksik kaydı kararları,
                            ürün sahibi soruları, işletme sırası, Codex kararlarının uygulanma durumu
  _sablon/                  altı dosyanın boş şablonları (yeni ekran eklerken kopyalanır)
  <NN-slug>/                ekran grubu (tuvaldeki numara + Türkçe kısa ad)
    README.md               grup kimliği: artboard'lar, faz, v1 durumu, tek paragraf özet, dosya durumları, **uygulama kararı tablosu**
    ozellikler.md           NE görünüyor — bölge bölge her öğe, metinler, durumlar, açık tema farkı
    mekanizma.md            NASIL davranıyor — gezinme, durum makinesi, süzgeç/sıralama, pencereler, rol/kapsam etkisi, boş/yükleniyor/hata
    backend.md              NEREDEN geliyor — öğe → operationId/alan eşlemesi, kapsam başlıkları, hata kodları, yazma protokolü
    eksikler.md             NE YOK — backend'de karşılığı olmayan öğeler, mevcut BE-NNN bağları, yeni satır önerileri, "şimdilik" kararı
    dogrulama.md            (isteğe bağlı) bağımsız denetim notu — çelişki, eksik, düzeltme
```

Açık tema varyantları (A1–A4) ayrı grup değildir; ilgili grubun `ozellikler.md` dosyasında "Açık tema" bölümü olur
(tuval kopyasında bu dosyalar yalnız `default: light` ile farklıdır).

## Ekran grupları

| Klasör | Artboard'lar (tuval başlığı) | Faz | v1 |
|---|---|---|---|
| `00-ortak` | Ortak · Kenar menüsü; Ortak · Kenar menüsü › Program, rol, koordinatörlük; üst çubuk (her ekranda); tema geçişi | F0 | ✓ · **F8: canlıya alma uygulandı (W173, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `01-ana-sayfa` | 01 · Ana sayfa; A1 · Açık tema › Ana sayfa | F1 (sade) / F6 (tam) | ✓ (sade) · **F8: canlıya alma uygulandı (W171/W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `01b-islem-gecmisi` | 01b · Ana sayfa › İşlem geçmişi | sonra | — |
| `03-gorevler-liste` | 03 · Görevler › Liste; A2 · Açık tema › Görevler | F1 | ✓ · **F8: canlıya alma uygulandı (W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `03c-zaman-cizelgesi` | 03c · Görevler › Zaman çizelgesi; 03d · Görevler › Alt görevler ve zaman çizelgesi | F3 | ✓ · **F8: canlıya alma uygulandı (W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `05-kullanicilar` | 05 · Kullanıcılar; 05b · Kullanıcı › Kişisel takip | F2 | ✓ · **F8: canlıya alma uygulandı (W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `06-arsiv` | 06 · Arşiv; 07 · Arşiv › Klasör | F5 | — · **F8: canlıya alma uygulandı (W171, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `08-koordinatorlukler` | 08 · Koordinatörlükler; 08b · Koordinatörlük › Altyapı ve tesisat | F2 | ✓ · **F8: canlıya alma uygulandı (W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `09-toplantilar` | 09 · Toplantılar; 09b · Toplantı › Haftalık koordinasyon; 09c · Toplantı › Pencereler; 09d · Görüşme (tam ekran); 09e · Küçültülmüş görüşme | F4 (09d/09e statik) | ✓ · **F8: canlıya alma uygulandı (W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `10-mesajlar` | 10 · Mesajlar › Genel grup; 10b · Üye görünümü; 10c · Pencereler; A3 · Açık tema › Mesajlar | F7 | — |
| `11-tablolar` | 11 · Tablolar; 11b · Fuar haftası vardiya planı; 11c · Paylaş; 11d · Tablo bağlantısı; 11e · Birlikte çalışma; A4 · Açık tema › Tablo | sonra | — |
| `12-silinen-kayitlar` | 01d · Silinen kayıtlar › seçilen · silinme tarihi sütunu (01c önceki seçenek) | F5 | — · **F8: canlıya alma uygulandı (W174, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `13-raporlar` | 01i · Raporlar › Her rapor kendi yerinde; 01f · Arşiv › Dönem sonu raporu önizleme; 01g · Toplantı › Toplantı raporu önizleme; 01h · Raporlar › Pencereler, durumlar ve iş yükü seçici (yalnız durum kartları/ZIP onayı/kâğıt içerikleri; 01e · Raporlar ve A5 önceki seçenek, uygulanmaz) | F6 | — · **F8: canlıya alma uygulandı (W171/W172, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `14-bildirimler` | Ortak · Zil, bildirim paneli ve Web Push izni (`Bildirimler.dc.html`: 1a zilin durumları, 1b panel, 1c satır durumları, 1d boş durum ve gruplama, 2 Web Push izin akışı; 3 Profilim bildirim tercihleri **uygulanmaz**, F7 dışı) | F7 | — · **F8: canlıya alma uygulandı (W175 (yalnız `work.task.reminder`), pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |

Dosya adı → artboard eşlemesi `../tasarim/kaynak/canvas.json` içindedir (`boards[*].title`).

## Üretim akışı (tespit oturumu)

1. **Tasarım analisti** (ekran başına, paralel): tasarım kopyasını okur → `ozellikler.md` + `mekanizma.md`.
2. **Backend analisti** (ekran başına, paralel; 1 bittikten sonra): `ozellikler.md` + `mekanizma.md` + `openapi.yaml` + `istemci-akislari.md` + `error-codes.json` → `backend.md` + `eksikler.md`.
3. **Denetçi** (bağımsız, daha küçük model): dört dosyayı tasarım ve sözleşmeyle çapraz okur → `dogrulama.md`; düzeltme gerekirse koordinatör ilgili analiste geri verir.
4. **Codex kapısı** (salt okunur, tek koşum): klasörün tamamı için işletme kararları ve eleştiri → `../reviews/EKRANLAR-codex.md`; makul olanlar uygulanır, uygulanan/reddedilen kararlar `sentez.md` §7'de.
5. Koordinatör durum tablosunu (aşağıda) günceller. Eksik satırları `../backend-eksikleri/kayit.md`'ye **koordinatör** taşır; analistler yalnız önerir.

Bu akış 2026-11-08'de tamamlandı (Codex: KOŞULLU UYGUN). Sonraki tespit turları aynı akışla yapılır.

## Kullanım (uygulama oturumu)

Bir ekranı yapan uygulayıcıya istemde şu sıra verilir: `ortak-kurallar.md` → grup `README.md` (uygulama kararı tablosu dahil)
→ `mekanizma.md` → `backend.md` → `eksikler.md` → `ozellikler.md` (görsel ayrıntı için). Tasarım kopyası yalnız
`ozellikler.md`'nin yetmediği yerde açılır (görsel doğrulama kaynağı olarak kalır).

- **`designStub` yalnız** uygulanmış arayüzdeki, `kayit.md`'de `açık`/`backend'de` satırı olan **kabul edilmiş işlev eksikliğine** bağlanır
  (`ortak-kurallar.md` §3). Belge eksiği, faz ertelemesi, gizli modül, ürün kararı bekleyen seçenek ve tasarımın sözleşmeye uydurulacağı
  yerler stub almaz.
- **Varsayım uygulama yetkisi değildir** (`ortak-kurallar.md` §2): uygulayıcı yalnız grup README'sindeki uygulama kararı tablosunda
  `kabul` olan varsayımları kodlar; karar yoksa en dar güvenli davranış (gizli/devre dışı) + rapora "karar bekliyor".
- Statik öğe **sahte işletme verisi üretmez** (`ortak-kurallar.md` §4).

## Yazım kuralları

- Dil Türkçe; backend kimlikleri (`operationId`, alan adı, hata kodu) ve CSS sınıfları olduğu gibi.
- Örnek veriler (`renderVals()`) **gerçek veri değildir**: biçim/şekil kanıtı olarak kullanılır, değerler kopyalanmaz.
**F7 KAPANDI — 2026-11-15 (bu kayıt kapanış PR’ının CI başarılı birleşmesiyle yürürlüğe girer).** W166 [#152](https://github.com/caliskan421/nizam.io--frontend/pull/152) main `ffc29374465e78c8da08ff43f4bf5d2b185144bb` ile birleşti; [CI 43644068102](https://github.com/caliskan421/nizam.io--frontend/actions/runs/43644068102) kalite, web imajı ve gerçek backend Playwright işlerinin üçünde de **SUCCESS**. CI test toplamı ayrıca alınamadı; sayı iddia edilmez. Codex dört turu: tur 1 UYGUN DEĞİL; tur 2 ve tur 3 KOŞULLU UYGUN; tur 4 yalnız Ö-06/Ö-07 düzeltme doğrulaması UYGUN (`68deaa9`), test-only `dc876ed` ek incelemesinde UYGUN korundu. Önceki koşullar kapalı; tur 4 bütün F7’yi baştan denetlemedi. Kapanış kaydı bu belge PR’ı ile teslim edilir; geçerlilik şartı CI SUCCESS ve MERGED, birleşme kanıtı GitHub PR kaydıdır. F8 AÇILMADI; backend paketi ve pin `v0.15.0-api` değişmedi. W162 gerçek sunucu tanığı #148 ile alındı. 10/14/00 uygulama kanıtları kendi tarihsel HEAD ve kapsamlarıyla korunur. P57–P66 [ortak-kurallar §12](ortak-kurallar.md) kesin; [yürütme](../yurutme/web-7/README.md).

**F8 KAPANDI — 2026-11-16 (kapanış PR'ının CI başarılı birleşmesiyle yürürlüğe girer).** Codex 2 tur (UYGUN DEĞİL → UYGUN); F8 kodu main `d183dc7`'de (#154–#167); canlanan ekran yüzleri 00, 01, 03, 03c, 05/05b, 06, 08, 09, 12, 13, 14 grup README'lerinin "F8 eki" bölümlerinde test adlarıyla kayıtlıdır (Kanıt sütunu); backend `backend.md` Sürüm satırları pin `v0.23.0-api`'yi gösterir (01, 03, 06, 09, 12, 13 ve W177'de 00, 03c, 05, 08); 01b, 10, 11 F8 dışıdır. Backend `v0.24.0-api` (BE-F7) çıktı: sohbet/bildirim canlıya alma F9 önerisidir ([web-9](../yurutme/web-9/README.md), [rapor-F8](../backend-eksikleri/rapor-F8.md)).

**F8 AÇILDI — 2026-11-15 (P67).** Pin `v0.15.0-api` → `v0.23.0-api` (UI değişmez) + canlıya alma turu: arşiv + ZIP, raporlar, K1/Ü1 + görev kodu, silinenler, toplantılar + organizasyon CSV + bildirim sözlüğü. Yeni ekran/tespit grubu yok; ekran grubu README'lerine "F8 eki" W169 ile eklenir (canlıya alma matrisi). Sohbet/bildirim stub'ları, Takvim, Kurumsal hafıza, Tablolar, 01b, Ü7, paneller, Asistan F8 dışı (F9 adayı). Karar kaydı: [ortak-kurallar §12 P67–P74](ortak-kurallar.md); plan: [web-8](../yurutme/web-8/README.md). Yukarıdaki "F8 AÇILMADI" ifadeleri F7 kapanış anının tarihsel kaydıdır.

- Her tespit konumlanır: `ozellikler.md` bölge adı ↔ `mekanizma.md` davranış ↔ `backend.md` uç ↔ `eksikler.md` satır, aynı **öğe kimliği** ile (`E-<grup>-NN`, ör. `E-03-07`).
- Varsayım yazılırsa `**Varsayım:** … (doğrulanacak: …)` biçimindedir ve neyin doğrulanacağı söylenir. Bilinmeyen "bilinmiyor" diye yazılır, uydurulmaz. Varsayımın uygulama durumu (öneri / kabul / ret) grup README'sindeki tabloda tutulur, dosya içinde değil.
- Ortak kural (sorgu anahtarı, capability, hata davranışı, faz görünürlüğü) grup dosyasında **yeniden yazılmaz**; `ortak-kurallar.md`'ye başvurulur.
- Yol haritası kararıyla çelişen tasarım öğesi (ör. K14 v1 dışı modül) silinmez; "v1 dışı / statik" diye işaretlenir.

## Durum

| Klasör | ozellikler | mekanizma | backend | eksikler | dogrulama | Codex |
|---|---|---|---|---|---|---|
| `00-ortak` | **kabul** | **kabul** | **kabul** | **kabul** | denetlendi | koşullu uygun; rol menüleri (E-00-41…47) **uygulandı (F6)**, Mesajlar menü/rozeti ve zil paneli (E-00-20/21/38) **uygulandı (F7)**, kanıt grup README; WEB-7 koşulları kapalı; F7 kapanışı bu belge PR’ının CI başarılı birleşmesiyle yürürlüğe girer · **F8: canlıya alma uygulandı (W173, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `01-ana-sayfa` | **kabul** | **kabul** | **kabul** | **kabul** | denetlendi | koşullu uygun; F6 satırları + K1/Ü1 **uygulandı (F6)**, kanıt grup README · **F8: canlıya alma uygulandı (W171/W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `01b-islem-gecmisi` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun |
| `03-gorevler-liste` | **kabul** | **kabul** | **kabul** | **kabul** | denetlendi | koşullu uygun · **F8: canlıya alma uygulandı (W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `03c-zaman-cizelgesi` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun · **F8: canlıya alma uygulandı (W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `05-kullanicilar` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun · **F8: canlıya alma uygulandı (W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `06-arsiv` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | uygulandı (F5), Codex UYGUN (WEB-5) · **F8: canlıya alma uygulandı (W171, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `08-koordinatorlukler` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun · **F8: canlıya alma uygulandı (W173/W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `09-toplantilar` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun · **F8: canlıya alma uygulandı (W175, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `10-mesajlar` | **kabul** (F7 eki W151) | **kabul** (F7 eki W151) | **kabul** (F7 eki W151) | **kabul** (F7 eki W151) | öz denetim (W151); WEB-7 dört tur tamam (son tur yalnız Ö-06/Ö-07); gerçek sunucu tanığı alındı (W162, dogrulama-F7) | **uygulandı (F7)** (#141, #143, #144, #146, #147); koşullu uygun (tespit); WEB-7 koşulları kapalı; F7 KAPANDI — bu belge PR’ının CI başarılı birleşmesiyle yürürlüğe girer |
| `11-tablolar` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun |
| `12-silinen-kayitlar` | tespit (W119) | tespit (W119) | tespit (W119) | tespit (W119) | öz denetim (W119); **uygulandı (F5), Codex UYGUN (WEB-5)** | UYGUN (WEB-5) · **F8: canlıya alma uygulandı (W174, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `13-raporlar` | **kabul** (P46–P53; öneri satırları açık sorularda) | **kabul** | **kabul** | **kabul** | öz denetim (W134); bağımsız denetçi bekliyor; gerçek sunucu tanığı W144 bekliyor | **uygulandı (F6)** (#122–#134); Codex WEB-6 3 tur UYGUN, F6 KAPANDI (2026-11-14) · **F8: canlıya alma uygulandı (W171/W172, pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |
| `14-bildirimler` | **kabul** (W152; P54–P66 kesin, ürün sahibi onayı 2026-11-14; F7 kanıtı W161) | **kabul** | **kabul** | **kabul** | öz denetim (W152); WEB-7 dört tur tamam (son tur yalnız Ö-06/Ö-07); gerçek sunucu tanığı alındı (W162, dogrulama-F7) | **uygulandı (F7)** (#141, #142, #145, #147); WEB-7 koşulları kapalı; F7 KAPANDI — bu belge PR’ının CI başarılı birleşmesiyle yürürlüğe girer · **F8: canlıya alma uygulandı (W175 (yalnız `work.task.reminder`), pin v0.23.0-api; Codex UYGUN, kapanış PR bekliyor)** |

Durum değerleri (CX-M-01): `—` yok · `taslak` · `denetlendi` (denetçi + Codex bulguları işlendi; **tespit tamam**) ·
`karar bekliyor` (ürün sahibi soruları açık — `sentez.md` §4) · `kabul` (faz açılışında koordinatör: uygulama kararı tablosu dolu,
kaynak sürümü ve açık engeller yazılı; uygulayıcıya referans olmaya hazır). 2026-11-08 akşamı ürün sahibi `sentez.md` §4 sorularını cevapladı (`ortak-kurallar.md` §12 P1–P11); `00-ortak`, `01-ana-sayfa`, `03-gorevler-liste` uygulama kararı tabloları dolu → `kabul`. Diğer gruplar fazları açılırken `kabul` alır.
