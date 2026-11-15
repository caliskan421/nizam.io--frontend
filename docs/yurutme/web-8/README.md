# WEB-8 — F8 (iskelet)

**F8 AÇILMADI.** Bu klasör yalnız iskelettir; F8'in kapsamı, sırası ve backend durumu **kullanıcı kararıdır** (F7'de olduğu gibi: "F8'i aç, backend dursun / aç" gibi açık bir onay gerekir). Onay otomatik geçti sayılmaz. [WEB-7](../web-7/README.md) kapanış kaydı: **F7 KAPANDI — 2026-11-15; bu kayıt kapanış belge PR’ının CI başarılı birleşmesiyle yürürlüğe girer.** W166 #152 main `ffc2937`, üç CI işi SUCCESS; F8 ayrıca kullanıcı onayı olmadan başlayamaz. Pin `v0.15.0-api`; yükseltme ayrı karar ([plan](../web-5/pin-yukseltme-plani.md)).

## Aday kapsam (karar ister; kaynak [web-7 README "Aday kapsam"](../web-7/README.md) ve [yol haritası §4](../../architecture/yol-haritasi-web.md))

| Aday | Not | Bağ |
| --- | --- | --- |
| Takvim (12) | v85 `Sidebar` K/Ü'de Zaman çizelgesi yerine Takvim koydu; **karar ister:** 03c'nin yerine mi geçer, yanına mı gelir | `Takvim`, `Takvim-Hafiza` |
| Kurumsal hafıza (13) | Prototipten import; yol haritasında kalem yok; K14 v1 dışı modül | `Kurumsal-Hafiza` |
| Profil sayfası / Ü7 | **Bildirim tercihleri, cihazlar (Web Push cihaz listesi), sessiz saatler** burada (P63; BE-151/152/153); oturum kartı "Profilim" düğmesi (E-00-47) çalışsın | `Uye-Profil`, [14-bildirimler §3 bölümü](../../ekranlar/14-bildirimler/README.md) |
| Üye panelleri Ü2–Ü7, koordinatör panelleri K2–K8 | F5/F6/F7 kapsamı dışı (P46, P54) | `Uye-*`, `Koord-*` |
| Asistan paneli (F46) | Yol haritası F8; menüde gizli (P2) | `Asistan` |
| 01b işlem geçmişi | Audit okuma (BE-030/BE-091/BE-010) backend'siz | `01b-islem-gecmisi` |
| Tablolar | Backend v0.17'de `tables` modülü (GAP-224); pin yükseltmesi ayrı karar | `11-tablolar` |
| BE paketleri | Önce rapor önerileri: [rapor-F7 §6](../../backend-eksikleri/rapor-F7.md) (BE-142/143, BE-081/082, BE-027/028), [rapor-F6 §6](../../backend-eksikleri/rapor-F6.md), [rapor-F5 §1](../../backend-eksikleri/rapor-F5.md) | — |

## F7'den devreden (ilerleme borçları; hiçbiri F8'i kendiliğinden başlatmaz)

- **"Şimdi değil" 14 gün kalıcı** (Web Push kutusu): şimdi oturum belleği; kalıcı saklama K2 anahtar listesine yeni anahtar ister (`push.snoozeUntil`) → F8 adayı ([ilerleme #8](../web-7/ilerleme.md)).
- 09/05 sayfalarına "oluştur" URL parametresi (01 kutucukları), ek önizleme penceresi, `manifest.webmanifest` + `apple-touch-icon` (iOS push), `topbar-dot*` token temizliği, `up.sh` parametrik, gerçek cihaz ekran okuyucu. **Gerçek Chrome/FCM push teslimi ve abonelik W162 ile kanıtlandı** (HEAD `76e4345`, 9,1 sn, register 200); bu borç kapalıdır. Safari/iOS/Firefox push ve OS bildirimi tıklama kanıtı hâlâ kapanış sonrası borçtur.
- Otomatik izin tetiği (03/03c kancası; E-14-64) F8 adayı.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| README.md | Bu iskelet (F8 AÇILMADI; adaylar) |
| `ilerleme.md`, `ortak-sozlesme.md`, `oturum-*.md` | **Açılmadı**; kullanıcı onayından sonra [web-7 kalıbıyla](../web-7/README.md) üretilir (ortak sözleşme KESİN 1–34 devralınır) |
