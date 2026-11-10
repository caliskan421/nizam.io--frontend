# O4 — Kapanış

## Açılış istemi

```
WEB-4 O4 oturumunu koordinatör olarak yürüt. Giriş: O2–O3 PR'ları main'de, CI yeşil.
Oku: docs/yurutme/web-4/README.md → oturum-4-kapanis.md → ilerleme.md.
Adımları sırayla uygula. Ürün sahibine soru sorma.
```

## Adımlar

1. **Eksik raporu:** `docs/backend-eksikleri/rapor-F4.md` — `rapor-F3.md` üzerine: F4'te eklenen/değişen BE satırları, `backend'de`/`bağlandı`ya geçenler (pin yükseltildiyse stub kaldırma), **F5'in ihtiyaç duyacakları önce** (tespit raporu Paket 5 — arşiv; **BE-072 engelleyici**). Her paket: amaç, uç/alan önerisi, kabul.
2. **Kabul tabloları:** 09 tablosunun "Kabul kanıtı" sütununa PR numaraları ve test adları (03c kalıbı); ürün sahibi F4-S1…S10'u cevapladıysa `geçici kabul` → `kabul`/`ret`, README durum satırı güncellenir; kalan "geçici kabul (koordinatör)" satırları kapanışta yeniden değerlendirilir. **F5 kabul tablosu:** `docs/ekranlar/06-arsiv/README.md` (Codex §6 #19–#20; cevapsız soru → varsayılan geçici kabul + `ilerleme.md` notu).
3. **Doğrulama:** `main`'de tam kapı (`typecheck`, `lint`, `format:check`, `test`, `build`, `gen:check`) + e2e CI koşumu; 09/09b/09c açık/koyu tema × 1440/1024/390 tasarımla yan yana (kanıt özeti, görüntüler git'e girmez — depo dışı kalıcı yer `<repo>/.git/koordinator/`); ŞY/Koordinatör/Üye yüzü birer tur; yazma güvenliği (anahtarsız uçlar). **Gerçek imaj tanığı:** Docker imajı + Caddy CSP başlığı, gerçek backend — iki tema × 390/1024/1440 taşma, hesaplanmış stil, tüm CSP ihlalleri 0; Docker yerelde yoksa sınır açıkça yazılır (CI `Web imajı` + `Playwright duman (gerçek backend)`). Ortamda yapılamayanlar (gerçek cihaz kanıtı) açıkça borç olarak yazılır (KESİN 32).
4. **Codex kapısı:** `codex exec -s read-only` tek koşum; istem: F4 kabul ölçütleri (09 kabul tablosunun `kabul`/`geçici kabul` satırları, K1/K3/K5/K7/K10/K13/K14 F4 payı, satır dışı varsayımlar), "dosyaları kabuk komutlarıyla oku, ilk eylemde HEAD'i yaz", bilerek yapılmayanlar (video, 09d/09e); yaşam döngüsü bulgusunda sınıf sorusu (web-1 O5 dersi). Hüküm `docs/reviews/WEB-4-codex.md`; araç izi olmayan çıktı kapı sayılmaz. KOŞULLU ise koşullar kapatılır, gerekirse ikinci tur.
5. **Kayıt:** `ilerleme.md` kapanış satırı; yönetim deposu `program/DURUM.md` tek satır + `gunluk/` satırı (yönetim deposu kuralıyla; bu depodan yazılmaz); `sentez.md` durum satırı.
6. **F5 hazırlığı:** `docs/yurutme/web-5/` iskeleti (her W'nin "Tespit" satırı `06-arsiv/` dosyalarına ve kabul tablosuna bağlanır; entegrasyon turu oturumu dahil). **F5, ürün sahibinin uyarısı/onayı olmadan açılmaz** (F4 için verilen kalıp; ürün sahibi aksini söylemedikçe).
