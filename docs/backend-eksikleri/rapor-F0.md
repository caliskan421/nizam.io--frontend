# Backend devir raporu — F0 kapanışı (WEB-0), 2026-11-08

**Tür:** faz kapanış devri (`rapor-F<N>.md` kalıbı). **Pin:** `v0.11.0-api` (F0 boyunca değişmedi).
**Önceki rapor:** [`rapor-tespit-2026-11-08.md`](rapor-tespit-2026-11-08.md) (faz öncesi tespit; paketlerin uç/alan önerileri ve kabul ölçütleri orada). Bu rapor onları **tekrar yazmaz**; yalnız F0'da değişeni, F1 öncelik sırasını ve F0 uygulamasında öğrenilenleri ekler.
**Kaynak:** [`kayit.md`](kayit.md) · PR #19–#26 gövdeleri · [`../yurutme/web-0/ilerleme.md`](../yurutme/web-0/ilerleme.md).
**Not:** Uç/alan adları **öneridir**; backend onayı ve sözleşme etiketi gelene kadar web uydurmaz.

## 1. F0'da kayıt değişikliği

| Kalem | Sayı / satır |
|---|---|
| Eklenen BE satırı | **0** — O2/O3/O4 uygulayıcılarından hiçbiri `YENİ-EKSİK` bildirmedi |
| Durumu değişen satır | **0** — `backend'de`ye geçen yok (pin değişmedi), `bağlandı` yok |
| Kodda `designStub` kullanılan | **BE-001** (program avatarı: E-00-04, E-00-07, E-00-40) · **BE-003** (Koordinatör/Üye merceğinde Görevler rozetleri: E-00-14, E-00-15) |
| Gantt pilotu (W31, PR #26) | Yeni eksik yok; BE-019, BE-020 ve 03c yeni-1/2/4/10 zaten kayıtlı. Karar: kendi SVG Gantt ([`../architecture/gantt-secimi.md`](../architecture/gantt-secimi.md)) |

`tests/lint/design-stub.test.ts` (W15) kod ↔ kayıt tutarlılığını CI'da denetler; F0 sonunda yeşil.

## 2. F1'in ihtiyaç duyacakları — öncelik sırası

F1 (görevler + sade ana sayfa) **hiçbir yeni uç beklemeden** başlar (tespit raporu §1, Codex §7): sayaçlar yüklenen kümede, "daha fazla yükle", kapsam etiketiyle dürüst sınırlı gösterim (P4). Aşağıdaki sıra, backend'in F1 gösterimini en çok iyileştiren sıradır. Her paketin **amaç / uç-alan önerisi / kabul ölçütü** tespit raporundaki satırdır; F1 tüketicisi ve F0 notu burada.

| Sıra | BE | Amaç (tek satır) | Uç/alan önerisi ve kabul ölçütü | F1 tüketicisi | F0'da öğrenilen / not |
|---|---|---|---|---|---|
| 1 | **BE-003** (+BE-009) | Görünür görev kümesinin kesin sayaçları (toplam, 5 durum, `overdue`, bekleyen talep) | Tespit raporu §2 Paket 0.2 (`GET /v1/program/work-items/counts`) | 03: E-03-04/07/08/09/13/38/39/40; 01: E-01-04…07 (K/Ü); kenar menüsü rozetleri E-00-14/15 (K/Ü) | F0'da K/Ü rozetleri `designStub('BE-003')` ile statik; Admin rozetleri `reportDashboard`'dan canlı ama **F0'da hesaplanmaz** (Görevler öğesi devre dışı). Kapanınca kenar menüsü, 03 sekmeleri ve 01 KPI aynı uçtan beslenir — tek sayaç kaynağı istenir |
| 2 | **BE-036** (belge) | Sözleşmede yazmayan anlamların yayımlanması | Tespit raporu §3 (11 madde) + Paket 0.1 | 03 E-03-07/25 (madde 1 `is_overdue`); 01 E-01-02/19/36 (madde 2) | F1 için önce **madde 1, 2, 3**. Madde 3'e F0 notu: `X-Result-Truncated` `reportDashboard` yanıtında tanımsız ve REPORTING-K03 gömülü dizileri (`coordinatorship_stats`, `overdue_tasks_list`) kesip kesmediği belirsiz — web şimdilik kesme sinyali okumuyor |
| 3 | **BE-038** | `listProgramWorkItems?assignee_account_id=` (çoklu) | Tespit raporu Paket 0.3 | 03 E-03-11 (kişi süzgeci, F1'de `designStub('BE-038')`); 01 Üye "bana atananlar" | Kapanana dek Üye/birleşik rol "bana atananlar" yüklenen kümede istemci süzmesi (01 kabul tablosu E-01-04) |
| 4 | **BE-040** | `sort` + `order` imleçle kararlı | Tespit raporu Paket 1.2 | 03 E-03-16 (sıralama düğmeleri) | Kapanana dek yüklenen kümede istemci sıralaması + kapsam etiketi |
| 5 | **BE-004** | Sunucu araması `q` | Tespit raporu Paket 1.1 (GAP-036 Türkçe katlama) | 03 E-03-10 | Kapanana dek istemci araması, `tr` katlama, "yüklenen kayıtlar içinde" |
| 6 | **BE-001** | `Program.short_name` + `Program.color` | Tespit raporu Paket 0.6 | Kabuk E-00-04/07/40 (F0'da stub); F2 program formu | F0'da tek canlı stub; kapanınca kenar menüsü avatarı bağlanır |
| 7 | **BE-051** | `GanttTask.subtask_counts` | Tespit raporu Paket 0.4 | **F1 için engelleyici değil** — 03 listesi sayacı `listProgramWorkItems.subtask_counts`'tan alır (E-03-21). Tüketici F3 (03c/03d); kendi SVG Gantt kararı (K4) aynı alanı bekler | Paket 0.4'ün kalanı (BE-052, BE-053, BE-019) da F3 öncesine |

Sıra 1–3 tek süzgeç ekseninde (görünürlük WORK-K82, `department_id`) birlikte tasarlanmalı; sıra 4–5 aynı eksene eklenir (tespit raporu Paket 1).

## 3. F0 uygulamasında öğrenilenler (backend'e iletilecek)

1. **`pending_date_changes` / `overdue_tasks` (GAP-075):** `reportDashboard` sayaçları backend testinde sınanmıyor. Web Admin rozetlerini (E-00-14/15) ve 01 Admin KPI'sını bu alanlardan okuyacak; E-00-14 kabul ölçütü elle doğrulama öngörür, ancak Görevler öğesi F0'da devre dışı olduğundan bu doğrulama F1'e kaldı; test kapsamı GAP-075 ile kapanmalı. BE-003 kapanınca liste sayaçlarıyla aynı tanımı (`is_overdue`, BE-036 madde 1) taşımalı.
2. **`X-Result-Truncated` gömülü diziler:** bkz. §2 sıra 2. Yanıt gömülü dizileri kesiyorsa ayrı BE satırı açılır (tespit raporu §3 madde 3 ile aynı karar).
3. **`MyDepartment.code` yok:** `me/departments` satırı birim kodu taşımaz (sentez G13). Dar menü birim simgesi (E-00-40) bu yüzden ayrıca `GET /v1/program/departments` (`scoped(['departments'])`) çağırır; kod yoksa baş harf. Aynı eksik BE-005'in K/Ü yüzündeki kod önekini de engeller. Yeni satır açılmadı (BE-005 kapsamında); `MyDepartment.code` isteğe bağlı alanı eklenirse kabukta bir istek düşer.
4. **Logout sonucu:** web 2xx dışı her `logout` sonucunu "sunucu çıkışı doğrulanamadı" sayar, yenileme denemez (ortak-kurallar §8). Tespit raporu Paket 0 "kayıt satırı olmayan F0 soruları" (a) hâlâ geçerli: başarısız/bilinmeyen sonuçta HttpOnly çerezin durumu belgelenmeli (BE-036'ya madde adayı).
5. **K6 yetki kaybı kodları** (`program.not_found`, `reporting.not_authorized`, `work.not_authorized`) web'de standing yenilemesine bağlandı (W13); tespit raporu Paket 0 (b) teyidi bekliyor.

## 4. Sonraki adım

Ürün sahibinin backend ajanı §2 sırasıyla paket açar; yeni API etiketi → web pin yükseltir (`api-pin.json`) → satır `bağlandı`, `designStub` kaldırılır. F1 kapanışında `rapor-F1.md`.
