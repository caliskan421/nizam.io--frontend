# O4 — Gantt kütüphane pilotu (W31, ayrı çıkış ölçütü)

## Açılış istemi

```
WEB-0 O4 oturumunu koordinatör olarak yürüt. Giriş: O2 PR'ları main'de.
Oku: docs/yurutme/web-0/README.md → ortak-sozlesme.md → oturum-4-gantt-pilot.md → docs/ekranlar/03c-zaman-cizelgesi/
(mekanizma.md §8.1 pilot yetenek listesi; backend.md §6 "Pilot yetenekleri → veri gereksinimi" tablosu; ozellikler.md §1–§2).
W31'i başlat; sonuç bir karar kaydıdır, ürün kodu main'e girmez (yalnız rapor + karar).
```

## W31

- **Sahip:** `pilot/gantt/**` (yeni, birleşmez), `docs/architecture/gantt-secimi.md` (yeni; birleşir).
- **Tespit:** `docs/ekranlar/03c-zaman-cizelgesi/` — 17 maddelik pilot yetenek listesi (`mekanizma.md` §8.1) ve hangilerinin veri gerektirdiği (`backend.md` §6: 1, 2, 3, 7, 8, 12 veri; kalanı istemci). Tasarım (görsel doğrulama): `Gorevler-Zaman.dc.html`, `Gorevler-AltGorev.dc.html`, `theme.css` `--gp-*`.
- **İş:** 2–3 aday (açık kaynak Vue/vanilla Gantt kütüphaneleri + kendi SVG çizimi) aynı sahte veriyle: 250 görev + 60 bağımlılık (gerçek `GanttTask`/`GanttLink` şeması — görev kodu, departman adı, atanan adı, bekleyen talep, alt görev sayacı **yanıtta yok**, BE-051 ve 03c eksikleri), gün/hafta ölçeği, lejant renkleri (`--gp-*`), bugün çizgisi, çubuk ucunu sürükleme olayı (yüze göre doğrudan `updateWorkItem`/`extendWorkItem` ya da talep — ürün sorusu #11), gruplu satırlar (koordinatörlük), satır açma (alt görev — ADR-0024, statik), bağımlılık okları `links`'ten (üye yüzünde de dolu), 200 satır kesilme uyarısı (BE-019). Paket ekleme yalnız `pilot/` altında, kök `package.json`'a girmez.
- **Ölçütler (puan tablosu):** bağımlılık okları; 250 satırda kaydırma/ilk çizim süresi; klavye ve ekran okuyucu; CSP nonce uyumu (satır içi stil/eval yok — `src/app/csp-nonce.ts`); lisans (ticari kullanım); paket boyutu; tasarıma birebir uyarlanabilirlik; bakım durumu.
- **Çıkış:** `gantt-secimi.md` puan tablosu + öneri; koordinatör kararı yol haritası K4'e işlenir. Kütüphane kurulumu F3'te.
