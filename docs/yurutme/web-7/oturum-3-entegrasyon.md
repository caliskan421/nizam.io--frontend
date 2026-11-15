# O3 — W160 zorunlu entegrasyon turu (tamam, #147 `76e4345`)

**Durum (2026-11-14):** birleşti. Dal `web7/o3-w160` (29 commit, uç `a7a509b`), taban main `5ae9bf8` (O2b birleşik). İstem ve senaryo listesi [oturum-2-uygulama](oturum-2-uygulama.md) O3 satırı; tespit [10-mesajlar](../../ekranlar/10-mesajlar/README.md), [14-bildirimler](../../ekranlar/14-bildirimler/README.md), [00-ortak mekanizma §9](../../ekranlar/00-ortak/mekanizma.md).

Gerçek router/AppShell/oturum ve durumlu sahte sunucuyla (sunucu görünürlüğü **süzmeden** döner; süzme istemcide sınanır) ve gerçek bileşenlerle koşar; sahte SSE akışı `fetch` çevresinden karşılanır. Sahte `/v1` kullanıldığı için gerçek backend kanıtı değildir; o W162'dedir ([dogrulama-F7](dogrulama-F7.md), alındı). e2e ise gerçek backend'e karşı koşar (aşağıda).

## Sonuç

| Ölçü | Değer |
| --- | --- |
| Entegrasyon testi | **125**, hepsi geçti (bu belge yazılırken yeniden koşuldu): `chat-*` 91 (dialogs 11, focus 26 [`it.each` genişlemiş], late 6, list 5, refs 4, roles 9, stream 14, window 6, writes 10), `notifications-*` 26 (panel 15, push 11), `menu-chat-shell` 8 |
| e2e (gerçek backend) | `e2e/chat.spec.ts` (iki hesap: gönder → SSE ile canlı → okundu → rozetler) + `e2e/notifications.spec.ts` (görev oluştur → üyenin zilinde satır → tık → okundu + 03 `?gorev=`) + `smoke.spec.ts` = **3/3** (backend `v0.15.0-api`, proje `nizamio_web7_w160`; HEAD `a7a509b`); `global-setup` sohbet tohumu eklendi (iki hesap, bir grup, birkaç mesaj). W154'te gerçek backend tam paket 5/5 |
| Görsel duman | üretim `dist` + gerçek Caddy (nonce CSP) + Playwright, senaryo başına ayrı `results-<senaryo>.json` + HEAD `a7a509b` + koşum kimliği (KESİN 33): liste, konuşma, pencereler (6), zil paneli, Web Push kutusu, kabuk menü 390; **68 ölçüm satırı: taşma 0, CSP ihlali 0, pageerror 0**; 390 gerçek tıklama (liste↔konuşma, mesaj menüsü, Composer menüleri, pencereler, zil paneli, kabuk menüsü); konsol 12 kayıt: 6 × Chrome "incognito'da Push API" (düzenek) + 6 × sahte `GET /v1/meetings/m-1` 404 (ürün hatası değil; "konsol hatası 0" diye sunulmaz) |
| Tam paket | typecheck · lint · format:check · test (**758 dosya / 5478 test**) · build yeşil (işçi raporu; `pnpm test` bu belge yazılırken W161 dalında yeniden koşuldu: 758/758 dosya, 5478/5478 test geçti) |
| Kanıt | `.git/koordinator/web7-w160/` (yerel; PNG ve JSON git'e girmez) |

## Senaryolar

1. **Sohbet uçtan uca (ŞY/K/Ü):** liste (50'lik sayfa, imleçle "Daha fazla yükle", sunucu sırası), süzgeç yalnız yüklü sayfada, 300 ms arama, `?filtre=`, `chat.changed`; konuşma (seq penceresi, daha eski yükle, alıntıya git ≤ 3 sayfa, `?mesaj=` `around`), gönder (`client_message_id`, 503 → aynı kimlikle yeniden, yanıt kaybolur → tek mesaj), düzenle (`edit_conflict`), sil, 4 tepki, sabitle, anket oy/bitir, okundu (1 sn, tek `markChatRead`; liste + sekme sayacı + menü rozeti türevleri, KESİN 29), `read-all`. `chat-list`, `-window`, `-writes`.
2. **SSE:** yalnız `/mesajlar` açıkken (başka sayfada 0 istek), program ve oturum değişiminde kapanış, gizli sekme 30 sn, 401 tek refresh, `message.created` (başka sohbet → yalnız liste; açık sohbet → pencere), yerel yama + olay çakışması (çift balon yok), `message.updated/deleted`, `read.updated` (`peer_read_seq`), `member.changed` (kendi hesap çıkarıldı → `getChat` 404 → listeye dön), `typing` (önbelleğe yazılmaz, 5 sn söner), kopma + üstel bekleme + `reconcile`, 403 yeniden deneme yok, N-10-15 göstergesi. `chat-stream`.
3. **Pencereler ve tetikleyiciler:** mesaj bilgisi (birebir okundu; grupta devre dışı), mesajdan görev (`Idempotency-Key`, aynı anahtarla yeniden gönder tek görev, 03 `?gorev=`), ek yükleme multipart, Arşivden dosya, anket (grupta; birebirde yok), yeni grup (`Idempotency-Key`, tek grup), üye çıkarma ortak onay (vazgeç istek atmaz); odak dönüşü pencere × kapanış yolu (Esc/✕/vazgeç) × 1440/390 (KESİN 27). `chat-dialogs`, `-focus`.
4. **Yetki ve mercek:** birebir adayları, grup kurma (K06: Ü dahil), "Mesajdan görev" ve "Toplantı planla" yalnız ŞY + K, K yalnız kendi birimi, yönetici Koordinatör/Üye merceğinde de ŞY (mercek ≠ yetki), `from_source` üyede "Çıkar/ayrıl" yok, bayat istemci 409 `member_source_managed`, 403 `messaging.not_authorized`. `chat-roles`.
5. **Görev çipi ve referanslar:** özet çip, tık → `getWorkItem` → 03 `?gorev=`, 403 "erişiminiz yok", `available:false` → "artık yok", K aynı çipi açar. `chat-refs`.
6. **Bildirim paneli:** sayaç rozeti (1–9, 9+, okunamazsa gizli), Bugün/Dün/Daha eski, "Daha eski" imleçle, boş durum, `work_item` okundu + 03; kapsamda yoksa 03 liste + tek ortak bildirim; `meeting` → 09b (404 → bulunamadı); `program_transfer` → 01; `membership` gezinme yok; "Okundu say", "Tümünü okundu say", 404 satır düşer, kapsam/oturum değişimi paneli kapatır, Esc → odak zile, panel açıkken ConfirmDialog tıkı dış tık değil. `notifications-panel`.
7. **Web Push:** `enabled=false` kutu yok; izin yalnız tıklamada; kayıt gövdesi (CSRF, anahtarlar, `user_agent`); izin reddi → Engellendi; `default` dönerse kutu geri açılır; 409/422 yerel geri alma; çıkışta yerel `unsubscribe` (sunucu hedefi silinmez). `notifications-push`.
8. **Kabuk:** `CURRENT_PHASE` F7; Mesajlar üç rolde; `unread` rozeti (`mentioned` danger, 1–9, 9+, yoksa çizilmez); zil ve menü rozeti bağımsız; 390 kabuk menüsü gerçek tıklama + odak. `menu-chat-shell`.
9. **Geç sonuç/oturum (KESİN 26):** gönderim sürerken sayfa sökülür (bildirim/ek okuma/akış yok); bekleyen okundu gönderimi sahip sökülünce ve kapsam değişince iptal; program değişince akış p1 → p2 ve p1 satırları yeni listeye yazılmaz; taslak program değişiminde boşalır; hesap değişince sohbet/bildirim önbelleği ve sayaçlar kalmaz. `chat-late`.
10. **Üretim + Caddy CSP + Playwright:** yukarıdaki duman satırı.

## Kusurlar (sınıf → commit; hepsi düzeltildi, test sabitledi)

| # | Sınıf | Düzeltme | Commit |
| --- | --- | --- | --- |
| 1 | Tetikleyici bağlamı kaybı (Ekle › Arşivden dosya, Dosya paylaş penceresini yanlış sekmede açıyordu) | Pencere Arşivden sekmesinde açılır | `41dcfba` |
| 2 | Çözülemeyen hedef bildirimsiz (03 `?gorev=` kapsamda yok) | Liste + tek ortak "Bu görev bu kapsamda bulunamadı" bildirimi (`trNotifications.target.workNotFound`) | `a8fedc4` |
| 3 | Üst katman etkileşimi dış tık sayılıyor | Panel açıkken ConfirmDialog (aria-modal) içindeki basış paneli kapatmaz | `4956d15` |
| 4 | Çifte pencere açma yolu (`provide` opener + `defineExpose({ openDialog })`) | `ChatPage` tek açıcı; dışa açık `openDialog` kaldırıldı | `576eadc` |
| 5 | Sözleşme tipsiz çalışma anı okuması (`ChatPageContext.messages.query`) | `MessagesQueryState` tipli | `697fda0` |
| 6 | N-10-15 "Bağlantı yeniden kuruluyor…" göstergesi akış durumundan değildi | `ChatPageContext.connection` (`StreamState`) ile çizilir | `697fda0` |
| 7 | Bildirimsiz erişim kaybı (açık sohbetten düşünce sessiz) | Tek bildirim + listeye dön | `5ae0e0e` |
| 8 | Kapsam değişiminde sökülen yazma çubuğu taslağı boşaltamıyor | Taslak deposu modül yaşamına bağlandı (`hesap:program:sohbet`) | `a981ae0` |
| 9 | Açılır yüzey kaydırma kabında kırpılıyor (menü, tepki seçici) | Açılınca görünür olana dek kaydırılır | `9934bf2` |
| 10 | Kart genişliği `min-content`'e daralıyor | Balon/kart alt genişlikleri tasarım token'ıyla (`chat-bub-min-w`, `chat-att-min-w`) | `4f3c278` |
| 11 | 390'da gizli satır araçları sütunu balonu daraltıyor; geniş kartlar taşıyor | Araçlar balonun üstünde yüzer; sütun içeriğin en küçük boyutundan daralmaz | `762cc67` |
| 12 | Kayma kararı yanlış listeyi okuyor (canlı gelen mesajda en alttaki okuyucu alta inmiyor, okundu işaretlenmiyor; **gerçek backend e2e'sinde yakalandı**) | Önceki ölçü önceki pencereyle alınır | `1356519` |
| 13 | Ulaşılamaz durum yüzeyi çizilmiyor (silinmiş görev referansı) | `available:false` → "artık yok" çipi | `b322284` |

Diğer: `web-tokens.json` biçim `a7a509b`; menü senaryosu lint `db7ad16`; akış izleme tüm sohbet senaryolarında `9fdd02a`. TASLAK kapananlar: `ConversationPane` ve `ChatDialogs` iskeletleri gerçek gövdeyle, `CHAT_DIALOG_OPENER` ↔ `openDialog` tek yola indi (KUSUR 4); komşu bileşenler gerçek bileşenle karşılanır (KESİN 16).

## Varsayımlar ve açık

- **Varsayımlar 1–3 kabul** (koordinatör): (1) açık tema rozet zemini `--accent` kalıcı kabul → [rapor-F7 §4](../../backend-eksikleri/rapor-F7.md); (2) program değişiminde URL'deki eski sohbet kimliği listede yoksa "bulunamadı" kabul; (3) `read.updated` kendi hesaba gönderilmiyor varsayımı sahte sunucudadır, gerçek tanık W162.
- **Açık:** `manifest.webmanifest` borcu (iOS push); okunmamış ayırıcı kozmetik sapma (BE-082); sahte akış düzeneği `watchStreams`; gerçek cihaz ekran okuyucu. Borç listesi: [ilerleme](ilerleme.md).
