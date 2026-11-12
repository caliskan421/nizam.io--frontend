# O4 — Kapanış

**Durum (2026-11-12):** O2/O3 PR'ları main'de (#102–#113); W127 #114 birleşti (main `8abcb3b`). Belge işi (W131) tamam; gerçek imaj tanığı (W130) yazılıyor; Codex ve kapanış PR'ı **bekliyor**. F5 henüz KAPANMADI.

## Gerçekleşen akış

| Adım | İş                                                                                                                                                  | İşçi / rol        | Durum                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------- |
| 1    | Belgeler: [rapor-F5](../../backend-eksikleri/rapor-F5.md), [ilerleme](ilerleme.md), ortak-kurallar §6, 12/06 kabul kanıtları, 06 mekanizma §4.4 notu, `kayit.md`, [pin yükseltme planı](pin-yukseltme-plani.md), [web-6 iskeleti](../web-6/README.md), yol haritası notu | W131 (Sonnet 5.5) | Yazıldı, yalnız belge; kod yok                                         |
| 2    | `dogrulama-F5.md`: gerçek Docker üretim imajı + Caddy CSP + gerçek backend (pin etiketinden), 06/07/12 üç rol × 390/1024/1440 × iki tema, G4 429, tam kapı | W130 (Sonnet 5.5) | #114 birleşti; ayrı dalda yazılıyor, sonuç henüz bu belgeye işlenmedi                      |
| 3    | Nihai kapı: Codex gpt-6.1-sol medium `-s read-only` tek koşum; hüküm `docs/reviews/WEB-5-codex.md`                                                  | Codex             | **Bekliyor**                                                          |
| 4    | Koşullar işçiyle kapatılır; gerekirse ikinci tur                                                                                                    | işçi + koordinatör | Bekliyor                                                              |
| 5    | Kapanış PR, MERGED ve kayıt (ilerleme, `../program/DURUM.md` yönetim deposu kuralıyla)                                                              | koordinatör       | **Bekliyor**                                                          |

## Roller

Koordinatör Fable (kod yazmaz, işçi çıktısı okumaz; özet alır, birleştirir, kaydeder). İşçiler Sonnet 5.5 medium, her biri ayrı worktree/dal. W131 (`web5/o4-kapanis`) ve W130 yalnız belge/doğrulama sahibidir; Codex salt okunur ve yalnız nihai kapıdadır. Gerçek cihaz/kullanıcı onayı otomatik geçti sayılmaz.

## Kapı sonuçları

| Kapı                                                  | Sonuç                                                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| İşçi tam paketleri (typecheck, lint, format, test, gen, build) | W121 509 dosya / 3450 test; W124 3515; W123 3520; W128 541 dosya / 3675; W127 4023 test. CI tek doğruluk kaynağıdır (iki zamanlama kırmızısı dersi: ilerleme) |
| main CI                                               | #102–#113 CI yeşil beklenerek birleşti (son main `a19c9d5`; üç denetimin tek tek sonucu doğrulanamadı); #114 birleşti (`8abcb3b`)                                                                          |
| Görsel ölçümler                                       | W121–W128 + W127 duman: taşma 0, CSP 0, sayfa hatası 0 (ham kanıt `.git/koordinator/web5-w12*/`)                                              |
| Belge kapısı (W131)                                   | `prettier --check` değişen dosyalar + `pnpm lint`: commit sırasında çalıştırıldı, sonuç W131 raporunda                                         |
| Gerçek imaj + gerçek backend (W130)                   | `dogrulama-F5.md` — **bekliyor**                                                                                                              |
| Codex nihai hüküm                                     | **Bekliyor** (ilk eylem HEAD, kabuk araç izi, 06 ve 12 kabul tabloları, KESİN 22/26a/27/29, K1/K2/K5/K7/K13)                                  |
| Kapanış PR                                            | **Bekliyor**                                                                                                                                  |

## Codex istem notları

Kabul ölçütleri: 06 ve 12 kabul tablolarının `kabul`/`geçici kabul` satırları ve satır dışı varsayımlar. Sınıf soruları: yaşam döngüsü (sahip söküm, geç sonuç), blob önizleme ve `img-src blob:` güvenliği, yönetici P33 geçici yolu, silme sırasında panel açık kalması (W127 kusur 1 tercihi). Bilerek yapılmayanlar: BE-072/120/121 statikleri, P45 ertelenenler, Ü1–Ü7 ve K1–K8 panelleri, F6. Araç izi olmayan çıktı kapı sayılmaz.

## Sonrası

Sonraki faz için ayrıca kullanıcı sınırı korunur: **F6 AÇILMAZ — kullanıcı onayı.** Pin yükseltmesi de ayrı onay ister ([plan](pin-yukseltme-plani.md)).

## Codex tur 1 (2026-11-13)

HEAD `44eb5fe`: **KOŞULLU UYGUN** ([WEB-5-codex.md](../../reviews/WEB-5-codex.md)). Ö-01/Ö-02 → W132 PR; K-01/K-02 → bu dal (düzeltildi). Tur 2 ve kapanış PR: bekliyor.

## Codex tur 2 (2026-11-13)

HEAD `d889e2a`: **KOŞULLU UYGUN**. Tur 1 koşulları kapandı; Ö-03/Ö-04 → W133 PR, bekliyor. Tur 3/kapanış PR: bekliyor.
