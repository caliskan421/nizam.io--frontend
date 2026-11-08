# 01 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Main.dc.html` (sürüm `1794118532-71ae`), açık tema `Main-Acik.dc.html`. Örnek veriler gerçek değildir.

Okuma notu: Dosyada iki katman vardır. **(a) İşaretleme** (`<x-dc>` içindeki HTML) ekranda gerçekten çizilen öğelerdir — §2.1–§2.6. **(b) Örnek veri** (`renderVals()` içindeki `D.h`) işaretlemenin kullanmadığı alanlar da taşır (`queues`, `rows`, `pages`, `shortcuts`, `hasMore` …) ve `<style>` bloğunda bunlara ait ama kullanılmayan sınıflar tanımlıdır (`rp-feed`, `rp-pager`, `rp-attfoot`, `rp-logtype`, `rp-shortcut`, `rp-shrole`). Bunlar §2.7'de "çizilmeyen" diye ayrı kimlikle listelenir; uygulanıp uygulanmayacakları §7'de soru olarak durur.

## 1. Yerleşim

- Tuval boyutu 1440×2700, tek sütun uzun sayfa; dikey kaydırma sayfanın kendisinde.
- İskelet: `rp-page` (`data-theme`) → `rp-side` (kenar menüsü, `Sidebar` içe aktarımı, `active="home"`, 272 px) + `rp-main`.
- `rp-main` sırası: `rp-topbar` (ortak üst çubuk) → `rp-head` (selamlama + sağda eylem) → içerik kabı (`flex-direction:column; gap:40px; padding:32px 32px 64px`).
- İçerik kabının bölgeleri yukarıdan aşağı:
  1. Görev özeti — 4 KPI kartı, `grid auto-fit minmax(220px,1fr)`, `gap:16px`.
  2. İki kart yan yana — `grid auto-fit minmax(360px,1fr)`, `gap:24px`: "Hızlı işlemler" + "Son işlemler".
  3. Ekip şeridi — tek `t-card`, solda toplam, sağda 3 rol kartı (`grid 3 sütun`).
  4. Koordinatörlükler — başlık + araç çubuğu (`rp-toolbar`) + kart ızgarası `grid auto-fill minmax(300px,1fr)`, `gap:16px`.
  5. Alt bilgi satırı — üst kenarlıklı tek satır özet.
