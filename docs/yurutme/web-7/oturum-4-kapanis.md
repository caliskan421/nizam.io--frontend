# O4 — Kapanış

**Durum (2026-11-14): F7 KAPANMADI — Codex bekliyor.** O1–O3 (#137–#147) main'de (son kod `76e4345`; 758 dosya / 5478 test). Bu belgeler W161 (yalnız belge, `web7/o4-kapanis`); gerçek sunucu tanığı W162 (`web7/o4-w162`) ve Codex nihai kapısı ([hüküm](../../reviews/WEB-7-codex.md), iskelet) tamamlanmadı; kapanış PR'ı: bekliyor (CI ve birleşme ayrıca). F8 AÇILMADI ([web-8](../web-8/README.md)).

## Planlanan akış

| Adım | İş | İşçi / rol | Durum |
| ---- | -- | ---------- | ----- |
| 1 | Belgeler: [rapor-F7](../../backend-eksikleri/rapor-F7.md) (bağlanan uçlar, BE kayıt durumları, tasarım farkları, öneri sırası, deploy notları), [ilerleme](ilerleme.md), [oturum-3-entegrasyon](oturum-3-entegrasyon.md), 10/14/00 "F7 uygulama kanıtı", ekranlar README durumu, [WEB-7-codex](../../reviews/WEB-7-codex.md) ve [web-8](../web-8/README.md) iskeletleri, yol haritası §4 ve tasarım README notu | W161 (Sonnet 5.5) | Yazıldı (`web7/o4-kapanis`), yalnız belge; kod yok; PR bekliyor |
| 2 | `dogrulama-F7.md`: gerçek Docker üretim imajı + Caddy CSP (`worker-src`, `/sw.js` no-cache) + gerçek backend (pin `v0.15.0-api`); SSE gerçek akış, çift gönderim/`edit_conflict`, ek yükleme + bilet indirme, anket, mesajdan görev, bildirim türü sözlüğü ↔ gerçek `type`, Web Push gerçek abonelik (headful), 3 rol × 390/1024/1440 × iki tema, `KUSUR n:` listesi | W162 (Sonnet 5.5) | **Tamam** (#148, main `4457bd3`; [dogrulama-F7](dogrulama-F7.md): 18 bağlam 0/0/0, SSE/yazma/bildirim/Web Push gerçek; KUSUR 1–6 → W163) |
| 2b | W163 düzeltmeleri: KUSUR 1–6 (KUSUR 6: `/mesajlar` departman kapısından muaf, koordinatör kararı P54) + "Gruptan ayrıl" metin bağlantısı | W163 (Sonnet 5.5) | **Tamam** (#149, main `a56e291`; KUSUR 1–6 kapandı, 761 dosya / 5491 test) |
| 3a | Codex tur 1 (HEAD: W163 sonrası kapanış dalı main birleşik): nihai kapı, `gpt-6.1-sol` medium `-s read-only`; hüküm `docs/reviews/WEB-7-codex.md` | Codex | Bekliyor |
| 3b | Koşullar işçiyle kapatılır | işçi + koordinatör | Bekliyor |
| 3c | Codex tur 2 (ve gerekirse tur 3) | Codex | Bekliyor |
| 4 | Koşullar işçiyle kapatılır; gerekirse sonraki tur | işçi + koordinatör | Bekliyor |
| 5 | Kapanış PR, MERGED ve kayıt (ilerleme, `../program/DURUM.md` yönetim deposu kuralıyla) | koordinatör | Bekliyor |

## Roller

Koordinatör Fable (kod yazmaz, işçi çıktısı okumaz; özet alır, birleştirir, kaydeder). İşçiler Sonnet 5.5, her biri ayrı worktree/dal. W161 yalnız belge sahibidir (W162'nin `dogrulama-F7.md` dosyasına dokunmaz, yalnız bağ verir); Codex salt okunur ve yalnız nihai kapıdadır. Gerçek cihaz/kullanıcı onayı otomatik geçti sayılmaz; yapılamayan kanıt baştan "yapılamadı" yazılır (KESİN 32).

## Kapı sonuçları

| Kapı | Sonuç |
| ---- | ----- |
| İşçi tam paketleri | W154 698 dosya / 4921 test; W155 704 / 4988; W158 707 / 5007; W157 716 / 5104; W159 5089 test; W156 737 / 5256; W160 758 / 5478. Her sayı kendi dal ucunun raporudur; CI tek doğruluk kaynağıdır |
| main CI | #137–#147 birleşme sırasıyla; #141 ve #145 ilk koşumda kırmızı (düzenek/anlık görüntü), düzeltilip yeniden koşuldu; her PR için üç denetimin tek tek sonucu bu kayıtta **doğrulanamadı** (koordinatör kaydı: CI yeşilken birleştirildi) |
| Görsel ölçümler | W154–W160 duman: taşma 0, CSP 0, pageerror 0 (W160 68 ölçüm); ham kanıt `.git/koordinator/web7-w154…w160/` (yerel) |
| Entegrasyon / e2e | 125 entegrasyon testi geçti; gerçek backend e2e 3/3 (`chat`, `notifications`, `smoke`) |
| Belge kapısı (W161) | `prettier --check` değişen dosyalar, `pnpm lint`, design-stub testleri: sonuç W161 teslim raporunda |
| Gerçek imaj + gerçek backend (W162) | [`dogrulama-F7.md`](dogrulama-F7.md) — **alındı** (#148, `4457bd3`); kanıtlanamayanlar: VoiceOver, görsel onay, OS bildirimi, Safari/iOS/Firefox push |
| Codex nihai hüküm | **Bekliyor** |
| Kapanış PR | **Bekliyor** |

## Codex istem notları

Kabul ölçütleri: [10-mesajlar](../../ekranlar/10-mesajlar/README.md) ve [14-bildirimler](../../ekranlar/14-bildirimler/README.md) kabul tablolarının `kabul`/`geçici kabul` satırları ve satır dışı varsayımlar; P54–P66; KESİN 17/21/22/26/27/29/30/33/34. Sınıf soruları: SSE yaşam döngüsü (`shared/sse` dışında `EventSource`/akış yok, `sessionBound`, kapsam/oturum/gizli sekme iptali, yeniden bağlanma + `reconcile`, olay içeriğinin önbelleğe yazılmaması), yazma güvenliği (`client_message_id`, `Idempotency-Key`, `edit_conflict`, "sonuç bilinmiyor"), geç sonuç ve sökülmüş ekran (bildirim yok), hesap/program değişiminde önbellek ve taslak temizliği, yetki olguları (mercek ≠ yetki; mesajdan görev ŞY + K; `member_source_managed`), türev sayaçlar (KESİN 29: okundu → liste + sekme sayacı + menü rozeti + zil), bildirim hedef çözümlemesi (kapsamda yok → 03 listesi + tek bildirim), Web Push (izin yalnız tıklamada, `enabled=false` gizli, 409/422 yerel geri alma, çıkışta yerel `unsubscribe`, `sw.js` ağ isteği yapmaz), odak/ARIA (KESİN 27), 390 etkileşim (KESİN 30), `designStub` kayıt tutarlılığı. Bilerek yapılmayanlar: BE-027/028/029, BE-080…086, BE-142…156, BE-160…162 statikleri, P63 (tercihler/cihazlar/sessiz saatler), P60 (kilit çizilmedi), Takvim, Kurumsal hafıza, profil (Ü7), Ü2–Ü7/K2–K8, Asistan, 01b, pin yükseltmesi, F8. Araç izi olmayan çıktı kapı sayılmaz.

## Sonrası

**F8 AÇILMAZ — kullanıcı onayı** ([web-8](../web-8/README.md)). Pin yükseltmesi ve BE paketi de ayrı onay ister ([plan](../web-5/pin-yukseltme-plani.md)); "backend dursun" sürüyor. "F7 kapandı" ifadesi W162 tanığı, Codex hükmü ve kapanış PR'ı MERGED olana kadar kullanılmaz.
