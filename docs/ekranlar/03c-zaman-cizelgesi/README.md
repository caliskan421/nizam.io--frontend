# 03c · Görevler › Zaman çizelgesi

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Gorevler-Zaman.dc.html` (`03c · Görevler › Zaman çizelgesi`), `Gorevler-AltGorev.dc.html` (`03d · Görevler › Alt görevler ve zaman çizelgesi`)
**Faz:** F3 · **v1:** ✓ · **Yol haritası bağı:** K4 (Gantt üç yüz, 200 tavanı, F0 kütüphane pilotu), K5 (tarih yazma protokolü), K10 (rota), K13 (statik eksik), §4 F3 satırı, §6 ADR-0024 (alt görev Gantt dışı)
**Rota (önerilen, K10):** `/zaman-cizelgesi` — tipli parametreler (**Varsayım:** bu adlarla (doğrulanacak: K10 `routes.catalog.ts`)): `durum` (`tumu|acik|geciken|biten`), `departman` (kimlik listesi), `olcek` (`gun|hafta|ay`), `secili` (görev kimliği), `altgorev` (`kapali|tumu`). Görev listesiyle (`/gorevler`) aynı başlık bloğunu paylaşır; "Liste / Zaman çizelgesi" segmenti iki rota arasında geçiştir.

## Özet
Programın görevlerini zaman ekseninde çubuk olarak gösteren Gantt ekranı: üstte görevler başlığı ve sayaçlar, süzgeç/ölçek/dışa aktarım araç çubuğu, sezonun tamamını gösteren yoğunluk şeridi ve açıklama satırı; altında koordinatörlüğe göre gruplanmış, açılıp kapanan satırlar, durum renkli çubuklar, gecikme/geç bitiş taşmaları, bağımlılık simgesi ve bugün çizgisi. Bir çubuk seçilince sağ altta tarih düzenleme paneli açılır (tarih talebi gönder, atanana hatırlat); çubuk uçları sürüklenerek tarih değiştirilir ve geri alınabilir bildirim çıkar. 03d, alt görevlerin çubuk içinde ilerleme çizgisi ve bitiş işaretiyle, istenince girintili ince satırlar olarak gösterilmesini tanımlar (ADR-0024 nedeniyle statik, BE-020). Tasarım tek bir yüz çizer (koordinatör izlenimli); K4'e göre yüz kapsamdan türetilir — Admin `adminGantt`, Koordinatör `coordinatorGantt`, Üye `memberGantt`, birleşik rolde koordinatör — ve görünür bir yüz seçici yoktur. Ana veri kaynağı seçili yüzün Gantt ucudur (ilk 200 kalem; tam 200'de "sınıra ulaşmış olabilir" uyarısı, BE-019).

## Dosyalar
| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | denetlendi | 2026-11-08 | tasarım analisti |
| mekanizma.md | denetlendi | 2026-11-08 | tasarım analisti |
| backend.md | denetlendi | 2026-11-08 | backend analisti |
| eksikler.md | denetlendi | 2026-11-08 | backend analisti |
| dogrulama.md | denetlendi | 2026-11-08 | denetçi (Sonnet) |

## Uygulama kararı tablosu (CX-M-07)

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| … | | | | | | |

Faz açılışında koordinatör doldurur; uygulayıcı yalnız `kabul` satırlarını kodlar.

## Açık sorular (ürün sahibine)
- Çubuk sürükleme sonucu doğrudan değişiklik mi (`extendWorkItem`/`updateWorkItem`, bildirim "süresi uzatıldı · İptal et"), yoksa onaya giden tarih talebi mi (panel metni "Değişiklik onaya gider")? Tasarım ikisini birden gösteriyor; yüz başına (Admin / Koordinatör) hangisi? (ozellikler §7-1)
- "İptal et" (geri al) neyi geri alır? Koordinatörün açtığı tarih talebini silme yetkisi yok (`istemci-akislari.md` §4: inceleme/silme yalnız yönetici); uzatma ucu yalnız pozitif gün alır. Geri alma istemci tarafı gecikmeli gönderim mi olmalı? (ozellikler §7-2)
- Bağımlılık okları tasarımda çizilmemiş, yalnız çubukta "Bağımlılığı var" simgesi var. Oklar çizilecek mi (K4 pilotu ok yeteneğini şart koşuyor), bağımlılık ekleme/kaldırma Gantt'tan yapılacak mı? (ozellikler §7-4)
- Üye yüzü ve Admin yüzü tasarımda yok: üyede sürükleme/tarih paneli kapalı mı, admin panelinde "Tarih talebi gönder" yerine ne var (doğrudan kaydet, bekleyen talebi onayla/reddet)? (mekanizma §2)
- 03d'deki alt görev satırları/çubukları ve "ana görevin dışına taşmaz" kuralı ADR-0024 ile çelişir; v1'de statik gösterim mi, tamamen gizleme mi? (BE-020)
- "Atanana hatırlat", "PDF olarak dışa aktar", "Görsel olarak indir", sezon şeridi: v1'de etkin mi statik mi? (ozellikler §7)
