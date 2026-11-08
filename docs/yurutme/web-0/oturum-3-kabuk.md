# O3 — Kabuk (W21–W22, 2 paralel)

## Açılış istemi

```
WEB-0 O3 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-0/README.md → ortak-sozlesme.md → oturum-3-kabuk.md → ilerleme.md → docs/ekranlar/ortak-kurallar.md
→ docs/ekranlar/00-ortak/ (README uygulama kararı tablosu → mekanizma → backend → eksikler → ozellikler). Giriş: O2'nin 5 PR'ı main'de, CI yeşil; 00-ortak durumu `kabul`.
Önce ortak imzaları sabitle (aşağıda), sonra W21 ve W22'yi paralel başlat. Kod yazma. Dönüşte kapılar, BE kimlikleri, PR, birleştirme.
Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

**Koordinatör imzası (uygulayıcılardan önce, tek commit):** `src/app/layouts/AppShell.vue` iskeleti (iki yuva: `side`, `topbar`; tasarım `rp-page/rp-side/rp-main` ızgarası) ve `src/app/shell/types.ts` (menü öğesi tipi = rota kataloğu girdisi).

## W21 — Kenar menüsü ve Kenar-Secici

- **Sahip:** `src/app/shell/side/**` (yeni).
- **Tespit:** `docs/ekranlar/00-ortak/` — öğeler E-00-01…40 (`ozellikler.md` §2), davranış `mekanizma.md` §2–§5, veri `backend.md` §1, eksikler `eksikler.md`. Tasarım (görsel doğrulama): `docs/tasarim/kaynak/Sidebar.dc.html`, `Kenar-Secici.dc.html`, açık tema `Main-Acik.dc.html` kenarı.
- **İş:** Program / Rol / Koordinatörlük kartları ve açılır menüleri (W13 kapsam deposu; rol sayıları `me/departments`'tan; program alt metni `Program.year`'dan, dönem alanı yok), Admin merceğinde koordinatörlük kartı gizli, rol rengi çerçevesi (token'a bağlanır, sabit hex yok), daraltılmış menüde kapsam simgeleri E-00-40 (`ProgramDepartment.code`). Menü grupları rota kataloğundan; **Yönetim grubu `company_admin` olgusuna bağlı, mercek değişince kaybolmaz** (`ortak-kurallar.md` §1); faz dışı öğeler `ortak-kurallar.md` §5 matrisine göre (varsayılan gizli: Takvim, Kurumsal hafıza, Tablolar, Simülasyon, Arşiv, Mesajlar, Asistan, Yardım — ürün sahibi onayına açık). Program avatarı BE-001 statik türetme. Rozetler: bildirim sayacı `countUnreadNotifications` gerçek (hesap geneli, zil paneli F7'ye kadar devre dışı); geciken/bekleyen talep rozetleri Admin merceğinde `reportDashboard`'dan canlı, Koordinatör/Üye merceğinde BE-003 statik; sohbet rozeti F7'ye kadar gizli (`unread_chats` = sohbet sayısı). Statik öğe sahte veri göstermez.
- **Kabul:** klavye ile kart/menü gezinmesi (`menuitemradio`), mercek değişince kapsam ve sorgu iptali testi + `company_admin` korunur testi, çok program/hatırlanan yok → seçici açık testi, 272 px genişlikte taşma yok, 76 px dar menüde E-00-40 görünür.

## W22 — Üst çubuk, tema, açık durumlar, etkili işlem onayı

- **Sahip:** `src/app/shell/topbar/**`, `src/app/states/**` (yeni), `src/shared/ui/confirm/**` (yeni), `src/modules/identity/pages/**` yalnız giriş ekranının kabuğa oturması.
- **Tespit:** `docs/ekranlar/00-ortak/` üst çubuk öğeleri (E-00-33…39) ve `mekanizma.md` §6 açık durumlar; K7 tetikleyicileri `backend.md` §6. Tasarım (görsel doğrulama): `Main.dc.html` üst çubuk, `Toplanti-Formlar.dc.html` silme onayı kalıbı.
- **İş:** Üst çubuk + kırıntı (rota kataloğundan; program adı kabuğun `['programs']` verisinden), tema anahtarı (`ui.theme` tercihi, `data-theme`; düğmede yalnız simge değişir), tarih `instanceProfile.timezone` ile (Varsayım — kabul tablosuna bakılır), K7 açık durum ekranları (program yok / atama bekleniyor — `listPrograms` 403 `membership_required` tetikler / departman yok / güncelleme gerekli zaten var) + "sunucu çıkışı doğrulanamadı" durumu (`ortak-kurallar.md` §8), etkili işlem onayı diyaloğu (W14 `confirmation_required` kancası; yalnız organizasyon uçları: `fields[]` görev başlıkları, onay, `unassigned_tasks`/`warning` sonucu) ve **genel istemci onay diyaloğu** (görev silme, tarih vb. için — sunucu onayı yok), "sonuç bilinmiyor" ve çakışma için ortak bildirim bileşenleri (alan alan seçim diyaloğu F1'de). Asistan/Yardım/zil paneli faz matrisine göre gizli ya da devre dışı; tıklanabilir ama işlevsiz kontrol bırakılmaz.
- **Kabul:** her açık durum için sahte backend testi (logout hatası dahil); onay diyaloğu iki aşamalı akış testi; genel onay diyaloğu testi; açık/koyu tema anlık geçişi.
