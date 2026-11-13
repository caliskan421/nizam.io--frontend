# Ortak kurallar — bütün ekran grupları için tek sözleşme

Grup dosyalarında tekrar edilen ve Codex kapısında (`../reviews/EKRANLAR-codex.md`) ayrıştığı görülen ortak kurallar burada **tek yerde** tutulur. Grup dosyası bu kurala yalnız başvurur, yeniden yazmaz. Çelişkide bu dosya kazanır; değişiklik buradan yapılır.

Kaynak: yol haritası K1–K15, `istemci-akislari.md`, API `README.md`, Codex bulguları CX-M-02/03/05, CX-T-01/02/04/05/06/07/09, CX-S-02/10.

## 1. Mercek ≠ yetki (CX-T-04, CX-M-02)

- **Yetki** sunucu olgularından gelir: `me.company_admin` ve `me/departments` satırlarındaki `role`. **Mercek** (Admin / Koordinatör / Üye kartı, K2) yalnız içerik kapsamını seçer.
- Şirket yöneticisi Koordinatör merceğine geçince `company_admin` kaybolmaz: Yönetim grubu görünür kalır, `listUsers` 403 **dönmez**. Mercek değişimi capability hesabını değiştirmez; yalnız kapsam başlıklarını ve sorgu anahtarlarını değiştirir.
- Birden çok seçenek varken "ilk departmanı sessizce seç" **yok** (K2): hatırlanan kimlik yoksa seçici açılır, K7 boş durumu gösterilir. Tek seçenekte otomatik seçim.

## 2. Varsayım durumları (CX-M-02)

Dosyalardaki `**Varsayım:** … (doğrulanacak: …)` işareti **uygulama yetkisi değildir**. Her uygulama etkili varsayım üç durumdan birindedir:

| Durum | Anlam | Uygulayıcı ne yapar |
|---|---|---|
| öneri | analist varsayımı, karar yok | kodlamaz; grup README "uygulama kararı" tablosunda karar bekler |
| kabul | ürün sahibi/koordinatör kararı, README tablosunda tarih ve kaynakla | kodlar |
| ret | reddedildi, gerekçeli | kodlamaz; metin dosyada not olarak kalır |

Uygulayıcı işaretli varsayımı kendiliğinden kesinleştirmez; kararı yoksa rapora "karar bekliyor" yazar ve en dar güvenli davranışı (gizli/devre dışı) uygular.

## 3. `designStub` ne zaman (CX-M-03)

