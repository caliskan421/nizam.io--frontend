# O5 — Kapanış

## Açılış istemi

```
WEB-1 O5 oturumunu koordinatör olarak yürüt. Giriş: O2–O4 PR'ları main'de, CI yeşil.
Oku: docs/yurutme/web-1/README.md → oturum-5-kapanis.md → ilerleme.md.
Adımları sırayla uygula. Ürün sahibine soru sorma.
```

## Adımlar

1. **Eksik raporu:** `docs/backend-eksikleri/rapor-F1.md` — `rapor-F0.md` üzerine: F1'de eklenen/değişen BE satırları, `backend'de`/`bağlandı`ya geçenler (pin yükseltildiyse), **F2'nin ihtiyaç duyacakları önce** (tespit raporu Paket 2: BE-041…045, BE-011/012, BE-048…050, BE-001). Her paket: amaç, uç/alan önerisi, kabul.
2. **F2 kabul tabloları:** `docs/ekranlar/05-kullanicilar/README.md` ve `08-koordinatorlukler/README.md` uygulama kararı tabloları (`sentez.md` §4 soru 13–18 cevaplarıyla); cevapsız soru → `ortak-kurallar.md` varsayılanı geçici kabul + `ilerleme.md` notu. W22 F2 devirleri (yönetim rotaları açık durumdan muaf, yöneticide "departman katılmamış" tespiti) ve Yönetim grubu `capabilities.ts` taşıması F2 kabul tablosuna girer.
3. **Doğrulama:** `main`'de tam kapı (`typecheck`, `lint`, `format:check`, `test`, `build`, `gen:check`) + e2e CI koşumu; 03 ve 01 ekranları açık/koyu tema × 1440/1024/390 genişlikte tasarımla yan yana (kanıt özeti, görüntüler git'e girmez); Admin/Koordinatör/Üye mercekleriyle birer tur.
4. **Codex kapısı:** `codex exec -s read-only` tek koşum; istem: F1 kabul ölçütleri (03 ve 01 kabul tablolarının `kabul` satırları, K3/K5/K7/K11/K13 F1 payı), "dosyaları kabuk komutlarıyla oku, ilk eylemde HEAD'i yaz", bilerek yapılmayanlar. Hüküm `docs/reviews/WEB-1-codex.md`; araç izi olmayan çıktı kapı sayılmaz. KOŞULLU ise koşullar kapatılır, gerekirse ikinci tur.
5. **Kayıt:** `ilerleme.md` kapanış satırı; yönetim deposu `program/DURUM.md` tek satır + `gunluk/` satırı (yönetim deposu kuralıyla); `sentez.md` §8 durum satırı.
6. **F2 hazırlığı:** `docs/yurutme/web-2/` iskeleti (her W'nin "Tespit" satırı `05-kullanicilar/` ve `08-koordinatorlukler/` dosyalarına ve kabul tablosuna bağlanır).
