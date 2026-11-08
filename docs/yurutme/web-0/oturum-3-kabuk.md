# O3 — Kabuk (W21–W22, 2 paralel)

## Açılış istemi

```
WEB-0 O3 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-0/README.md → ortak-sozlesme.md → oturum-3-kabuk.md → ilerleme.md. Giriş: O2'nin 5 PR'ı main'de, CI yeşil.
Önce ortak imzaları sabitle (aşağıda), sonra W21 ve W22'yi paralel başlat. Kod yazma. Dönüşte kapılar, BE kimlikleri, PR, birleştirme.
Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

**Koordinatör imzası (uygulayıcılardan önce, tek commit):** `src/app/layouts/AppShell.vue` iskeleti (iki yuva: `side`, `topbar`; tasarım `rp-page/rp-side/rp-main` ızgarası) ve `src/app/shell/types.ts` (menü öğesi tipi = rota kataloğu girdisi).

## W21 — Kenar menüsü ve Kenar-Secici

- **Sahip:** `src/app/shell/side/**` (yeni).
- **Tasarım:** `docs/tasarim/kaynak/Sidebar.dc.html`, `Kenar-Secici.dc.html` (4 durum + 3 kural kartı), açık tema `Main-Acik.dc.html` kenarı.
- **İş:** Program / Rol / Koordinatörlük kartları ve açılır menüleri (W13 kapsam deposu; rol sayıları `me/departments`'tan), Admin merceğinde koordinatörlük kartı gizli, rol rengi çerçevesi, daraltılmış menüde üç simge. Menü grupları rota kataloğundan; yönetim grubu yalnız Admin merceğinde; v1 dışı öğeler (Takvim, Kurumsal hafıza, Tablolar, Simülasyon) **gösterilmez**. Program avatarı BE-001 statik türetme. Okunmamış rozetleri: bildirim sayacı gerçek, sohbet rozeti `GET /v1/me/chat-unread`.
- **Kabul:** klavye ile kart/menü gezinmesi (`menuitemradio`), mercek değişince kapsam ve sorgu iptali testi, 272 px genişlikte taşma yok.

## W22 — Üst çubuk, tema, açık durumlar, etkili işlem onayı

- **Sahip:** `src/app/shell/topbar/**`, `src/app/states/**` (yeni), `src/shared/ui/confirm/**` (yeni), `src/modules/identity/pages/**` yalnız giriş ekranının kabuğa oturması.
- **Tasarım:** `Main.dc.html` üst çubuk (geri/ileri, konum kırıntısı, tema düğmesi, bildirim zili), `Toplanti-Formlar.dc.html` silme onayı kalıbı.
- **İş:** Üst çubuk + kırıntı (rota kataloğundan), tema anahtarı (`ui.theme` tercihi, `data-theme`), K7 açık durum ekranları (program yok / atama bekleniyor / departman yok / güncelleme gerekli zaten var), etkili işlem onayı diyaloğu (W14 `confirmation_required` kancası: görev başlıkları listesi, onay, `unassigned_tasks`/`warning` sonucu), "sonuç bilinmiyor" ve çakışma için ortak bildirim bileşenleri (alan alan seçim diyaloğu F1'de).
- **Kabul:** her açık durum için sahte backend testi; onay diyaloğu iki aşamalı akış testi; açık/koyu tema anlık geçişi.
