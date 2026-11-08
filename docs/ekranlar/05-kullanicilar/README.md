# 05 · Kullanıcılar

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Kullanicilar.dc.html` (`05 · Kullanıcılar`), `Kullanici-KisiselTakip.dc.html` (`05b · Kullanıcı › Kişisel takip`)
**Faz:** F2 · **v1:** ✓ · **Yol haritası bağı:** K1 (rol yalnız gösterim), K2 (kapsam), K3 (görev listesi tek uç, fan-out yasak), K5 (yazma protokolü), K6, K7, K10, K13 (eksik statik), K14; §4 F2 satırı ("Kullanıcılar, kişisel takip")
**Rota (önerilen, K10):**
- `/kullanicilar` — süzgeçler sorgu dizgisinde: `rol` (`tumu` | `admin` | `koordinator` | `uye`), `q` (arama), `koordinatorluk` (departman kimliği), `sayfa` (tamsayı), `secili` (hesap kimliği; yan paneli açar).
- `/kullanicilar/:hesapId` — kişisel takip; `sekme` (`gorevler` | `dosyalar` | `etkinlik` | `hesap`), `kart` (`tamamlanan` | `acik` | `geciken` | `onayda`), `grupla` (`son-tarih` | `durum`), `ay` (`YYYY-MM`, takvim kartı).
- **Varsayım:** parametre adları öneridir; rota kataloğu (F0) son sözü söyler.

## Özet
Kullanıcılar ekranı, şirketteki kişileri tek tabloda listeler (ad, e-posta, rol rozetleri, koordinatörlük atamaları), rol sekmesi + arama + koordinatörlük süzgeciyle daraltır ve satır seçilince sağdaki yan panelde kişinin rollerini ve koordinatörlük atamalarını düzenletir; hesap işlemleri (şifre sıfırlama bağlantısı, kilitleme, silme) aynı panelin menüsündedir. Kişisel takip (05b) bir kişinin görevlerini dört özet kartı, son tarihe/duruma göre gruplanmış görev tablosu, aylık son tarih takvimi ve durum dağılımıyla gösterir; Dosyalar, Etkinlik ve Hesap ve roller sekmelerinin içeriği tasarımda yoktur. Tasarım ekranı yönetici (Admin merceği) gözüyle çizer; Koordinatör/Üye merceğinde neyin görüneceği tasarımda yoktur ve eylem görünürlüğü `istemci-akislari.md` §4 yöntemine göre işlem bazında hesaplanmalıdır (kullanıcı yönetimi işlemleri o tabloda henüz satır olarak yok — backend analisti doğrulamalı). Ana veri: kullanıcı/hesap listesi, ekip üyelikleri (program, departman, rol) ve kişinin atandığı görevler. İlgili açık eksikler: BE-011 (program kapsamlı liste/sayaç), BE-012 (kilitle), BE-013 (sıfırlama/davet bağlantısı), BE-014 (dışa aktar), BE-015 (Etkinlik sekmesi).

Öğe kimlikleri: `E-05-01…E-05-38` → 05 Kullanıcılar; `E-05-40…E-05-75` → 05b Kişisel takip (`E-05-39` kullanılmadı).

## Dosyalar
| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | denetlendi | 2026-11-08 | tasarım analisti |
| mekanizma.md | denetlendi | 2026-11-08 | tasarım analisti |
| backend.md | denetlendi | 2026-11-08 | backend analisti |
| eksikler.md | denetlendi | 2026-11-08 | backend analisti |
| dogrulama.md | denetlendi | 2026-11-08 | denetçi (Sonnet) |

## Uygulama kararı tablosu (CX-M-07)

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| … | | | | | | |

Faz açılışında koordinatör doldurur; uygulayıcı yalnız `kabul` satırlarını kodlar.

## Açık sorular (ürün sahibine)
- **Rol modeli:** Tasarımda roller (Admin / Koordinatör / Üye) kişiye bağlı onay kutuları, koordinatörlük ise ayrı bir çip listesi. Backend'de Koordinatör/Üye bir **(program, departman) üyeliğinin** rolüdür; Admin `company_admin`'dir. "Koordinatör" kutusu hangi departmanda koordinatörlük verir? Çip başına rol mü seçilmeli? (bkz. ozellikler §7-1)
- **Liste kapsamı:** Liste şirket geneli mi, seçili program mı? Rol sekmesi sayıları hangi programa göre? (BE-011)
- **"Kullanıcı davet et":** E-posta daveti yok (BE-013). v1'de bu düğme mevcut "kullanıcı oluştur + geçici parola" formunu mu açsın? Form tasarımda yok.
- **Durum sütunu yok:** Tabloda hesap durumu (aktif / kilitli / silinmiş) gösterilmiyor; "Hesabı kilitle" var ama kilit açma ve kilitli göstergesi yok. Eklenmeli mi?
- **Silinmiş kullanıcılar:** Backend'de silinenler/geri yükleme var; tasarımda karşılığı yok. v1'de gerekli mi?
- **05b erişimi:** Koordinatör kendi departmanındaki üyenin kişisel takibini görebilir mi? Üye kendi sayfasını görür mü?
- **05b başlık eylemleri:** "Mesaj" (F7, v1 dışı), "Kişisel rapor" (biçimi bilinmiyor, F6?), "Görev ata" (hangi departmanda?), "Profili düzenle" (05 yan paneliyle aynı mı?) — v1'de hangileri etkin?
