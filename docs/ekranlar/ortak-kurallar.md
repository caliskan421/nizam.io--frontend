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
| Gantt | `scoped(['gantt', face])` | tarih uçları, bağımlılık uçları |
| tarih talepleri | `scoped(['date-requests', filters])` | requestDateChange, reviewDateChangeRequest, deleteDateChangeRequest |
| pano | `scoped(['report','dashboard'])`, `scoped(['report','dashboard','coordinatorships'])` | **görev (work) yazmaları geçersizlemez** (odakta tazele); **organizasyon yazmaları** (üyelik, koordinatör, departman oluştur/bağla/ad, kullanıcı) eylemin program kapsamındaki panoyu geçersizler — ayrım notu aşağıda |
| arşiv | `scoped(['archive', 'folders'|'tasks'|'attachments'|'uploaders', filters])` | dosya uçları |
| toplantı | `scoped(['meetings', filters])`, `scoped(['meetings', id])`, `…'agenda'`, `…'notes'` | toplantı/gündem/not/katılımcı uçları |
| sohbet | `scoped(['chats'])`, `scoped(['chats', id, 'messages'])` | sohbet uçları + SSE uzlaştırma |
| kullanıcılar | `['users', filters]` (S1) | kullanıcı/hesap/üyelik uçları |

