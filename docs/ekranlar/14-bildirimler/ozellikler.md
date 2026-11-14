# 14 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Bildirimler.dc.html` (tasarım v85/v87 kopyası; canvas başlığı `Ortak · Zil, bildirim paneli ve Web Push izni`); ek referans yalnız `Uye-Profil.dc.html` (Ü7 küçük panel) ve ana sayfa artboard'larındaki zil. Örnek veriler gerçek değildir (adlar, kodlar, tarihler, sayılar şekil kanıtıdır, kopyalanmaz). Metinler tasarımdan **birebir** alınmıştır (Türkçe İ/ı korunur). Kimlikler `E-14-NN`, karar tablosu `README.md`.

## 1. Yerleşim
- **Üst çubuk (E-00-38 ile ortak):** zil 40×40 (`nb-bell`), Asistan'ın yanında ("Zil üst çubukta, Asistan'ın yanında durur ve her sayfadan açılır"); F0'da zil `t-iconbtn` olarak çizili, panel bağlanmamıştı.
- **Artboard:** 1440×3000, iç boşluk 56 px, bölümler arası 56 px, koyu tema (`data-theme="dark"`). Üç bölüm: **1 · Zil ve panel** (dört sütun: 1a 250 px · 1b 420 px · 1c ve 1d esnek, boşluk 32 px), **2 · Web Push izin akışı** (üç adım yan yana, 48 px boşluk, ardından üç çıktı kartı 24 px boşluk), **3 · Profilim › Bildirim tercihleri** (F7 DIŞI; iki sütun 1,55 : 1).
- **Panel (1b):** 420 px, 16 px köşe, `--bg-raised`, `--border-strong`, `--shadow-sheet`; başlık satırı (`nb-ph`), sekme şeridi (`nb-tabs`), günlük gruplar (`nb-grp` + `nb-list`), "Daha eski" bağlantısı (`nb-more`), alt Web Push kutusu (`nb-foot`). Artboard'da zilden bağımsız çizilmiştir; **panelin zile göre konumu tasarımda yoktur** (uygulama: zile hizalı, sağ kenar, zilin 8 px altı — Varsayım, E-14-09).
- Tasarım sınıfları `nb-*`, ortak `rp-*`/`t-*` sınıfları; kodda karşılıkları `shared/ui` + tasarım token'larıdır (`--danger`, `--on-danger`, `--accent-text`, `--gold`, `--violet`, `--r-admin/--r-koord/--r-uye` rol renkleri, `--bg-overlay`, `--border-subtle/-strong`). `--gold` ve `--violet` token'larının kod karşılığı doğrulanacak (Varsayım).

## 2. Bölgeler ve öğeler

