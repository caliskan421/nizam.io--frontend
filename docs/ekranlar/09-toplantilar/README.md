# 09 · Toplantılar

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Toplantilar.dc.html` (`09 · Toplantılar`), `Toplanti-Detay.dc.html` (`09b · Toplantı › Haftalık koordinasyon`), `Toplanti-Formlar.dc.html` (`09c · Toplantı › Pencereler`), `Toplanti-Gorusme.dc.html` (`09d · Toplantı › Görüşme (tam ekran)`), `Toplanti-Kucuk.dc.html` (`09e · Toplantı › Küçültülmüş görüşme`)
**Faz:** F4 · **v1:** ✓ (09d/09e **statik**, KR-26) · **Yol haritası bağı:** K1, K2, K5, K7, K10, K13, K14; §4 F4 satırı ("Liste, detay, gündem, notlar, nottan görev, silinenler; video (W7) ayrı"); §6 KR-26
**Rota (önerilen, K10):** `/toplantilar` — tipli süzgeçler: `zaman` (`yaklasan` | `gecmis` | `silinenler`), `koordinatorluk` (departman kimliği, tekil); `/toplantilar/:meetingId` — `meetingId` (kimlik), isteğe bağlı `notlar` (`tumu` | `gorev` | `benim`). 09d/09e için v1'de rota yok (statik; bkz. `mekanizma.md` §1).

## Özet
Seçili programın ("sezon") toplantılarını gün gruplarına ayrılmış bir liste olarak gösterir (yaklaşan / geçmiş / silinenler), her satırda tarih kutusu, sahip + davetli koordinatörlük kodları, gündem / not / katılımcı sayaçları vardır. Detay sayfası gündem maddelerini (işaretlenebilir, eklenebilir), toplantı notlarını (yazma, süzme, düzenleme/silme, nottan görev oluşturma), katılımcıları koordinatörlüğe göre gruplu olarak, bağlı koordinatörlükleri ve bilgi kartını gösterir; üstte görüntülü konferans şeridi bulunur. Pencereler: yeni toplantı, göreve dönüştür, silme onayı, silinen toplantılar (yalnız admin). Görüşme ekranları (tam ekran ve küçültülmüş pencere) video modülüne aittir; F4'te statik (BE-023, faz sırası kararı; backend video uçları vardır, sağlayıcı kurulum profiline bağlıdır: `livekit` varsayılan, profil 2'de `none`, GAP-133 karar bekliyor). Admin sezondaki tüm toplantıları görür; koordinatör bağlı olduğu koordinatörlüklerin toplantılarını görür; üye yalnız "Üyeler dahil" açık ve departmanı bağlı toplantıları görür, katılımcı olmak yetmez (kural kaynağı meetings README K19/K45; `istemci-akislari.md` toplantıyı kapsamaz, bkz. `backend.md` §3). Ana veri kaynağı: toplantı modülü (`listMeetings`, `getMeeting`, not ve katılımcı uçları — eşleme `backend.md`'nin işi).

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
- 09b'deki **konferans şeridi** (Canlı, süre, "6 / 25 kişi bağlı", Katıl, Konferansı bitir) ve listedeki **Canlı / Bekliyor** durumları video modülüne bağlı. F4'te bunlar tamamen statik mi gösterilecek (K13, BE-022/BE-023), yoksa şerit gizlenip yalnız toplantı verisi mi gösterilecek?
- Yeni toplantı penceresindeki **"Kişiler"** davet biçimi ve 09b'deki katılımcı **"Ekle"** için kişi seçici tasarlanmamış. Hangi bileşen kullanılacak?
- **Gündem maddesi düzenleme** (madde "…" menüsü) ve toplantı **"Düzenle"** formu tasarımda yok. Düzenle formu yeni toplantı penceresinin aynısı mı olacak? Koordinatörlük kümesi orada da değiştirilebilir mi (09b'de "yalnız admin" deniyor)?
- 09b'de **dosyalar** bölümü yok. F4 kapsamında toplantıya dosya eklenmesi bekleniyor mu?
- Bilgi kartında **"Konferans: LiveKit"** yazıyor. Sağlayıcı adı kullanıcıya gösterilecek mi?
- Liste yalnız **koordinatörlük** süzgecini gösteriyor; BE-021 "tarih süzgeci"nden de söz ediyor. Tarih süzgeci tasarımda yok. Gerekli mi?
