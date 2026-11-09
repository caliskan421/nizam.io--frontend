# O4 — F2 entegrasyon turu (W82)

**Neden zorunlu:** web-1 O2b'de sayfa testleri komşu bileşenleri taslakla değiştirdi; gerçek bileşenlerle olay zinciri ayrı turda (W48) doğrulanmak zorunda kaldı. Web-2'de bu tur planın parçasıdır ([ortak-sozlesme.md](ortak-sozlesme.md) KESİN 16).

## Açılış istemi

```
WEB-2 O4 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-2/README.md → ortak-sozlesme.md → oturum-4-entegrasyon.md → ilerleme.md (O2b TASLAK satırları)
→ docs/yurutme/web-1/ilerleme.md (W48 kaydı).
Giriş: O2b (W72–W76) ve O3 (W81) main'de, CI yeşil. W82'yi başlat; dönüşte kapı, PR, birleştir.
Kod yazma. Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

## W82 — Entegrasyon turu

- **Sahip:** `src/modules/organization/__tests__/integration/**`, `src/modules/program/__tests__/integration/**` (yeni), O2b/O3 bileşenlerinde **yalnız** entegrasyon testinin ortaya çıkardığı hata düzeltmeleri (her düzeltme rapora dosya + neden; kapsam dışı yeniden yazım yok).
- **Tespit:** `ilerleme.md` O2b kaydındaki `TASLAK:` satırları; 05/08 kabul tablolarının satır dışı varsayımları; `web-1/ilerleme.md` W48 kaydı (senaryo kalıbı).
- **İş:** gerçek bileşenlerle (taslaksız) msw senaryoları: (1) 08 kart → 08b → Üye ekle → Ekip/Üyeler sayaçları ve 05 listesi yenilenir; (2) 05 çip kaldır → `confirmation_required` → onay → görev listeleri yenilenir; (3) yeni koordinatörlük oluştur + bağla (kısmi başarı dahil) → 08 ızgarası, kenar menüsü kapsamı; (4) kapsam (program) değişimi: açık panel/süzgeç/imleç sıfırlanır, arama korunur, 08b birim yeni programda yoksa iletisi; (5) dört kişilik yetki (yönetici Admin merceği, yönetici Koordinatör merceği, koordinatör, üye): menü, rota kapısı, eylem görünürlüğü; (6) "programa departman katılmamış": muaf rotalar açık, diğerleri durum ekranı; (7) derin bağlantılar (`secili`, `/kullanicilar/:id`, `/koordinatorlukler/:id?sekme=`); (8) iç içe `aside`/`dialog` erişilebilirlik rolleri ve odak dönüşü; (9) W81 aktarım önizle → aktar → `['programs']` ve kapsam yenilenir.
- **Web-1'den devralınan borçlar (iş kalemi; WEB-1 O5, Codex tur 1):** (10) **Ö-02 kalan** — entegrasyon harness'i üretim `createAppRouter` ve `AppShell` ile kurulur (modül → `app/` sınır kuralı nedeniyle harness'in yeri `src/app/**` altında; sahiplik koordinatörce verilir); gerçek 403 / liste dışlama, kapsam değişimi, çıkış → başka hesapla giriş ve bekleyen onay (`use-confirm`) senaryoları — web-1 görev ekranı dahil; (11) **Ö-04** — test beklemeleri: `setTimeout(0)` yerleşme döngüleri (W48 `harness.ts`, `KpiCard.test.ts`, `use-tasks-url.test.ts`) koşul/olay tabanlı beklemeye; (12) **Ö-05** — dar menü kaplaması (`narrow-nav.ts`): odak dönüşü, arka içeriğin klavye erişimi, kaydırma kilidi; 390 px klavye turuyla doğrulama; (13) görev listesinde yükleme/hata sırasında sekme sayaçlarının "(0)" göstermesi; avatar yığınının 3 avatarda 72 px olması (60 px sütun); (14) K-03 — medya koşulu eşiklerinin (`AppShell.vue`, `side.css`, `topbar.css` 900 px) token değerleriyle eşlenmesi. (15) **Ö-07 (Codex tur 5)** — sökülmüş ekranın geç bildirimi: oluşturma beklerken form sökülürse kısmi sonuç bildirimi (`use-new-task-form.ts` `finish()`), pano işlemi beklerken ayrıntı sökülürse başarı/hata bildirimi (`DetailActions.vue`), alt görevde geç sıradan hatada bildirim + yeniden okuma (`use-subtask-edit.ts`) sahip yaşamına bağlanır; ortak politika (ör. `toast` sahip yaşamını bilir) + geciktirilmiş yanıt testleri.
- **Eksikler (BE):** yok (yeni eksik çıkarsa `YENİ-EKSİK`).
- **Kabul:** her TASLAK satırı gerçek bileşenle en az bir senaryoda kapsanır; senaryolar yeşil; düzeltmeler kendi E-kimliğinin kabul kanıtını bozmaz; devralınan (10)–(15) kalemlerinin her biri kapanır ya da gerekçesiyle `ilerleme.md`'ye yazılır.
