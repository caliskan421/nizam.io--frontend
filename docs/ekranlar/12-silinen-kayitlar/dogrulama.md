# 12 — Doğrulama

Denetçi: **öz denetim (W119, tespit işçisi)** — bağımsız denetçi ve Codex kapısı **bekliyor**. Tarih: 2026-11-12. Kaynaklar: beş dosya + tasarım artboard'ları (01d, 01c, şablon, Sidebar, canvas) + pin `v0.15.0-api` (`openapi.yaml`, `istemci-akislari.md`, `error-codes.json`, modül README ve store kodu).

## Bulgular
| # | Dosya | Satır/öğe | Sorun türü | Açıklama | Önem | Durum |
|---|---|---|---|---|---|---|
| 1 | README, ozellikler | E-12-01…69 | kapsama | Her E-kimliği README tablosunda (69/69), `ozellikler.md` ve `mekanizma.md` §7'de (69/69) var. `backend.md` ve `eksikler.md` aralık gösterimiyle ve §7 / §6 tamamlayıcılarıyla kapsar (betikle denetlendi: kimlik → dosya). | düşük | kapandı |
| 2 | backend.md | `deleted_by` | varsayım doğrulandı | Silen alanı yalnız toplantı satırında (`MeetingDeletedBy`, K77); görev/departman/hesap şemalarında yok. | — | doğrulandı |
| 3 | backend.md | `department_id` | varsayım doğrulandı | `DeletedWorkItem.department_id` zorunlu → koordinatörlük süzgeci istemci süzmesi; toplantıda `owner_department_id` + `departments[]`. Departman/hesapta uygulanmaz. | — | doğrulandı |
| 4 | backend.md | `sort`/`q`/süzgeç | varsayım çürütüldü ("sunucu sort olabilir") | Altı listede yalnız `limit`+`cursor`; sunucu `sort`, `q`, tarih/silen/departman süzgeci yok. Sıra yalnız kodda (`deleted_at DESC, id DESC`; **hesapta `created_at DESC`**). | orta | işlendi (BE-117, BE-118) |
| 5 | backend.md | Idempotency-Key / expected_revision | varsayım çürütüldü | Altı yaşam döngüsü ucunda yok (şema yalnız `ProgramScope`, `CsrfHeader`, `PathID`). Tekrar güvenliği durum koşuluyla: 409 `*.not_deleted`, 404 `*_not_found`. | orta | işlendi (mekanizma §4) |
| 6 | backend.md | `getWorkItem` silinmişte | varsayım doğrulandı | 409 `work.item_deleted`; panel ayrıntı okumaz. | — | doğrulandı |
| 7 | backend.md | 409 kodları | doğrulandı | `work.not_deleted`, `work.department_unavailable`, `work.permanent_requires_deleted`, `work.constraint_violation`; `organization.not_deleted`/`permanent_requires_deleted`/`department_in_use`; `identity.not_deleted`/`permanent_requires_deleted`/`account_referenced`; `collaboration.not_deleted`/`permanent_requires_deleted` — hepsi `error-codes.json`'da var. | — | doğrulandı |
| 8 | backend.md | 404 hesap kodu | sözleşme tutarsızlığı | `restoreAccount` 404 `identity.account_not_found`, `permanentDeleteAccount` 404 `organization.account_not_found`. İstemci ikisini de "yok" sayar. | düşük | not düşüldü (backend §6) |
| 9 | backend.md | Departman listesi kapsamı | yeni bulgu | `listDeletedDepartments` S2 başlığı ister ama kodda şirket geneli; `deleted_records` programa bağlı departmanı sayar → sayaç ≠ liste. | orta | BE-119 |
| 10 | backend.md | `restoreAccount` | yeni bulgu | Devredilmiş açık atamalar geri dönmez (ORGANIZATION-K29); onay metnine girer. | düşük | işlendi |
| 11 | backend.md §5 | geçersizleme | eksik bağ | `query-keys.ts`'te: `restoreWorkItem`→`gantt`, `archive`; `restoreMeeting`/`permanentDeleteMeeting`, `restoreDepartment`/`permanentDeleteDepartment`, `restoreAccount`/`permanentDeleteAccount`→`report`; `restoreDepartment`→`me` yok. Yeni anahtarlar: `deletedWorkItems`, `deletedAccounts`. | orta | W128 işi olarak yazıldı |
| 12 | ozellikler.md | Sidebar | varsayım doğrulandı | Sidebar artboard'ında "Silinen kayıtlar" girişi yok; ekranda `active="home"`. | — | doğrulandı |
| 13 | ozellikler.md | Sütun genişlikleri | çelişki | 01d tablo `118/180` ↔ şablon metni `124/170`. | düşük | §7 not, görsel kapıda |
| 14 | README, ozellikler | "Tümü" | karar | Dört uç birleştirilmez (fan-out, sıra anahtarları uyuşmaz); `öneri`. | — | ürün sahibine soru |
| 15 | README | P41 | koordinatör mesajı | "Koordinatörlük" türü `kabul (P41)`; `ortak-kurallar.md` dokunulmadı, P41 satırı koordinatör ekler. | — | işlendi |
| 16 | eksikler.md | BE-076 | süreç | Görev: `kayit.md`'de yalnız sona satır; BE-076 Ekran sütununa "12 Silinen kayıtlar" eklenmesi koordinatörde. | düşük | açık (koordinatör) |
| 17 | backend.md | v0.17 farkı | bilinmiyor | Çalışma ağacında silinenlerle ilgili iki değişiklik (sıra açıklaması, toplantı sayacı) görüldü; ayrıntı doğrulanmadı (kaynak değil). | düşük | pin yükselince |
| 18 | tüm | `bilinmiyor` kullanımı | biçim | Bilinmeyenler yazıldı: `kind` değer kümesi, görev notu/gündem silme tipi, `dateRequests` etkisi, 01d kopyaya eklenme zamanı, açık tema toplu çubuğu. Uydurma değer yok; örnek veriler (127, ELE-5 vb.) kopyalanmadı. | — | kontrol edildi |
| 19 | tüm | Varsayım biçimi | biçim | Uygulama etkili varsayımların durumu yalnız README tablosunda (kabul/öneri/ret); dosya içi `**Varsayım:**` işareti kullanılmadı (önerilen davranışlar README'ye bağlı). | — | kontrol edildi |

## Hüküm
Öz denetim: `taslak` — bulgular işlendi; **bağımsız denetçi (daha küçük model) ve Codex salt okunur kapısı bekliyor**. Bu dosya o iki adım gelmeden `denetlendi` durumuna alınmaz.
