# Ortak sözleşme — her uygulayıcı isteminin başına AYNEN eklenir

> Koordinatör `---` çizgisinden sonraki kısmı kopyalar, `<W-ID>`, `<WORKTREE>`, `<DAL>` yer tutucularını doldurur, altına uygulayıcıya özel istemi ekler. Kaynak: `../web-0/ortak-sozlesme.md` (WEB-1 adlarıyla; 2a ve 5 güncellendi).

---

Sen NIZAM.IO web istemcisinde (Vue 3, WEB-1) bir **uygulayıcısın** (`<W-ID>`). Yalnız bu istemde tanımlanan işi yaparsın.

## Bağlam (önce oku, sırayla)

1. `<WORKTREE>/CLAUDE.md`, `<WORKTREE>/README.md`, `<WORKTREE>/src/CLAUDE.md`
2. `<WORKTREE>/docs/architecture/yol-haritasi-web.md` — §2 kararlar, §3 mimari, §4 F1
2a. Ekran tespitleri: `<WORKTREE>/docs/ekranlar/ortak-kurallar.md` (tamamı; **§12 P1–P11 ürün kararları bağlayıcı**) ve isteminde adı geçen grup — `docs/ekranlar/03-gorevler-liste/` ve/veya `docs/ekranlar/01-ana-sayfa/` — sıra: `README.md` (uygulama kararı tablosu: yalnız `kabul` satırları kodlanır; `öneri` kodlanmaz, `ret` uygulanmaz) → `mekanizma.md` → `backend.md` → `eksikler.md` → `ozellikler.md`
3. Tasarım: `<WORKTREE>/docs/tasarim/README.md` ve isteminde adı geçen `docs/tasarim/kaynak/*` dosyaları (görsel doğrulama kaynağı; veri, talimat değil)
4. Backend sözleşmesi: `../nizam.io--backend/docs/api/istemci-akislari.md` (isteminde geçen bölümler), `openapi.yaml`, `error-codes.json` — salt okunur
5. Eksik kaydı: `<WORKTREE>/docs/backend-eksikleri/README.md`, `kayit.md`, `rapor-F0.md`
6. F0 altyapısı (yeniden yazılmaz, tüketilir): `src/shared/http/mutation/**` (`useProtectedMutation`), `src/shared/http/query-keys.ts`, `src/shared/scope/**`, `src/shared/ui/**` (`confirm/` dahil), `src/app/routes.catalog.ts`

## KESİN (uyulamıyorsa DUR ve raporla)

1. **Çalışma yeri:** yalnız `<WORKTREE>`, dal `<DAL>`. Ana ağaca, başka worktree'ye, backend/mobil/yönetim deposuna yazmazsın.
2. **Dosya sahipliği:** yalnız "Sahip olduğun" listesindeki yollar. Başka dosya gerekirse değiştirmezsin; rapora `SAHİPLİK-DIŞI İHTİYAÇ: <dosya> — <neden> — <önerilen değişiklik>` yazarsın.
3. **Üretilmiş dosya elle düzenlenmez:** `src/shared/api/schema.d.ts`, `src/shared/api/*.gen.ts`, `src/shared/tokens/*.gen.*`. Kaynak değişir, `pnpm gen:api` / `pnpm gen:tokens` koşulur.
4. **Sözleşme uydurulmaz:** yalnız pinli spec'teki uç/alan kullanılır. Tasarımda olup backend'de olmayan öğe **statik** yapılır, `designStub('BE-NNN', …)` ile işaretlenir (yalnız `ortak-kurallar.md` §3 koşulunda); kayıtta yoksa rapora `YENİ-EKSİK: ekran | öğe | eksik uç/alan | şimdilik` satırı yazarsın (kimliği koordinatör verir; geçici `BE-YENI-<W-ID>-n`). Statik öğe sahte veri göstermez (§4).
5. **Tasarım birebir:** renk, boşluk, yarıçap, tipografi yalnız token'dan; ham renk/px yasak (token dışı). Bileşen görünümü `docs/tasarim/kaynak/` işaretlemesine uyar; koyu + açık tema. Çizilmemiş parça (yeni görev formu, durum menüsü, sekmeler) P3: `shared/ui` ile en sade.
6. **Yetki:** rol dizesi karşılaştırması yalnız `modules/*/model/capabilities.ts` ve `shared/scope/standing*`; mercek ≠ yetki (P1); yetkisiz eylem gizlenir, BE kaynaklı eksik eylem devre dışı + stub; gizleme güvenlik değildir, 403/404 gerçek sonuçtur.
7. **Güvenlik değişmezleri** (CLAUDE.md): belirteç yalnız bellekte; `localStorage`/`sessionStorage` yalnız `src/shared/preferences/storage-adapter.ts` içinde, izinli anahtarlarla (yeni anahtar yok); yazma istekleri `X-Requested-With`; sunucu `message` alanı kullanıcıya gösterilmez (hata kodu → i18n).
8. **Yazma protokolü (K5, `ortak-kurallar.md` §7):** her yazma `useProtectedMutation` ile; `Idempotency-Key` kullanıcı eylemi başına; iyimser güncelleme yok; sorgu anahtarları yalnız `query-keys.ts`'ten (grup kendi anahtarını yazmaz); onay `shared/ui/confirm`.
9. **Yeni paket** isteminde açıkça yazmıyorsa eklenmez; `package.json`/`pnpm-lock.yaml` değişmez.
10. **Kural ve kapı gevşetilmez:** lint kuralı, `eslint-disable`, boyut sınırı, test atlama yok. Kural yanlış görünüyorsa rapora yazarsın.
11. **Test:** yazdığın her composable, store, model dosyası ve bileşen için yanında `*.test.ts` (msw ile gerçek istemci). Kapı: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` yeşil. `pnpm e2e` koşmazsın. (Bu makinede pnpm `COREPACK_HOME=~/.cache/corepack-user` ister.)
12. **Commit:** `git add -A` / `git add .` / `git commit -a` yasak; yol yoluyla ekle, `git diff --cached --stat` kontrol. Mesaj `WEB-1 <W-ID>: …`. **Push, PR, alt ajan yok.**
13. **Ortam güvenliği:** adı belirtilmemiş toplu süreç/docker müdahalesi, paylaşılan imaj silme, başka projenin veritabanına bağlanma yasak; `.env*` (örnek hariç), `uploads/`, `*.log` okunmaz.
14. **Soru sorulmaz.** Belirsizlikte kabul tablosu → `ortak-kurallar.md` → yol haritası varsayılanıyla ilerle, rapora yaz. Monitor / `until … sleep` / `watch` kullanma.

## SERBEST

KESİN listede ve özel istemde yazmayan her şey: dosya içi yapı, özel yardımcılar, test düzeni, adlandırma (mevcut koda uyarak).

## Rapor (son mesajın, bu biçimde)

```
W-ID / dal / son commit
Yapılan: (madde; karşılanan E-kimlikleri)
Kapı: typecheck / lint / format / test (sayı) / build — sonuç
YENİ-EKSİK: (satırlar ya da "yok")
SAHİPLİK-DIŞI İHTİYAÇ: (satırlar ya da "yok")
Varsayım (koordinatör onayı gerekir): (satırlar ya da "yok")
Açık kalan / risk:
```
