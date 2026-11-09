# O3 — F3 entegrasyon turu (W97)

**Neden zorunlu:** web-1 O2b ve web-2 O2b'de sayfa testleri komşu bileşenleri taslakla değiştirdi; gerçek bileşenlerle olay zinciri ayrı turda doğrulandı (web-1 W48: 5 kusur; web-2 W82a: 3 odak/ARIA hatası). Web-3'te bu tur planın parçasıdır ([ortak-sozlesme.md](ortak-sozlesme.md) KESİN 16).

## Açılış istemi

```
WEB-3 O3 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-3/README.md → ortak-sozlesme.md → oturum-3-entegrasyon.md → ilerleme.md (O2b TASLAK satırları)
→ docs/yurutme/web-2/ilerleme.md (W82a/W82b kaydı) → docs/yurutme/web-1/ilerleme.md (W48 kaydı).
Giriş: O2b (W92–W96) main'de, CI yeşil. W97'yi başlat; dönüşte kapı, PR, birleştir.
Kod yazma. Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

## W97 — Entegrasyon turu

- **Sahip:** `src/app/__tests__/integration/**` içinde zaman çizelgesi senaryoları (W82a harness'i üretim `createAppRouter` + `AppShell` + gerçek oturum + durumlu sahte backend; harness genişletmesi bu W'nin), O2b bileşenlerinde **yalnız** entegrasyon testinin ortaya çıkardığı hata düzeltmeleri (her düzeltme rapora dosya + neden; kapsam dışı yeniden yazım yok).
- **Tespit:** `ilerleme.md` O2b kaydındaki `TASLAK:` satırları; 03c kabul tablosunun satır dışı varsayımları; `../web-2/ilerleme.md` W82a kaydı (senaryo kalıbı, harness); `../../ekranlar/ortak-kurallar.md` §7 (Ö-07/Ö-08), §12 P8.
- **İş:** gerçek bileşenlerle (taslaksız) msw senaryoları: (1) 03 liste ↔ zaman çizelgesi segment geçişi, kapsam korunur, süzgeç taşınmaz; (2) Gantt satırı seç → panel → Koordinatör "Tarih talebi gönder" → Gantt + görev + `date-requests` yenilenir, 03 talep bandı ve kenar menüsü rozeti güncellenir; (3) Admin panelde bekleyen talebi onayla/reddet → aynı yenilemeler; (4) **P8 dört kişilik yetki × üç yüz** (yönetici Admin merceği, yönetici Koordinatör merceği, koordinatör, üye): yüz, tutamaç, panel düğmeleri, bağımlılık menüsü, Yeni görev; (5) sürükleme → 5 sn gecikme → "İptal et" (istek 0) / süre sonu (tek istek) / bekleme sırasında kapsam değişimi, çıkış → başka hesapla giriş, sayfa sökülmesi (istek 0, bildirim yok — Ö-07/Ö-08); (6) tam 200 kalem → tavan uyarısı + yaklaşık sayaçlar; (7) derin bağlantılar (`/zaman-cizelgesi?secili=`, `durum`, `olcek`, `departman`) ve 08 E-08-86, 03 E-03-54 girişleri; (8) `treegrid` erişilebilirlik rolleri, klavye turu (gezinme + tarih değişimi), panel/menü kapanınca odak dönüşü (KESİN 27); (9) 03d tek satır alt görev açma → tek istek; (10) kardeş sekme çıkışı sırasında geciktirilmiş Gantt GET'i yeni oturumun önbelleğine yazılmaz.
- **Web-2'den devralınan kalemler (iş kalemi; WEB-2 O5 "F3'e devredilenler"):** (11) çip kaldırmada iki bildirim sırayla (onayın devir iletisi + "çıkarıldı") — `use-confirm.ts`'in devir sayısını döndürmesiyle birleştirme; (12) 08 `DepartmentForm`: kapsam değişiminde sayfada bağlı kalınca başarı bildirimi davranışı; (13) entegrasyon testlerinin yük altında 5 sn'ye yaklaşması — bölme ya da gerekçeli süre kararı (kural gevşetmeden, KESİN 10). (`unlock` simgesi ve W81 aktarım kaynağı tasarım/ürün kalemidir; W97 işi değil, `ilerleme.md`'de izlenir.)
- **Eksikler (BE):** yok (yeni eksik çıkarsa `YENİ-EKSİK`).
- **Kabul:** her TASLAK satırı gerçek bileşenle en az bir senaryoda kapsanır; senaryolar yeşil; düzeltmeler kendi E-kimliğinin kabul kanıtını bozmaz; devralınan (11)–(13) kalemlerinin her biri kapanır ya da gerekçesiyle `ilerleme.md`'ye yazılır; görsel duman (KESİN 17) değişen durumlarda.
