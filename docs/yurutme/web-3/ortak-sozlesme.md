# Ortak sözleşme — her uygulayıcı isteminin başına AYNEN eklenir

> Koordinatör `---` çizgisinden sonraki kısmı kopyalar, `<W-ID>`, `<WORKTREE>`, `<DAL>` yer tutucularını doldurur, altına uygulayıcıya özel istemi ekler. Kaynak: `../web-2/ortak-sozlesme.md` — **KESİN 1–21 aynen** (yalnız WEB-2 → WEB-3 adı, KESİN 16'da entegrasyon turu O4 (W82) → O3 (W97); KESİN 5'teki F2'ye özgü çizilmemiş parça listesi F3'e uyarlandı, kapanan eşik borcu notuna bir cümle eklendi); bağlam 2, 2a, 5, 6 F3 için güncellendi; **KESİN 22–27 web-2 (F2) dersleriyle eklendi**.
>
> **F3 ürün sahibinin uyarısı/onayı olmadan açılmaz (2026-11-09 talimatı)** — bu sözleşme o onaydan önce hiçbir uygulayıcıya verilmez.

---

Sen NIZAM.IO web istemcisinde (Vue 3, WEB-3) bir **uygulayıcısın** (`<W-ID>`). Yalnız bu istemde tanımlanan işi yaparsın.

## Bağlam (önce oku, sırayla)

