# Backend eksikleri kaydı

Tasarım birebir uygulanır ([yol haritası K13](../architecture/yol-haritasi-web.md)); backend'de karşılığı olmayan alan ya da eylem web'de **statik** gösterilir ve burada bir satır olur. Bu klasör, web ilerlerken eksikleri paralel bir backend ajanına devretmenin tek kaynağıdır.

## Dosyalar

- [`kayit.md`](kayit.md) — bütün eksikler, tek tablo. Satır silinmez; durum değişir.
- `rapor-F<N>.md` — her faz kapanışında üretilen devir raporu: o fazda eklenen/kapanan satırlar, backend için önerilen iş paketleri ve sıra.

## Satır biçimi

| Sütun | Anlam |
|---|---|
| `BE-NNN` | Kimlik; sırayla verilir, yeniden kullanılmaz |
| Faz | Ekranın fazı (F0–F8, `sonra`) |
| Ekran | Tasarım tuvalindeki artboard (`03 Görevler › Liste`) |
| Tasarım öğesi | Görünen şey (sayaçlı durum sekmeleri) |
| Eksik | Hangi uç/alan/kural yok — mümkünse `operationId` ve alan adı |
| Şimdilik | Web'de ne gösteriliyor (statik değer, devre dışı düğme, istemcide hesap) |
| Bağ | İlgili GAP/KR/ADR/kural kimliği; yoksa `yeni` |
| Boyut | S / M / L (backend tahmini) |
| Durum | `açık` → `backend'de` (etiket adıyla) → `bağlandı` (web PR'ı) · `vazgeçildi` (gerekçe) |

## Kod ile bağ

Statik öğe kodda `designStub('BE-NNN', değer)` (ya da bileşende `<DesignStub id="BE-NNN">`) ile işaretlenir. `tests/lint/design-stub.test.ts`: koddaki her kimlik kayıtta `açık`/`backend'de` durumunda olmalı; `bağlandı` bir kimlik kodda kalmamalı. Statik öğe geliştirme yapısında kesikli çerçeveyle işaretlenir, üretimde normal görünür ama eylem tetiklemez (düğme devre dışı + "yakında" ipucu).

## Karşılanan satır kuralı (F8)

F5 ve F6 hiçbir satırı kapatmadı: `git log` ve Durum sütunu dağılımı gösterir ki F5/F6 yalnız yeni satır ekledi (BE-108…BE-141) ve Durum sütununu yalnız `açık` bıraktı (`c45db1c`: notlar Durum'dan Bağ sütununa taşındı). Satır kapatma kalıbı tek yerde var: WEB-P (pin v0.15.0-api) satırları silmeden Durum'u `bağlandı (pin vX.Y.Z-api, <iş>)` yaptı. F8 için kural: backend'de karşılığı gelen satır **silinmez**; (1) pini yükseltmeden önce (W168) Bağ sütununa "vX.Y'de karşılandı — F8 canlıya alma (W17x)" notu yazılır, **Durum `açık` kalır** (kodda `designStub` yaşadığı için `tests/lint/design-stub.test.ts` `bağlandı` kimliği kodda kabul etmez); (2) canlıya alma W'si stub'ı koddan kaldırınca ve gerçek uç testi yazılınca aynı PR'da Durum `bağlandı (pin v0.23.0-api, F8 W17x)` olur; (3) **kısmen** karşılananlarda Bağ'a "kısmen: … kaldı (GAP-2xx)" yazılır ve Durum `açık` kalır, kalan stub'lar sürer; (4) `backend'de (etiket)` durumu F8'de kullanılmaz (pin etiketi tek: `v0.23.0-api`; ara durum satır sayısını ikiye katlar). Biçim kuralı: Durum sütunu yalnız sabit sözcük/`bağlandı (…)` biçimindedir, notlar Bağ'a; hücrelerde `|` kullanılmaz (`tests/lint` 9 sütun denetler). Ayrıntı: [web-8 KESİN 35](../yurutme/web-8/ortak-sozlesme.md).

## F8 sonucu ve v0.24 notu

F8 kuralı uygulandı ([rapor-F8](rapor-F8.md)): 35 satır `bağlandı (pin v0.23.0-api, F8 W17x)` oldu (BE-005, 008, 014, 021, 061, 063, 065, 067, 068, 070…074, 108, 113, 114, 116…122, 124, 125, 132…135, 137…141); kısmen canlananlar (BE-018, 025, 110, 115, 123, 127, 136) Durum `açık` kalır ve kalan GAP Bağ sütunundadır. Backend `v0.24.0-api` (BE-F7) çıkınca aynı kuralın ilk adımı uygulandı: karşılanan sohbet/bildirim satırlarına Bağ sütununda "v0.24'te karşılandı — F9 canlıya alma" notu yazıldı, **Durum `açık` kalır** (kodda `designStub` var; web pini `v0.23.0-api`). Satırı `bağlandı` yapmak F9 canlıya alma W'sinin işidir.

## Backend'e devir

Web bu depodan backend'e yazmaz. Devir raporundaki paket, yönetim deposu sürecinde (`program/isler/FNN-*.md`) backend fazı olarak açılır; sonuç yeni API etiketi olur, web pin yükseltip satırı `bağlandı` yapar.
