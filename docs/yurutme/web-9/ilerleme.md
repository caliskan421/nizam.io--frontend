# WEB-9 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz (ham kaynak `.git/koordinator/f5-notlar.md` ve `web9-kararlar.md`).

**F9 AÇILDI — karar 2026-11-16 (P77), yürütme 2026-11-17; kapsam 2026-11-17'de v0.25'i de içerecek biçimde güncellendi (P84).** Kapsam [README](README.md)'de. F8 [KAPANDI](../web-8/ilerleme.md) (main `a48a3e78`; devreden borçlar web-8 ilerleme #1–#38). Pin bugün `v0.23.0-api`; hedef `v0.25.0-api` (W182).

## Durum

| Oturum | Durum | main hash |
| --- | --- | --- |
| O1 W181 | **Teslim edildi (dal `web9/o1-w181`; PR koordinatörde)** | PR birleşince eklenir |
| O2a W182 (pin v0.25) | bekliyor | — |
| O2b W183 ‖ W184, sonra W185b ‖ W185 | bekliyor | — |
| O3 W186 | bekliyor | — |
| O4 W187 ‖ W188, Opus denetim + Codex koordinatör kapanışı | bekliyor | — |

## Kararlar

| # | Konu | Durum |
| --- | --- | --- |
| P77 | F9 = pin yükseltmesi + sohbet/bildirim canlıya alma; yeni ekran yok | **KESİN** (ürün sahibi 2026-11-16) |
| P78 | Hız politikası (P76) varsayılan: etkilenen testler yerelde, tam paket CI'da, tek duman 390+1440 koyu, gerçek backend e2e yalnız CI + tanık işçisi, eşzamanlı ≤ 2 işçi, Opus denetim ≤ 2 tur | kullanıcı süreç tercihi |
| P79 | Model ajandası: **2026-11-17 güncellemesi** işçi Sonnet, test Terra (gpt-6.1-terra), denetçi Opus, koordinasyon Codex; eski Haiku/Astra atamaları geçersiz | kullanıcı güncellemesi |
| P80 | Pin tek PR (KESİN 36 kalıbı): `v0.23.0-api` → **`v0.25.0-api`** (P84 ile v0.24'ten yükseltildi); UI değişmez | geçici kabul |
| P81 | Canlıya alma = KESİN 35; kısmi satır `bağlandı` olmaz; kalanlar BE-147 (GAP-246), BE-150…153 | geçici kabul (P84 ile güncel; v0.24'te kalan 027/029/080/160 ve kısmi 028/085/156 v0.25 ile `tam`) |
| P82 | SSE yalnız `shared/sse`; bildirimlerde SSE yok; sohbet mesajı bildirim zinciri SSE'den ayrı | geçici kabul |
| P83 | O2b bölme (≤ 2 eşzamanlı): W183 sohbet A, W184 sohbet B, **W185b sohbet C (yeni, öneri)**, W185 bildirimler | geçici kabul; matris §2–§4 (W181 önerisi) |
| P84 | **Kapsam güncellemesi:** F9 v0.25'i de kapsar; tek pin v0.23→v0.25; v0.25 karşılıkları F10'a bırakılmaz | **KESİN** (kullanıcı 2026-11-17) |

| P85 | Yönetici ana Codex; Sonnet uygulayıcı, Terra test, Opus bağımsız denetim | kullanıcı rol talimatı |
| P86 | Mevcut görev detayında kaynak mesaj bağlantısı W184; bildirim panelinde sessize alınanlar W185; BE027 kapanış W185 | koordinatör kapsam uygulaması |

## Kayıtlar

### O1 (2026-11-17)

- **W181** (`web9/o1-w181`): web-9 belgeleri (README, ortak sözleşme KESİN 1–37, ilerleme, oturum-1-keşif, pin-yukseltme-v025, canlıya alma matrisi), ekran 10/14 README F9 ekleri, `kayit.md` Bağ hedefleri, ortak-kurallar §12 P77–P84 (+ P79 model düzeltmesi), yol haritası F9 AÇILDI. Keşif: backend `v0.25.0-api` (`58856bbc`) etiketi bulundu; v0.24'ün bıraktığı BE-027/029/080/160 ve kısmi 028/085/156 ile BE-148/149/154 v0.25'te karşılandı. Matris: **28 satır, 23 tam / 0 kısmi / 5 kalır**.
- İlk taslak v0.24 hedefliydi; P84 ile atıldı (SIGINT; önceki düzenlemeler korundu, `pin-yukseltme-v024.md` hiç üretilmedi).

## Borç devri

Web-8 ilerleme #1–#38 F9 W'lerine otomatik taşınmaz. F9 ile ilgili: #38 (`platform.unauthenticated` işlenmemiş red; chat-writes geç 401 sınıfı; sohbet/bildirim W'lerinde yeniden görülebilir), 01f sanallaştırma (#16, F9 dışı), ADR-0041 ŞY aktör kararı ve E-03C-22 (karar bekler). Yeni borç F9 ilerledikçe numaralanır (#39'dan).

### O1 koordinatör kabulü (2026-11-17)

Sonnet W181: 656dba77 (yalnız 11 belge); Terra prettier ve 100 hedefli test başarılı. Koordinatör ee33b13/3939d3e ile kapsam, rol ve sahiplik düzeltmeleri; Opus tur1 KOŞULLU UYGUN → tur2 **UYGUN** (3939d3e, yalnız O1; final F9 kapısı değil). Düşük metin kalıntıları koordinatörce temizlendi; kaynak/pin değişmedi. PR #169 CI ve merge bekliyor; W182 bundan sonra başlar.
