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
| `00-ortak` | Ortak · Kenar menüsü; Ortak · Kenar menüsü › Program, rol, koordinatörlük; üst çubuk (her ekranda); tema geçişi | F0 | ✓ |
| `01-ana-sayfa` | 01 · Ana sayfa; A1 · Açık tema › Ana sayfa | F1 (sade) / F6 (tam) | ✓ (sade) |
| `01b-islem-gecmisi` | 01b · Ana sayfa › İşlem geçmişi | sonra | — |
| `03-gorevler-liste` | 03 · Görevler › Liste; A2 · Açık tema › Görevler | F1 | ✓ |
| `03c-zaman-cizelgesi` | 03c · Görevler › Zaman çizelgesi; 03d · Görevler › Alt görevler ve zaman çizelgesi | F3 | ✓ |
| `05-kullanicilar` | 05 · Kullanıcılar; 05b · Kullanıcı › Kişisel takip | F2 | ✓ |
| `06-arsiv` | 06 · Arşiv; 07 · Arşiv › Klasör | F5 | — |
| `08-koordinatorlukler` | 08 · Koordinatörlükler; 08b · Koordinatörlük › Altyapı ve tesisat | F2 | ✓ |
| `09-toplantilar` | 09 · Toplantılar; 09b · Toplantı › Haftalık koordinasyon; 09c · Toplantı › Pencereler; 09d · Görüşme (tam ekran); 09e · Küçültülmüş görüşme | F4 (09d/09e statik) | ✓ |
| `10-mesajlar` | 10 · Mesajlar › Genel grup; 10b · Üye görünümü; 10c · Pencereler; A3 · Açık tema › Mesajlar | F7 | — |
| `11-tablolar` | 11 · Tablolar; 11b · Fuar haftası vardiya planı; 11c · Paylaş; 11d · Tablo bağlantısı; 11e · Birlikte çalışma; A4 · Açık tema › Tablo | sonra | — |
| `12-silinen-kayitlar` | 01d · Silinen kayıtlar › seçilen · silinme tarihi sütunu (01c önceki seçenek) | F5 | — |
| `13-raporlar` | 01i · Raporlar › Her rapor kendi yerinde; 01f · Arşiv › Dönem sonu raporu önizleme; 01g · Toplantı › Toplantı raporu önizleme; 01h · Raporlar › Pencereler, durumlar ve iş yükü seçici (yalnız durum kartları/ZIP onayı/kâğıt içerikleri; 01e · Raporlar ve A5 önceki seçenek, uygulanmaz) | F6 | — |

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
**Durum notu (2026-11-14): F7 açıldı** ("F7'yi aç, backend dursun"; kapsam P54: sohbet 10/10b/10c + bildirimler `14-bildirimler` + kabuk Mesajlar/zil paneli; Web Push P58 onayına bağlı). F6 KAPANDI. P57–P66 koordinatör varsayılanı olarak [ortak-kurallar §12](ortak-kurallar.md)'de taslaktır; §5 F7 eki matrisi verir. Yürütme: [web-7](../yurutme/web-7/README.md).

- Her tespit konumlanır: `ozellikler.md` bölge adı ↔ `mekanizma.md` davranış ↔ `backend.md` uç ↔ `eksikler.md` satır, aynı **öğe kimliği** ile (`E-<grup>-NN`, ör. `E-03-07`).
- Varsayım yazılırsa `**Varsayım:** … (doğrulanacak: …)` biçimindedir ve neyin doğrulanacağı söylenir. Bilinmeyen "bilinmiyor" diye yazılır, uydurulmaz. Varsayımın uygulama durumu (öneri / kabul / ret) grup README'sindeki tabloda tutulur, dosya içinde değil.
- Ortak kural (sorgu anahtarı, capability, hata davranışı, faz görünürlüğü) grup dosyasında **yeniden yazılmaz**; `ortak-kurallar.md`'ye başvurulur.
- Yol haritası kararıyla çelişen tasarım öğesi (ör. K14 v1 dışı modül) silinmez; "v1 dışı / statik" diye işaretlenir.

## Durum

| Klasör | ozellikler | mekanizma | backend | eksikler | dogrulama | Codex |
|---|---|---|---|---|---|---|
| `00-ortak` | **kabul** | **kabul** | **kabul** | **kabul** | denetlendi | koşullu uygun; rol menüleri (E-00-41…47) **uygulandı (F6)**, kanıt grup README |
| `01-ana-sayfa` | **kabul** | **kabul** | **kabul** | **kabul** | denetlendi | koşullu uygun; F6 satırları + K1/Ü1 **uygulandı (F6)**, kanıt grup README |
| `01b-islem-gecmisi` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun |
| `03-gorevler-liste` | **kabul** | **kabul** | **kabul** | **kabul** | denetlendi | koşullu uygun |
| `03c-zaman-cizelgesi` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun |
| `05-kullanicilar` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun |
| `06-arsiv` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | uygulandı (F5), Codex UYGUN (WEB-5) |
| `08-koordinatorlukler` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun |
| `09-toplantilar` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun |
| `10-mesajlar` | **kabul** (F7 eki W151) | **kabul** (F7 eki W151) | **kabul** (F7 eki W151) | **kabul** (F7 eki W151) | öz denetim (W151); bağımsız denetçi bekliyor | koşullu uygun; F7 eki Codex bekliyor |
| `11-tablolar` | denetlendi | denetlendi | denetlendi | denetlendi | denetlendi | koşullu uygun |
| `12-silinen-kayitlar` | tespit (W119) | tespit (W119) | tespit (W119) | tespit (W119) | öz denetim (W119); **uygulandı (F5), Codex UYGUN (WEB-5)** | UYGUN (WEB-5) |
| `13-raporlar` | **kabul** (P46–P53; öneri satırları açık sorularda) | **kabul** | **kabul** | **kabul** | öz denetim (W134); bağımsız denetçi bekliyor; gerçek sunucu tanığı W144 bekliyor | **uygulandı (F6)** (#122–#134); Codex WEB-6 3 tur UYGUN, F6 KAPANDI (2026-11-14) |

Durum değerleri (CX-M-01): `—` yok · `taslak` · `denetlendi` (denetçi + Codex bulguları işlendi; **tespit tamam**) ·
`karar bekliyor` (ürün sahibi soruları açık — `sentez.md` §4) · `kabul` (faz açılışında koordinatör: uygulama kararı tablosu dolu,
kaynak sürümü ve açık engeller yazılı; uygulayıcıya referans olmaya hazır). 2026-11-08 akşamı ürün sahibi `sentez.md` §4 sorularını cevapladı (`ortak-kurallar.md` §12 P1–P11); `00-ortak`, `01-ana-sayfa`, `03-gorevler-liste` uygulama kararı tabloları dolu → `kabul`. Diğer gruplar fazları açılırken `kabul` alır.
