# WEB-7 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F7 AÇILDI 2026-11-14 (ürün sahibi: "F7'yi aç, backend dursun").** Kapsam P54 (sohbet + bildirimler); P55/P56 kayıtlı; P57–P66 koordinatör varsayılanı (taslak; P58 Web Push ve P60 kilitli kart ürün sahibi onayı bekler). WEB-6 KAPANDI (Codex 3 tur UYGUN). Pin `v0.15.0-api` değişmez; backend paketi açılmaz. Plan [README](README.md)'de.

## Durum

| Oturum | Durum | main hash |
| ------ | ----- | --------- |
| O1 W151 ‖ W152 ‖ W153 | **sürüyor** (W151 10-mesajlar tespiti, W152 14-bildirimler tespiti, W153 kararlar + süreç belgeleri) | — |
| O2a W154 | bekliyor | — |
| O2b W155–W159 | bekliyor (W159 P58 onayına bağlı) | — |
| O3 W160 | bekliyor | — |
| O4 W161 ‖ W162 → Codex → kapanış | bekliyor | — |

## Kayıtlar

### F7 açıldı — O1 (2026-11-14)

- **Kararlar:** P54 (kapsam), P55 (derin bağlantı), P56 (program seçici) kesin; P57–P66 koordinatör varsayılanı ([ortak-kurallar §12 taslak](../../ekranlar/ortak-kurallar.md)). **Onay bekleyen:** P58 (Web Push dahil mi), P60 (kilitli kart: backend mi tasarım mı).
- **W153** (`web7/o1-w153`, yalnız belge): ortak-kurallar §5 F7 eki + §12 taslak, 00-ortak E-00-20/21/38 + mekanizma §9 Mesajlar satırları, bu klasör, yol haritası §4, tasarım README, ekranlar README durum notu.
- **Sözleşme:** KESİN 33 (duman sonuç dosyası, P66) ve KESİN 34 (SSE yalnız `shared/sse`, P65) eklendi ([ortak-sozlesme](ortak-sozlesme.md)).

## Borçlar (başlangıç)

F6'dan devreden ([web-6 ilerleme](../web-6/ilerleme.md) tablosu esastır; kapanış sonrası borçlar F7'yi kendiliğinden genişletmez):

| # | Borç / not | Sınıf | Kaynak |
| --- | --- | --- | --- |
| 1 | Gerçek cihaz ekran okuyucu (VoiceOver) kabulü: W136–W142 ve F7 UI'ı için yapılamadı; sessiz geçilmez (KESİN 32) | kapanış sonrası borç | web-6 #1 (ekran okuyucu) |
| 2 | Kararsız testler: `password.test.ts` `force_password_change` yük altında; `archive/api/lifecycle.test.ts` 5 sn zaman aşımı; KESİN 32 bölme adayı | kapanış sonrası borç | web-6 #19 |
| 3 | Ü1 iade/onay/tarih notları ve K1 ApprovalsCard sayacı pending dışı kısmi kümede "≥" almıyor | kapanış sonrası borç | web-6 #21 |
| 4 | Soğuk `?gorev=` derin bağlantıda hedef birim/kapsam çözümleme UX borcu (P55 karar; UX açık). Bildirim hedef çözümlemesi (P57) aynı kalıbı kullanır | UX borcu açık | web-6 #22 |
| 5 | Gerçek backend'de gezinme SONRASI K/Ü mercek-parametre tanığı yok | kapanış sonrası borç | web-6 #23 |
| 6 | Ağır okuyucu bekleme denetimi `useReportSeason` içinde; yeni ağır okuyucu aynı denetimi kendisi yapmalı | uygulama notu | web-6 #24 |
| 7 | Duman betikleri tek `results.json` (CX-F6-K-10): **KESİN 33 ile kapandı** (F7 betikleri uyar) | kapandı (süreç) | web-6 #25, P66 |
