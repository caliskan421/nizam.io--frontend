# O4 — Kapanış

**Durum (2026-11-14):** O1–O3 PR'ları main'de (#119–#128), W144 tanığı #129 (`66c1708`) ve W145 düzeltme turu #130 (`136da28`) birleşti; **O4 düzeltme turu KAPANDI**. Belge işi (W143) yazıldı; Codex tur 1 ve kapanış PR'ı **bekliyor**. F6 henüz KAPANMADI. F7 AÇILMADI ([web-7](../web-7/README.md)).

## Gerçekleşen akış

| Adım | İş                                                                                                                                                                                                                                           | İşçi / rol         | Durum                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| 1    | Belgeler: [rapor-F6](../../backend-eksikleri/rapor-F6.md), [ilerleme](ilerleme.md), [oturum-3-entegrasyon](oturum-3-entegrasyon.md), 13-raporlar mekanizma §4.3 (KESİN 26), 01/13/00 README kabul kanıtları, [web-7 iskeleti](../web-7/README.md), yol haritası §4 ve tasarım README notu | W143 (Sonnet 5.5)  | Yazıldı (`web6/o4-kapanis`), yalnız belge; kod yok; PR bekliyor              |
| 2    | `dogrulama-F6.md`: gerçek Docker üretim imajı + Caddy CSP + gerçek backend (pin `v0.15.0-api`), dört PDF akışı, 429/403/404, 01f/01g/01/K1/Ü1, üç rol × 390/1024/1440 × iki tema, `?gorev=` derin bağlantı, tasarım farkları, `KUSUR n:` listesi | W144 (Sonnet 5.5)  | Birleşti (#129, `66c1708`): 78 görünüm / 6 tıklama bağlamı / 35 API koşumu 0 başarısız; kusurlar: 1/3/5a → W145, 2 ve 5b kusur değil (değerlendirildi), 4 ürün kararı (karar bekler)       |
| 2b   | W145 düzeltmeleri: KUSUR 1 (`/oturum?next=`), KUSUR 3 (01 kutucukları 09/05'e), KUSUR 5a (K1 şeridi flex-wrap); 660 dosya / 4599 test, duman 0/0/0 | W145 (Sonnet 5.5) | Birleşti (#130, `136da28`) |
| 3a   | Codex tur 1 (HEAD `633d9d2`): **KOŞULLU UYGUN**; hüküm [WEB-6-codex.md](../../reviews/WEB-6-codex.md) | Codex | Tamam |
| 3b   | Koşullar: W146 (E-01, E-02, E-05, E-06; reports), W147 (E-03, E-04, K-01, KUSUR 4 mercek listesi; home/work), W148 (K-02 gerçek backend e2e nedeni) | W146/W147/W148 | **Tamam:** W146 (#132), W148 (#131), W147 (#133, main `47739fe`) birleşti; bütün koşullar kapandı |
| 3c   | Codex tur 2 (HEAD `d98b409`): **KOŞULLU UYGUN**; yeni E-07, E-08 → W149; K-09 belge düzeltmesi W143 | Codex | Tamam |
| 3d   | W149 (E-07, E-08) ve Codex tur 3 | W149 / Codex | **Bekliyor** |
| 3    | Nihai kapı: Codex `gpt-6.1-sol` medium `-s read-only` tek koşum; hüküm `docs/reviews/WEB-6-codex.md`                                                                                                                                         | Codex              | **Bekliyor**                                                                 |
| 4    | Koşullar işçiyle kapatılır; gerekirse ikinci tur                                                                                                                                                                                             | işçi + koordinatör | Bekliyor                                                                     |
| 5    | Kapanış PR, MERGED ve kayıt (ilerleme, `../program/DURUM.md` yönetim deposu kuralıyla)                                                                                                                                                       | koordinatör        | **Bekliyor**                                                                 |

## Roller

Koordinatör Fable (kod yazmaz, işçi çıktısı okumaz; özet alır, birleştirir, kaydeder). İşçiler Sonnet 5.5 medium, her biri ayrı worktree/dal. W143 yalnız belge sahibidir (W144'ün `dogrulama-F6.md` dosyasına dokunmaz, yalnız bağ verir); Codex salt okunur ve yalnız nihai kapıdadır. Gerçek cihaz/kullanıcı onayı otomatik geçti sayılmaz.

## Kapı sonuçları

| Kapı                                                  | Sonuç                                                                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| İşçi tam paketleri                                    | W135 585 dosya / 4032 test; W136 602 / 4196; W141 604 / 4220; W139 606 / 4220; W137 617 / 4275; W138 635 / 4413; W140 633 / 4398; W142 658 / 4590. Her sayı kendi dal ucunun raporudur; CI tek doğruluk kaynağıdır |
| main CI                                               | #119–#128 birleşme sırasıyla; her PR için üç denetimin tek tek sonucu bu kayıtta **doğrulanamadı** (koordinatör kaydı: CI yeşilken birleştirildi)                                                              |
| Görsel ölçümler                                       | W136–W142 duman: taşma 0, CSP 0, pageerror 0 (W142 54 kare); ham kanıt `.git/koordinator/web6-w13*…w142/`                                                                                                     |
| Entegrasyon / e2e                                     | 97 entegrasyon testi geçti; `e2e/reports.spec.ts` 3/3 (**sahte** `/v1`)                                                                                                                                      |
| Belge kapısı (W143)                                   | `prettier --check` değişen dosyalar, `pnpm lint`, stubs/design-stub testleri: sonuç W143 teslim raporunda                                                                                                    |
| Gerçek imaj + gerçek backend (W144)                   | [`dogrulama-F6.md`](dogrulama-F6.md) — **alındı** (503 ve VoiceOver hariç)                                                                                                                                                                             |
| Codex nihai hüküm                                     | **Bekliyor**                                                                                                                                                                                                 |
| Kapanış PR                                            | **Bekliyor**                                                                                                                                                                                                 |

## Codex istem notları

Kabul ölçütleri: [13-raporlar](../../ekranlar/13-raporlar/README.md), [01](../../ekranlar/01-ana-sayfa/README.md) ve [00-ortak](../../ekranlar/00-ortak/README.md) kabul tablolarının `kabul`/`geçici kabul` satırları ve satır dışı varsayımlar; P46–P53; KESİN 18/21/22/26/27/29. Sınıf soruları: yaşam döngüsü (sahip söküm → bilet tüketilmez, kapsam/hesap/kardeş sekme iptali), `reportGate` tek eşzamanlı üretim ve `Retry-After` yalnız başlık varsa, yetki olguları (mercek ≠ yetki; toplantı/görev PDF koordinatörü), K/Ü adresle girince 01f/01g okunmaması, **yönetici üye merceğinde başka birim görevine `?gorev=` derin bağlantı (araştırılmadı)**, tek yüklem türevleri (KESİN 29), blob/indirme güvenliği, `designStub` kayıt tutarlılığı. Bilerek yapılmayanlar: BE-120/122…141 statikleri, P45 ertelenenler, Ü2–Ü7, K2–K8, 01b, Bildirimler/Asistan/Takvim/Kurumsal hafıza, profil sayfası, F7. Araç izi olmayan çıktı kapı sayılmaz.

## Sonrası

**F7 AÇILMAZ — kullanıcı onayı** ([web-7](../web-7/README.md)). Pin yükseltmesi de ayrı onay ister ([plan](../web-5/pin-yukseltme-plani.md)). "F6 kapandı" ifadesi W144 tanığı, Codex hükmü ve kapanış PR'ı MERGED olana kadar kullanılmaz.
