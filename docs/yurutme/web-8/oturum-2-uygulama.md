# O2 — Pin yükseltme ve canlıya alma (tamam: O2a #158, O2b #159–#163)

**Durum (2026-11-16): tamam.** O2a W170 #158 (`b141713`), O2b W173 #159, W174 #160, W171 #161, W172 #162, W175 #163 (main `6e09d7a`); sonuçlar [ilerleme](ilerleme.md). Plan (tarihsel): O1 (W168, W169) birleşince koordinatör istemleri üretti; her W istemindeki **Tespit** satırı W169'un matris dosyasındaki E-kimlik listesidir. Yöntem ve kabul: [ortak sözleşme](ortak-sozlesme.md) KESİN 35 (canlıya alma) ve KESİN 36 (pin).

| W | İş / sahiplik sınırı | Kaynak |
| --- | --- | --- |
| **W170 O2a** | **Pin WP1:** `api-pin.json` → `v0.23.0-api`, `pnpm gen:api`/`gen:check`, tip/fixture uyumu (zorunlu alan varsayılan üreticileri), kırıcı enum/şema farkları **ayrı commit ve ayrı test**, 33 hata kodu i18n, `e2e/backend` etiketi. UI davranışı **değişmez**; `designStub` kaldırılmaz | [pin-yukseltme-v023](pin-yukseltme-v023.md) WP1 |
| **W171 (a)** | Arşiv + ZIP: BE-072 S2 uçları, BE-120 dönem ZIP, BE-025/070/071/073/074/121; P33 geçici yönetici yolu kaldırılır | 06/07 README, rapor-F5 |
| **W172 (b)** | Raporlar: BE-122/124/125/132/133/134/135; BE-123/136 yalnız gelen alan | 13-raporlar README, rapor-F6 |
| **W173 (c)** | K1/Ü1 + görev kodu: BE-137…141, BE-005 (`code`/`sequence_no`) | 01, 03, rapor-F6 |
| **W174 (d)** | Silinen kayıtlar: BE-108/113…119; BE-110 yalnız tür sayaçları | 12 README, rapor-F5 |
| **W175 (e)** | Toplantılar + organizasyon CSV + bildirim sözlüğü: BE-021/061/063/065/067/068/014; BE-018 kısmi; `work.task.reminder`; BE-008 yalnız tasarımda çizildiyse | 09, 05, 08b, 14 |

**Paylaşılan dosyalar** (query-keys, i18n `tr<Modül>` ağaçları, `routes.catalog.ts`, `icons.ts`): KESİN 23–24; dokunacak W'ler W169 matrisinde adlandırılır, ilk işçi oluşturur. W171–W175 W170'nin birleşmesini bekler (tipler pin sonrası). Her W ayrı `web8/<oturum>-<wid>` dalı ve `nizam.io--frontend-wt-<wid>` worktree'si. Yeni BE kimliği gerekirse **BE-163'ten** (koordinatör verir; geçici `BE-YENI-<W-ID>-n`).