`designStub('BE-NNN', …)` yalnız **uygulanmış arayüzdeki, kabul edilmiş işlev eksikliğine** bağlanır: öğe ekranda var, backend ucu/alanı yok, `kayit.md`'de `açık`/`backend'de` satırı var.

Stub **kullanılmaz**: belge eksiği (sözleşmede anlam yok ama davranış var), faz ertelemesi (öğe başka fazda bağlanacak → faz notu + devre dışı), v1 dışı gizli modül, ürün kararı bekleyen seçenek, tasarımın sözleşmeye uydurulacağı yerler (tuval geri bildirimi). `tests/lint/design-stub.test.ts` kuralı buna göre okunur.

## 4. Statik ≠ sahte veri (CX-M-05, K13)

Backend karşılığı olmayan öğe statik gösterilir ama **gerçek işletme verisi gibi görünen örnek içerik üretmez**: kişi adı, tarih, sayı, işlem metni yok. Nötr yer tutucu ("Henüz veri yok" / "yakında"), devre dışı eylem, kısa açıklama. Geliştirme yapısında kesikli çerçeve; üretimde normal görünür, eylem tetiklemez. "Son işlemler" gibi akışlar statik örnek akış **göstermez**.

## 5. Faz görünürlük matrisi (CX-T-07, K14) — **ürün sahibi kararı 2026-11-08: menüde gizli**

Karar (sentez §4 soru 2): yeni modüller ve henüz başlamamış fazların **menü girişleri gizli**; mevcut ekran içindeki faz dışı eylemler **açıklamalı devre dışı** ("F5'te"). Asistan, Yardım ve zil paneli de bu kurala tabidir.

| Öğe | F0 | F1 | F2 | F3 | F4 | F5+ |
|---|---|---|---|---|---|---|
| Menü: Ana sayfa, Görevler | görünür | canlı | | | | |
| Menü: Zaman çizelgesi | gizli | gizli | gizli | canlı | | |
| Menü: Kullanıcılar, Koordinatörlükler | gizli | gizli | canlı | | | |
| Menü: Toplantılar | gizli | gizli | gizli | gizli | canlı | |
| Menü: Arşiv | gizli | gizli | gizli | gizli | gizli | F5 canlı |
| Menü: Mesajlar + okunmamış rozeti | gizli | … | | | | F7 canlı |
| Menü: İşlem geçmişi, Tablolar, Takvim, Kurumsal hafıza, Simülasyon | gizli (K14) | | | | | ayrı faz |
| Üst çubuk: bildirim zili | sayaç canlı, panel F7'ye kadar tıklanamaz (devre dışı) | | | | | |
| Üst çubuk: Asistan, Yardım | gizli (hedef yok) | | | | | F8 |
| Ekran içi bağlantılar (ör. 03 → Arşiv klasörü, 01 → İşlem geçmişi, 08b → Ekibe mesaj) | devre dışı + faz notu | | | | | ilgili fazda canlı |
| Tarih talebi düğmeleri (03 panel, 03c) | — | **okuma göstergesi canlı** (`pending_date_request`), gönder/onayla devre dışı "F3'te" | | canlı | | |

Ürün sahibi "devre dışı görünsün" derse menü satırları da devre dışı olur; matris tek yerden değişir.

**F6 eki (P46–P53, 2026-11-13).** F6 açıldı; matris satırları F6 sütunuyla okunur:

| Öğe | F6 |
|---|---|
| Menü: Ana sayfa | **canlı, 01 tam** (kartlar, ekip şeridi, sırala/süz; yönetici ana sayfası E-01-12, 19–39) |
| Menü: **Raporlar** | **YOK** (P47: ayrı sayfa ve menü öğesi yok, `/raporlar` rotası yok) |
| Rapor eylemleri (13 adet) | 06 Arşiv başlığı (dönem PDF, bölüm seç [statik], ZIP [BE-120 stub]), 09b/K7 toplantı raporu, 03/K3 görev raporu, 05 iş yükü raporu; önizleme 01f/01g; 01 "Rapor oluştur" yalnız yönlendirme menüsü (P47) |
| K1 koordinatör ana sayfası (`Koord-Ana`), Ü1 üye ana sayfası (`Uye-Ana`) | canlı; veri mevcut görev/toplantı/tarih talebi uçlarından istemci türetimi (pano uçları K/Ü'ye 403); K1'de rapor girişi yok (P53) |
| Rol menüleri (`Kenar-Roller`: yönetici/koordinatör/üye) | canlı; menü tanımı rol taşır, mercek≠yetki (§1, P1/P11); "Dosyalarım" üye etiketi |
| 01b İşlem geçmişi | **F6 dışı** (P46; nötr "Son işlemler" yer tutucusu kalır) |
| Ü2–Ü7, K2–K8, Bildirimler, Asistan, Takvim, Kurumsal hafıza | F6 kapsamı DIŞI (sonraki fazlar) |

Bağ: §3 `designStub` koşulu F6 statikleri için aynen geçerlidir (P48/P49/P51 statikleri `designStub`, yeni BE kayıtları W134 bloğunda, backend paketi açılmaz); §4 statik ≠ sahte veri.

## 6. Ortak sorgu anahtarları (CX-T-01)

Tek anahtar fabrikası `shared/http/query-keys.ts` (F0, `scopedKey()` üzerine). Gruplar anahtarı **kendisi yazmaz**, buradan başvurur:

| Kaynak | Anahtar | Geçersizleyen mutasyonlar |
|---|---|---|
| kurulum profili | `['instance','profile']` (S0, uygulama açılışı) | — (yalnız yeniden yükleme) |
| bildirim sayacı | `['notifications','unread-count']` (hesap geneli, kapsamdan bağımsız) | bildirim okundu uçları (F7); odakta tazele |
| sohbet okunmamış özeti | `['chats','unread-overview']` (hesap geneli) | markChatRead / markAllChatsRead, SSE (F7) |
| program listesi | `['programs']` | createProgram, program sıfırlama/aktarım |
| me / departmanlarım | `['me']`, `['me','departments']` | K6 yetki kaybı, üyelik değişiklikleri |
| program departmanları | `scoped(['departments'])` | link/unlink/rename |
| görev listesi | `scoped(['work-items', filters])` | görev oluştur/güncelle/sil/geçiş/ata; tarih uçları |
| görev | `scoped(['work-items', id])` | aynı |
| alt görevler | `scoped(['work-items', id, 'subtasks'])` | alt görev uçları |
| notlar | `scoped(['work-items', id, 'notes'])` | not uçları |
| **görev dosyaları** | `scoped(['work-items', id, 'files'])` — 03, 03c, 06 **aynı anahtarı** kullanır | attachFile, renameFile, deleteFile |
| **görev bağımlılıkları** | `scoped(['work-items', id, 'dependencies'])` — 03 ve 03c **aynı anahtarı** kullanır | addDependency, removeDependency |
| Gantt | `scoped(['gantt', face])` | tarih uçları, bağımlılık uçları |
| tarih talepleri | `scoped(['date-requests', filters])` | requestDateChange, reviewDateChangeRequest, deleteDateChangeRequest |
| pano | `scoped(['report','dashboard'])`, `scoped(['report','dashboard','coordinatorships'])` | **görev (work) yazmaları dahil** (aşağıdaki «Pano geçersizlemesinin gerçek kapsamı»): organizasyon yazmaları (üyelik, koordinatör, departman oluştur/bağla/ad, `createUser`/`updateUser`/`deleteUser`), görev yazmaları, tarih yazmaları ve devir/atama yazmaları eylemin program kapsamındaki panoyu geçersizler; **F5 (12 Silinen kayıtlar, W128):** `deleteMeeting`, `restoreMeeting`, `permanentDeleteMeeting`, `restoreDepartment`, `permanentDeleteDepartment`, `restoreAccount`, `permanentDeleteAccount` da geçersizler (`deleted_records` sayacı silinen toplantı, departman ve hesapları sayar; görev geri yükle/kalıcı sil zaten görev yazmaları kümesindedir) |
| arşiv | `scoped(['archive', 'folders'\|'tasks'\|'attachments'\|'uploaders'\|'preview', filters])` (`preview`: seçili görselin `downloadFile` blob'u) | dosya uçları (`attachFile`, `renameFile`, `deleteFile`) + `restoreWorkItem`, `permanentDeleteWorkItem` (geri yüklenen görevin dosyaları erişilebilir döner, kalıcı silinenin dosyaları gider; W128) |
| toplantı | `scoped(['meetings', filters])`, `scoped(['meetings', id])`, `…'agenda'`, `…'notes'` | toplantı/gündem/not/katılımcı uçları |
| **silinen listeleri** (12 Silinen kayıtlar, W128) | görev: `scoped(['deleted-work-items', filters])` (`listDeletedWorkItems`, S2, imleçli); koordinatörlük: `scoped(['deleted-departments'])` (`listDeletedDepartments`, S2); toplantı: `scoped(['meetings','deleted'])` (`listDeletedMeetings`, S2; 09 Silinenler ile **aynı** anahtar); kullanıcı: `['deleted-accounts', filters]` (`listDeletedAccounts`, S1, hesap geneli, kapsam değişince düşmez). İstemci süzgeçleri (tür, `q`, aralık, koordinatörlük, silen) anahtara girmez; yalnız sunucu parametreleri (sayfa boyu) girer | görev: `deleteWorkItem`, `restoreWorkItem`, `permanentDeleteWorkItem`; koordinatörlük: `deleteDepartment`, `restoreDepartment`, `permanentDeleteDepartment`; toplantı: `deleteMeeting`, `restoreMeeting`, `permanentDeleteMeeting`; kullanıcı: `deleteAccount`, `restoreAccount`, `permanentDeleteAccount`, `deleteUser`. Geri yükleme türevleri: görev → görev listesi/ayrıntı/sayaçlar, Gantt, arşiv, pano; koordinatörlük → `['me']`, `['me','departments']`, program departmanları, katalog, pano; hesap → kullanıcılar, departman üyeleri, pano |
| sohbet | `scoped(['chats'])`, `scoped(['chats', id, 'messages'])` | sohbet uçları + SSE uzlaştırma |
| kullanıcılar | `['users', filters]` (S1) | kullanıcı/hesap/üyelik uçları |
| **rapor (13 Raporlar, F6)** | dönem raporu `scoped(['report','season'])` (`reportSeason`, yalnız 01f açıkken, `staleTime: 0`, odak tazelemesi kapalı); toplantı raporu `scoped(['report','meeting', id])` (`reportMeetingDetail`, yalnız ŞY). `report.task(id)` ve `report.workload` **kullanılmaz** (P52: `reportTaskDetail`/`reportWorkload` F6'da okunmaz). PDF indirmeleri önbelleğe girmez | görev/tarih/organizasyon yazmaları (`season`, pano geçersizleme kümesiyle aynı); toplantı/gündem/not/katılımcı yazmaları, nottan görev, `deleteMeeting` (`meeting`) |

**Tarihsel karar (WEB-2 W82a #59).** Görev yazmalarında yalnız odakta pano tazeleme yaklaşımı WEB-P WP3 H-2 ile değiştirildi; yürürlükteki kapsam aşağıdadır. Organizasyon yazmalarında pano, o anki seçimle değil eylemin yakaladığı program kapsamında geçersizlenir; `staleTime` periyodik yenileme değildir.

**Pano geçersizlemesinin gerçek kapsamı (WEB-3 O4 + WP3 H-1/H-2; CX-P-Ö-03, CX-P-K-01; koordinatör 2026-11-10).** Önceki ayrım yürürlükte değildir; bağlayıcı küme `query-keys.ts` `INVALIDATED_BY.report` listesidir:

- **Organizasyon yazmaları:** üyelik, koordinatörlük, departman oluştur/bağla/ad/güncelle/sil, `createUser`, `updateUser` (Admin yetkisi `company_admin` değişimi pano `total_admins` sayacını değiştirir), `deleteUser`, `deleteAccount`.
- **Bütün görev (work) ve tarih yazmaları ile devir/atama yazmaları** (durum geçişi, oluşturma, güncelleme, silme, tarih uçları, `requestDateChange` / `reviewDateChangeRequest`, devir): Admin merceği kenar menüsü rozetleri (`overdue_tasks`, `pending_date_changes`) pano sayaçlarından gelir ve 03 sunucu sayaçlarıyla AYNI yazmadan sonra birlikte yenilenmelidir. Aynı yazmalar K/Ü merceğinin rozet sorgusunu (`['work-items','shell-counts',…]`) da `workItems.counts` süzgeciyle yeniler.
- **F5 silinen kayıtlar (W128):** `deleteMeeting`/`restoreMeeting`/`permanentDeleteMeeting`, `restoreDepartment`/`permanentDeleteDepartment` ve `restoreAccount`/`permanentDeleteAccount` panoyu geçersizler (`deleted_records` sayacı; ana sayfa E-01-02 düğmesi); kaynak `query-keys.ts` `REPORT_ORGANIZATION_WRITES`.
- **Pano dışında kalanlar:** not, dosya ve bağımlılık yazmaları (panoda sayılmaz).
- **Gantt:** alt görev yazmaları da `gantt` anahtarlarını geçersizler (satırın `subtask_counts` alanı; CX-P-Ö-03).

**Etkin okuma maliyeti (tek yer).** Geçersizleme yalnız etkin gözlemcisi olan sorguyu yeniden okutur; pasif pano önbelleği bayat işaretlenir ve bir sonraki gözlemde okunur. Panoyu bu sırada gözleyen yalnız (a) Admin merceğindeki kenar menüsü rozeti (`src/app/shell/side/badges.ts`, `enabled: adminView`, `staleTime` 30 sn) ve (b) açıksa 08 sayfasıdır. Bu yüzden her görev/tarih yazması Admin merceğinde en çok **bir** ek `reportDashboard` okuması, K/Ü merceğinde bir `shell-counts` okuması doğurur; diğer ekranlarda ek okuma yoktur. Fan-out sınırsız değildir (yazma başına bir okuma, eylemin program kapsamıyla sınırlı). Yeni yazma-pano ilişkisi bu bölümün ve `query-keys.test.ts` tablosunun birlikte güncellenmesini gerektirir.

Kapsam (program/departman) değişince `scoped(...)` ile başlayan **tüm** sorgular iptal edilir ve önbellekten düşer (K2). Program adı kabukta `['programs']`'tan okunur; 01b/03c gibi gruplar ayrı `readProgram` çağırmaz (CX-T-02).

## 7. Yazma protokolü ayrıntıları (CX-S-02, K5)

- `Idempotency-Key` **kullanıcı eylemi başına** üretilir (gönder düğmesi), form açılışında değil; ağ tekrarında aynı anahtar + aynı gövde. Formu düzeltip yeniden gönderme **yeni** eylemdir, yeni anahtar.
- `X-Requested-With` bütün yazma isteklerine istisnasız eklenir (CLAUDE.md); sözleşme istemese de zararsız.
- 409 `organization.confirmation_required` yalnız organizasyon uçlarında (koordinatör kaldırma, `updateMembershipRole`, `removeMember` vb.). Görev silme, tarih uçları, nottan görev, `assignMembership`, koordinatör atama: **yok** → istemci onay diyaloğu.
- Kısmi başarı (ör. `createWorkItem` başarılı, `addAssignments` başarısız): ilk yanıtın gerçek durumu kullanıcıya söylenir ("görev oluşturuldu, ek atama yapılamadı"), ilk atama korunur.
- İyimser güncelleme §8 gereği yok; başarı yanıtı gelmeden ekran değişmez.
- **Eylem bağlamı ve sahip yaşamı (WEB-1 O5; Codex CX-F1-E-02/E-03/E-05).** Her yazma, kullanıcı eylemi anındaki kapsam + oturum neslini taşır; motor her gönderimden önce karşılaştırır (`scope_changed` / `client.session_ended`). Ayrım:
  - **Yeni yazma kararı** — istemcinin sunucunun yeni durumuna ya da kullanıcının sonraki onayına bakarak başlattığı gönderim: onay kabulü (`confirmWrite`), çakışma sonrası birleştirip yeniden gönderme, `confirmation_required` devamı, manuel/otomatik çakışma tekrarı, bileşik işlemin ardıl adımı. Bunlar ilk eylemin bağlamını taşır (`submit(vars, { context })`) ve **sahibi (bileşen) sökülmüşse başlamaz** (`owner_disposed`; istek yok, bildirim yok). Kapsam/oturum değiştiyse de başlamaz; ilk başarı korunur, kısmi sonuç bildirilir.
  - **Aynı isteğin tamamlanması** — uçuştaki istek ve taşıyıcının `401 → refresh →` özdeş isteği **bir kez** yeniden göndermesi (aynı yöntem, URL, gövde, `Idempotency-Key`, kapsam başlıkları; yalnız `Authorization` yenilenir). Sunucu isteği kimlik nedeniyle henüz işlememiştir; bu yeni karar değildir. Sahip sökülmesi ve kapsam değişimi bunu **engellemez** (engellemek kullanıcının verdiği komutu, bildirim alacak kimse kalmadan sessizce düşürür). Şart olan değişmezler: özdeş istek, en fazla bir tekrar, **aynı kimlik** — refresh sırasında çıkış, hesap değişimi ya da oturum nesli değişimi olduysa tekrar gönderilmez. (Koordinatör kararı 2026-11-09; Codex tur 5'in "taşıyıcı tekrarına sahip kapısı" önerisi bu gerekçeyle uygulanmadı; ürün sahibi aksini isterse W82'de değiştirilir.)

- **Sökülmüş ekran ve oturum değişimi (WEB-2 W82b #60 ile kapandı; okuyucu katmanı W84 PR #63 `d52510c` ile tamamlandı — Codex WEB-1 Ö-07, Ö-08; WEB-2 CX-F2-Ö-01/Ö-02).** **Ö-07:** iki ayrı kural (Codex CX-F2-K-04): (a) **ortak önbellek uzlaştırması sürer** — sahip sökülse de yazma motorunun başarı geçersizlemesi ve anahtarsız uçta "sonuç bilinmiyor" durumundaki liste yeniden okuması çalışır (veri doğruluğu ekrana bağlı değildir; `useProtectedMutation`, `organization/api/keyless.ts`); (b) **sökülmüş ekran ek iş başlatmaz** — sahibi (bileşen) sökülmüş ekranın geç gelen sonucu ekrana özgü ek okuma, UI akışı (onay, çakışma, ardıl adım, gezinme) ya da bildirim **başlatmaz** (ortak `markDetached` / `notifyOutcome` / `reachesOwner`; kurulumda alınan `useToast()` sahip yaşamını bilir; ortak yardımcıların istisnası W84 PR #63 `d52510c`'da belgelenir — CX-F2-K-01). Tek istisna bileşik yazmanın **kısmi sonucudur** (ör. oluştur başarılı, bağla/ek atama başarısız): kullanıcı veri durumunu bilmek zorunda olduğundan uygulama düzeyi bildirim (`pushAppNotice`) gösterilir — yalnız aynı oturum neslinde. Sökülmüş form tam başarıda bildirim ya da `created` yaymaz. **Ö-08:** oturum nesli ya da hesap değişince — yerel çıkış **ve kardeş sekmeden gelen çıkış/hesap değişimi dahil** — bütün sorgular iptal edilir ve önbellek boşaltılır (`shared/session/query-session.ts` `bindSessionQueries`); okuyucular `sessionBound` kapısından geçer, böylece eski oturumun geciktirilmiş GET'i ya da TanStack geçici hata tekrarı yeni oturumun önbelleğine yazılamaz (iki katman yedekli; `session-isolation.test.ts` (yerel | kardeş) × (geciktirilmiş GET | geçici hata tekrarı)). Testlerde yerleşme beklemesi `shared/http/__tests__/settle.ts` `settleQueries` / `until` ile (sabit `setTimeout(0)` döngüsü yok).

## 8. Çıkış (logout) hatası (CX-S-10)

`logout` başarısız/zaman aşımı olursa: bellekteki erişim belirteci silinir, oturum **"sunucu çıkışı doğrulanamadı"** durumuna alınır, kullanıcı giriş ekranına gider ve **sessiz yenileme (refresh) denenmez**. HttpOnly yenileme çerezinin iptal edildiği varsayılmaz; kullanıcıya kısa uyarı ("Bu cihazdaki oturum kapatıldı, sunucu doğrulaması alınamadı") gösterilir.

## 9. Fan-out yasağının sınırı (CX-T-05, CX-T-06, K3)

K3'ün yasağı: **departmanları ayrı çağrılarla birleştirerek görev listesi kurmak**. Şunlar yasak değildir: aynı ucun imleçli sayfalaması; kullanıcının açtığı tek kaydın ek okuması (`getWorkItem`, `listWorkItemFiles`); kullanıcı eylemiyle tetiklenen N yazma (toplu katılımcı ekleme). Toplu yazmada atomiklik, kısmi başarı ve kota (ADR-0028) ayrı kararlardır; K3 gerekçesiyle reddedilmez.

## 10. Sayfa tavanı ≠ toplam tavanı (CX-S-01)

`limit` 200 **sayfa** boyutudur. İmleç bitene kadar yüklenen küme tamdır ve sayaçlar kesindir; imleç bitmemişse sayaçlar "yüklenen kayıtlar içinde" diye etiketlenir. "Toplam N" yalnız küme tamsa yazılır.

## 12. Ürün sahibi kararları (2026-11-08; P12–P17 2026-11-09; P18–P19 2026-11-10; P20 2026-11-10; P21–P31 2026-11-10; P33–P45 2026-11-12; P46–P53 2026-11-13) — bağlayıcı

`sentez.md` §4 soruları ürün sahibince cevaplandı; aşağıdakiler **kabul**dür, grup README kabul tablolarında bu numarayla anılır.

| # | Konu | Karar |
|---|---|---|
| P1 | Mercek ↔ yetki | **Yetki korunur.** Şirket yöneticisi Koordinatör/Üye merceğine geçince Yönetim grubu ve yönetici yetkileri kalır; mercek yalnız içerik kapsamını seçer (§1). |
| P2 | Faz dışı menü | **Menüde gizli.** Arşiv, Mesajlar, Asistan, Yardım, yeni modüller v1 menüsünde yok; ekran içi faz dışı düğmeler açıklamalı devre dışı (§5). |
| P3 | Çizilmemiş parçalar | **Ortak bileşenlerle minimum.** Yeni görev formu, durum geçiş menüsü, kişi seçici, koordinatör/üye ana sayfası `shared/ui` ile en sade biçimde; üye "bana atananlar", koordinatör seçili birim, admin KPI. Yeni kuyruk/kısayol icat edilmez; tuvale geri bildirim ayrıca. |
| P4 | Liste sınırları | **"Daha fazla yükle" + tek departman.** Sayaçlar imleç bitmediyse "yüklenen kayıtlar içinde"; numaralı sayfalayıcı ve toplam BE-003 kapanınca; çoklu koordinatörlük süzgeci yok (K3). |
| P5 | Durum / kanıt / tarih talebi | **Sözleşmeye uy.** 5 durum sekmesi (`iade_edildi` dahil); herhangi dosya kanıt, yüklemede etiket seçici (kapalı küme); tarih talebi okuma göstergesi F1'de canlı, gönder/onayla F3'e kadar devre dışı; yeni zorunluluk bayrağı yok. |
| P6 | Yönetici ana sayfası F1 | **KPI + sade özet; kartlar F6.** F1: selamlama, KPI şeridi, hızlı işlemler, nötr "Son işlemler" yer tutucusu; koordinatörlük kartları, ekip şeridi, raporlar F6. (P36 ile E-01-02 "Silinen kayıtlar" düğmesi F5'e alındı.) |
| P7 | 03 "Kopyala" / toplu seçim | **Kopyala = görev bağlantısını panoya; toplu seçim kutuları gizli** (toplu uç yok). |
| P9 | Marka satırı | **Sabit "RoketPortal"** (tasarım metni); `instanceProfile.display_name` kullanılmaz. |
| P10 | Kenar menüsü daraltma | **Yalnız oturum belleği**; K2 izinli anahtar listesi genişlemez (Y9 düşer). |
| P11 | Tek mercekli kullanıcıda Rol kartı | **Salt gösterim** (kart görünür, menü açılmaz). Dar menüde kapsam simgeleri (E-00-40) tıklanınca kapsam seçicisini açar (koordinatör kararı). |
| P12 | 05 rol düzenleme ve Kaydet (2026-11-09, #13) | **Çip başına anında.** Şirket Admin anahtarı ayrı; program/koordinatörlük çipinde tek üyelik rolü; her çip işlemi kendi onayı ve sonucuyla hemen uygulanır. Toplu atomik Kaydet yok. |
| P13 | 05 liste kapsamı (2026-11-09, #14) | **Yalnız yönetici.** Yöneticiye şirket listesi, seçili program üyelikleri etiketli. Koordinatöre yönetim ekranı açılmaz; kişisel takip yalnız yetkili görev kümesini gösterir. |
| P14 | Kullanıcı ekleme / kilit / silinenler (2026-11-09, #15) | **"Kullanıcı oluştur" + yöneticinin belirlediği geçici parola** (ilk girişte değiştirilir). Kilit durumu okunamıyorsa kilitle/aç anahtarı gösterilmez. Silinenler F2'de yok (ayrı akış). |
| P15 | 05b eylemleri ve "Dosyalar" (2026-11-09, #16) | **Sade.** Görev atamada hedef koordinatörlük açık seçilir; profil düzenleme yönetim paneline gider; Mesaj/Rapor/Etkinlik kendi fazına kadar açıklamalı devre dışı; "Dosyalar" sayı göstermez. |
| P16 | 08 erişim ve yerleşim (2026-11-09, #17) | **Yalnız yönetici, düz ızgara.** Sahte üst birim başlığı yok. Koordinatörün kendi birim görünümü ayrı ekran olarak sonra tanımlanır (F2'de kurulmaz); üyeye ekip yönetimi yok. |
| P17 | 08 eksik formlar ve "sezona kopyala" (2026-11-09, #18) | **Formlar ortak bileşenlerle (P3); kopyala yalnız yapıyı kopyalar**, görev taşımaz. Görev aktarımı ayrı eylemdir. |
| P18 | 03c tarih düzenleme, talep ve geri alma (2026-11-10, Codex §6 #11) | **Önerilen varsayılan.** Mevcut yetkisi olan doğrudan tarih düzenler (Admin "Kaydet" + bekleyen talepte "Onayla/Reddet"); Koordinatör ayrı "Tarih talebi gönder" düğmesiyle talep açar; Üye düzenlemez. "İptal et" yalnız gönderim öncesi 5 sn; gönderilmiş zincir değişikliğine otomatik "geri al" yok. Sürükleme ayrıca P8. |
| P19 | 03c oklar, şerit ve dışa aktarım (2026-11-10, Codex §6 #12) | **Önerilen varsayılan.** Oklar yalnız iki ucu da görünür görevler arasında; bağımlılık ekle/kaldır Admin + Koordinatör, üye salt görür; şerit "görev aralığı ‹tarih› – ‹tarih›" (sezon değil); PDF/görsel dışa aktarım istemcide SVG'den pilotla doğrulanır, hazır değilse devre dışı "yakında". |
| P20 | 03 E-03-14 "Talepleri incele" (2026-11-10) | **Ürün sahibi kararı.** Yalnız yönetici; Görevler listesinde mevcut tarih talebi süzgecini (E-03-09, URL `talep`) açar; zaman çizelgesine gitmez, yeni uç yok. Faz notu/devre dışı metni kalkar. |
| P21 | 09 F4-S1 video şeridi, Canlı/Bekliyor, 09d/09e, "konferans kapanır" (2026-11-10) | **Ürün sahibi kararı: gizli.** Konferans şeridi, sahte Canlı/Bekliyor, silme cümlesindeki "konferans kapanır" ve görüşme rotaları (09d/09e) F4'te çizilmez; gerçek sağlayıcı durumu W7'de bağlanır (KR-26). |
| P22 | 09 F4-S2 sağlayıcı adı (2026-11-10) | **Ürün sahibi kararı: gösterilmez.** Bilgi kartında sağlayıcı adı ("LiveKit" vb.) ve "Konferans" satırı kurulmaz. |
| P23 | 09 F4-S3 kişi seçici (2026-11-10) | **Ürün sahibi kararı: tasarımdaki özel kişi seçici.** Açılmış seçici çizimi kaynakta bulunamadı; ortak seçiciye sessiz geçilmez. ŞY `listUsers` program filtresiyle, K yalnız kendi koordine ettiği ekiplerin `listMembers` sonuçlarıyla aday seçer (BE-067); `person` kipinde ŞY de katılımcı yönetir (K21/K74). |
| P24 | 09 F4-S4 “Kişiler” davet modu (2026-11-10) | **Ürün sahibi kararı: KURULUR.** Pin v0.15 K73/K74: kuruluşta `person` ve tam bir sahip `department_ids` zorunlu; `members_included: true` yasak. PATCH kip ve `department_ids` içermez, `members_included: true` yasaktır. İki kipte katılımcılık görünürlük verir; person yönetimi ŞY veya sahip departmanı hâlâ koordine eden oluşturana aittir. Aday kapsamı BE-067 ile sınırlı; O1 raporu. |
| P25 | 09 F4-S5 düzenle formu (2026-11-10) | **Ürün sahibi kararı: oluşturma alanlarıyla aynı.** Sözleşme sınırı: person kipinde kip ve departman kümesi değişmez, `members_included: true` yasak; coordinatorship kümesini yalnız ŞY değiştirir. |
| P26 | 09 F4-S6 toplantı dosyası (2026-11-10) | **Ürün sahibi kararı: F4 kapsamı dışı.** Toplantıya dosya eklenmez. |
| P27 | 09 F4-S7 tarih kuralı metni (2026-11-10) | **Ürün sahibi kararı: düzeltilir.** Metin "Bugünden önceki günlere toplantı açılamaz."; "tarih yalnız ileri alınabilir" kalkar, istemci ek kural koymaz. |
| P28 | 09 F4-S8 not sınırı (2026-11-10) | **Ürün sahibi kararı: sayaç "N / 5000"** (sözleşme esas; tasarımdaki 2000 değil). |
| P29 | 09 F4-S9 liste tarih süzgeci (2026-11-10) | **Ürün sahibi kararı: BAĞLANIR** (öneri hayırdı; güncellendi). `listMeetings` `from`/`to` (`YYYY-MM-DD`, kurulum saat dilimi, v0.12+; `v0.15.0-api` pininde var) kullanılır. |
| P30 | 09 F4-S10 yetki kaynağı (2026-11-10) | **Ürün sahibi kararı: evet.** Toplantı eylem görünürlüğü meetings README §3/§4 kurallarından kodlanır (`capabilities.ts`); yol haritasına bu istisna yazılır (BE-036 madde 7 belge paketi gelince kaynak değişir). |
| P31 | Program avatar renkleri (2026-11-10) | **Ürün sahibi kararı: onaylandı.** `avatar-6/7/8` = `#4fd1c5`, `#ff6b6b`, `#94a3b8` kalır. |
| P8 | Gantt sürükleme (F3) | **Koordinatörde talep, adminde doğrudan.** Koordinatör sürüklemesi `requestDateChange` açar ("değişiklik onaya gider" metni kalır); admin sürüklemesi `updateWorkItem`/`extendWorkItem`; üye sürükleyemez. "İptal et" = gönderim öncesi 5 sn gecikme. Sözleşme koordinatöre doğrudan izin verir; bu ürün tercihidir ve `capabilities.ts`'te kodlanır. |
| P33 | 06/07 yönetici merceği, BE-072 çözülmeden (2026-11-12) | **Ürün sahibi kararı.** Yönetici için keyfî "ilk departman" teknik başlığı YOK (Codex §8 reddi korunur). 06 koordinatörlük ızgarası yönetici için `listProgramDepartments` (S2) adlarından kurulur; dosya/görev sayısı, boyut, son yükleme bu merceğte statik (`—`, designStub BE-072/BE-025). Yönetici bir klasöre tıklayınca o departman **açık seçimle** S3 başlığı olur (rota `/arsiv/:klasorId`); 07'de ağaç `archiveFolders` (yönetici tüm klasörleri görür), görev klasörleri `archiveTasks` ∩ `listProgramWorkItems(department_id)` (200 tavan + kesilme uyarısı; geçici yol, eksikler §3), dosyalar yalnız seçili görev klasöründe `archiveAttachments?work_item_id=` ile (başlık doğru, indir/adlandır çalışır). Yönetici için klasör düzeyi "Son eklenen dosyalar" ve "Tüm arşivde ara" statik/boş durum ("Görev klasörü seçin"). Koordinatör ve üye tamamen canlı (tek klasör). BE-072 açık kalır, rapor-F5'te yine raporlanır. |
| P34 | Etiketler (2026-11-12) | **Ürün sahibi kararı.** Kapalı küme Türkçe adlarla: İster, Plan, Girdi, Analiz, Çıktı, Sonuç (`ister/plan/girdi/analiz/cikti/sonuc`); renk istemci sözlüğünden. "Yeni etiket" formu tasarımda kalır, devre dışı (designStub BE-024). Tasarımdaki "Saha görselleri" vb. adlar kullanılmaz. |
| P35 | Yükleme (2026-11-12) | **Ürün sahibi kararı.** "Dosya yükle" (06) ve "Yükle" (07) ortak bileşenlerle görev seçtiren pencere açar: görev seçici (arşivde görünen görevler), zorunlu etiket, sürükle-bırak; yetki v0.15 ADR-0030. Göreve bağsız yükleme (BE-069) açık kalır. |
| P36 | Silinen kayıtlar (2026-11-12) | **Ürün sahibi kararı.** Tasarıma eklenen "01d · Silinen kayıtlar › seçilen · silinme tarihi sütunu" (`Silinen-Kayitlar-Tarih.dc.html`) **F5 kapsamında ayrı ekran** olur; yeni ekran grubu `docs/ekranlar/12-silinen-kayitlar/` (tespit W119). 01c (`Silinen-Kayitlar.dc.html`, günlük gruplar) önceki seçenektir, uygulanmaz; `Sablon-KayitListesi` yalnız şablon referansıdır. Pinli v0.15 ile canlı türler: görev, toplantı, departman, hesap (liste + geri yükle + kalıcı sil); dosya, alt görev, not/gündem türleri ile çöpü boşalt, CSV, toplu seçim/işlem ve "birlikte geri gelecek" sayaçları (dosya sayısı hariç) statik/devre dışı, BE olarak raporlanır. **P6 düzeltmesi:** ana sayfa E-01-02 "Silinen kayıtlar" düğmesi F5'te canlanır (yalnız şirket yöneticisi; sayaç `reportDashboard.deleted_records`; hedef rota `/silinen-kayitlar`); kartlar/ekip şeridi/raporlar F6'da kalır. Yalnız yönetici görür. |
| P37 | Saklama metni (2026-11-12) | **Ürün sahibi kararı.** Backend'de saklama süresi ve otomatik temizlik yok. Metin: "Silinen kayıtlar bir yönetici kalıcı olarak silene kadar saklanır." "Kalan süre" sütunu ve "Yakında kalıcı silinecek" kartı gizli; "silinme tarihi" sütunu canlı. Saklama politikası BE olarak raporlanır (ürün kararı ister). |
| P38 | 06 alt başlık (2026-11-12) | **Ürün sahibi kararı.** "Görevlere yüklenen dosyalar" ("Kurumsal hafıza" metni kullanılmaz; BE-033 ad çakışması). |
| P39 | "grup" / "çalışma grubu" rozeti (2026-11-12) | **Ürün sahibi kararı: gizli** (düz departman v1, K14). |
| P40 | Koordinatör ve üye 06 (2026-11-12) | **Ürün sahibi kararı.** 06'yı atlayıp doğrudan kendi klasörüne (07) yönlenir (`/arsiv` → `/arsiv/<folder_id>`; üyede `my-tasks`). |
| P41 | 12 Silinen kayıtlar "Koordinatörlük" türü (2026-11-12) | **Ürün sahibi kararı: eklenir.** Tasarımda çizilmemiş olsa da backend'de var olan silinen departmanlar (`listDeletedDepartments`/`restoreDepartment`/`permanentDeleteDepartment`, S2) tür segmentine "Koordinatörlük" düğmesi olarak ortak çip bileşeniyle en sade biçimde eklenir (P3). Kabul tablosunda E-12-16/E-12-68. |
| P42 | 12 "Tümü" sekmesi ve segment (2026-11-12) | **Ürün sahibi kararı.** "Tümü" sekmesi YOK (gizli/çizilmez). Segment: Görev (varsayılan) · Toplantı · Koordinatörlük · Hesap canlı; Alt görev · Dosya · Not ve gündem devre dışı. Birleşik liste BE-110 açık kalır. |
| P43 | 12 sayaç, tarih aralığı, URL (2026-11-12) | **Ürün sahibi kararı.** Tür sayacı yalnız açık sekmede "n" ya da "n+", diğer sekmelerde sayı yok. Tarih aralığı istemci süzgeci olarak canlı (`deleted_at DESC` sırayla sayfa yükleyerek), menü sayıları gizli, Hesap sekmesinde devre dışı (`deleted_at` yok). URL: `tur`, `q`, `koordinatorluk`, `aralik`, `kayit`; `silen` yalnız Toplantı'da canlı (`deleted_by`), diğerlerinde devre dışı (BE-108). |
| P44 | 12 çizilmemiş metinler (2026-11-12) | **Ürün sahibi kararı.** Alt satır: görevde "‹koordinatörlük› › Görevler", toplantıda "‹tarih saat› · ‹sahip koordinatörlük›" (E-12-28); iz kaydı cümlesi korunur, bağlantısız (E-12-40); boş liste / süzgeç boş / hata / panel boş durumları ortak K7 metinleri (E-12-54/60/61/62). |
| P45 | 12 ertelenen backend işleri (2026-11-12) | **Ürün sahibi kararı.** BE-112 saklama politikası, BE-109 alt görev, BE-111 not/gündem, BE-076 dosya çöp kutusu ERTELENDİ: ekranda statik/devre dışı kalır, backend paketine girmez, rapor-F5'te "karar bekler". |
| P46 | F6 kapsamı (2026-11-13) | **Ürün sahibi kararı.** F6 = (a) yönetici ana sayfası tam (01 kabul tablosunun F6 satırları E-01-12, 19–39), (b) **raporlar/PDF — ayrı sayfa YOK**; rapor eylemleri kendi ekranlarına eklenir (06 Arşiv, 09b/K7 toplantı detayı, 03/K3 görev paneli, 05 Kullanıcılar) ve iki önizleme ekranı (01f dönem sonu raporu, 01g toplantı raporu); referans artboard'lar 01i (indirme noktaları), 01h (pencereler/durumlar/iş yükü seçici); 01e ve A5 'önceki seçenek, uygulanmaz', (c) **K1** koordinatör ana sayfası (`Koord-Ana`) ve **Ü1** üye ana sayfası (`Uye-Ana`), (d) rol menüleri (`Kenar-Roller`: yönetici/koordinatör/üye menü grupları; F5 borcu "menü tanımına rol bilgisi / Dosyalarım etiketi" burada kapanır). 01b işlem geçmişi F6 DIŞI (BE-030 backend'siz; nötr "Son işlemler" yer tutucusu kalır). Ü2–Ü7 ve K2–K8 sonraki fazlar. **Backend paketi açılmaz** ("backend dursun"): bütün eksikler `kayit.md` + `rapor-F6.md`'ye yazılır, ekranda statik/devre dışı kalır (§3 designStub koşulu). Pin `v0.15.0-api` değişmez. **F6 AÇILDI 2026-11-13 (kullanıcı: "F6'yı aç").** |
| P47 | Raporların yeri: ayrı sayfa ve menü öğesi YOK, her rapor kendi alanında (2026-11-13) | **Ürün sahibi kararı** ("sidebara raporlar yaması istemiyorum; ayrı ayrı alanlarda olacak bu raporlamalar"). Kenar menüsünde **Raporlar öğesi yok**, `/raporlar` rotası yok. Eski Teknofest kalıbıyla: **06 Arşiv** başlığı → "Dönem sonu raporu (PDF)" (+ bitişik "Bölüm seç…"), "Dönem arşivi (ZIP)" (eski "Tümünü indir" bu adı alır), "Önizle" → 01f; **09b toplantı detayı** (ve K7) → "Toplantı raporu (PDF)" (ŞY + toplantının koordinatörü), önizleme 01g; **03 görev ayrıntı paneli** (ve K3) → "Görev raporu (PDF)" (ŞY + görevin koordinatörü); **05 Kullanıcılar** → "İş yükü raporu (PDF)" (ŞY; satır başı çoklu seçim, seçim yoksa bütün üyeler). 01 "Rapor oluştur" kutucuğu **kalır** (ürün sahibi 2026-11-13): ayrı sayfa açmaz, küçük yönlendirme menüsü (dönem sonu raporu → Arşiv, iş yükü → Kullanıcılar, toplantı raporu → toplantı seç, görev raporu → görev seç) — `kabul`. **K1 koordinatör ana sayfasında rapor girişi YOK** (ürün sahibi); koordinatörün raporları yalnız K7 (toplantı) ve K3 (görev) düğmeleri. Üye hiçbir rapor görmez (v0.15 REPORTING-K01/K07). |
| P48 | Dönem sonu PDF: bölüm seçimi, varsayılan "hepsi" (2026-11-13) | **Ürün sahibi kararı.** "Dönem sonu raporu (PDF)" düğmesi doğrudan tıklanınca **tam rapor** iner (v0.15 `reportSeasonPdf`, parametresiz). Yanındaki "Bölüm seçerek indir…" penceresi (01i) onay kutularıyla bölüm seçtirir: Yönetici özeti · Gantt · Teknofest geneli · Koordinatörlük bölümleri (alt kutular: görev tablosu, görev detayları, notlar, toplantılar, dosyalar) · Ek; koordinatörlük süzgeci çipleri. v0.15'te bölüm/süzgeç parametresi YOK → pencere çizilir, kodda **statik/devre dışı** (`designStub`, yeni BE kimliği: dönem PDF bölüm seçimi + departman süzgeci); bütün kutular seçiliyken = düz indirme (canlı). **Hedef PDF içeriği 01f çizimidir** (kapak, içindekiler, yönetici özeti, Gantt, Teknofest geneli, koordinatörlük bölümleri: görev tablosu + görev detay kartları + notlar + toplantılar + dosya grupları, ek/sözlük); mevcut backend şablonu daha sade → "dönem PDF şablonu 01f'ye göre yeniden yazım" yeni BE kaydı (backend dursun → `açık`). |
| P49 | Dönem arşivi ZIP'in yeri (2026-11-13) | **Ürün sahibi kararı.** ZIP düğmesi hem Raporlar başlığında hem 06 Arşiv başlığında. v0.15 `archiveFullZip` S3 (BE-120: yönetici başlıksız kullanamaz) → iki yerde de `designStub('BE-120')` devre dışı; çözülünce ikisi birden açılır. Hedef ZIP yapısı eski projedeki "raporlu dönem arşivi" (kök klasör; `00-Genel/Donem-Raporu.pdf`; koordinatörlük klasörleri: kendi raporu + `Dosyalar/<görev>/…`; `EKSIK-DOSYALAR.txt`) → yeni BE kaydı "ZIP içine raporlar" (açık). Onay penceresi 01h'deki gibi (dosya sayısı/boyut/süre uyarısı). |
| P50 | Toplantı raporu içeriği (2026-11-13) | **Ürün sahibi kararı.** Toplantı raporu 01g çizimindeki gibi: başlık bandı, künye (tarih · koordinatörlük · oluşturan), katılımcılar + "üyeler dahil" rozeti, gündem onay kutuları (n/m görüşüldü), notlar zaman akışı, **"Göreve dönüştürülenler" tablosu**. Web önizlemesi `reportMeetingDetail` (notes[].converted_to_task_id/converted_task_title) ile canlı; backend PDF'ine tablonun eklenmesi yeni BE kaydı (açık). Düğme not sayısına bağlı değildir (gündemi olup notu olmayan toplantı da indirilebilir — eski proje kuralı). |
| P51 | 01f tek artboard; [BE] statikler (2026-11-13) | **Ürün sahibi kararı (bölme koordinatöre bırakıldı → bölünmez).** 01f dönem raporu önizlemesi tek uzun artboard kalır (PDF'in web önizlemesi tek akıştır). Çizilmiş ama v0.15'te uçsuz öğeler **statik** (§3): HTML sürüm düğmesi, tarih aralığı/koordinatörlük süzgeci, CSV/XLSX, "Son raporlar" listesi, asenkron üretim ilerlemesi, koordinatör birim raporu. Her biri `kayit.md`'de yeni kimlik alır (W134 bloğu BE-122…); sahte veri gösterilmez (§4). |
| P52 | Rapor listeleri/sekmeleri (2026-11-13) | **Koordinatör kararı (P47 sonucu).** Ayrı sayfa olmadığı için 01e'deki sekmeler (Dönem raporu · İş yükü · Görev raporları · Toplantı raporları) uygulanmaz; `reportDashboardTasks/Meetings` listeleri F6'da kullanılmaz (görev/toplantı raporları kendi detaylarından iner). İş yükü: 05 listesi + `reportWorkloadPdf` (`member_ids`); 05'te ek `reportWorkload` JSON okuma yok (öneri, sonraki faz). Ağır uçlar (`reportSeason` JSON) yalnız 01f önizleme açıldığında okunur. |
| P53 | K1/Ü1 ve rol menüleri (2026-11-13) | **Ürün sahibi kararı (kapsam) + koordinatör varsayılanları (içerik).** K1'de rapor girişi/kutucuğu yok (ürün sahibi). K1 `Koord-Ana` ve Ü1 `Uye-Ana` birebir uygulanır; pano uçları K/Ü'ye 403 → veri mevcut görev/toplantı/tarih-talebi uçlarından (K14, BE-009 kalıbı), istemci türetimi tek yüklemden (KESİN 21). Çizili ama uçsuz parçalar (ör. kişisel kısayollar/dikkat kuyrukları için sunucu sayaçları, bildirim özeti) statik + kayıt. Kenar menüsü: menü tanımı rol taşır (`Kenar-Roller` üç sütun); yönetici K/Ü merceğine geçince **menü yönetici menüsü kalır**, yalnız içerik merceğe göre süzülür (P1/P11). Koordinatör merceğinde 01 koordinatörlük kartları: yönetici için **program geneli kalır** (E-01-28 açık sorusu — koordinatör varsayılanı; K1 zaten kendi birimini gösterir). |

## 11. Sürüm kapısı (00/yeni-2 kararı)

Yalnız `GET /v1/instance/profile` `api_version` ana sürüm kapısı uygulanır (CLAUDE.md). Ürün sürümü ile API pin minörünü karşılaştıran uyarı **yapılmaz** (tanımlı eşdeğerlik yok). Asgari web sürümü alanı backend'e belge/politika işi olarak önerilir.


### P32 — F4-S3 özel kişi seçici türetme kararı (2026-11-11)

Ürün sahibi, “önerin nedir? arka planda claude opus5.5 ile tartışıp karar ver” diyerek P23 özel seçicinin eksik açılmış görünümünü kararlaştırma yetkisini koordinatöre devretti. İki tur Claude Opus 5.5 değerlendirmesi ve koordinatör karşı görüşleriyle [S3 kararı](../yurutme/web-4/s3-kisi-secici-karari.md) kesinleşti: toplantıya özel, ağsız, aramalı çoklu seçim modalı; gerçek ad/avatar; locked katılımcılar; formda boş seçimi uygulama; kaybolan adayın seçimini sessiz düşürmeme; K/eksik liste uyarısı; ortak modal/odak altyapısı. Eski çizim bulundu iddiası yok, hazır ortak kişi seçici ikamesi yok. Yeni ürün onayı beklenmez; W105/W106/W107 test/görsel kapıları şart. Bu karar VoiceOver veya E-03C-27/41 kullanıcı kanıtı borçlarını kapatmaz; F5 yetkisi vermez.