- Ortak kabuk öğeleri (kenar menüsü, üst çubuk: geri/ileri, kırıntı "‹program› / Ana sayfa", tarih kicker'ı, tema düğmesi, bildirim zili, "Asistan" düğmesi) `00-ortak` grubundadır; burada ayrıntılanmaz. "Asistan" düğmesi F8'dir (yol haritası §4).
- Kullanılan başlıca sınıflar: `t-card`, `t-btn`/`t-btn--secondary`/`t-btn--sm`, `t-field`/`t-input--icon`, `t-icon`; `rp-head`, `rp-actions`, `rp-cardbtn`, `rp-ichip`, `rp-num`, `rp-bar`, `rp-seg-todo|doing|review|done`, `rp-cap`, `rp-kicker`, `rp-trunc`, `rp-clamp2`, `rp-cardhead`, `rp-cardtitle`, `rp-link`, `rp-linkbtn`, `rp-timeline`, `rp-tl-dot`, `rp-dot`, `rp-toolbar`, `rp-tgroup`, `rp-seg`, `rp-count`, `rp-pop`, `rp-menuitem`, `rp-menudiv`, `rp-empty`, `rp-avstack`, `rp-av--sm`, `rp-tip`, `rp-statbtn`, `rp-mono`, `rp-danger-text`.
- Sayfaya özgü stiller `<style>` içinde (`/*home-extra*/`): `rp-tip` (CSS `::after` ipucu), `rp-statbtn`, `rp-numlink`, `rp-hlink`, `rp-shortcut`, `rp-shrole`, `rp-feed`, `rp-pager`, `rp-logtype`, `rp-attfoot`. Bunlardan işaretlemede yalnız `rp-tip` ve `rp-statbtn` kullanılır.

## 2. Bölgeler ve öğeler

### 2.1 Başlık (`rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01-01 | Selamlama | başlık (`h1`) | "Merhaba ‹ad›"; `--font-display`, 44/50 px, 600 | — | `string` (kullanıcının adı) | **Varsayım:** ad, tam addaki ilk sözcüktür (örnekte tek ad); iki adlı kullanıcıda ne gösterileceği doğrulanmalı (sözleşmede `me.full_name` tek "Görünen ad" alanıdır, bkz. `backend.md`). Tasarım işaretlemesinde selamlama sabit metindir (veriye bağlı değil); kişi adı kopyalanmaz. Alt başlık yok (boş `div`). |
| E-01-02 | "Silinen kayıtlar" | düğme (`t-btn--secondary`, çöp kutusu ikonu) + sayaç (`rp-count`) | "Silinen kayıtlar ‹n›" | hover (t-btn varsayılanı); devre dışı/boş durumu çizilmemiş | `integer` | Neyin sayıldığı tasarımdan anlaşılmıyor — §7. Backend: `reportDashboard.deleted_records` görev + toplantı + programa bağlı departman + **şirket genelindeki** silinmiş hesapları tek sayıda toplar (modül belgesi REPORTING-K02; `backend.md` E-01-02). Sayfadaki tek üst eylem. |

### 2.2 Görev özeti — KPI kartları (`section[aria-label="Görev özeti"]`)
Her kart tek bir `button.t-card.rp-cardbtn`'dır (min 176 px yükseklik): üst satırda renkli ikon çipi (`rp-ichip`) + etiket + sağda çapraz ok ikonu; altta büyük sayı (`rp-num`, 48/52 px), 4 px ilerleme çubuğu (`rp-bar`, tek dolgu), alt not (`rp-cap rp-trunc`). Kartın tamamı tıklanır.

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01-03 | KPI kart kabı | kart düğmesi | ikon + etiket + ok; sayı; çubuk; not | hover: kenarlık `--border-strong` (`rp-cardbtn`); seçili yok; yükleniyor/boş çizilmemiş | `{label, value, note, w(%), tone, num(renk), go}` | Dört kart aynı şablondan. |
| E-01-04 | "Tamamlanma" | KPI | sayı "%‹p›" (yüzde işareti önde); not "‹toplam› görevin ‹biten›’i bitti" | — | `p = round(biten/toplam·100)`; çubuk genişliği = p | Ton `--accent-text`; sayı rengi `--ink`. Ek ("’i/’ı/’u/’ü") Türkçe ünlü uyumu ister — §7. |
| E-01-05 | "Açık görev" | KPI | sayı tamsayı; not "‹n› tanesi zamanında ilerliyor" | — | `açık = toplam − biten`; `zamanında = açık − geciken`; çubuk = açık/toplam | Ton `--violet`. Örnekte değerler bu ilişkiyle tutarlı (biçim kanıtı). |
| E-01-06 | "Gecikmede" | KPI | sayı tamsayı, **sayı rengi `--danger`**; not "Açık görevlerin %‹q›’i" | — | `q = round(geciken/açık·100)`; çubuk = q | Ton `--danger`, ikon üçgen uyarı. |
| E-01-07 | "Onay bekleyen" | KPI | sayı tamsayı; not sabit "Kanıt yüklendi, onay sırasında" | — | `onayda` sayısı; çubuk = onayda/açık | Ton `--gold`, ikon saat. Not metni sabit; kanıtsız onaya gönderilen görevlerde yanıltıcı olabilir — §7. |

### 2.3 Hızlı işlemler (`section.t-card`, başlık "Hızlı işlemler")
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01-08 | Kart başlığı | başlık (`h2.rp-cardtitle`, 18 px) | "Hızlı işlemler" | — | — | 2 sütunlu ızgara, `gap:10px`. |
| E-01-09 | "Yeni görev" | kutucuk düğmesi (112 px yükseklik, `--bg-raised`, ikon üstte, etiket altta `rp-clamp2`) | "Yeni görev", artı ikonu | hover: kenarlık güçlenir; devre dışı çizilmemiş | — | Örnek veride `key:"N"` var ama çizilmiyor (E-01-44). |
| E-01-10 | "Toplantı oluştur" | kutucuk düğmesi | "Toplantı oluştur", kamera ikonu | aynı | — | `key:"T"` çizilmiyor. |
| E-01-11 | "Kullanıcı davet et" | kutucuk düğmesi | "Kullanıcı davet et", kişi+artı ikonu | aynı | — | `key:"U"` çizilmiyor. |
| E-01-12 | "Rapor oluştur" | kutucuk düğmesi | "Rapor oluştur", belge ikonu | aynı | — | `key:"R"` çizilmiyor. |

### 2.4 Son işlemler (`section.t-card.rp-feedcard`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01-13 | Kart başlığı + "Tümü ›" | başlık + bağlantı düğmesi (`rp-link rp-linkbtn`, 12 px, sağ ok) | "Son işlemler" · "Tümü" | "Tümü" hover: `--ink` | — | "Tümü" → 01b İşlem geçmişi (K14: v1 dışı). |
| E-01-14 | Akış listesi | sıralı liste (`ol.rp-timeline.rp-feedlist`) | dikey çizgili zaman çizgisi; her satır 3 sütun: nokta · içerik · zaman | boş/yükleniyor çizilmemiş | `Array<{who, type, when, open}>` (örnekte 24 satır; kesme/sınır yok) | `rp-feedlist` / `rp-feedcard` hiçbir CSS'te tanımlı değil — §7. |
| E-01-15 | Akış satırı — nokta | ikon (`rp-tl-dot` içinde 6 px `rp-dot`, `--ink-muted`) | — | — | — | Tüm satırlarda aynı renk; türe göre renk çizilmiyor. |
| E-01-16 | Akış satırı — kişi | bağlantı düğmesi (`rp-linkbtn rp-trunc`, 13 px, 600) | "‹ad soyad›" | hover: çizgisiz (rp-linkbtn yalnız `.rp-title` ile altı çizilir) | `string` | Tıklayınca `f.open` — hedef belirsiz (kişi mi kayıt mı) — §7. |
| E-01-17 | Akış satırı — tür | altyazı (`rp-cap`) | "Toplantı" / "Görev" / "Giriş" / "Mesaj" / "Arşiv" | — | kapalı küme (örnekte bu 5 değer) | Eylem metni (ör. "Toplantı notu ekledi · …") örnek veride var ama çizilmiyor (E-01-45). |
| E-01-18 | Akış satırı — zaman | kicker (`rp-kicker rp-nowrap`, `--ink-faint`) | "SS:DD" (24 saat) | — | saat | Bugünden eski kayıtların biçimi bilinmiyor — §7. |

### 2.5 Ekip şeridi (`section.t-card[aria-labelledby="team-title"]`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01-19 | Ekip toplamı | kicker + sayı + altyazı | "ekip" (küçük harf, mono); "‹n›" 32 px; "kullanıcı · ‹m› koordinatörlük" | — | `peopleN: integer`, `coordN: integer` | Kapsam tasarımdan belirsiz — §7. Backend: sayılar program kadrosu + şirket geneli yöneticilerdir (`backend.md` E-01-19; **(kod)/modül belgesi**, şemada yazmaz). |
| E-01-20 | Rol kartı ×3 | kart düğmesi (ikon çipi · sayı 22 px + etiket · sağ ok) | "Admin" / "Koordinatör" / "Üye" | hover: kenarlık güçlenir | `Array<{label, n, go}>` (sabit 3) | Örnekte rol sayıları toplamı kullanıcı sayısını aşar (bir hesap birden çok rolde sayılır; `backend.md` E-01-20, kod/modül belgesi) — §7. |

### 2.6 Koordinatörlükler (`section[aria-labelledby="coord-title"]`)
Başlık satırı + araç çubuğu + kart ızgarası.

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01-21 | Bölüm başlığı + ipucu | başlık (`h2`, 18 px) + altyazı | "Koordinatörlükler"; ipucu "‹sıralama açıklaması› · ‹n› koordinatörlük" | ipucu sıralama ve sayıya göre değişir | `loadHint: string` | İpucu metni seçili sıralamanın `hint` metnidir (örnek: "En çok gecikmesi olandan aza"). |
| E-01-22 | "Tümünü gör →" | bağlantı düğmesi | "Tümünü gör" + sağ ok | hover `--ink` | — | → 08 Koordinatörlükler. |
| E-01-23 | Arama | giriş (`input[type=search]`, 220×36, büyüteç ikonu) | yer tutucu "Koordinatörlük ara" | boş / dolu | `cq: string` | Olay `onChange` (her tuşta değil) — §7. |
| E-01-24 | Durum süzgeci | bölümlü düğme grubu (`rp-seg`, `role=group`, `aria-label="Durum filtresi"`) | "Tümü ‹n›" · "Gecikmesi olan ‹n›" · "Yolunda ‹n›" · "Koordinatörsüz ‹n›" | seçili: `aria-pressed="true"` (zemin `--bg-base` + iç kenar); tek seçim | `Array<{label, n, pressed}>` | Sayılar mono (`rp-count`). "Tümü" varsayılan. |
| E-01-25 | "Sırala: ‹ölçüt› ↓" | düğme (`t-btn--secondary t-btn--sm`, sıralama ikonu + aşağı ok) | "Sırala: Gecikme ↓" biçimi | `aria-expanded` true/false | `sortLabel: string` (ölçüt + yön oku) | Yukarı ok biçimi (`↑`) çizilmemiş; ters çevrilince **Varsayım:** "↑". |
| E-01-26 | Sıralama menüsü | açılır menü (`rp-pop`, `role=menu`, 250 px, sağa hizalı) | 6 seçenek (§3) | açık/kapalı | `Array<{label, hint, on}>` | §3'te ayrıntı. |
| E-01-27 | Boş durum | boş kutu (`rp-empty`, kesik kenarlık) | "Bu filtreyle eşleşen koordinatörlük yok." | `loadEmpty` true iken | — | Arama + süzgeç sonucu boşken. |
| E-01-28 | Koordinatörlük kartı | kart (`article.t-card`, padding 22) | aşağıdaki öğeler | hover yok (kart tıklanmaz; içindeki düğmeler tıklanır) | `Array<Koordinatörlük>` (örnekte 11; sayfalama yok) | |
| E-01-29 | Kart — ad | bağlantı düğmesi (`rp-linkbtn rp-title rp-trunc`, 15 px, 600) | "‹koordinatörlük adı›" | hover altı çizili | `string` | → 08b. |
| E-01-30 | Kart — koordinatör(ler) | altyazı (`rp-cap rp-trunc`) | "‹ad›, ‹ad›" ya da "Koordinatör atanmamış" | koordinatörsüz durum metni | `string[]` (birleştirilmiş) | |
| E-01-31 | Kart — avatar yığını | avatar yığını (`rp-avstack`, `rp-av--sm`, −3 px bindirme) | baş harfler (2 harf, büyük) | odaklanabilir (`tabindex=0`); hover/odak: CSS ipucu (tam ad) | `Array<{full, ini}>` — örnekte birimin tüm kullanıcıları (koordinatör + üye) | Taşma ("+N") çizilmemiş; aynı baş harfli iki kişi ("AA") ayırt edilmiyor — §7. |
| E-01-32 | Kart — görev toplamı | sayı + altyazı + mono | "‹n› görev" (32 px) · sağda "%‹p› bitti" | — | `total: integer`, `pct: integer` | |
| E-01-33 | Kart — durum çubuğu | yığılmış çubuk (`rp-bar`, 8 px, 4 dilim, 2 px ara) | başlamadı `rp-seg-todo` · devam `rp-seg-doing` · onayda `rp-seg-review` · bitti `rp-seg-done` | `title` = durum satırı | dört yüzde (toplam 100) | Gecikme dilimi (`rp-seg-late` mevcut) kullanılmıyor. Sözleşmede görev durumu 5 değerlidir (`baslanmadi`, `devam_ediyor`, `onaya_sunuldu`, `iade_edildi`, `tamamlandi`); çubuk 4 dilimdir, `iade_edildi` için dilim yok — §7/10. |
| E-01-34 | Kart — durum satırı | altyazı | "‹a› başlamadı · ‹b› devam · ‹c› onayda · ‹d› bitti" | sıfırlar da yazılır | dört tamsayı | |
| E-01-35 | Kart — "geciken" | istatistik düğmesi (`rp-statbtn`) | kicker "geciken" + sayı 20 px | sayı > 0 → `rp-danger-text` | `late: integer` | `aria-label="‹ad›: geciken görevler"`. |
| E-01-36 | Kart — "kullanıcı" | istatistik düğmesi | kicker "kullanıcı" + sayı | — | `members: integer` | `aria-label="‹ad›: kişiler"`; olay ad düğmesiyle aynı (`c.go`) — §7. Backend: sayı `member_count + coordinators.length` ile türetilir (`backend.md` §1.1). |
| E-01-37 | Kart — "arşiv" | istatistik düğmesi | kicker "arşiv" + sayı | — | `files: integer` | `aria-label="‹ad›: arşiv dosyaları"`. |
| E-01-38 | Kart — son yükleme | altyazı | "Son yükleme ‹göreli zaman›" ("bugün", "dün", "‹n› gün önce") | hiç yükleme yoksa metin bilinmiyor | göreli tarih | |
| E-01-39 | Alt bilgi satırı | altyazı (üst kenarlıklı) | "‹n› koordinatörlük · ‹m› kullanıcı (‹a› admin, ‹k› koordinatör, ‹u› üye)" | — | `orgLine: string` | E-01-19/E-01-20 ile aynı sayıları tekrarlar. |

### 2.7 Örnek veride olup çizilmeyen öğeler
İşaretlemede karşılığı yoktur; yalnız `renderVals()` ve/veya kullanılmayan CSS'te iz bırakır. Uygulanmaz; §7'deki soruya bağlıdır.

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01-40 | Dikkat kuyrukları | sekme/segment (tahmin) | "Geciken ‹n›" · "Onay ‹n›" · "Tarih talebi ‹n›"; ipucu "En uzun gecikmeden kısaya"; "Tüm geciken görevler" | `pressed` | `queues[]`, `qHint`, `allLabel`, `all` | `rp-attfoot` CSS'i ("attention footer") bu bölgeye ait olabilir. |
| E-01-41 | Kuyruk satırı + "Hatırlat" | liste satırı + eylem | başlık; alt "‹koordinatörlük› · ‹atanan›"; sağda "‹n› gün gecikti" (`rp-danger-text`); durum noktası; eylem "Hatırlat" | `isTask`/`isReq` | `rows[]: {title, sub, right, rightCls, dot, isTask, isReq, actLabel, act, open}`, `empty` | **BE-008** bu öğeye bağlı, ama öğe güncel işaretlemede çizilmiyor. |
| E-01-42 | Sayfalayıcı | sayfalayıcı (`rp-pager`) | "1–10 / ‹n›"; önceki/sonraki; sayfa numaraları (`aria-current="page"`) | ilk sayfada önceki devre dışı vb. | `multiPage, pageLine, noPrev, noNext, prev, next, pages[]` | Kuyruk satırları içindi (sayfa boyu 10). |
| E-01-43 | Kişisel kısayollar | hap düğmeler (`rp-shortcut`) | "Bana atanan ‹n›" · "Bu hafta bitiyor ‹n›" · "Yüksek öncelikli gecikenler ‹n›" · "Geri gönderilenler ‹n›" | — | `shortcuts[]: {label, n, tone, go}` | Koordinatör/üye merceğine uygun içerik (BE-009 ile örtüşür). Sözleşmede `WorkItem.priority` zorunlu alandır (`dusuk`, `orta`, `yuksek`, `acil`); "Yüksek öncelikli" eşlemesi (`yuksek` + `acil`) **Varsayım**, ürün sahibi onayı gerekir. "Geri gönderilenler" = `status = iade_edildi`. |
| E-01-44 | Hızlı işlem kısayol tuşu | klavye kısayolu | N / T / U / R | — | `quick[].key` | Çizilmiyor; klavye kısayolu davranışı tanımsız. |
| E-01-45 | Zengin akış satırı | akış satırı (`rp-feed`, `rp-logtype`, `rp-shrole`) | avatar baş harf; ad; rol rozeti ("Admin"/"Koordinatör"/"Üye"); renkli tür etiketi; eylem metni "‹fiil› · ‹hedef›" ("Oturum açtı · ‹cihaz/tarayıcı›") | — | `feed[]: {ini, role, color, bg, text}` | Güncel işaretleme yalnız ad/tür/zaman çiziyor (E-01-14…18). |
| E-01-46 | "Tümünü göster (‹n›)" | genişletme düğmesi | "Tümünü göster (11)" | aç/kapa | `hasMore, moreLabel, toggleMore` | Koordinatörlük ızgarasında çizilmiyor; ızgara tüm kartları gösteriyor. |
| E-01-47 | Üst düzey sayaçlar | sayaç | — | — | `h.late`, `h.review`, `h.reqs`, `goLate`, `goReview`, `goReqs`, `allUsers` | Hiçbir yerde çizilmiyor. **Varsayım:** kenar menüsündeki "Görevler" rozetleri (`lateCount`, `reqCount`) için; `00-ortak` ile doğrulanmalı. |

## 3. Pencereler, menüler, açılır paneller

**Sıralama menüsü (E-01-26)** — tetikleyici "Sırala: …" düğmesi (E-01-25). `rp-pop`, düğmenin altında (`top: calc(100% + 6px)`), sağa hizalı, 250 px.
- Altı `rp-menuitem[role=menuitemradio]`; her biri iki satır (ad + `rp-cap` açıklama), seçilende sağda onay işareti, `aria-checked`:
  1. "Gecikme" — "En çok gecikmesi olandan aza" (varsayılan)
  2. "Açık iş" — "En çok açık işi olandan aza"
  3. "Tamamlanma" — "Tamamlanma oranı en düşükten yükseğe"
  4. "Kullanıcı sayısı" — "En kalabalıktan en küçüğe"
  5. "Son yükleme" — "En son dosya yükleneden eskiye"
  6. "Ad" — "A’dan Z’ye"
- Ayraç (`rp-menudiv`), ardından "Sırayı ters çevir" (sıralama ikonlu düz öğe).
- Kapanış davranışı (dışarı tıklama, Esc, seçimden sonra kapanma) tasarımda yok — `mekanizma.md` §3'te varsayım.

Başka pencere, çekmece veya diyalog yok. "Silinen kayıtlar", hızlı işlemler ve "Tümü" ekran dışına gider (bkz. `mekanizma.md` §1).

## 4. Metinler ve etiket sözlüğü

- Selamlama: "Merhaba ‹ad›".
- KPI etiketleri: "Tamamlanma", "Açık görev", "Gecikmede", "Onay bekleyen". KPI notları: "‹n› görevin ‹m›’i bitti", "‹n› tanesi zamanında ilerliyor", "Açık görevlerin %‹q›’i", "Kanıt yüklendi, onay sırasında".
- Kart başlıkları: "Hızlı işlemler", "Son işlemler", "ekip" (küçük harf kicker), "Koordinatörlükler".
- Hızlı işlemler: "Yeni görev", "Toplantı oluştur", "Kullanıcı davet et", "Rapor oluştur".
- Akış türleri: "Toplantı", "Görev", "Giriş", "Mesaj", "Arşiv".
- Rol adları: "Admin", "Koordinatör", "Üye".
- Süzgeç: "Tümü", "Gecikmesi olan", "Yolunda", "Koordinatörsüz". Sıralama: §3. "Sırayı ters çevir".
- Kart: "Koordinatör atanmamış", "görev", "bitti", "geciken", "kullanıcı", "arşiv", "Son yükleme", durum adları "başlamadı", "devam", "onayda", "bitti".
- Bağlantılar: "Tümü", "Tümünü gör", "Silinen kayıtlar".
- Boş: "Bu filtreyle eşleşen koordinatörlük yok."
- Sayı biçimleri: yüzde önde ("%‹p›"), tam sayıya yuvarlanmış; sayılar `tabular-nums` (`rp-num`, `rp-mono`, `rp-count`); saat "SS:DD"; göreli tarih "bugün" / "dün" / "‹n› gün önce"; ayırıcı " · ".
- Çizilmeyen öğelerin metinleri (§2.7): "Hatırlat", "‹n› gün gecikti", "1–10 / ‹n›", "Tüm geciken görevler", "En uzun gecikmeden kısaya", "Bana atanan", "Bu hafta bitiyor", "Yüksek öncelikli gecikenler", "Geri gönderilenler", "Tümünü göster (‹n›)".

## 5. Açık tema farkı

Yalnız token. `Main-Acik.dc.html` yalnız `theme` varsayılanında (`light`) farklıdır. `theme.css`'teki `[data-theme="light"]` kuralları bu ekrana şöyle dokunur: `rp-seg-done` dilimi `#7fb800` olur, `t-card` gölge alır (`--shadow-card`), `rp-seg` seçili düğmesi `--bg-surface` zemin + hafif gölge alır. Davranış farkı yok.

## 6. Erişilebilirlik ipuçları

- Bölge etiketleri: KPI `section[aria-label="Görev özeti"]`; ekip `aria-labelledby="team-title"`; koordinatörlükler `aria-labelledby="coord-title"`.
- Süzgeç: `role="group"` + `aria-label="Durum filtresi"`, düğmelerde `aria-pressed`.
- Sıralama: tetikleyicide `aria-expanded`; menü `role="menu"` + `aria-label="Sıralama"`; seçenekler `role="menuitemradio"` + `aria-checked`. Ok tuşlarıyla gezinme ve odak yönetimi tasarımda belirtilmemiş.
- Arama: `aria-label="Koordinatörlük ara"`.
- Avatarlar: `tabindex="0"`, `aria-label` = tam ad; ipucu `data-tip` ile CSS `::after` (hover ve `:focus-visible`).
- İstatistik düğmeleri: `aria-label="‹ad›: geciken görevler" | "‹ad›: kişiler" | "‹ad›: arşiv dosyaları"`.
- Dekoratif ikonlar `aria-hidden="true"`.
- KPI kart düğmelerinde ve rol kartlarında `aria-label` yok; erişilebilir ad, içerdiği tüm metnin birleşimi olur (etiket + sayı + not).
- Akış `ol` (sıralı liste); satırdaki tek odaklanabilir öğe kişi adı düğmesi.

## 7. Tasarımda belirsiz / çelişkili

1. **Çizilmeyen bölgeler (§2.7).** Örnek veri ve CSS, güncel işaretlemede olmayan bir "dikkat kuyruğu" bölgesini (kuyruk sekmeleri, satırlar, "Hatırlat", sayfalayıcı) ve "kişisel kısayollar" şeridini taşıyor. Bunlar tasarımdan bilinçli olarak mı çıkarıldı, yoksa çizilmeyi mi bekliyor, bilinmiyor. BE-008 ("Hatırlat") ve BE-009'un "kuyruklar" kısmı bu çizilmeyen öğelere bağlı.
2. **Son işlemler akışının iki biçimi.** İşaretleme yalnız ad + tür + saat çiziyor (`rp-timeline`); örnek veri ve `rp-feed` CSS'i avatar, rol rozeti, renkli tür etiketi ve eylem metni içeren zengin biçimi öneriyor. Hangisi kesin bilinmiyor. `rp-feedlist`/`rp-feedcard` sınıfları hiçbir yerde tanımlı değil.
3. **Akışta satır sınırı yok.** Örnekte 24 satır, kesme/"daha fazla" yok; kartın yüksekliği yan karttan (Hızlı işlemler) büyük olur. Kaç satır gösterileceği bilinmiyor.
4. **Akış zaman biçimi.** Yalnız "SS:DD" görülüyor; dünden eski kayıtların biçimi bilinmiyor.
5. **Akış satırı tıklaması.** Düğme metni kişi adı, ama olay adı `open` — kişiye mi (05b) kayda mı gidileceği belirsiz.
6. **Rol sayıları toplamı ≠ kullanıcı sayısı.** Örnek alt bilgi satırında admin + koordinatör + üye sayılarının toplamı kullanıcı sayısını aşar. Bir kişinin birden çok rolde sayıldığı anlaşılıyor; kural tasarımda belirsiz. Backend yanıtı: her sayaç tekil hesap sayar, bir hesap birden çok rolde sayılır; `total_admins` şirket geneli, diğerleri program kapsamlı (`backend.md` E-01-19/20; kod/modül belgesi).
7. **"Silinen kayıtlar" neyi sayıyor ve nereye gidiyor** — yalnız silinen görevler mi, toplantı/dosya da mı; hedef ekran tasarımda yok.
8. **"Kullanıcı" istatistik düğmesi ile ad düğmesi aynı olayı (`c.go`) kullanıyor**; "kullanıcı" düğmesinin 08b'de kişiler sekmesine mi gideceği belirsiz.
9. **Avatar yığınında taşma yok** ("+N" rozeti çizilmemiş); kalabalık birimde davranış bilinmiyor. Aynı baş harfli kişiler ayırt edilmiyor (yalnız ipucu).
10. **Durum çubuğu dört durumla sınırlı.** Sözleşmedeki `WorkItem.status` kümesi 5 değerdir: `baslanmadi`, `devam_ediyor`, `onaya_sunuldu`, `iade_edildi`, `tamamlandi`. Çubuk ve durum satırı `iade_edildi` için dilim/metin içermez (`rp-dot--back` sınıfı başka ekranlarda var). Kararı ürün sahibi verir: ayrı dilim mi, "onayda/iade" birleşik mi (`eksikler.md` §3).
11. **"Onay bekleyen" notu sabit** ("Kanıt yüklendi, onay sırasında"); kanıt bayrağı olmayan görevler de onaya gidebiliyorsa metin yanıltıcı.
12. **Sıralama eşitlik kuralı.** Örnekte eşit gecikmeli kartların sırası ne alfabetik ne başka ölçütle açıklanıyor; ikincil sıralama bilinmiyor.
13. **Ters sıralama gösterimi.** "Gecikme ↓" biçimi var; ters çevrilince etiketin nasıl değiştiği çizilmemiş.
14. **Arama olayı `onChange`**: her tuşta mı, Enter/odak kaybında mı süzüleceği belirsiz.
15. **Türkçe ekler.** "‹n› görevin ‹m›’i", "%‹q›’i" ünlü uyumuna göre değişen ek gerektirir (’i/’ı/’u/’ü, sayının okunuşuna göre); tasarım kuralı vermiyor.
16. **Yükleniyor / hata durumları** hiçbir bölgede çizilmemiş; yalnız koordinatörlük boş durumu var.
17. **Rol ayrımı yok.** Tek artboard var ve içerik (Silinen kayıtlar, Kullanıcı davet et, Rapor oluştur, ekip rol sayıları, tüm koordinatörlükler) yönetici merceğini düşündürüyor; koordinatör/üye için ayrı bir ana sayfa çizilmemiş.
18. **Kapsam belirsiz.** KPI'lar, ekip sayıları ve koordinatörlük kartları seçili programa mı, seçili koordinatörlüğe mi, şirkete mi ait, tasarımdan anlaşılmıyor (kırıntıda program adı var; Koordinatörlük kartı seçilince ekranın daralıp daralmadığı çizilmemiş).
