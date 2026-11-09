# O4 — Kapanış

## Açılış istemi

```
WEB-3 O4 oturumunu koordinatör olarak yürüt. Giriş: O2–O3 PR'ları main'de, CI yeşil.
Oku: docs/yurutme/web-3/README.md → oturum-4-kapanis.md → ilerleme.md.
Adımları sırayla uygula. Ürün sahibine soru sorma.
```

## Adımlar

1. **Eksik raporu:** `docs/backend-eksikleri/rapor-F3.md` — `rapor-F2.md` üzerine: F3'te eklenen/değişen BE satırları, `backend'de`/`bağlandı`ya geçenler (Paket 0.4 / 3.1 bağlandıysa pin ve stub kaldırma), **F4'ün ihtiyaç duyacakları önce** (tespit raporu Paket 4 — toplantılar). Her paket: amaç, uç/alan önerisi, kabul.
2. **Kabul tabloları:** 03c tablosunun "Kabul kanıtı" sütununa PR numaraları; Codex §6 #11–#12 ürün sahibince 2026-11-10'da onaylandı (P18–P19), tablo `kabul`; kalan "geçici kabul (koordinatör)" satırları kapanışta yeniden değerlendirilir; 03 E-03-05/14/54/63 ve 08 E-08-86 kabul kanıtı. **F4 kabul tablosu:** `docs/ekranlar/09-toplantilar/README.md` (Codex §6 ilgili sorular; cevapsız soru → varsayılan geçici kabul + `ilerleme.md` notu).
3. **Doğrulama:** `main`'de tam kapı (`typecheck`, `lint`, `format:check`, `test`, `build`, `gen:check`) + e2e CI koşumu; 03c/03d açık/koyu tema × 1440/1024/390 tasarımla yan yana (kanıt özeti, görüntüler git'e girmez — depo dışı kalıcı yer `<repo>/.git/koordinator/`); Admin/Koordinatör/Üye yüzü ve yönetici Koordinatör merceğiyle birer tur; sürükleme + gecikmeli gönderim; 250+ görevde kaydırma ölçümü (`gantt-secimi.md` §4 ile karşılaştırma); ekran okuyucu gerçek cihaz denemesi (VoiceOver + Safari ya da NVDA + Firefox, `gantt-secimi.md` §8). **Gerçek imaj tanığı:** Docker imajı + Caddy CSP başlığı, gerçek backend — iki tema × 390/1024/1440 taşma, hesaplanmış stil, tüm CSP ihlalleri 0; Docker yerelde yoksa sınır açıkça yazılır (CI `Web imajı` + `Playwright duman (gerçek backend)`).
4. **Codex kapısı:** `codex exec -s read-only` tek koşum; istem: F3 kabul ölçütleri (03c kabul tablosunun `kabul`/`geçici kabul` satırları, K3/K4/K5/K7/K13 F3 payı, P8, satır dışı varsayımlar), "dosyaları kabuk komutlarıyla oku, ilk eylemde HEAD'i yaz", bilerek yapılmayanlar; yaşam döngüsü bulgusunda sınıf sorusu (web-1 O5 dersi). Hüküm `docs/reviews/WEB-3-codex.md`; araç izi olmayan çıktı kapı sayılmaz. KOŞULLU ise koşullar kapatılır, gerekirse ikinci tur.
5. **Kayıt:** `ilerleme.md` kapanış satırı; yönetim deposu `program/DURUM.md` tek satır + `gunluk/` satırı (yönetim deposu kuralıyla; bu depodan yazılmaz); `sentez.md` durum satırı.
6. **F4 hazırlığı:** `docs/yurutme/web-4/` iskeleti (her W'nin "Tespit" satırı `09-toplantilar/` dosyalarına ve kabul tablosuna bağlanır; entegrasyon turu oturumu dahil). **F4, ürün sahibinin uyarısı/onayı olmadan açılmaz** (F3 için verilen 2026-11-09 talimatının kalıbı; ürün sahibi aksini söylemedikçe).
