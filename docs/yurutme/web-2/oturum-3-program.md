# O3 — Program yönetimi "Teknofest ve sezon" (W81)

## Açılış istemi

```
WEB-2 O3 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-2/README.md → ortak-sozlesme.md → oturum-3-program.md → ilerleme.md
→ docs/ekranlar/ortak-kurallar.md (§1, §3, §5, §7, §12 P1/P3) → docs/ekranlar/00-ortak/README.md (E-00-25, satır dışı tablo)
→ docs/ekranlar/08-koordinatorlukler/README.md (E-08-06, satır dışı "Sezona kopyala ≠ görev aktarımı").
Giriş: O2a (W71) main'de, CI yeşil (O2b ile paralel olabilir; dosya kesişmesi yok). W81'i başlat; dönüşte kapı, PR, birleştir.
Kod yazma. Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

## W81 — "Teknofest ve sezon" (P3 minimum)

- **Sahip:** `src/modules/program/**` (yeni modül: `api/**`, `model/**` — `capabilities.ts`, `pages/**`, `components/**`, `routes.ts`, `public.ts`), `src/app/routes.catalog.ts` yalnız program yönetimi rota satırı (+ `NO_DEPARTMENT_EXEMPT_ROUTES`'a eklenmesi `src/app/states/resolve.ts`'te), `src/app/router.ts` yalnız `programRoutes` kaydı. **Varsayım:** modül adı `program`; koordinatör açılışta değiştirebilir.
- **Tespit:** **tasarımda artboard yok** (`00-ortak/ozellikler.md` §7 madde 8) → P3 (ortak bileşenlerle minimum); kabuk girişi E-00-25 (F2'de canlı, `company_admin` ile, P1); K7 "program yok" açık durumu yöneticide "program oluştur" yoluna bağlanır (`src/app/states/resolve.ts` notu); 08 satır dışı tablosu ("Sezona kopyala" yapı kopyası ≠ görev aktarımı, Codex §6 #18 geçici kabul); `rapor-F1.md` §2 sıra 3 (BE-001).
- **İş:** program listesi (`listPrograms`, `['programs']` anahtarı) · oluştur/düzenle/sil (`createProgram`, `updateProgram`, `deleteProgram`; kısa ad/renk alanı yok → BE-001 statik, sahte alan yok) · programa departman bağla (W74 `DepartmentForm` / `linkDepartment`, `copy_members_from_program_id` "ekibi şu sezondan kopyala" seçeneğiyle — tek birim yapı kopyası) · dönem aktarımı (`previewTransfer` → önizleme → `transferWorkItems`, `Idempotency-Key` + `preview_fingerprint`; `listTransfers`/`readTransfer` geçmişi; 409 `program.transfer_preview_stale` → yeniden önizle) · sıfırlama (`resetProgram`, istemci yıkıcı onayı; ayrıntı uç sözleşmesinden). Her yazmada `['programs']` ve kapsam yaşam döngüsü yenilenir (K2).
- **Eksikler (BE):** BE-001; toplu yapı kopyası ucu yok (08/yeni-7, kayda alınmadı — ürün kararı: stub yok, eylem kurulmaz).
- **Kabul:** yalnız `company_admin` (Koordinatör merceğindeki yönetici dahil, P1); "program yok" durumundan program oluşturma yolu; aktarım önizleme olmadan yürütülmez, anahtar eylem başına; sıfırlama/silme onaysız istek atmaz; program değişince `scoped` sorgular düşer (K2); açık/koyu tema. Kabul tablosu yok (artboard yok) → bu satırlar W81'in kabul ölçütüdür; O5'te 00-ortak E-00-25 satırı "Kabul kanıtı" ile güncellenir.