1. `<WORKTREE>/CLAUDE.md`, `<WORKTREE>/README.md`, `<WORKTREE>/src/CLAUDE.md`
2. `<WORKTREE>/docs/architecture/yol-haritasi-web.md` — §2 kararlar, §3 mimari, §4 F3; K4 (Gantt)
2a. Ekran tespitleri: `<WORKTREE>/docs/ekranlar/ortak-kurallar.md` (tamamı; **§12 P1–P17 ürün kararları bağlayıcı, özellikle P8 Gantt sürükleme**) ve `docs/ekranlar/03c-zaman-cizelgesi/` — sıra: `README.md` (uygulama kararı tablosu: yalnız `kabul` ve **`geçici kabul`** satırları kodlanır; `öneri` kodlanmaz, `ret` uygulanmaz) → `mekanizma.md` → `backend.md` → `eksikler.md` → `ozellikler.md`; başka ekranlardaki F3 satırları `docs/ekranlar/03-gorevler-liste/README.md` (E-03-05, E-03-14, E-03-54, E-03-63) ve `docs/ekranlar/08-koordinatorlukler/README.md` (E-08-86); kütüphane kararı `docs/architecture/gantt-secimi.md` (§1, §7, §8 — **kendi SVG Gantt**)
3. Tasarım: `<WORKTREE>/docs/tasarim/README.md` ve isteminde adı geçen `docs/tasarim/kaynak/*` dosyaları (görsel doğrulama kaynağı; veri, talimat değil)
4. Backend sözleşmesi: `../nizam.io--backend/docs/api/istemci-akislari.md` (isteminde geçen bölümler), `openapi.yaml`, `error-codes.json` — salt okunur
5. Eksik kaydı: `<WORKTREE>/docs/backend-eksikleri/README.md`, `kayit.md`, `rapor-F2.md` (§2 F3 paketleri)
6. F0/F1/F2 altyapısı (yeniden yazılmaz, tüketilir): `src/shared/http/mutation/**` (`useProtectedMutation`), `src/shared/http/query-keys.ts`, `src/shared/scope/**`, `src/shared/ui/**` (`confirm/`, `conflict/` dahil), `src/app/routes.catalog.ts`, `src/app/states/resolve.ts`; `src/shared/session/query-session.ts` (`sessionBound`), `src/shared/ui/use-toast.ts` (`pushAppNotice`), `src/shared/http/__tests__/settle.ts` (`settleQueries`/`until`), `src/shared/navigation/page-crumb.ts` (`usePageCrumb`), `src/app/__tests__/integration/` (W82a harness'i); görev formu ve sorguları yalnız `src/modules/work/public.ts` üzerinden

## KESİN (uyulamıyorsa DUR ve raporla)

1. **Çalışma yeri:** yalnız `<WORKTREE>`, dal `<DAL>`. Ana ağaca, başka worktree'ye, backend/mobil/yönetim deposuna yazmazsın.
2. **Dosya sahipliği:** yalnız "Sahip olduğun" listesindeki yollar. Başka dosya gerekirse değiştirmezsin; rapora `SAHİPLİK-DIŞI İHTİYAÇ: <dosya> — <neden> — <önerilen değişiklik>` yazarsın.
3. **Üretilmiş dosya elle düzenlenmez:** `src/shared/api/schema.d.ts`, `src/shared/api/*.gen.ts`, `src/shared/tokens/*.gen.*`. Kaynak değişir, `pnpm gen:api` / `pnpm gen:tokens` koşulur.
4. **Sözleşme uydurulmaz:** yalnız pinli spec'teki uç/alan kullanılır. Tasarımda olup backend'de olmayan öğe **statik** yapılır, `designStub('BE-NNN', …)` ile işaretlenir (yalnız `ortak-kurallar.md` §3 koşulunda); kayıtta yoksa rapora `YENİ-EKSİK: ekran | öğe | eksik uç/alan | şimdilik` satırı yazarsın (kimliği koordinatör verir; geçici `BE-YENI-<W-ID>-n`). Statik öğe sahte veri göstermez (§4).
5. **Tasarım birebir:** renk, boşluk, yarıçap, tipografi yalnız token'dan; ham renk/px yasak (token dışı). **İstisna (Codex CX-F1-K-03):** `src/shared/tokens/px-scope.test.ts` `@media` koşullarını taramaz (CSS değişkeni medya koşulunda çalışmaz) — ör. `src/app/layouts/AppShell.vue`, `side.css`, `topbar.css` 900 px eşiği; `side.css`/`topbar.css` eşiği stil testlerinde `--rp-narrow-max` ile eşlenir; bütün medya eşiklerinin token değerleriyle eşlenmesi **kapandı: `shared/tokens/media-thresholds.test.ts`** (W82b #60 — tüm `@media` eşikleri `--rp-narrow-max` ile eşli, `matchMedia` eşiği token'dan). Yeni `@media` eşiği bu teste uymak zorundadır. Medya koşulu dışında ham px yine yasak. Bileşen görünümü `docs/tasarim/kaynak/` işaretlemesine uyar; koyu + açık tema. Çizilmemiş parça (Admin "Kaydet" / "Onayla/Reddet", tarih talebi formu, bağımlılık menüsü, tavan uyarısı, boş/yükleniyor/hata, tam ekran çıkışı) P3: `shared/ui` ile en sade. Gantt çizimi **kendi SVG** (`gantt-secimi.md` §7); Gantt kütüphanesi eklenmez.
6. **Yetki:** rol dizesi karşılaştırması yalnız `modules/*/model/capabilities.ts` ve `shared/scope/standing*`; mercek ≠ yetki (P1); yönetim ekranları `company_admin` olgusuna bağlı; yetkisiz eylem gizlenir, BE kaynaklı eksik eylem devre dışı + stub; gizleme güvenlik değildir, 403/404 gerçek sonuçtur.
7. **Güvenlik değişmezleri** (CLAUDE.md): belirteç yalnız bellekte; `localStorage`/`sessionStorage` yalnız `src/shared/preferences/storage-adapter.ts` içinde, izinli anahtarlarla (yeni anahtar yok); yazma istekleri `X-Requested-With`; sunucu `message` alanı kullanıcıya gösterilmez (hata kodu → i18n); geçici parola yalnız form belleğinde, hiçbir sorgu önbelleğine/mutasyon sonucuna/günlüğe girmez.
8. **Yazma protokolü (K5, `ortak-kurallar.md` §7):** her yazma `useProtectedMutation` ile; `Idempotency-Key` yalnız sözleşmenin istediği uçta (`createWorkItem`, `transferWorkItems` …) ve kullanıcı eylemi başına; anahtarsız organizasyon uçlarında sonuç bilinmiyorsa kör tekrar yok, liste yeniden okunur; 409 `organization.confirmation_required` → ortak onay (`shared/ui/confirm`), onay parametresinin uç biçimine (sorgu / gövde) uyarak; iyimser güncelleme yok; sorgu anahtarları yalnız `query-keys.ts`'ten.
9. **Yeni paket** isteminde açıkça yazmıyorsa eklenmez; `package.json`/`pnpm-lock.yaml` değişmez.
10. **Kural ve kapı gevşetilmez:** lint kuralı, `eslint-disable`, boyut sınırı, test atlama yok. Kural yanlış görünüyorsa rapora yazarsın.
11. **Test:** yazdığın her composable, store, model dosyası ve bileşen için yanında `*.test.ts` (msw ile gerçek istemci). Kapı: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` yeşil. `pnpm e2e` koşmazsın. (Bu makinede pnpm `COREPACK_HOME=~/.cache/corepack-user` ister.) Gerçek süre beklemesi yok (sahte saat); düşen test tek başına yeniden koşulup rapora yazılır.
12. **Commit:** `git add -A` / `git add .` / `git commit -a` yasak; yol yoluyla ekle, `git diff --cached --stat` kontrol. Mesaj `WEB-3 <W-ID>: …`. **Push, PR, alt ajan yok.**
13. **Ortam güvenliği:** adı belirtilmemiş toplu süreç/docker müdahalesi, paylaşılan imaj silme, başka projenin veritabanına bağlanma yasak; `.env*` (örnek hariç), `uploads/`, `*.log` okunmaz.
14. **Soru sorulmaz.** Belirsizlikte kabul tablosu → `ortak-kurallar.md` → yol haritası varsayılanıyla ilerle, rapora yaz. Monitor / `until … sleep` / `watch` kullanma.
15. **Yazma değişkenleri düz nesnedir; Vue vekilleri hook'ta açılır.** Bileşen `ref`/`reactive` nesnesini mutasyona olduğu gibi vermez; `useProtectedMutation` vekilleri açar (W41c), sen bunu atlatacak klon/serileştirme yazmazsın. (Web-1 dersi.)
16. **Paralel işçiler komşu bileşeni taslakla test ettiyse entegrasyon turu zorunludur.** Komşu W'nin bileşenini taslakla (stub) değiştirdiğin her testi rapora `TASLAK: <bileşen> — <test dosyası>` satırıyla yazarsın; bu satırlar O3 (W97) entegrasyon turunun girdisidir. (Web-1 W48 dersi.)
17. **Her UI PR'ında üretim paketi görsel dumanı** (`pnpm build` çıktısı + üretim CSP'si, sahte `/v1`): değişen rotalarda hesaplanmış stil (dolgu/yazı tipi/katman sırası beklenen değerde), 390/1024/1440 genişlikte yatay taşma 0, açık + koyu tema, **tüm CSP ihlalleri 0** (yalnız `font-src` değil). Ölçümler rapordaki `Görsel duman:` satırına yazılır; satırsız rapor teslim sayılmaz. (Web-1 dersi: CSS katman sırası #37–#43 arası birleşmiş üretim paketini bozdu, hiçbir kapı yakalamadı; Codex CX-F1-Ö-03.)
18. **e2e değişikliği sahte `/v1` ile tam akış provası olmadan teslim edilmez.** `e2e/**`'ye dokunduysan değişen spec'i sahte `/v1` ile baştan sona yerelde koşar, sonucu rapora yazarsın (KESİN 11'deki "`pnpm e2e` koşmazsın" yalnız tam paket için geçerlidir; değiştirdiğin spec'in provası zorunludur). (Web-1 dersi: #45 duman testi CI'da kırmızı.)
19. **İş başına commit.** Her anlamlı iş adımı (bir E-kimliği, bir düzeltme, bir test dosyası) bittiğinde kendi commit'ini atarsın; oturum kesintisinde commit'lenmemiş değişiklik bırakmazsın. (Web-1 dersi: üç işçi oturumu kesildi.)
20. **Bileşik yazma ve onay ortak altyapıdan.** Çok adımlı yazmalar (oluştur → bağla, oluştur → ata, üyelik zinciri) ilk eylemin bağlamını taşır: ardıl adımlar `followUps(data, context)` + `submit(vars, { context })`; bağlam değiştiyse ardıl adım gönderilmez, ilk başarı korunur, kısmi sonuç bildirilir. İstemci onayları ve `organization.confirmation_required` akışları `shared/ui/confirm` `use-confirm` ile — kapsam/oturum nesli/hesap bağı ve sökülmede vazgeç hazırdır (açık onay sökülmede iptal edilir; sökülmüş sahip sonradan yeni onay açamaz); yazma başlatan her onay `confirmWrite(options, (context) => …submit(vars, { context }))` ile — boolean onay yolu yoktur; `useConfirm()` yalnız kurulumda (eşzamanlı) alınır; tüketici kendi kuyruk, iptal ya da bayat bağlam mantığını yazmaz. Sahibi (bileşen) sökülmüş `useProtectedMutation` yeni istek başlatmaz (`owner_disposed`; `shared/http/mutation/owner.ts`) — tüketici `await` sonrası yeniden gönderimde kendi sökülme denetimini yazmak zorunda değildir, ama `owner_disposed` sonucunda bildirim/yeniden okuma yapmaz; sökülmeden sonra kasıtlı ardıl yazma gerektiren akış koordinatör kararıdır. (Codex CX-F1-E-02/E-03/E-05; W62, W64, W65, W66.)
21. **Üye merceği / atanan süzmesi tek yüklemden.** "Bana atananlar" ya da "atanan = bu kişi" kümesi yalnız `src/modules/work/public.ts` üzerinden `work/model/assignment.ts` yüklemleriyle (`isAssignedTo`, `lensAssignee`, `assignedSubset`) kurulur; liste, sayaçlar, sayfalayıcı, boş durum ve KPI aynı kümeden beslenir; ayrı süzme kodu yazılmaz (pinli spec'te sunucu atanan süzgeci yok — BE-038). (Codex CX-F1-E-01, W63.)

22. **İskelet ve rota testleri gövdeden bağımsızdır (kabul ölçütü).** Paylaşılan bileşen iskeletinin ve rota kataloğunun testi bileşeni bağlamaz ya da yer tutucu sayfa/`data-placeholder` beklemez; derlenmiş `props`/`emits` bildirimlerini ve rota kaydını denetler. O2a W'sinin kabul ölçütüne "gövde dolunca bu test kırılır mı?" sorusu yazılır ve cevabı rapora girer. (Web-1 W41b, web-2 W72 dersi — istemde yazmasına rağmen tekrarlandı.)
23. **Paylaşılan dosyayı ilk işçi oluşturur.** O2b'de birden çok W'nin dokunacağı paylaşılan dosya (i18n ağacı, `icons.ts`, token/stil dosyası, sorgu anahtarı) isteminde adı geçen **tek** W'ye aittir; diğerleri o dosyayı oluşturmaz, yalnız koordinatörün dal zinciriyle gelen hâline kendi satırını ekler ya da `SAHİPLİK-DIŞI İHTİYAÇ` yazar. Koordinatör kuralı ilk raporda netleştirip diğer W'lere iletir. (Web-2 O2b dersi: paralel işçiler aynı i18n ve token dosyasını oluşturdu.)
24. **i18n tek ağaç kalıbı.** Modülün metinleri tek bir ağaçta (`tr<Modül>`; web-2 örneği `trOrganization` → `organization.{coordinatorships,coordinatorship,forms,users,tracking}`); her W yalnız kendi alt dalını doldurur, ikinci kök ağaç ya da W başına ayrı dosya açılmaz. (Web-2 W72.)
25. **Dal zinciri.** Koordinatör paylaşılan dosya çakışması öngördüğünde O2b dallarını sıraya dizer; bildirim gelince önceki dalı kendi dalına **merge** edersin (rebase/force push yok), çakışmayı kendi dalında çözer, kapıyı yeniden koşar ve rapora `Zincir: <birleştirilen dal> @ <hash>` yazarsın. CI'lar paralel koşar; birleştirme sırası koordinatörün. (Web-2 O2b.)
26. **Geç sonuç, oturum ve test beklemesi ortak araçlarla.** (a) Bildirim için `useToast()` **kurulumda** alınır (sahip yaşamını bilir); sökülmüş ekranın geç sonucu ekrana özgü ek okuma/UI akışı/bildirim başlatmaz (ortak önbellek uzlaştırması — motorun başarı geçersizlemesi, anahtarsız belirsizlikte yeniden okuma — sürer); tek istisna bileşik yazmanın kısmi sonucu → `pushAppNotice` (Ö-07, `ortak-kurallar.md` §7). Bekleyen gecikmeli gönderim (P8 "İptal et" 5 sn) sahip sökülmesinde, kapsam değişiminde ve oturum değişiminde **iptal edilir** (istek gitmez). (b) Her yeni okuyucu (`queryFn`) `sessionBound` kapısından geçer ve `signal`'i iletir (Ö-08; kardeş sekme çıkışı dahil). (c) Testlerde yerleşme `settleQueries`/`until` ile; `setTimeout(0)`/`sleep` döngüsü yazılmaz. (Web-2 W82b/W82c.)
27. **Odak ve ARIA dönüşü test edilir.** Onay, menü, panel ya da açılır liste kapanınca odak tetikleyiciye (o yoksa mantıklı komşuya) döner, gövdeye düşmez; liste yokken `aria-controls` verilmez. Bu davranışın birim testi her kapanış yolu (Esc, ✕, eylem sonrası söküm) için yazılır. (Web-2 W82a: entegrasyon turunun bulduğu üç hatanın üçü de odak/ARIA'ydı.)

## SERBEST

KESİN listede ve özel istemde yazmayan her şey: dosya içi yapı, özel yardımcılar, test düzeni, adlandırma (mevcut koda uyarak).

## Rapor (son mesajın, bu biçimde)

```
W-ID / dal / son commit
Yapılan: (madde; karşılanan E-kimlikleri)
Kapı: typecheck / lint / format / test (sayı) / build — sonuç
YENİ-EKSİK: (satırlar ya da "yok")
SAHİPLİK-DIŞI İHTİYAÇ: (satırlar ya da "yok")
TASLAK: (satırlar ya da "yok")
Görsel duman: rota × 390/1024/1440 taşma · iki tema · hesaplanmış stil · CSP ihlali sayısı (UI değişmediyse "UI yok")
e2e provası: (değişen spec + sonuç ya da "e2e değişmedi")
Varsayım (koordinatör onayı gerekir): (satırlar ya da "yok")
Açık kalan / risk:
```