### 2.1 Zilin durumları (1a) — E-14-01…E-14-08
Zil simgesi: `M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0` (20 px). Tasarım notu (1a altı): "**Sayı** yalnızca senden işlem bekleyenleri sayar (onay, tarih talebi, atama). Sadece bilgi veren yeni bildirimler **nokta** ile gösterilir; böylece rozet hep bir yapılacak işi anlatır." (uygulanamayan kural: §7 madde 1, `dogrulama.md` #3.)
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-01 | Zil düğmesi (üst çubuk, her ekranda) | ikon düğme (40×40, `nb-bell`) | zil simgesi (`M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0`); `aria-label="Bildirimler"` | normal · rozetli · açık (`aria-expanded="true"`) | `{ okunmamışSayısı, panelAçık }` | kabul (P54); ortak-kurallar §5 (zil paneli F7 canlı) |
| E-14-02 | Zil · okunmamış yok | durum | çubuk etiketi "Okunmamış yok" (örnek şerit metni, ekranda yok); `aria-label="Bildirimler"` | rozet/nokta yok | `count=0` | geçici kabul (P57 kesin) |
| E-14-03 | Zil · sayılı rozet (1–9) | rozet (`nb-badge`) | "4" örneği; 18 px yükseklik, `min-width:18px`, 5 px yan boşluk, `--danger` zemin, `--on-danger` yazı, 10,5 px / 700, tabular-nums, 2 px `--bg-base` halka, sağ üst köşe (`top:3px; right:2px`); `aria-label="Bildirimler, 4 okunmamış"` | 1–9 sayı | `count` | geçici kabul (P57 kesin) |
| E-14-04 | Zil · "9+" rozeti | rozet | "9+"; `aria-label="Bildirimler, 9'dan fazla okunmamış"`; çubuk etiketi "10 ve üstü" (örnek şerit) | 10 ve üstü | `count > 9` | geçici kabul (P57 kesin) |
| E-14-05 | Zil · bilgi noktası ("Yalnız bilgi amaçlı yeni") | nokta rozeti (`nb-badge--dot`) | 9 px nokta (`top:8px; right:9px`); `aria-label="Bildirimler, yeni bilgi var"`; çubuk etiketi "Yalnız bilgi amaçlı yeni" | yalnız bilgi var (sayı yok) | tasarımda: bilgi/eylem ayrımı; yanıtta karşılığı yok | geçici kabul (P57 kesin) |
| E-14-06 | Zil · sessiz saat ay simgesi | küçük ay simgeli köşe işareti (`nb-mute`) | 14 px daire, 9 px ay simgesi, sağ alt; `aria-label="Bildirimler, sessiz saatler açık"`; çubuk etiketi "Sessiz saatlerde" | sessiz saat açık | tasarımda: tercih durumu; yanıtta yok | kabul (ortak-kurallar §4) |
| E-14-07 | Zil · panel açık hâli | durum | `.nb-bell[aria-expanded="true"]`: zemin `--bg-overlay`, kenar `--border-strong`; çubuk etiketi "Panel açık" | panel açık | — | kabul (tasarım 1a) |
| E-14-08 | Zil · sayaç okunamadı | durum (tasarımda yok) | — | sayaç hatası | `count=null` | geçici kabul (P57 kesin) |

### 2.2 Panel (1b: "Panel · Admin, bugün") — başlık, sekmeler, "Daha eski", Web Push kutusu
Not (1b altı): "Varsayılan sekme **Senden bekleyen**: işlem butonları satırın içinde, görev açmadan karar verilir. Satırın kendisine tıklamak ilgili görevi, toplantıyı ya da tabloyu açar ve bildirimi okundu yapar."
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-09 | Panel kabuğu (zile bağlı açılır panel) | açılır panel (`nb-panel`, `role="dialog"`) | genişlik 420 px; kenar `--border-strong`; 16 px köşe; zemin `--bg-raised`; gölge `--shadow-sheet`; üst 16 px, sol 20 px, sağ 16 px iç boşluk | açık/kapalı | — | geçici kabul (P57 kesin) |
| E-14-10 | Panel başlığı "Bildirimler" | başlık (`h3`) | "Bildirimler" (16 px / 22, 600) | — | — | geçici kabul (P57 kesin) |
| E-14-11 | "Tümünü okundu say" bağlantı düğmesi | bağlantı düğmesi (`rp-linkbtn`) | "Tümünü okundu say" (12,5 px, `--ink-muted`, sağ boşluk 6 px) | normal · yazma sürüyor · devre dışı (okunmamış yok — tasarımda çizilmemiş) | — | geçici kabul (P57 kesin) |
| E-14-12 | "Bildirim ayarları" dişli düğmesi | ikon düğme (`nb-ib`, 32×32) | dişli simgesi; `aria-label="Bildirim ayarları"` | normal · hover `--bg-overlay` | — | geçici kabul (P63 kesin) |
| E-14-13 | Sekme şeridi ("Bildirim filtresi", `role="tablist"`) | sekme şeridi (`rp-tabs nb-tabs`, `role="tablist"`) | `aria-label="Bildirim filtresi"`; sekme yüksekliği 38 px, 13 px; yatay boşluk 20 px | seçili `aria-selected="true"` | — | geçici kabul (P57 kesin) |
| E-14-14 | "Senden bekleyen" sekmesi + sayaç | sekme + `rp-count` sayaç | "Senden bekleyen" + sayaç (örnek 4); tasarımda ilk ve seçili sekme; boş durumlu panelde sayaçsız | seçili/değil | tasarımda: bekleyen işlem sayısı | geçici kabul (P57 kesin) |
| E-14-15 | "Tümü" sekmesi | sekme | "Tümü" | seçili/değil | — | geçici kabul (P57 kesin) |
| E-14-16 | "Okunmamış" sekmesi + sayaç | sekme + `rp-count` sayaç | "Okunmamış" + sayaç (örnek 6) | seçili/değil | tasarımda: okunmamış sayısı | geçici kabul (P57 kesin) |
| E-14-17 | "Daha eski bildirimler" düğmesi | bağlantı düğmesi (`rp-link rp-linkbtn`, `nb-more`) | "Daha eski bildirimler · son 30 gün" (12,5 px, ortalı) | normal · yükleniyor (tasarımda yok) | — | geçici kabul (P57 kesin) |
| E-14-18 | Liste · ilk yükleme (yükleniyor) | durum (tasarımda yok) | — | yükleniyor | — | geçici kabul (P57 kesin) |
| E-14-19 | Liste · hata durumu | durum (tasarımda yok) | — | hata | — | geçici kabul (P57 kesin) |
| E-14-22 | Kapatma: Esc, dış tık, zil, gezinme | davranış (tasarımda yok) | — | — | — | geçici kabul (P57 kesin) |
| E-14-23 | Odak yönetimi ve ARIA | erişilebilirlik | `role="dialog"` `aria-label="Bildirimler"`; sekmeler `role="tablist"`; okunmamış nokta `aria-label="okunmamış"` | — | — | geçici kabul (P57 kesin) |
| E-14-24 | Dar ekran 390 px | yerleşim (tasarımda yok) | — | 390 px | — | geçici kabul (P62 kesin) |
| E-14-59 | Panel altı "Portal kapalıyken de haber verelim mi?" kutusu | panel altı kutusu (`nb-foot`, 32 px simge + metin; accent %8 zemin) | "Portal kapalıyken de haber verelim mi?" · "Tarih talepleri ve onaylar bu tarayıcıya bildirim olarak düşer." · "Şimdi değil" (hayalet) · "Bildirimleri aç" (birincil) | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-60 | Kutu görünürlük koşulları | koşul (tasarımda yok) | — | — | `enabled`, izin, abonelik | kabul (P58 kesin: Web Push dahil) |
| E-14-61 | "Bildirimleri aç" düğmesi | düğme (`t-btn--primary t-btn--sm`) | "Bildirimleri aç" | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-62 | "Şimdi değil" düğmesi | düğme (`t-btn--ghost t-btn--sm`) | "Şimdi değil" | — | — | kabul (P58 kesin: Web Push dahil) |

### 2.3 Satır ve satır durumları (1b liste, 1c) — E-14-25…E-14-52
1c satır örnekleri (başlık "Satırın durumları"): "okunmamış", "üzerine gelince", "işlem yapıldı", "başkası karar verdi"; alt not: "Aynı talebe iki kişi aynı anda bakabilir. Karar verilmişse butonlar kalkar, kimin ne zaman karar verdiği yazar." Satır iç yapısı: 32 px simge · metin sütunu (cümle, meta, varsa eylem düğmeleri: 28 px, 12,5 px yazı, üst boşluk 6 px) · 10 px nokta sütunu.
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-25 | Satır kabuğu | liste satırı (`nb-it`, 3 sütun: 32 px simge · metin · 10 px nokta; boşluk 12) | 10 px dikey, 12 px yatay iç boşluk; 12 px köşe | normal · okunmamış (`data-unread="true"`) · hover (`data-hover="true"`, `--bg-overlay`) | `{ id, type, subject_ref, is_read, created_at }` | geçici kabul (P57 kesin) |
| E-14-26 | Satır simgesi ve ton | simge kutusu (`nb-ic`, 32×32, 9 px köşe) | ton `--tone` (`color-mix(... 14%, transparent)` zemin); tasarım tonları: tarih talebi `--gold` + takvim, onay `--violet` + onay işareti, toplantı `--accent-text` + video, tablo `--r-uye`/`--violet` + tablo, gecikme `--danger` + saat, kullanıcı `--ink-muted` + kullanıcı-ekle, atama `--r-koord` + kullanıcı-ekle | — | `type` (tasarımda: kategori) | geçici kabul (P57 kesin) |
| E-14-27 | Satır metni (tür → Türkçe cümle) | metin (`nb-tx p`, 13/18) | tasarım örnekleri (değerleri kopyalanmaz): "Zeynep Kaya SİS-4 için tarih talebi gönderdi: 24.10 → 31.10"; "Mert Aydın EĞİ-3 “Katılımcı geri bildirim formu” görevini onaya gönderdi · 2 kanıt dosyası"; "Haftalık koordinasyon 30 dakika sonra başlıyor · 14:00"; "OPE-9 “Saha yönlendirme tabelaları” sana atandı"; "Gizem Nur Eğitim koordinatörlüğüne üye olarak eklendi"; "3 görev bugün gecikmeye düştü · ALT-5, ELE-2, OPE-7" | okunmamış `--ink`, okunmuş `--ink-muted`; özne `<b>` 600 | tasarımda: aktör, kod, başlık, tarih; yanıtta yok | geçici kabul (P57 kesin) |
| E-14-28 | Meta çizgisi ("Tür etiketi · zaman") | meta (`nb-meta`, mono 11/14, `--ink-faint`) | "Tarih talebi · Sistem · 12 dk", "Onay · Eğitim · 40 dk", "Toplantı · 6 katılımcı", "Tablo önerisi · 1 sa", "Atama · Kadir Özbek · 5 dk", "Gecikme · Günlük özet · 09:00", "Kullanıcı · Mehmet Kara · 17:42"; ilk parça `<i>` `--ink-muted` | — | tür etiketi · (birim/aktör) · zaman | geçici kabul (P57 kesin) |
| E-14-29 | Zaman biçimi | metin | "12 dk", "40 dk", "1 sa", "son 1 sa", "dün", "17:42", "09:00" | — | `created_at` | geçici kabul (P57 kesin) |
| E-14-30 | Okunmamış noktası | nokta (`nb-un`, 8×8) | `--accent-text`; `aria-label="okunmamış"`; üst boşluk 6 px | okunmamış | `is_read` | kabul (tasarım 1c) |
| E-14-31 | Hover/odak eylem şeridi | eylem şeridi (`nb-hov`) | sağ üst (8 px), 1 px `--border-subtle` kenar, 9 px köşe, `--shadow-card`; içinde 28 px ikon düğmeler | yalnız hover (1c "üzerine gelince") | — | geçici kabul (P57 kesin) |
| E-14-32 | "Okundu say" (onay işareti, `aria-label="Okundu say"`) | ikon düğme (`nb-ib`) | onay işareti; `aria-label="Okundu say"` | normal · hover | — | geçici kabul (P57 kesin) |
| E-14-33 | "Bu görevi sessize al" (hover düğmesi) | ikon düğme | çizili zil; `aria-label="Bu görevi sessize al"` | — | — | geçici kabul (P57 kesin) |
| E-14-34 | "Kaldır" (hover düğmesi) | ikon düğme | çarpı; `aria-label="Kaldır"` | — | — | geçici kabul (P57 kesin) |
| E-14-35 | Satır tıklama: okundu + hedefe git | davranış | not: "Satırın kendisine tıklamak ilgili görevi, toplantıyı ya da tabloyu açar ve bildirimi okundu yapar." | — | — | geçici kabul (P57 kesin) |
| E-14-36 | Satır içi "Onayla" / "Reddet" (tarih talebi) | düğme çifti (`t-btn--secondary` + `t-btn--primary`, 28 px) | "Reddet" · "Onayla" | — | tasarımda: talep kimliği | geçici kabul (P57 kesin) |
| E-14-37 | "İncele" düğmesi (tarih talebi satırı) | düğme (`t-btn--secondary t-btn--sm`) | "İncele" | — | — | geçici kabul (P57 kesin) |
| E-14-38 | "Gündemi aç" düğmesi (toplantı satırı) | düğme (`t-btn--secondary t-btn--sm`) | "Gündemi aç" | — | — | geçici kabul (P57 kesin) |
| E-14-39 | "Geç" / "Taşı" (tablo taşıma önerisi) | düğme çifti | "Geç" · "Taşı" | — | tasarımda: tablo önerisi | geçici kabul (P57 kesin) |
| E-14-40 | "Onayladın · Geri al" (işlem yapıldı hâli) | durum satırı (`nb-done`) | "Onayladın" + "Geri al" (altı çizili bağlantı düğmesi, `--ink-muted`, 500) | işlem yapıldı | tasarımda: karar | geçici kabul (P57 kesin) |
| E-14-41 | "Kadir Özbek reddetti · 16:20" (başkası karar verdi) | durum satırı | "Kadir Özbek reddetti · 16:20"; not: "Aynı talebe iki kişi aynı anda bakabilir. Karar verilmişse butonlar kalkar, kimin ne zaman karar verdiği yazar." | başkası karar verdi | tasarımda: karar veren/zaman | geçici kabul (P57 kesin) |
| E-14-42 | Hedef çözümü · `subject_ref.kind = work_item` | davranış (not) | "…ilgili görevi… açar" | — | `subject_ref` | geçici kabul (P57 kesin); P55 kabul |
| E-14-43 | Hedef çözümü · `subject_ref.kind = meeting` | davranış (not) | "…toplantıyı… açar" | — | `subject_ref` | geçici kabul (P57 kesin) |
| E-14-44 | Hedef çözümü · `subject_ref.kind = program_transfer` | davranış (tasarımda yok) | — | — | `subject_ref` | geçici kabul (P57 kesin) |
| E-14-45 | Hedef çözümü · `subject_ref.kind = membership` | davranış (tasarımda yok) | — | — | `subject_ref` | geçici kabul (P57 kesin) |
| E-14-46 | Hedef çözülemedi / kayıt artık yok | durum (tasarımda yok; yalnız "Bu kayıt silindi" notu var) | — | — | — | geçici kabul (P57 kesin) |
| E-14-47 | Okundu yazması hata durumları | durum (tasarımda yok) | — | — | — | geçici kabul (P57 kesin) |
| E-14-48 | Bilinmeyen `type` | durum (tasarımda yok) | — | — | — | geçici kabul (P57 kesin) |
| E-14-49 | "3 görev bugün gecikmeye düştü" (günlük özet satırı) | satır tipi | "3 görev bugün gecikmeye düştü · ALT-5, ELE-2, OPE-7" · "Gecikme · Günlük özet · 09:00" | — | tasarımda: özet olayı | geçici kabul (P57 kesin) |
| E-14-50 | "30 dakika sonra başlıyor" (toplantı hatırlatma satırı) | satır tipi | "Haftalık koordinasyon 30 dakika sonra başlıyor · 14:00" · "Toplantı · 6 katılımcı" | — | tasarımda: hatırlatma olayı | geçici kabul (P57 kesin) |
| E-14-51 | "Fuar haftası vardiya planı tablosunda 3 kişi 14 hücreyi değiştirdi" (tablo satırı) | satır tipi | "Bahar Kılıç “Fuar haftası vardiya planı” tablosunu Altyapı ve tesisat'a taşımayı önerdi" · "Tablo önerisi · 1 sa"; 1d: "Fuar haftası vardiya planı tablosunda 3 kişi 14 hücreyi değiştirdi" | — | tasarımda: tablo olayı | geçici kabul (P57 kesin) |
| E-14-52 | "Bu kayıt silindi" hâli | durum | not (Saklama kartı): "…kayıt silinirse bildirim “Bu kayıt silindi” olarak kalır ve butonları kalkar." | kayıt silindi | tasarımda: konu durumu | geçici kabul (P57 kesin) |

### 2.4 Boş durum ve gruplama (1d) — E-14-20, E-14-53…E-14-58
1d (başlık "Boş durum ve gruplama"): boş panel (başlıkta yalnız dişli; iki sekme "Senden bekleyen" ve "Tümü") + "aynı kayıtta art arda gelenler tek satır" örneği.
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-20 | Liste · boş durum (hiç bildirim yok) | boş durum (`nb-empty`) | tasarımdaki biçim: 48 px simge kutusu (14 px köşe, `--bg-overlay`) + kalın başlık + `rp-cap` açıklama + bağlantı; "hiç bildirim yok" metni tasarımda yok | boş | — | geçici kabul (P57 kesin) |
| E-14-21 | Boş durum "Senden bekleyen bir şey yok" + "Tüm bildirimlere bak" | boş durum | "Senden bekleyen bir şey yok" · "Yeni bir onay ya da talep gelince burada görürsün." · "Tüm bildirimlere bak" (onay işareti simgesi) | boş | — | geçici kabul (P57 kesin) |
| E-14-53 | Grup başlığı "Bugün" | grup başlığı (`nb-grp`, mono 11/14, büyük harf, 0,04em, `--ink-faint`) | "Bugün" | — | `created_at` | geçici kabul (P57 kesin) |
| E-14-54 | Grup başlığı "Dün" | grup başlığı | "Dün" | — | `created_at` | geçici kabul (P57 kesin) |
| E-14-55 | Grup başlığı "Daha eski" | grup başlığı (tasarımda yok) | — | — | `created_at` | geçici kabul (P57 kesin) |
| E-14-56 | Aynı kayıtta art arda gelenler tek satır (yığın avatar) | satır tipi (`nb-stack`, 20 px yığın avatar, −5 px örtüşme) | "aynı kayıtta art arda gelenler tek satır"; not: "Bir saat içinde aynı görev ya da tabloya düşen olaylar birleşir. Tıklayınca kayıt açılır, değişiklikler işlem geçmişinde ayrı ayrı durur." | — | tasarımda: aktör kümesi | geçici kabul (P57 kesin) |
| E-14-58 | Sıra | davranış | tasarımda sıra: en yeni önce (gruplar içinde) | — | `created_at` | geçici kabul (P57 kesin) |

### 2.5 Web Push izin akışı — üç adım (2)
Bölüm başlığı "Web Push izin akışı"; alt başlık: "tarayıcı penceresi tek bir kez açılabilir · reddedilirse portal tekrar soramaz". Her adım 300 px yüksekliğinde tarayıcı kabuğu (`nb-screen`; üst şerit: üç nokta + adres `portal.roketportal.org`, kilit simgesi; arka sayfa soluk iskelet) içinde çizilir.
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-63 | Adım 1 · portal izin penceresi ("Tarih talebin sonuçlanınca haber verelim mi?") | pencere (`nb-soft`, `role="dialog"` `aria-label="Bildirim izni"`) | "Tarih talebin sonuçlanınca haber verelim mi?" · maddeler: "Talep, onay ve atamalar", "Toplantıdan 30 dk önce", "Sohbet mesajları gelmez" (onay işaretli) · "Şimdi değil" · "Bildirimleri aç"; adım başlığı "1 Önce portal sorar"; not: "Ne zaman çıkar: kişi ilk kez bir şeyi beklemeye başladığında (tarih talebi gönderdi, görevi onaya yolladı) ya da panelin altındaki kutudan. Sayfa açılışında asla çıkmaz." | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-64 | Otomatik tetik ("ilk kez bir şeyi beklemeye başladığında") | davranış (not) | bkz. adım 1 notu | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-65 | Adım 2 · tarayıcı izin penceresi, karartma, koç notu | tarayıcı penceresi örneği (`nb-native`) + karartma (`nb-dim`) + koç notu (`nb-coach`) | adım başlığı "2 Tarayıcı izin ister"; "portal.roketportal.org şunları yapmak istiyor:" · "Bildirimleri göster" · "Engelle" · "İzin ver" (tarayıcının penceresi; "görünümünü biz değiştiremeyiz"); koç: "Sol üstteki pencerede “İzin ver”e bas." · "Bu pencere tarayıcının; görünümünü biz değiştiremeyiz."; not: "Portal sayfayı hafifçe karartır ve pencereyi gösteren kısa bir not koyar. Kişi pencereyi kapatırsa (karar vermeden) 1. adıma döner, “sonra sor” sayılır." | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-66 | Karar vermeden kapatma ("sonra sor") | davranış (not) | bkz. adım 2 notu | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-67 | Adım 3 · izin verildi: deneme bildirimi + "Bildirimler bu tarayıcıda açık" kartı | işletim sistemi bildirimi örneği (`nb-os`) + kart (`nb-ok`) | adım başlığı "3 İzin verildi"; OS: "RoketPortal" · "şimdi" · "Deneme bildirimi" · "Bildirimler bu tarayıcıda açık. Tarih talebin sonuçlanınca buraya düşecek." · "Portalı aç"; kart: "Bildirimler bu tarayıcıda açık" · "Chrome · macOS · cihazlarını Profilim'den yönetirsin" · "Tamam"; not: "Hemen bir deneme bildirimi gönderilir; kişi işletim sisteminin bildirimleri de kapatmışsa bunu o an fark eder. Gelen bildirime tıklamak ilgili kaydı açar." | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-68 | Abonelik kaydı (`registerPushTarget`) | davranış | — | — | `endpoint`, `keys`, `user_agent` | kabul (P58 kesin: Web Push dahil) |

### 2.6 Web Push çıktıları (2, alt kartlar)
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-69 | Çıktı · Engellendi (`denied`) | çıktı kartı (`nb-out`) + uyarı kutusu (`nb-foot--warn`) | "Engellendi" · rozet "denied" · "Bu tarayıcıda bildirimler engelli" · "Portal tekrar soramaz; açmak için tarayıcı ayarı gerekir." · adımlar: "Adres çubuğundaki kilit simgesine tıkla", "Bildirimler satırını İzin ver yap", "Sayfayı yenile; panelin altındaki kutu yeşile döner."; not: "Bu kutu panelin altında yalnızca kişi kendisi zile ya da Profilim'deki anahtara bastığında çıkar; her açılışta hatırlatmaz." | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-70 | Çıktı · iPhone ve iPad (ana ekran şartı) | çıktı kartı | "iPhone ve iPad" · rozet "ana ekran gerekli" · "Önce portalı ana ekrana ekle" · "iOS, web bildirimlerini yalnızca ana ekrandan açılan uygulamalara verir." · adımlar: "Safari'de Paylaş düğmesine dokun", "Ana Ekrana Ekle'yi seç", "Ana ekrandaki RoketPortal'ı aç, zilden bildirimleri aç." | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-71 | Çıktı · tarayıcı Web Push desteklemiyor | not | "Tarayıcı Web Push'u hiç desteklemiyorsa (eski sürüm, gizli pencere) kutu yalnızca “Bu tarayıcıda kullanılamıyor” der ve tercihlerde e-posta önerilir." | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-72 | "Şimdi değil" kuralı (14 gün, ikinci kez sonra bitiş) | çıktı kartı | "“Şimdi değil” dendiğinde" · rozet "default" · "14 gün boyunca hiçbir yerde sorulmaz." · "Sonra yalnızca yeni bir bekleme anında bir kez daha sorulur; ikinci “Şimdi değil”den sonra otomatik sorma biter." · "Panelin altındaki küçük kutu ve Profilim'deki anahtar her zaman durur; kişi istediğinde açar." | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-73 | "Tarayıcı bildirimleri kapalı · Aç" alt satırı | küçük kutu (`nb-foot--plain`) | "Tarayıcı bildirimleri kapalı" · "Yalnız portal açıkken haber alırsın." · "Aç" (`rp-link`) | — | — | kabul (P58 kesin: Web Push dahil) |

### 2.7 Altyapı (tasarımda çizilmemiş)
Service worker, push olayı, bildirime tıklama, CSP/Caddy, kayıt hataları, çıkışta yerel abonelik iptali — tasarım yalnız sonuçları (OS bildirimi örneği, adım 3) gösterir; altyapı `mekanizma.md` §3.3 ve `backend.md` §9'dadır.
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-74 | Service worker kaydı (`public/sw.js`) | altyapı (tasarımda yok) | — | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-75 | `push` olayı → işletim sistemi bildirimi | altyapı (tasarımda yok; OS bildirimi görünümü adım 3 örneği) | — | — | push yükü | kabul (P58 kesin: Web Push dahil) |
| E-14-76 | Bildirime tıklama (`notificationclick`) | altyapı | adım 3 notu: "Gelen bildirime tıklamak ilgili kaydı açar." | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-77 | CSP ve Caddy gereksinimi | altyapı (tasarımda yok) | — | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-78 | Abonelik kaydı hataları | durum (tasarımda yok) | — | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-79 | Çıkışta yerel abonelik iptali (paylaşılan tarayıcı) | altyapı (tasarımda yok) | — | — | — | kabul (P58 kesin: Web Push dahil) |

### 2.8 Profilim › Bildirim tercihleri (3) — **F7 DIŞI**, yalnız referans
Başlık: "Profilim › Bildirim tercihleri"; alt başlık: "profil sayfasındaki bildirim kartının genişletilmiş hâli". Rol noktaları (`nb-role`): Admin `--r-admin` (#e57a9a), Koordinatör `--r-koord` (#74c27a), Üye `--r-uye` (#73a9e3).
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-57 | Saklama metni ("30 gün tutulur…", "işlem bekleyenler silinmez") | kart (`nb-rule`) | "Saklama" · "Bildirimler 30 gün tutulur. İşlem bekleyenler karar verilene kadar silinmez; kayıt silinirse bildirim “Bu kayıt silindi” olarak kalır ve butonları kalkar." | — | — | kabul (ortak-kurallar §4) |
| E-14-80 | "Deneme gönder" (sunucu tarafı) | düğme (`t-btn--ghost t-btn--sm`) | "Deneme gönder" (cihaz kartı, "bu cihaz" satırı) | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-81 | Cihaz listesi, "Kaldır", "bu cihaz" rozeti | kart (`t-card`) + cihaz satırları (`nb-dev`) | "Tarayıcı bildirimi alan cihazlar" · "Her tarayıcı ayrı izin ister" · "Chrome · macOS" (rozet "bu cihaz", "Açık · son bildirim 12 dk önce") · "Safari · iPhone (ana ekran)" ("Açık · 21.10.2026'dan beri") · "Kaldır" | açık · uyarı | — | geçici kabul (P63 kesin); kabul (P58 kesin: Web Push dahil) |
| E-14-82 | "30 gündür ulaşılamıyor · otomatik kaldırılacak" | satır durumu | "Edge · Windows" · "30 gündür ulaşılamıyor · otomatik kaldırılacak" (`--gold`) · "Kaldır" | — | — | kabul (P58 kesin: Web Push dahil) |
| E-14-93 | Profilim › "Neyi nereden duymak istersin" matrisi (portal içi / tarayıcı / e-posta) | kart + tablo (`nb-mx`) | "Neyi nereden duymak istersin" · "Satırlar rolüne göre değişir · noktalar hangi rolde göründüğünü gösterir" · sütunlar "Olay" · "Portal içi" · "Tarayıcı" · "E-posta" · satırlar: Tarih talepleri, Onaya gönderilen görevler, Görev atama, onay ve iade, Toplantı, Bitişi yaklaşan ve geciken, Tablo taşıma önerileri, Kullanıcı ve rol değişiklikleri; alt not: "Senden işlem bekleyen olaylar portal içinde kapatılamaz (soluk işaret). Sohbet mesajları ve alt görevler bildirim üretmez; onlar kendi sayfalarında okunmamış olarak görünür." | onay kutusu: açık · kapalı · kilitli (soluk) | — | geçici kabul (P63 kesin) |
| E-14-94 | Sessiz saatler kartı (22:00 – 08:00, hafta sonu) | kart + anahtar (`rp-switch`) | "Sessiz saatler" · "22:00 – 08:00 ve hafta sonu tarayıcı bildirimi gelmez; portal içinde birikir, zilde ay simgesi görünür." | açık/kapalı | — | geçici kabul (P63 kesin) |
| E-14-95 | "Tarayıcı bildirimi alan cihazlar" kartı | kart | bkz. E-14-81 | — | — | geçici kabul (P63 kesin) |
| E-14-96 | "Saklama" kartı | kart | bkz. E-14-57 | — | — | geçici kabul (P63 kesin) |
| E-14-97 | Ü7 küçük panel varyantı (Tümü · Okunmamış, "1 eski bildirimi göster", "Web bildirimlerini aç" anahtarı) | başka artboard (Ü7) | "Bildirimler" · "Tümünü okundu say" · sekmeler "Tümü" (7), "Okunmamış" (2) · "1 eski bildirimi göster" · alt satır "Web bildirimlerini aç" anahtarı | — | — | ret (tekrar; ortak bileşen kazanır) |
| E-14-98 | E-posta kanalı ("E-posta" sütunu, "tercihlerde e-posta önerilir") | tablo sütunu | "E-posta" sütunu (tercih matrisi) | — | — | geçici kabul (P63 kesin) |

### 2.9 Davranış ve ilişki satırları (tasarımda yalnız not olarak)
| Kimlik | Öğe | Tür | Metin / biçim (tasarım, birebir) | Durumlar | Gösterilen veri (şekil) | Karar |
|---|---|---|---|---|---|---|
| E-14-83 | Sayaç hesap geneli | davranış (tasarımda yok) | — | — | — | kabul (E-00-38, ortak-kurallar §6) |
| E-14-84 | Tazeleme: pencere odağı + aralık (SSE yok) | davranış (tasarımda yok) | — | — | — | geçici kabul (P65 kesin) |
| E-14-85 | Yazma sonrası geçersizleme (KESİN 29 türevleri) | davranış (tasarımda yok) | — | — | — | geçici kabul (P57 kesin) |
| E-14-86 | Rozet sayısı ↔ panel sekme sayacı uyumu | davranış (tasarımda yok) | — | — | — | geçici kabul (P57 kesin) |
| E-14-87 | Üç rolde aynı panel | davranış | tasarım zil notu: "Sayı yalnızca senden işlem bekleyenleri sayar (onay, tarih talebi, atama)."; panel örneği "Panel · Admin, bugün" | — | — | geçici kabul (P57 kesin) |
| E-14-88 | Kapsam, program, oturum değişimi | davranış (tasarımda yok) | — | — | — | geçici kabul (P57 kesin) |
| E-14-89 | Bildirimde program bilgisi yok (çoklu program) | davranış (tasarımda yok) | — | — | — | geçici kabul (P57 kesin) |
| E-14-90 | Sohbet bildirim üretmez | not | "Sohbet mesajları ve alt görevler bildirim üretmez; onlar kendi sayfalarında okunmamış olarak görünür." (tercih matrisi altı) · Ü7: "Kapalıyken bildirimler yalnız portal açıkken bu listeye düşer. Sohbet ve alt görev bildirim üretmez." | — | — | geçici kabul (P59 kesin) |
| E-14-91 | Mesajlar rozeti ayrı sayaç (P59) | davranış (başka artboard) | — | — | — | geçici kabul (P59 kesin) |
| E-14-92 | Okuyana göre kilitli kart (P60) | davranış (başka artboard) | — | — | — | kabul (P60 kesin: backend kazanır; bu grupta etkisiz) |

## 3. Pencereler, menüler, açılır paneller
| Yüzey | Tetikleyici | İçerik | Kapanış |
|---|---|---|---|
| Bildirim paneli | zil tıkı | başlık, sekmeler, gruplu liste, "Daha eski bildirimler", Web Push kutusu | Esc, dış tık, zil, satırdan gezinme (E-14-22) |
| Web Push kutusu (panel altı) | panel açılışı (koşullu: E-14-60) | "Portal kapalıyken de haber verelim mi?" + "Şimdi değil" / "Bildirimleri aç" | "Şimdi değil" ya da izin sonucu |
| Portal izin penceresi ("Bildirim izni", adım 1) | tasarımda: bekleme anı veya kutu | "Tarih talebin sonuçlanınca haber verelim mi?" | F7'de ayrı pencere yok (E-14-63) |
| Tarayıcı izin penceresi (adım 2) | `Notification.requestPermission()` | tarayıcının kendi penceresi; portal karartma + not gösterir | kullanıcı kararı |
| "Bildirimler bu tarayıcıda açık" kartı (adım 3) | izin verildi | durum + "Tamam" | "Tamam" |

## 4. Metinler ve etiket sözlüğü
- **Zil:** "Bildirimler" · "Bildirimler, 4 okunmamış" (örnek) · "Bildirimler, 9'dan fazla okunmamış" · "Bildirimler, yeni bilgi var" (uygulanmaz) · "Bildirimler, sessiz saatler açık" (uygulanmaz) · rozet "9+".
- **Panel:** "Bildirimler" · "Tümünü okundu say" · "Bildirim ayarları" (uygulanmaz) · "Bildirim filtresi" · "Senden bekleyen" · "Tümü" · "Okunmamış" · "Bugün" · "Dün" · "Daha eski bildirimler · son 30 gün" (uygulamada "Daha eski bildirimler") · "okunmamış" · "Okundu say" · "Bu görevi sessize al" (uygulanmaz) · "Kaldır" (uygulanmaz).
- **Satır eylemleri:** "Reddet" · "Onayla" · "İncele" · "Gündemi aç" · "Geç" · "Taşı" · "Onayladın" · "Geri al" (karar eylemleri uygulanmaz).
- **Boş durum:** "Senden bekleyen bir şey yok" · "Yeni bir onay ya da talep gelince burada görürsün." · "Tüm bildirimlere bak".
- **Web Push:** "Portal kapalıyken de haber verelim mi?" · "Tarih talepleri ve onaylar bu tarayıcıya bildirim olarak düşer." · "Şimdi değil" · "Bildirimleri aç" · "Tarih talebin sonuçlanınca haber verelim mi?" · "Talep, onay ve atamalar" · "Toplantıdan 30 dk önce" · "Sohbet mesajları gelmez" · "Bildirim izni" · "Bildirimleri göster" · "Engelle" · "İzin ver" · "Bildirimler bu tarayıcıda açık" · "Tamam" · "Engellendi" · "Bu tarayıcıda bildirimler engelli" · "Portal tekrar soramaz; açmak için tarayıcı ayarı gerekir." · "iPhone ve iPad" · "Önce portalı ana ekrana ekle" · "“Şimdi değil” dendiğinde" · "Tarayıcı bildirimleri kapalı" · "Yalnız portal açıkken haber alırsın." · "Aç".
- **Zaman (örnek):** "12 dk", "40 dk", "1 sa", "son 1 sa", "dün", "17:42", "09:00", "Günlük özet".
- **Satır cümleleri (uygulama):** `type` → Türkçe şablon sözlüğü `backend.md` §4'tedir (tasarım cümleleri örnek biçimdir).

## 5. Açık tema farkı
Tasarımda **açık tema çizimi yoktur** (artboard yalnız `data-theme="dark"`; ana sayfa açık varyantı `Main-Acik` yalnız zili noktalı gösterir). Bütün renkler token'dır; açık temada token'lar çözümü sağlar. Tek sabit renkler `nb-native` (#f6f6f7 / #1f1f1f / #c7c7cc / #0b57d0) ve `nb-os` (rgba(242,242,247,0.96) / #1c1c1e / #6e6e73): tarayıcı ve işletim sistemi penceresi taklitleridir — **kodlanmaz** (gerçek pencere tarayıcınındır).

## 6. Erişilebilirlik ipuçları
- Zil: `aria-label` sayıyı içerir ("Bildirimler, N okunmamış"); `aria-expanded` panel durumunu söyler (`nb-bell[aria-expanded="true"]`); rozet görsel (`aria-hidden` olmalı, sayı etikette).
- Panel: `role="dialog"` + `aria-label="Bildirimler"`; sekmeler `role="tablist"` `aria-label="Bildirim filtresi"`, `role="tab"` `aria-selected`; okunmamış nokta `aria-label="okunmamış"`; yığın avatar `aria-label="Bahar Kılıç, Gizem Nur, Mert Aydın"` (uygulanmaz).
- Simge kutuları ve zil simgeleri `aria-hidden="true"`; ikon düğmelerin `aria-label`'ı var ("Okundu say", "Bu görevi sessize al", "Kaldır", "Bildirim ayarları").
- Adım 1 penceresi `role="dialog"` `aria-label="Bildirim izni"`; tarayıcı penceresi örneği `aria-label="Tarayıcının izin penceresi (örnek)"`; OS örneği `aria-label="İşletim sistemi bildirimi (örnek)"`.
- Tercih matrisinde kilitli onay kutuları ("Açık, kapatılamaz") — profil, F7 dışı.
- Odak sırası tasarımda tanımlı değil (`mekanizma.md` §3.4).

## 7. Tasarımda belirsiz / çelişkili
1. **Rozet sayısı kuralı.** 1a notu: sayı yalnız "senden işlem bekleyenleri" sayar, bilgi için nokta. Sözleşmede ayrım yok: `countUnreadNotifications` tüm okunmamışları sayar (BE-144). Ayrıca F0 zil görünümü (`Main.dc.html`: nokta, sayı yalnız `aria-label`'da) ile 1a (sayılı rozet) birbirinden farklıdır. **Karar:** 1a (ortak bileşen) kazanır; sayı = tüm okunmamışlar (E-14-03).
2. **"Daha eski bildirimler · son 30 gün"** ve **"Saklama: 30 gün"** kartı — sözleşmede saklama süresi yok (BE-154); iddia çizilmez.
3. **Varsayılan sekme** "Senden bekleyen" — devre dışı (BE-144); varsayılan "Tümü".
4. **Sekme sayısı tutarsız:** 1b üç sekme, 1d boş panelde iki ("Senden bekleyen", "Tümü"), Ü7 panelinde iki ("Tümü", "Okunmamış"). Uygulama: 1b'nin üç sekmesi.
5. **İki panel tasarımı:** `Bildirimler.dc.html` (ortak bileşen) ile `Uye-Profil.dc.html` (Ü7) panelinin sekmeleri, "eski bildirimi göster" bağlantısı ve alt anahtar düzeni farklıdır. **Karar:** ortak panel kazanır (E-14-97).
6. **"Toplantıdan 30 dk önce"** maddesi ve "30 dakika sonra başlıyor" satırı — toplantı hatırlatma olayı yok (BE-149); kutu maddesi çizilmez, satır çizilmez.
7. **Adım 1 başlığı** "Tarih talebin sonuçlanınca haber verelim mi?" yalnız tarih talebini söyler, kutu başlığı ("Portal kapalıyken de haber verelim mi?") genel; iki metin farklı yerlerde. Uygulama panel altı kutuyu kullanır (E-14-59).
8. **Koç notu** "Sol üstteki pencerede…" tarayıcıya göre yanlış konum söyler (izin penceresinin yeri tarayıcıya göre değişir); nötr söylenir (E-14-65).
9. **Adım 3 kartındaki cihaz adı** ("Chrome · macOS"): sunucu cihaz adı döndürmez; `user_agent` yalnız kayıt gövdesindedir, çizilmez.
10. **Engellendi sonrası** "kutu yeşile döner": yeşil "açık" hâli tasarımda çizilmemiş; abonelik varken kutu çizilmez, adım 3 kartı yalnız abone olunduğu anda görünür (E-14-60).
11. **Hover düğmeleri** "Bu görevi sessize al" (görev bazlı) ve "Kaldır": semantikleri tanımsız (sessize alma süresi/kapsamı yok); çizilmez (BE-156).
12. **Eksik durumlar:** yükleniyor, hata, "Okunmamış" boş, bilinmeyen tür, 390 px tasarımı, panelin zile göre konumu ve "Tümü" boş durumu tasarımda yoktur; K7 varsayılanı/ortak bileşenler (E-14-18, E-14-19, E-14-20, E-14-24).
13. **Örnek veri tutarsızlıkları:** zil örneği "4 okunmamış" ↔ panelde dört işlem butonlu satır; sekme sayacı "6" ↔ görünür okunmamış satır 4 (+1 hover örneği); şekil kanıtıdır.

## 8. Kimlik dizini (öğe → bölüm)
| Kimlik | Öğe | Bölüm |
|---|---|---|
| E-14-01 | Zil düğmesi (üst çubuk, her ekranda) | §2.1 |
| E-14-02 | Zil · okunmamış yok | §2.1 |
| E-14-03 | Zil · sayılı rozet (1–9) | §2.1 |
| E-14-04 | Zil · "9+" rozeti | §2.1 |
| E-14-05 | Zil · bilgi noktası ("Yalnız bilgi amaçlı yeni") | §2.1 |
| E-14-06 | Zil · sessiz saat ay simgesi | §2.1 |
| E-14-07 | Zil · panel açık hâli | §2.1 |
| E-14-08 | Zil · sayaç okunamadı | §2.1 |
| E-14-09 | Panel kabuğu (zile bağlı açılır panel) | §2.2 |
| E-14-10 | Panel başlığı "Bildirimler" | §2.2 |
| E-14-11 | "Tümünü okundu say" bağlantı düğmesi | §2.2 |
| E-14-12 | "Bildirim ayarları" dişli düğmesi | §2.2 |
| E-14-13 | Sekme şeridi ("Bildirim filtresi", `role="tablist"`) | §2.2 |
| E-14-14 | "Senden bekleyen" sekmesi + sayaç | §2.2 |
| E-14-15 | "Tümü" sekmesi | §2.2 |
| E-14-16 | "Okunmamış" sekmesi + sayaç | §2.2 |
| E-14-17 | "Daha eski bildirimler" düğmesi | §2.2 |
| E-14-18 | Liste · ilk yükleme (yükleniyor) | §2.2 |
| E-14-19 | Liste · hata durumu | §2.2 |
| E-14-20 | Liste · boş durum (hiç bildirim yok) | §2.4 |
| E-14-21 | Boş durum "Senden bekleyen bir şey yok" + "Tüm bildirimlere bak" | §2.4 |
| E-14-22 | Kapatma: Esc, dış tık, zil, gezinme | §2.2 |
| E-14-23 | Odak yönetimi ve ARIA | §2.2 |
| E-14-24 | Dar ekran 390 px | §2.2 |
| E-14-25 | Satır kabuğu | §2.3 |
| E-14-26 | Satır simgesi ve ton | §2.3 |
| E-14-27 | Satır metni (tür → Türkçe cümle) | §2.3 |
| E-14-28 | Meta çizgisi ("Tür etiketi · zaman") | §2.3 |
| E-14-29 | Zaman biçimi | §2.3 |
| E-14-30 | Okunmamış noktası | §2.3 |
| E-14-31 | Hover/odak eylem şeridi | §2.3 |
| E-14-32 | "Okundu say" (onay işareti, `aria-label="Okundu say"`) | §2.3 |
| E-14-33 | "Bu görevi sessize al" (hover düğmesi) | §2.3 |
| E-14-34 | "Kaldır" (hover düğmesi) | §2.3 |
| E-14-35 | Satır tıklama: okundu + hedefe git | §2.3 |
| E-14-36 | Satır içi "Onayla" / "Reddet" (tarih talebi) | §2.3 |
| E-14-37 | "İncele" düğmesi (tarih talebi satırı) | §2.3 |
| E-14-38 | "Gündemi aç" düğmesi (toplantı satırı) | §2.3 |
| E-14-39 | "Geç" / "Taşı" (tablo taşıma önerisi) | §2.3 |
| E-14-40 | "Onayladın · Geri al" (işlem yapıldı hâli) | §2.3 |
| E-14-41 | "Kadir Özbek reddetti · 16:20" (başkası karar verdi) | §2.3 |
| E-14-42 | Hedef çözümü · `subject_ref.kind = work_item` | §2.3 |
| E-14-43 | Hedef çözümü · `subject_ref.kind = meeting` | §2.3 |
| E-14-44 | Hedef çözümü · `subject_ref.kind = program_transfer` | §2.3 |
| E-14-45 | Hedef çözümü · `subject_ref.kind = membership` | §2.3 |
| E-14-46 | Hedef çözülemedi / kayıt artık yok | §2.3 |
| E-14-47 | Okundu yazması hata durumları | §2.3 |
| E-14-48 | Bilinmeyen `type` | §2.3 |
| E-14-49 | "3 görev bugün gecikmeye düştü" (günlük özet satırı) | §2.3 |
| E-14-50 | "30 dakika sonra başlıyor" (toplantı hatırlatma satırı) | §2.3 |
| E-14-51 | "Fuar haftası vardiya planı tablosunda 3 kişi 14 hücreyi değiştirdi" (tablo satırı) | §2.3 |
| E-14-52 | "Bu kayıt silindi" hâli | §2.3 |
| E-14-53 | Grup başlığı "Bugün" | §2.4 |
| E-14-54 | Grup başlığı "Dün" | §2.4 |
| E-14-55 | Grup başlığı "Daha eski" | §2.4 |
| E-14-56 | Aynı kayıtta art arda gelenler tek satır (yığın avatar) | §2.4 |
| E-14-57 | Saklama metni ("30 gün tutulur…", "işlem bekleyenler silinmez") | §2.8 |
| E-14-58 | Sıra | §2.4 |
| E-14-59 | Panel altı "Portal kapalıyken de haber verelim mi?" kutusu | §2.2 |
| E-14-60 | Kutu görünürlük koşulları | §2.2 |
| E-14-61 | "Bildirimleri aç" düğmesi | §2.2 |
| E-14-62 | "Şimdi değil" düğmesi | §2.2 |
| E-14-63 | Adım 1 · portal izin penceresi ("Tarih talebin sonuçlanınca haber verelim mi?") | §2.5 |
| E-14-64 | Otomatik tetik ("ilk kez bir şeyi beklemeye başladığında") | §2.5 |
| E-14-65 | Adım 2 · tarayıcı izin penceresi, karartma, koç notu | §2.5 |
| E-14-66 | Karar vermeden kapatma ("sonra sor") | §2.5 |
| E-14-67 | Adım 3 · izin verildi: deneme bildirimi + "Bildirimler bu tarayıcıda açık" kartı | §2.5 |
| E-14-68 | Abonelik kaydı (`registerPushTarget`) | §2.5 |
| E-14-69 | Çıktı · Engellendi (`denied`) | §2.6 |
| E-14-70 | Çıktı · iPhone ve iPad (ana ekran şartı) | §2.6 |
| E-14-71 | Çıktı · tarayıcı Web Push desteklemiyor | §2.6 |
| E-14-72 | "Şimdi değil" kuralı (14 gün, ikinci kez sonra bitiş) | §2.6 |
| E-14-73 | "Tarayıcı bildirimleri kapalı · Aç" alt satırı | §2.6 |
| E-14-74 | Service worker kaydı (`public/sw.js`) | §2.7 |
| E-14-75 | `push` olayı → işletim sistemi bildirimi | §2.7 |
| E-14-76 | Bildirime tıklama (`notificationclick`) | §2.7 |
| E-14-77 | CSP ve Caddy gereksinimi | §2.7 |
| E-14-78 | Abonelik kaydı hataları | §2.7 |
| E-14-79 | Çıkışta yerel abonelik iptali (paylaşılan tarayıcı) | §2.7 |
| E-14-80 | "Deneme gönder" (sunucu tarafı) | §2.8 |
| E-14-81 | Cihaz listesi, "Kaldır", "bu cihaz" rozeti | §2.8 |
| E-14-82 | "30 gündür ulaşılamıyor · otomatik kaldırılacak" | §2.8 |
| E-14-83 | Sayaç hesap geneli | §2.9 |
| E-14-84 | Tazeleme: pencere odağı + aralık (SSE yok) | §2.9 |
| E-14-85 | Yazma sonrası geçersizleme (KESİN 29 türevleri) | §2.9 |
| E-14-86 | Rozet sayısı ↔ panel sekme sayacı uyumu | §2.9 |
| E-14-87 | Üç rolde aynı panel | §2.9 |
| E-14-88 | Kapsam, program, oturum değişimi | §2.9 |
| E-14-89 | Bildirimde program bilgisi yok (çoklu program) | §2.9 |
| E-14-90 | Sohbet bildirim üretmez | §2.9 |
| E-14-91 | Mesajlar rozeti ayrı sayaç (P59) | §2.9 |
| E-14-92 | Okuyana göre kilitli kart (P60) | §2.9 |
| E-14-93 | Profilim › "Neyi nereden duymak istersin" matrisi (portal içi / tarayıcı / e-posta) | §2.8 |
| E-14-94 | Sessiz saatler kartı (22:00 – 08:00, hafta sonu) | §2.8 |
| E-14-95 | "Tarayıcı bildirimi alan cihazlar" kartı | §2.8 |
| E-14-96 | "Saklama" kartı | §2.8 |
| E-14-97 | Ü7 küçük panel varyantı (Tümü · Okunmamış, "1 eski bildirimi göster", "Web bildirimlerini aç" anahtarı) | §2.8 |
| E-14-98 | E-posta kanalı ("E-posta" sütunu, "tercihlerde e-posta önerilir") | §2.8 |
