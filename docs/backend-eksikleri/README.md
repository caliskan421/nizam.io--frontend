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

## Backend'e devir

Web bu depodan backend'e yazmaz. Devir raporundaki paket, yönetim deposu sürecinde (`program/isler/FNN-*.md`) backend fazı olarak açılır; sonuç yeni API etiketi olur, web pin yükseltip satırı `bağlandı` yapar.
