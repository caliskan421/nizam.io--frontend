# O2 — Organizasyon (W71 → W72–W76)

## Açılış istemi

```
WEB-2 O2 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-2/README.md → ortak-sozlesme.md → oturum-2-organizasyon.md → ilerleme.md
→ docs/ekranlar/ortak-kurallar.md (tamamı, §12) → docs/ekranlar/08-koordinatorlukler/ ve 05-kullanicilar/ (README kabul tablosu → mekanizma → backend → eksikler → ozellikler)
→ docs/ekranlar/00-ortak/README.md (E-00-23/24/25, satır dışı tablo) → docs/backend-eksikleri/rapor-F1.md.
Giriş: WEB-1 kapalı (W48, W61 main'de, WEB-1-codex hükmü), CI yeşil; 05/08 kabul tabloları ürün cevabıyla güncel (yoksa geçici kabul).
O2a: W71'i başlat (bileşen iskeleti dahil); dönüşte kapı, PR, birleştir. Sonra O2b: W72–W76 paralel.
Kod yazma. Dönüşte kapıları worktree'de koş, YENİ-EKSİK'e BE kimliği ver ve kayit.md'ye işle, TASLAK satırlarını ilerleme.md'ye (W82 girdisi),
her W için ayrı PR, CI yeşilse birleştir (O2b sırası: W72 → W73 → W74 → W75 → W76). Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

**Bileşen iskeleti (W71'in işi; O2b'den önce birleşir — koordinatör kod yazmaz, K15):** `src/modules/organization/components/index.ts` — O2b bileşenlerinin adları ve prop/emit tipleri, boş gövdeli yer tutucularla: `CoordinatorshipGrid`, `CoordinatorshipCard` (W72), `CoordinatorshipDetail` (W73; prop `departmentId`), `DepartmentForm`, `CoordinatorAssignDialog`, `MemberAddDialog`, `PersonPicker`, `UserCreateDialog`, `TemporaryPasswordDialog` (W74), `UsersTable`, `UserPanel` (W75; prop `accountId`), `PersonalTracking` (W76; prop `accountId`). İskelet sözleşme testi **bileşeni bağlamaz**, derlenmiş `props`/`emits` bildirimlerini denetler (web-1 W41b dersi). Her W yalnız kendi bileşeninin gövdesini doldurur; `index.ts`'e satır ekleyemez.

**Hepsi için ortak kabul kaynağı:** `docs/ekranlar/08-koordinatorlukler/README.md` ve `05-kullanicilar/README.md` uygulama kararı tabloları — W bloğundaki E-kimliklerinin **`kabul` / `geçici kabul`** satırlarındaki "Kabul kanıtı" sütunu, o W'nin kabul ölçütüdür (burada tekrar yazılmaz). Satır dışı varsayımlar tabloları bütün O2b W'lerini bağlar.

## W71 — `modules/organization` veri katmanı (O2a)

- **Sahip:** `src/modules/organization/**` (yeni: `api/**`, `model/**` — `capabilities.ts` dahil, `routes.ts`, `public.ts`, `components/index.ts` iskeleti), `src/app/routes.catalog.ts` (F2 rota satırları, `CURRENT_PHASE` F1 → F2, `rol`/`sirala` parametreleri), `src/app/router.ts` yalnız `organizationRoutes` kaydı, `src/app/states/resolve.ts` yalnız `NO_DEPARTMENT_EXEMPT_ROUTES` (+ testi), `src/app/shell/side/menu.ts` yalnız Yönetim grubu kapısının organizasyon `capabilities.ts`'e bağlanması, `src/shared/http/query-keys.ts` yalnız organizasyon anahtarları (§6 tablosundaki adlarla).
- **Tespit:** 05 ve 08 `backend.md` §1 (okuma), §2 (yazma), §3 (eylem görünürlüğü), §5 (anahtarlar), §6 (sözleşme notları); `ortak-kurallar.md` §1, §6, §7, §9, §10; kabul tabloları **satır dışı varsayımlar** (erişim `company_admin`, yazmada kör tekrar yok, onay iki biçim, `NO_DEPARTMENT_EXEMPT_ROUTES`, Yönetim grubu kapısı); 00 E-00-23/24/25; `sentez.md` §1 G13, G16, G17.
- **İş:** okuma sorguları (`listUsers` sonsuz, `listMembers`, `listAssignable`, `listDepartments`, `listDeletedDepartments`, `reportDashboard` paylaşımı, tek birim görev sorgusu `listProgramWorkItems?department_id=` — work sorgusu `public.ts`'ten yeniden kullanılır); yazma sarmalayıcıları (`createDepartment`, `linkDepartment`, `renameDepartmentLink`, `updateDepartment`, `assignCoordinator`, `removeCoordinator`, `assignMembership`, `updateMembershipRole`, `removeMember`, `createUser`, `updateUser`, `deleteUser`, `updateAccount`, `unlockAccount`) + `confirmation_required` onay akışı (sorgu/gövde); `memberships` etiket ayrıştırıcı (`program:departman:rol`); `capabilities.ts` (backend.md §3 tabloları, kural kimliği kaynaklı; tablo testi mercek × rol × `company_admin`); rota kapısı (yönetici olmayan → ana sayfa); iskelet.
- **Eksikler (BE):** veri katmanında stub yok; BE-011/041/042/043/045 kapanana dek liste sınırları istemcide (W75).
- **Kabul:** her uç için msw testi (kapsam S1/S2 doğru, departman yol parametresi, `X-Nizamio-Department` gönderilmez); `confirmation_required` iki biçim testi; anahtarsız yazmada sonuç bilinmiyor → tekrar yok + geçersizleme testi; capability tablo testi; Yönetim grubu `company_admin` ile görünür, Koordinatör merceğindeki yönetici de görür (P1); muaf rotalarda "departman katılmamış" açık durumu görünmez; geçici parola hiçbir önbellekte yok testi.

## W72 — 08 Koordinatörlükler liste (O2b)

- **Sahip:** `src/modules/organization/pages/CoordinatorshipsPage.vue` (+ `pages/coordinatorships/**`), `src/modules/organization/components/coordinatorships/**` (`CoordinatorshipGrid`, `CoordinatorshipCard` gövdeleri).
- **Tespit:** `08-koordinatorlukler/README.md` E-08-01…46 (E-08-05 düğmesi; form W74); `mekanizma.md` liste bölümleri; `backend.md` ana karar + §4. Tasarım: `Koordinatorlukler.dc.html`.
- **İş:** kabul tablosundaki E-08-01…46 satırları (yapı sağlığı, arama, sıralama, kart, kart menüsü, boş durumlar; toplu seçim ve hiyerarşi gizli).
- **Eksikler (BE):** BE-016, BE-017, BE-018, BE-025, BE-036 (2, 9), BE-050.
- **Kabul:** E-08-01…46 kabul kanıtları; ŞY'de tek `listProgramDepartments` + tek `reportDashboard` (msw istek sayısı); açık/koyu tema.

## W73 — 08b Koordinatörlük detayı (O2b)

- **Sahip:** `src/modules/organization/pages/CoordinatorshipPage.vue` (+ `pages/coordinatorship/**`), `src/modules/organization/components/detail/**` (`CoordinatorshipDetail` gövdesi).
- **Tespit:** E-08-50…90; `mekanizma.md` 08b bölümleri; `backend.md` §1 08b satırları. Tasarım: `Koordinatorluk-Detay.dc.html`.
- **İş:** kabul tablosundaki E-08-50…90 satırları (sekmeler URL `sekme`; KPI; Hakkında; Ekip; Üyeler sekmesi listesi; Dikkat gerektirenler; Kısayollar; faz dışı sekme ve bağlantılar devre dışı). Formlar W74 bileşenleriyle açılır; "Görev ata" work `NewTaskDialog`.
- **Eksikler (BE):** BE-003, BE-005, BE-016, BE-017, BE-018, BE-021, BE-025, BE-047, BE-049, BE-091.
- **Kabul:** E-08-50…90 kabul kanıtları; tek birim için yalnız o birimin uçları (fan-out yok); derin bağlantı ve "seçili programda yok" durumu.

## W74 — Organizasyon formları (O2b; K5/K11 tüketicisi)

- **Sahip:** `src/modules/organization/components/forms/**` (`DepartmentForm`, `CoordinatorAssignDialog`, `MemberAddDialog`, `PersonPicker`, `UserCreateDialog`, `TemporaryPasswordDialog`).
- **Tespit:** E-08-05, E-08-33, E-08-63, E-08-70, E-08-79, E-05-05, E-05-33 (seçici), 05 satır dışı "Geçici parola belirle"; `backend.md` (05, 08) §2 hata kodu sütunları; `ortak-kurallar.md` §7.
- **İş:** P3 minimum formlar (vee-validate + zod, K11): yeni koordinatörlük (oluştur → bağla, `department_exists` → mevcut departmanı ekle akışı, kısmi başarı metni), düzenleme (programdaki ad / katalog alanları ayrı sonuç, "tüm sezonlarda geçerli" uyarısı), koordinatör ata, üye ekle (kişi seçici: `listUsers` arama), kullanıcı oluştur (`transfer_available` akışı) + geçici parola.
- **Eksikler (BE):** BE-013, BE-036 (6, 9), BE-050.
- **Kabul:** E-kimliklerinin kabul kanıtları; alan hataları `fields[]` → forma; anahtarsız uçta çift gönderim yok (düğme istek sürerken kilitli); geçici parola sızmaz testi.

## W75 — 05 Kullanıcılar + yan panel (O2b)

- **Sahip:** `src/modules/organization/pages/UsersPage.vue` (+ `pages/users/**`), `src/modules/organization/components/users/**` (`UsersTable`, `UserPanel` gövdeleri).
- **Tespit:** `05-kullanicilar/README.md` E-05-01…38 + satır dışı tablo; `backend.md` §1.1, §2, §3, §6 "Rol modeli". Tasarım: `Kullanicilar.dc.html`.
- **İş:** kabul tablosundaki E-05-01…38 satırları (şirket geneli liste, seçili program etiketleri, "Daha fazla yükle", tek koordinatörlük süzgeci → `listMembers`, yan panel: çipler anında + onaylı, Admin kartı devre dışı, hesap eylemleri, "Geçici parola belirle", "Giriş kilidini kaldır"); toplu Kaydet yok.
- **Eksikler (BE):** BE-011, BE-012, BE-013, BE-014, BE-041, BE-042, BE-043, BE-044, BE-045.
- **Kabul:** E-05-01…38 kabul kanıtları; çip işlemi başına ayrı sonuç; kendi hesabında yıkıcı eylem gizli; açık/koyu tema.

## W76 — 05b Kişisel takip (O2b)

- **Sahip:** `src/modules/organization/pages/UserPage.vue` (+ `pages/user/**`), `src/modules/organization/components/tracking/**` (`PersonalTracking` gövdesi).
- **Tespit:** E-05-40…75; `backend.md` §1.2, §4 (türetilen değerler). Tasarım: `Kullanici-KisiselTakip.dc.html`.
- **İş:** kabul tablosundaki E-05-40…75 satırları (tek `listProgramWorkItems` sonuna dek sayfalama + istemci atanan süzmesi; dört kart; gruplu tablo; takvim; durum dağılımı; Dosyalar/Etkinlik nötr; "Hesap ve roller" W75 `UserPanel`'i gömer; "Görev ata" work `NewTaskDialog`).
- **Eksikler (BE):** BE-005, BE-015, BE-036 (1), BE-038, BE-041, BE-042, BE-043, BE-046, BE-091.
- **Kabul:** E-05-40…75 kabul kanıtları; 05 panel özetiyle aynı sorgu anahtarı; sayfa sürerken yaklaşık etiket; departman fan-out yok (msw).
