# O4 — Kapanış

**F8 KAPANMADI — Codex bekliyor (2026-11-16).** O1–O3 main `b9aab8c`'de; O4 sürüyor. "F8 KAPANDI" yalnız CI SUCCESS + MERGED + Codex hükmü sonrası yazılır; kanıtlanamayanlar (VoiceOver, görsel onay, Safari/iOS/Firefox push, CDN arkası SSE, `X-Result-Truncated` canlı tetikleme) açıkça "yapılamadı" kalır, otomatik tamamlanmış sayılmaz (KESİN 32). P76 hızlı mod yürürlüktedir (yerelde yalnız etkilenen testler; tam paket CI'da; Codex en çok 2 tur, UYGUN DEĞİL → 3).

## Planlanan akış

| Adım | İş | İşçi / rol | Durum |
| ---- | -- | ---------- | ----- |
| 1 | Belgeler: [rapor-F8](../../backend-eksikleri/rapor-F8.md) (pin envanteri, canlanan/kısmi/açık satırlar, v0.24 farkı, §6 web F9 işi + backend paket adayları), [ilerleme](ilerleme.md), [oturum-3-entegrasyon](oturum-3-entegrasyon.md), ekran README "F8 uygulama kanıtı" ve Sürüm satırları, `kayit.md` v0.24 Bağ notları, [WEB-8-codex](../../reviews/WEB-8-codex.md) ve [web-9](../web-9/README.md) iskeletleri, yol haritası §4, tasarım README notu | W177 (Sonnet 5.5) | `web8/o4-kapanis`; yalnız belge, kod yok; kapı prettier + lint + `tests/lint` |
| 2 | `dogrulama-F8.md`: gerçek Docker üretim imajı + Caddy CSP + gerçek backend **`v0.23.0-api` imajı** (P73); P33 yolu yok kanıtı, ZIP/CSV bilet indirme, rapor bölüm seçimi, silinenler toplu, toplantı katılımcı adayları, görev kodu, `X-Result-Truncated` deneme, 3 rol × 390/1024/1440 × iki tema, `KUSUR n:` listesi | W178 (`web8/o4-w178`) | sürüyor; W177 dosyasına dokunmaz |
| 3 | Kusur düzeltmeleri (W179…) | işçi | gerekirse |
| 4 | Codex tur 1…2 (3) (`gpt-6.1-sol` medium `-s read-only`; ilk eylem HEAD, araç izi); sınıf soruları: yetki/kapsam sızıntısı (P33 kaldırıldı; S2/S3 başlıkları), bilet hedefi (14 desen), `Idempotency-Key` yaşam döngüsü (üç oluşturma ucu), pin ↔ fixture uyumu (zorunlu alan uydurma, `defaults.ts`), "eski yol yok" kanıtı, ŞY aktör (ADR-0041) | Codex | bekliyor |
| 5 | Kapanış belge PR'ı, CI SUCCESS ve MERGED | koordinatör | bekliyor |

## Roller

Koordinatör Claude Code işi bölüştürür; W177 yalnız belge sahibidir (`dogrulama-F8.md` W178'indir; W177 yalnız bağ verir). Codex salt okunur ve yalnız nihai kapıdadır. Koordinatör "W178 main'de" ve Codex tur mesajlarıyla W177'ye geri döner; W177 o mesajlarla `ilerleme`, `oturum-4`, `rapor-F8` §5/§7 ve `WEB-8-codex` kayıtlarını günceller. Gerçek cihaz/kullanıcı onayı otomatik geçti sayılmaz.

## Kapı sonuçları

| Kapı | Sonuç |
| ---- | ----- |
| İşçi tam paketleri | W170 776/5617; W173 784/5649; W174 786/5725; W171 783/5682; W172 803/5873; W175 799/5788 (dosya/test); W176 819/5963. Her sayı kendi dal ucunun işçi raporudur; CI tek doğruluk kaynağıdır |
| P75 yerel CI (Actions kesintisi 00:12–07:17) | #161 `pr161-c8ae0ab` 801/5822, #162 `pr162-c1c3d88` 804/5877, #163 `pr163-6aaa9fb` 809/5908; her biri 11/11 adım yeşil (verify + image + e2e 7/7); kanıt `.git/koordinator/yerel-ci/` (yerel), PR yorumlarında özet |
| main CI (Actions döndükten sonra) | **main `6e09d7a` CI SUCCESS** (07:17 UTC): P75 penceresindeki üç birleşme bu koşumla doğrulandı. #164 (`b9aab8c`) ilk koşumda `notifications.spec` ile kırmızı, W176 KUSUR 4 düzeltmesiyle yeşil birleşti. #154–#157 CI'larında kararsız `archive lifecycle.test` ve tarih bağımlı `notifications-panel.test` kırmızıları düzeltilip yeniden koşuldu ([ilerleme](ilerleme.md)) |
| Görsel ölçümler | W173/W174/W171/W172/W175/W176 duman: taşma 0, CSP 0, pageerror 0 (W176 gerçek backend 6 rota × 3 × 2 tema); ham kanıt `.git/koordinator/web8-w17N/` (yerel) |
| Entegrasyon / e2e | W176: yeni entegrasyon testleri + gerçek backend e2e (arşiv 4, kayıtlar 3, raporlar, Ü1); tam e2e 14/14 × 3 ardışık |
| Belge kapısı (W177, 2026-11-16) | Prettier check, `pnpm lint`, `tests/lint`: sonuç W177 raporunda; typecheck/test/build/e2e koşulmadı (UI yok, P76) |
| Gerçek imaj + gerçek backend (W178) | `dogrulama-F8.md` — W178 bekliyor; sonuç buraya işlenir |
| Codex nihai hüküm | bekliyor |
| Kapanış belge PR | bekliyor; geçerlilik şartı CI SUCCESS ve MERGED |

## Codex istem notları

Kabul ölçütleri: ekran README'lerinin F8 eki tabloları (`kabul`/`geçici kabul` satırları) ve satır dışı varsayımlar; P67–P76; KESİN 17/21/22/26/29/30/32/35/36. Sınıf soruları: **yetki ve kapsam** (S2 `programArchive*` yalnız ŞY; S3 başlığı satırın `department_id`'si; mercek ≠ yetki; P33 yolu kalktı), **bilet hedefi** (kapalı liste 14 desen, `shared/download`, `X-Result-Truncated`, 429/503 `Retry-After`), **yazma güvenliği** (`Idempotency-Key` yalnız sözleşmenin istediği uçta ve kullanıcı eylemi başına; toplu geri yükle/kalıcı sil ≤100 parça kısmi başarı; tür adı yazılarak onay), **pin ↔ fixture** (`defaults.ts` spec varsayılanı, alan uydurma yok), **stub kaldırma bütünlüğü** (`designStub` ↔ `kayit.md` Durum ↔ matris), **türev sayaçlar** (KESİN 29: toplu işlem → liste + rozet + pano), **geç sonuç ve sökülmüş ekran**, **ŞY aktör**. Kanıt sınırları baştan yazılır; geri alma deneyi yalnız bulgularda (P76).

## Sonrası

**F9 AÇILMAZ — kullanıcı onayı** ([web-9](../web-9/README.md) iskeleti: pin `v0.24.0-api` + sohbet/bildirim canlıya alma önerisi). Backend sonraki paket adayları [rapor-F8 §6b](../../backend-eksikleri/rapor-F8.md)'dedir; kullanıcı backend'i ayrı yürütür.
