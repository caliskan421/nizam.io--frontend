# O4 — Gantt kütüphane pilotu (W31, ayrı çıkış ölçütü)

## Açılış istemi

```
WEB-0 O4 oturumunu koordinatör olarak yürüt. Giriş: O2 PR'ları main'de.
Oku: docs/yurutme/web-0/README.md → ortak-sozlesme.md → oturum-4-gantt-pilot.md.
W31'i başlat; sonuç bir karar kaydıdır, ürün kodu main'e girmez (yalnız rapor + karar).
```

## W31

- **Sahip:** `pilot/gantt/**` (yeni, birleşmez), `docs/architecture/gantt-secimi.md` (yeni; birleşir).
- **Tasarım:** `Gorevler-Zaman.dc.html`, `Gorevler-AltGorev.dc.html`, `theme.css` `--gp-*`.
- **İş:** 2–3 aday (açık kaynak Vue/vanilla Gantt kütüphaneleri + kendi SVG çizimi) aynı sahte veriyle: 250 görev + 60 bağımlılık (`GanttTask`/`GanttLink` şeması), hafta ölçeği, lejant renkleri, çubuk ucunu sürükleme olayı (tarih talebi akışına bağlanacak), satır açma (alt görev — BE-020 statik). Paket ekleme yalnız `pilot/` altında, kök `package.json`'a girmez.
- **Ölçütler (puan tablosu):** bağımlılık okları; 250 satırda kaydırma/ilk çizim süresi; klavye ve ekran okuyucu; CSP nonce uyumu (satır içi stil/eval yok — `src/app/csp-nonce.ts`); lisans (ticari kullanım); paket boyutu; tasarıma birebir uyarlanabilirlik; bakım durumu.
- **Çıkış:** `gantt-secimi.md` puan tablosu + öneri; koordinatör kararı yol haritası K4'e işlenir. Kütüphane kurulumu F3'te.