**Pano geçersizlemesi ayrımı (koordinatör kararı 2026-11-09, WEB-2 W82a #59).** "Pano yazmayla geçersizlenmez" kuralı yalnız görev (work) yazmaları için geçerlidir: sık ve çok sayıdadırlar, pano odakta tazelenir. Organizasyon yazmaları (13 uç: üyelik, koordinatör ata/kaldır, departman oluştur/bağla/ad değiştir/güncelle, kullanıcı oluştur/güncelle/sil vb.) seyrektir ve pano sayıları (ör. `member_count`, `total_users`) doğrudan onlara bağlıdır; yöneticinin 60 sn eski sayı görmesi kabul edilemez → bu yazmalar **eylemin program kapsamındaki** `report.dashboard` anahtarlarını geçersizler (o anki seçili program değil, eylemin yakaladığı kapsam). Ekran içinde ayrıca el ile yeniden okuma yapılmaz (08'deki kaldırıldı).

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

- **Sökülmüş ekran ve oturum değişimi (WEB-2 W82b #60 ile kapandı; okuyucu katmanı W84 `<W84 PR>` ile tamamlandı — Codex WEB-1 Ö-07, Ö-08; WEB-2 CX-F2-Ö-01/Ö-02).** **Ö-07:** sahibi (bileşen) sökülmüş ekranın geç gelen sonucu bildirim ya da yeniden okuma **üretmez** (ortak `markDetached` / `notifyOutcome` / `reachesOwner`; kurulumda alınan `useToast()` sahip yaşamını bilir). Tek istisna bileşik yazmanın **kısmi sonucudur** (ör. oluştur başarılı, bağla/ek atama başarısız): kullanıcı veri durumunu bilmek zorunda olduğundan uygulama düzeyi bildirim (`pushAppNotice`) gösterilir — yalnız aynı oturum neslinde. Sökülmüş form tam başarıda bildirim ya da `created` yaymaz. **Ö-08:** oturum nesli ya da hesap değişince — yerel çıkış **ve kardeş sekmeden gelen çıkış/hesap değişimi dahil** — bütün sorgular iptal edilir ve önbellek boşaltılır (`shared/session/query-session.ts` `bindSessionQueries`); okuyucular `sessionBound` kapısından geçer, böylece eski oturumun geciktirilmiş GET'i ya da TanStack geçici hata tekrarı yeni oturumun önbelleğine yazılamaz (iki katman yedekli; `session-isolation.test.ts` (yerel | kardeş) × (geciktirilmiş GET | geçici hata tekrarı)). Testlerde yerleşme beklemesi `shared/http/__tests__/settle.ts` `settleQueries` / `until` ile (sabit `setTimeout(0)` döngüsü yok).

## 8. Çıkış (logout) hatası (CX-S-10)

`logout` başarısız/zaman aşımı olursa: bellekteki erişim belirteci silinir, oturum **"sunucu çıkışı doğrulanamadı"** durumuna alınır, kullanıcı giriş ekranına gider ve **sessiz yenileme (refresh) denenmez**. HttpOnly yenileme çerezinin iptal edildiği varsayılmaz; kullanıcıya kısa uyarı ("Bu cihazdaki oturum kapatıldı, sunucu doğrulaması alınamadı") gösterilir.

## 9. Fan-out yasağının sınırı (CX-T-05, CX-T-06, K3)

K3'ün yasağı: **departmanları ayrı çağrılarla birleştirerek görev listesi kurmak**. Şunlar yasak değildir: aynı ucun imleçli sayfalaması; kullanıcının açtığı tek kaydın ek okuması (`getWorkItem`, `listWorkItemFiles`); kullanıcı eylemiyle tetiklenen N yazma (toplu katılımcı ekleme). Toplu yazmada atomiklik, kısmi başarı ve kota (ADR-0028) ayrı kararlardır; K3 gerekçesiyle reddedilmez.

## 10. Sayfa tavanı ≠ toplam tavanı (CX-S-01)

`limit` 200 **sayfa** boyutudur. İmleç bitene kadar yüklenen küme tamdır ve sayaçlar kesindir; imleç bitmemişse sayaçlar "yüklenen kayıtlar içinde" diye etiketlenir. "Toplam N" yalnız küme tamsa yazılır.

## 12. Ürün sahibi kararları (2026-11-08; P12–P17 2026-11-09) — bağlayıcı

`sentez.md` §4 soruları ürün sahibince cevaplandı; aşağıdakiler **kabul**dür, grup README kabul tablolarında bu numarayla anılır.

| # | Konu | Karar |
|---|---|---|
| P1 | Mercek ↔ yetki | **Yetki korunur.** Şirket yöneticisi Koordinatör/Üye merceğine geçince Yönetim grubu ve yönetici yetkileri kalır; mercek yalnız içerik kapsamını seçer (§1). |
| P2 | Faz dışı menü | **Menüde gizli.** Arşiv, Mesajlar, Asistan, Yardım, yeni modüller v1 menüsünde yok; ekran içi faz dışı düğmeler açıklamalı devre dışı (§5). |
| P3 | Çizilmemiş parçalar | **Ortak bileşenlerle minimum.** Yeni görev formu, durum geçiş menüsü, kişi seçici, koordinatör/üye ana sayfası `shared/ui` ile en sade biçimde; üye "bana atananlar", koordinatör seçili birim, admin KPI. Yeni kuyruk/kısayol icat edilmez; tuvale geri bildirim ayrıca. |
| P4 | Liste sınırları | **"Daha fazla yükle" + tek departman.** Sayaçlar imleç bitmediyse "yüklenen kayıtlar içinde"; numaralı sayfalayıcı ve toplam BE-003 kapanınca; çoklu koordinatörlük süzgeci yok (K3). |
| P5 | Durum / kanıt / tarih talebi | **Sözleşmeye uy.** 5 durum sekmesi (`iade_edildi` dahil); herhangi dosya kanıt, yüklemede etiket seçici (kapalı küme); tarih talebi okuma göstergesi F1'de canlı, gönder/onayla F3'e kadar devre dışı; yeni zorunluluk bayrağı yok. |
| P6 | Yönetici ana sayfası F1 | **KPI + sade özet; kartlar F6.** F1: selamlama, KPI şeridi, hızlı işlemler, nötr "Son işlemler" yer tutucusu; koordinatörlük kartları, ekip şeridi, raporlar F6. |
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
| P8 | Gantt sürükleme (F3) | **Koordinatörde talep, adminde doğrudan.** Koordinatör sürüklemesi `requestDateChange` açar ("değişiklik onaya gider" metni kalır); admin sürüklemesi `updateWorkItem`/`extendWorkItem`; üye sürükleyemez. "İptal et" = gönderim öncesi 5 sn gecikme. Sözleşme koordinatöre doğrudan izin verir; bu ürün tercihidir ve `capabilities.ts`'te kodlanır. |

## 11. Sürüm kapısı (00/yeni-2 kararı)

Yalnız `GET /v1/instance/profile` `api_version` ana sürüm kapısı uygulanır (CLAUDE.md). Ürün sürümü ile API pin minörünü karşılaştıran uyarı **yapılmaz** (tanımlı eşdeğerlik yok). Asgari web sürümü alanı backend'e belge/politika işi olarak önerilir.
