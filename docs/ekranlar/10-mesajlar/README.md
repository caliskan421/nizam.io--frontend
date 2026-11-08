# 10 · Mesajlar

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Mesajlar.dc.html` (`10 · Mesajlar › Genel grup`), `Mesajlar-Uye.dc.html` (`10b · Mesajlar › Üye görünümü (MSG-043)`), `Mesajlar-Pencereler.dc.html` (`10c · Mesajlar › Pencereler`), `Mesajlar-Acik.dc.html` (`A3 · Açık tema › Mesajlar`, yalnız `default: light` farkı)
**Faz:** F7 · **v1:** — (K14: v1 = F0–F4; tespit tam yapıldı) · **Yol haritası bağı:** K8 (SSE yalnız sohbet, `fetch` akışı), K5 (yazma protokolü), K6, K7, K13, §4 F7 satırı
**Rota (önerilen, K10):** `/mesajlar` (liste, sohbet seçili değil) ve `/mesajlar/:sohbetId` — tipli parametreler: `sohbetId` (backend sohbet kimliği; biçimi `backend.md`'de doğrulanacak), isteğe bağlı sorgu `?mesaj=<seq>` (bağlantıdan mesaja gitme: E-10-45 bağlantıyı üretir, E-10-49 hedefi vurgular) ve `?filtre=okunmamis|gruplar|kisiler` (E-10-06). Varsayım: sorgu adları öneridir; rota kataloğu sahibi karar verir.

## Özet
Program kapsamlı (S2) sohbet ekranı: solda konuşma listesi (sistem grubu "Genel", koordinatörlük grupları — tasarımdaki "Koordinatörler" sistem grubu **tasarımda var, sözleşmede yok, ürün kararı**: sözleşmede `auto_kind` yalnız `general` / `department`, ozellikler §7.17 —, serbest gruplar, birebir konuşmalar; arama, dört süzgeç sekmesi, okunmamış / bahsetme / sessiz rozetleri), sağda seçili konuşmanın akışı (balonlar, gün ve okunmamış ayırıcıları, alıntılı yanıt, @bahsetme, #görev çipi, dosya eki, kilitli dosya [tasarımda var, sözleşmede yok, ürün kararı — ozellikler §7.16], anket, tepkiler, düzenlendi, okundu tiki, sabit mesaj şeridi, yazıyor…) ve altta yazma çubuğu (+ ekle menüsü, # görev önerisi, yanıt bağlamı). Yedi pencere tasarlanmış: Grup bilgisi, Mesaj bilgisi, Yeni grup, Mesajı ilet, Mesajdan görev oluştur, Anket oluştur, Dosya paylaş. Ekranı programdaki herkes görür; 10 yönetici (Admin) merceği, 10b üye merceğidir — fark içerik ve eylem görünürlüğündedir ("Göreve dönüştür" yalnız görev açabilene). Tasarımdaki "kart / dosya okuyanın yetkisiyle kilitli görünür" ve "<n> kişi kilitli görür" kuralı **tasarımda var, sözleşmede yok, ürün kararı**: sözleşmede paylaşılan görev / koordinatörlük / dosya özeti her sohbet üyesine açıktır (MESSAGING-K31/K32; tek görünmez durum `available: false`), bkz. ozellikler §7.16. Veri kaynağı backend sohbet modülü (`istemci-akislari.md` §10); gerçek zamanlı güncelleme yalnız bu ekranda SSE ile gelir (K8).

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
- 10b'deki mor "Okuyan: … Aynı mesajlar onun yetkisiyle gösteriliyor (MSG-043)" şeridi (E-10-21) ürün özelliği mi (yönetici bir üyenin gözünden bakabilir), yoksa yalnız tuval açıklaması mı? Ürün özelliğiyse ayrı bir yetki ve uç gerektirir.
- Grup sohbetinde okundu tiki ve "Mesaj bilgisi" (kim okudu) tasarımda var; sözleşme (`istemci-akislari.md` §10.4) grupta okundu bilgisi vermiyor (BE-028). v1 sonrası F7'de grupta tik gizlenecek mi, statik mi gösterilecek?
- Tepki seçicide 6 emoji var (👍 ❤️ 😂 🎉 🙏 ✅); sözleşmede 4 tür (`like`, `heart`, `check`, `star`). Hangi küme esas?
- "Sessize al" ve sessiz rozeti (E-10-16, E-10-65) tasarımda var, sözleşmede yok (BE-027). Sessize alma süresi/seçenekleri tasarımda çizilmemiş.
- Anket "Anonim" seçeneği (E-10-97) — sözleşmede oy verenler her zaman görünür (§10.10). Seçenek gösterilecek mi?
- "Toplantı planla" (E-10-67) grup bilgisinden 09 Toplantılar formuna mı gider, üyeler ön dolu mu gelir?
- Mesajdan açılan görev mesajın altında nasıl görünür? Pencere "mesajın altında görev kartı" diyor, stil dosyası "görev kartı yok" diyor ve akışta örnek yok (ozellikler §7).
- Birebir konuşmada başlık alt satırı (çevrimiçi / son görülme) ve "neden yazamıyorum" metinleri tasarımda yok; sözleşme metinlerini (§10.6) aynen mi kullanalım?
