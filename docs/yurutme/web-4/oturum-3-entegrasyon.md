# O3 — F4 entegrasyon turu (W107)

**Neden zorunlu:** web-1 W48 (5 kusur), web-2 W82a (3 odak/ARIA hatası) ve web-3 W97a (bayat rozet, 390 px örtme, bağlanmamış bileşen, çift kaynak alan) paralel işçi çıktılarının gerçek bileşenlerle ayrı turda doğrulanması gerektiğini gösterdi ([ortak-sozlesme.md](ortak-sozlesme.md) KESİN 16, 28–32).

## Açılış istemi

```
WEB-4 O3 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-4/README.md → ortak-sozlesme.md → oturum-3-entegrasyon.md → ilerleme.md (O2b TASLAK satırları)
→ docs/yurutme/web-3/ilerleme.md (W97a kaydı) → docs/yurutme/web-2/ilerleme.md (W82a kaydı).
Giriş: O2b (W102–W106) main'de, CI yeşil. W107'yi başlat; dönüşte kapı, PR, birleştir.
Kod yazma. Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

## W107 — Entegrasyon turu

- **Sahip:** `src/app/__tests__/integration/**` içinde toplantı senaryoları (W82a/W97a harness'i üretim `createAppRouter` + `AppShell` + gerçek oturum + durumlu sahte backend; harness genişletmesi bu W'nin), O2b bileşenlerinde **yalnız** entegrasyon testinin ortaya çıkardığı hata düzeltmeleri (her düzeltme rapora dosya + neden; kapsam dışı yeniden yazım yok).
- **Tespit:** `ilerleme.md` O2b kaydındaki `TASLAK:` satırları; 09 kabul tablosunun satır dışı varsayımları; `../web-3/ilerleme.md` W97a kaydı (senaryo kalıbı); `../../ekranlar/ortak-kurallar.md` §7 (Ö-07/Ö-08).
- **İş:** gerçek bileşenlerle (taslaksız) msw senaryoları: (1) liste → satır → detay → kırıntı ile liste (URL `zaman`/`koordinatorluk` korunur); (2) **üç rol (ŞY, K, Ü) × görünürlük**: liste kapsamı, Yeni toplantı, Düzenle, Silinenler, gündem işaretleme, katılımcı ekle/çıkar, nottan görev, koordinatörlük kümesi — K'da "Değiştir" DOM'da yok, iki kipte katılımcı görünürlüğü; person'da sahip K olan oluşturan, koordinatörlüğünü kaybeden oluşturan ve ŞY katılımcı yönetimi; coordinatorship'te K olmayan ŞY katılımcı ekleyemez; (3) yeni toplantı oluştur → liste + detay yenilenir; sonuç bilinmiyor → tekrar yok, kullanıcı kararı; (4) gündem ekle/işaretle → ilerleme ve işaretleyen; 50 madde sınırı; (5) not yaz (`Idempotency-Key`, çift gönderim yok) → düzenle (409 `edit_conflict` uzlaştırma) → sil; (6) nottan görev → not "Göreve dönüştü", 03 listesinde görev (`['work','program-list']` geçersizlenir; **türev sayaç/rozetler KESİN 29**), tekrar → 409 `note_converted`; (7) kısmi başarılı katılımcı ekleme uyarısı; (8) sil → listeye dön, Silinenler (yalnız ŞY) → geri yükle / kalıcı sil; (9) kapsam (program) değişimi: detay K6 durumuna düşer, pencereler ve taslaklar düşer; oturum değişimi / kardeş sekme çıkışı (Ö-08); sökülen ekranın geç sonucu bildirim üretmez (Ö-07); (10) 390 px'te pencere ve menüler tıklanarak denenir (KESİN 30); odak dönüşü (menü, pencere, onay: KESİN 27); derin bağlantılar `/toplantilar?zaman=gecmis&koordinatorluk=`, `/toplantilar/:id?notlar=benim`; (11) gerçek P23 özel seçici, aday kapsamı ve `department_id`/`from`/`to` URL-sorgu eşleşmesi; (12) 09 konferans/Canlı/Bekliyor ögeleri hiçbir yüzde DOM'da yok; `startConference`/`joinConference` isteği yok.
- **Eksikler (BE):** yok (yeni eksik çıkarsa `YENİ-EKSİK`).
- **Kabul:** her TASLAK satırı gerçek bileşenle en az bir senaryoda kapsanır; senaryolar yeşil; düzeltmeler kendi E-kimliğinin kabul kanıtını bozmaz; entegrasyon testleri `retryDelay 0` ile 5 sn'nin çok altında (KESİN 32); görsel duman (KESİN 17) değişen durumlarda.
