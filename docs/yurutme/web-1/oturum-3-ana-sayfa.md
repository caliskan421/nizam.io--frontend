# O3 — Sade ana sayfa (W51)

## Açılış istemi

```
WEB-1 O3 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-1/README.md → ortak-sozlesme.md → oturum-3-ana-sayfa.md → ilerleme.md
→ docs/ekranlar/ortak-kurallar.md (§4, §10, §12 P3/P4/P6) → docs/ekranlar/01-ana-sayfa/ (README kabul tablosu → mekanizma → backend → eksikler → ozellikler).
Giriş: O2'nin 7 PR'ı main'de, CI yeşil. W51'i başlat; dönüşte kapı, BE kimlikleri, PR, birleştir.
Kod yazma. Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

## W51 — Ana sayfa (01, F1 satırları)

- **Sahip:** `src/modules/home/**` (yeni modül: `pages/HomePage.vue`, `components/**`, `model/**`, `routes.ts`, `public.ts`), `src/app/routes.catalog.ts` yalnız `home` satırının bileşen bağı. **Varsayım:** modül adı `home`; koordinatör açılışta `reporting` olarak değiştirebilir (01 F6'da rapor uçlarını tüketir).
- **Tespit:** `docs/ekranlar/01-ana-sayfa/README.md` uygulama kararı tablosu — F1 satırları: E-01-01, E-01-03…09, E-01-10/11 (devre dışı, faz notu), E-01-13 ("Tümü" devre dışı), E-01-14 (nötr yer tutucu) + **ekran düzeyi varsayımlar**; F1'de gizli (çizilmez): E-01-02, E-01-12, E-01-15…39; ret (uygulanmaz): E-01-40…47. Veri `backend.md`; tarih E-00-36 (W22'de var). Tasarım: `Main.dc.html`, `Main-Acik.dc.html`.
- **İş:** Selamlama (tam `full_name`, öneri olan ilk sözcük uygulanmaz); KPI şeridi — Admin `reportDashboard` (sunucu sayaçları, GAP-075), Koordinatör seçili birim, Üye ve birleşik rol "bana atananlar" (`listProgramWorkItems` istemci sayımı, imleç bitmediyse "yüklenen kayıtlar içinde"; W41 sorgusu); KPI tıklaması → `/gorevler` (03 süzgeç parametreleri kabul edildiği kadar); "Hızlı işlemler" yalnız capability'si olan kutucuklar — "Yeni görev" W45 `NewTaskDialog`, "Toplantı oluştur" devre dışı "F4'te", "Kullanıcı davet et" devre dışı "F2'de", "Rapor oluştur" çizilmez; "Son işlemler" `designStub('BE-010')` + `rp-empty`, sahte akış yok (§4); bölge başına iskelet ve bölge içi hata + "Yeniden dene". K7 açık durumları (W22) S1 rotası bağlandığında görünür — doğrulanır.
- **Eksikler (BE):** BE-003, BE-009, BE-010, BE-036 (1, 2), GAP-075.
- **Kabul:** kabul tablosundaki F1 satırlarının "Kabul kanıtı" sütunu; F1'de gizli öğeler DOM'da yok; tamamlanmış geç görev "Gecikmede"ye sayılmaz; Admin ↔ K/Ü veri kaynağı ayrımı msw testi; açık/koyu tema.
