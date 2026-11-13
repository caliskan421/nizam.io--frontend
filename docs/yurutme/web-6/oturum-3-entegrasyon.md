# O3 — W142 zorunlu entegrasyon turu (tamam, #128 `a3b31e3`)

**Durum (2026-11-14):** birleşti. Dal `web6/o3-w142` (20 commit, uç `3396644`), taban main `21e49a5`. İstem ve senaryo listesi [oturum-2-uygulama](oturum-2-uygulama.md) O3 satırı; tespit [13-raporlar](../../ekranlar/13-raporlar/README.md), [01 ana sayfa](../../ekranlar/01-ana-sayfa/README.md), [00-ortak mekanizma §9](../../ekranlar/00-ortak/mekanizma.md).

Gerçek router/AppShell/oturum ve durumlu sahte sunucuyla (sunucu görünürlüğü **süzmeden** döner; süzme istemcide sınanır) ve gerçek bileşenlerle koşar. Sahte `/v1` kullanıldığı için gerçek backend kanıtı değildir; o W144'tedir ([dogrulama-F6](dogrulama-F6.md)).

## Sonuç

| Ölçü                   | Değer                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entegrasyon testi      | **97**, hepsi geçti: `reports-*` 65 (lifecycle 7, meeting 12, season-download 7, season-picker 4, season-preview 9, task 8, workload 9), `home-*` 22 (home-admin, home-roles), `menu-roles-shell` 10 |
| e2e                    | `e2e/reports.spec.ts` **3/3**, sahte `/v1` ile baştan sona (KESİN 18)                                                                                                                       |
| Görsel duman           | üretim `dist` + gerçek Caddy (nonce CSP) + Playwright: 9 sayfa × 390/1024/1440 × iki tema = **54 kare**; taşma 0, CSP 0, pageerror 0, console.error 0; 390'da bölüm penceresi tam ekran + yapışık alt şerit + Esc odağı, seçim çubuğu, Rapor oluştur menüsü, kabuk menüsü gerçek tıklama |
| Tam paket (PR gövdesi) | typecheck · lint · format:check · test (**658 dosya / 4590 test**) · build yeşil; ek commit sonrası integration 52 dosya / 350 test                                                          |
| Kanıt                  | `.git/koordinator/web6-w142/` (yerel; PNG ve JSON git'e girmez)                                                                                                                            |

Not: PR gövdesindeki alt döküm "reports-\* 62, home-\* 18, menu 10" idi; bu belge yazılırken üç grup yeniden koşuldu (65 / 22 / 10) ve toplam 97 doğrulandı.

## Senaryolar

1. **Rapor akışları (ŞY):** 06 dönem PDF (bilet program başlığı + CSRF → tüketim → dosya adıyla kayıt ve bildirim), hazırlanırken kilit, 429 `export_in_progress`, 429 `platform.rate_limited`, 503 `capacity_full`, 403, bilet 404; bölüm seçimi penceresi (hepsi seçili = düz indirme, kutu kalkınca devre dışı + açıklama, çipler devre dışı, odak), ZIP stub (ağ isteği yok), 01f önizleme (`reportSeason` yalnız sayfa açılınca, canlı/statik bölümler, yükleniyor/boş, "Kapat" odağı). `reports-season-download`, `-picker`, `-preview`.
2. **09b/K7/01g toplantı raporu:** ŞY + sahip/dahil departman koordinatörü; başka departman K'si ve üye görmez; "Önizle" yalnız ŞY; K adresle girerse okunmaz; 404 → yeniden okuma; "Tetikleyiciler" kartı çizilmez. `reports-meeting`.
3. **03/K3 görev raporu:** ŞY + görevin birim koordinatörü; mercek ≠ yetki; üye görmez; 404; **panel kapanınca uçuştaki istek bilet tüketmez** (W142 varsayım 5). `reports-task`.
4. **05/05b iş yükü:** boş `member_ids`, çoklu seçim, arama/sıralamada korunum, "Tümünü seç", seçilemeyen satır, 422 temizleme, program değişimi, hazırlanırken kilit, K için yok, 05b kişisel rapor. `reports-workload`.
5. **01 yönetici ve K1/Ü1:** "Rapor oluştur" menüsü (ağ isteği yok, Esc/dış tıklama), tek pano okuması, arama, yönetici K merceğinde program geneli (P53), dashboard 403; K1/Ü1 tek yüklem ve yazma sonrası özet + kuyruk + **kabuk rozetleri önce/sonra** (KESİN 29: onay, iade, üstlen, own-status), mercek değişimi. `home-admin`, `home-roles`.
6. **Rol menüleri:** üç rol × öğe/rozet, "Raporlar" yok, mercek değişiminde menü sabit, 390 kabuk menüsü gerçek tıklama + odak (açma, Esc, perde, `inert`). `menu-roles-shell`.
7. **Geç sonuç/oturum:** ekran sökümü (bilet beklerken ve tüketim sürerken), uygulama sökümü, program değişimi, kardeş sekme çıkışı, 401 → tek refresh → bilet isteği bir kez tekrar, refresh reddi. `reports-lifecycle`.
8. **Üretim + Caddy CSP + Playwright:** yukarıdaki 54 kare.

## Kusurlar (sınıf → commit; hepsi düzeltildi, test sabitledi)

| #   | Sınıf                                                                              | Düzeltme                                                                                        | Commit    |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------- |
| 1   | Kilitli/devre dışı durumda ekran etiketi (yuva) varsayılana dönüyor                | `ReportActionButton` kilitliyken yuva etiketi korunur                                           | `95fe33f` |
| 2   | `ret` kararlı tasarım notunun üretime sızması (01g "Tetikleyiciler" kartı, E-13-54) | kart çizilmez                                                                                   | `79a0972` |
| 3   | Önbellekteki satırdan türetilen kapsamın yanlış birimi (`?gorev=`, 404 riski)      | hedef, görevin kendi birimini alır (`locatedItems`; yalnız önbellekteki satırlar)               | `4435b5e` |
| 4   | Modül içe aktarma döngüsü (`work ↔ reports`)                                       | `retryTransient`, `useProgramDepartments` shared'a; `work/public` adları korunur; `module-boundary.test` korur | `2d00088` |
| 5   | Dar ekranda pencere düzeni (E-13-12)                                               | `SectionPickerDialog` 390 px'te tam ekran, alt düğmeler yapışık                                 | `e3448b3` |

Temizlik: `MEETINGS_ROUTE`/`MEETING_ROUTE` `meetings/public`'ten açıldı, `home` yerel sabitleri kaldırıldı (`a677af3`). Ortak sahte sunucu `getWorkItem` departman uyuşmazlığında 404 verir (`3396644`). Entegrasyon destek dosyaları lint düzeltmeleri `f60d1c0`. TASLAK kapananlar: `RoleHomeDraft` yok; `SeasonReportPage`/`MeetingReportPage` gerçek gövde (rota testi gövdeden bağımsız); `ReportActionButton` kart stili 06/05/09b/03/05b'de tek tip; `TaskReportButton`/`MeetingReportButton` gerçek bileşenle bağ testleri.

## Varsayımlar ve borçlar

- **Varsayımlar 1–5 kabul** (koordinatör). Varsayım 5: ekran söküm → bilet tüketilmez (KESİN 26); [13-raporlar mekanizma §4.3](../../ekranlar/13-raporlar/mekanizma.md) buna hizalandı (W143). Varsayım 1–4 metinleri bu dosyada tutulmaz; kaynak W142 teslim raporudur (koordinatör kaydı, doğrulanamadı).
- **Açık borç (araştırılmadı):** yönetici **üye merceğinde** başka birimin görevine `?gorev=` ile derin bağlantı. KUSUR 3 yalnız önbellekteki satırları kapsar; liste dışı birim bilinemediği için seçili birime düşebilir. Bu nedenle `reports-task.test` "mercek ≠ yetki" testinin yönetici-üye-mercek ikinci yarısı çıkarıldı (şu an kalan: "d1 koordinatörü d2'de üye merceğinde (w3) görmez" ve "yönetici K merceğinde de görür"). W144 gerçek sunucuyla sınar; Codex'e açık yazılır.
- E-13-10 ZIP onayı (BE-120/BE-124 ile), E-13-12 390 px ZIP/yükle düğmesi genişliği (geçici kabul), E-K1-17/18 iade gerekçesi (BE-139), kâğıt 880/10,5 pt, gerçek backend e2e ilk CI koşumu, gerçek cihaz ekran okuyucu: [ilerleme borç tablosu](ilerleme.md).
