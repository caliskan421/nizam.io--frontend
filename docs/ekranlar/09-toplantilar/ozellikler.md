# 09 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Toplantilar.dc.html`, `Toplanti-Detay.dc.html`, `Toplanti-Formlar.dc.html`, `Toplanti-Gorusme.dc.html`, `Toplanti-Kucuk.dc.html` (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir. Kenar menüsü (`Sidebar`, `active="meetings"`; 09e'de `active="tasks"`) ve üst çubuk (geri/ileri, kırıntı, tema, bildirim zili) `00-ortak` grubunun işidir; burada yalnız kırıntı içeriği yazılır.

## 1. Yerleşim

**09 Liste** (`$preview` 1440×1300): `rp-page` → `rp-side` (Sidebar, 272px) + `rp-main`. `rp-main`: `rp-topbar` (kırıntı: `Program adı / **Toplantılar**`) → `rp-head rp-mtwrap` (başlık + işlem) → `rp-body rp-mtwrap` → tek sütun (`flex:1 1 100%`, dikey boşluk 16px): araç çubuğu (`rp-toolbar`), gün grupları (`section`), alt bilgi satırı. `rp-mtwrap` sınıfının kuralı ne dosyada ne `theme.css`'te tanımlı (bkz. §7). 900px altında satır sayaçları (`rp-mmeta`) gizlenir, satır ızgarası `64px | 1fr | 20px` olur.

**09b Detay** (1440×1700): aynı kabuk; kırıntı `Program / Toplantılar / **<toplantı başlığı>**`. `rp-head`: sol (kicker + h1 + rozet satırı), sağ `rp-actions`. `rp-body`: üstte tam genişlik konferans şeridi (`rp-conf`), altında `rp-col` (ana sütun, `flex:999 1 620px`; içi `repeat(auto-fit, minmax(min(100%,340px),1fr))` ızgara → Gündem kartı + Notlar kartı yan yana) ve `rp-aside` (`flex:1 1 340px; max-width:380px`; Katılımcılar, Koordinatörlükler, Bilgi kartları). Dar ekranda `rp-aside` `max-width:none` olur (theme.css).

**09c Pencereler** (1440×1300): `rp-stage` üzerinde yan yana üç sütun: Yeni toplantı (`t-modal`), Göreve dönüştür (`t-modal`), sağda alt alta Silme onayı (`t-modal role=alertdialog`) + Silinen toplantılar kartı (`t-card`). Her birinin üstünde tuval etiketi (`rp-cap-k`) var; etiketler uygulamaya girmez.

**09d Görüşme — F4'te statik** (1440×900): kabuksuz tam ekran `rp-call` (`role=dialog`), sabit koyu renkler (tema token'larını kendi değerleriyle ezer). `rp-call__top` (64px) → `rp-call__body` ızgara `minmax(0,1fr) 380px`: sol `rp-call__stage` (ana görüntü + karo şeridi + denetim çubuğu), sağ `rp-call__side` (yan panel).

**09e Küçültülmüş görüşme — F4'te statik** (1440×900): normal kabuk (örnekte Görevler sayfası) + sağ altta `rp-pip` (`position:absolute; right:28px; bottom:32px; width:360px`, sabit koyu, giriş animasyonu `rpPipIn`; hareket azaltmada animasyon yok).

## 2. Bölgeler ve öğeler

### 2.1 Liste — başlık (`rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-01 | Sayfa başlığı | başlık (`rp-h1`) | "Toplantılar" | — | sabit | |
| E-09-02 | Alt başlık | metin (`rp-sub`) | "<sezon adı> · N yaklaşan, M geçmiş toplantı · <merceğe göre cümle>" | — | program adı, iki sayaç, rol cümlesi (örnek: "Admin olarak sezondaki tüm toplantıları görüyorsun") | Koordinatör/Üye cümlesi tasarımda yok |
| E-09-03 | "Yeni toplantı" | düğme (`t-btn--primary`, + ikonu) | "Yeni toplantı" | görünürlük §4'e göre | — | E-09-66 penceresini açar |

### 2.2 Liste — araç çubuğu (`rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-04 | Zaman sekmeleri | sekme grubu (`rp-seg`, `role=tablist`, `aria-label="Toplantı zamanı"`) | "Yaklaşan", "Geçmiş" + sayaç (`rp-count`) | seçili (`aria-selected`) | sekme başına tam sayı | |
| E-09-05 | "Silinenler" sekmesi | sekme | "Silinenler" + sayaç; soluk renk (`--ink-faint`); `title="Yalnız admin görür: geri yükleme ve kalıcı silme"` | yalnız admin | silinen toplantı sayısı | içerik E-09-82 |
| E-09-06 | Koordinatörlük süzgeci | düğme (`t-btn--secondary t-btn--sm`, aşağı ok) | "Koordinatörlük" | açılır menü tasarlanmamış | — | BE-021 |
| E-09-07 | Kod açıklaması | metin (`rp-cap`, sağda) | "Koyu kod sahip koordinatörlüğü gösterir" | — | sabit | |

### 2.3 Liste — gün grupları ve satırlar
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-08 | Gün grubu başlığı | `section` + `rp-daylabel` (h2 15px + `rp-cap`) | "Bugün" / "Bu hafta" / "Gelecek hafta" + tarih notu ("21 Ekim Çarşamba", "22 – 25 Ekim", "26 Ekim – 1 Kasım") | — | grup etiketi + gün/aralık | Geçmiş sekmesindeki gruplar tasarımda yok |
| E-09-09 | Toplantı satırı | bağlantı (`a.rp-mrow.rp-mrow--list`) → detay | ızgara `60px | 1fr | auto | 18px` | hover: kenarlık `--border-strong` | bir toplantı | |
| E-09-10 | Tarih kutusu | `rp-mdate` (`data-state`) | gün (büyük, `--font-display`), ay kısaltması ("Eki"), altta saat (`rp-mdate__time`, mono "14:00") | `live`: ay yerine yanıp sönen nokta + "Canlı" (vurgu renkli); `due`: "Bekliyor" (altın, 9px büyük harf); normal: ay | gün, ay, saat, konferans durumu | live/due konferansa bağlı (BE-022/023) |
| E-09-11 | Toplantı başlığı | metin (`rp-title rp-trunc`, 15px/600) | tek satır, kesilir | — | başlık | |
| E-09-12 | Koordinatörlük kodları | rozet (`rp-code`; ilk `rp-code--own` koyu) | kısa kod (büyük harfli kısa dizge) ; `title`= ad (+ " · sahip") | — | sıralı koordinatörlük listesi, ilk = sahip | kod = `Department.code` varsayımı |
| E-09-13 | Koordinatörlük satırı | metin (`rp-cap rp-trunc`) | tek: "<ad>"; çok: "<sahip adı> + N koordinatörlük" | — | ad + sayı | |
| E-09-14 | Gündem sayacı | sayaç (ikon, `title="Gündem"`) | "işaretli / toplam" ("4 / 7", "0 / 5") | — | iki sayı | |
| E-09-15 | Not sayacı | sayaç (`title="Notlar"`) | "N not" / "not yok" | — | sayı | |
| E-09-16 | Katılımcı sayacı | sayaç (`title="Katılımcılar"`) | "N kişi" | — | sayı | |
| E-09-17 | Satır oku | ikon (sağ ok, `--ink-faint`) | — | — | — | süs |
| E-09-18 | Kural notu | metin (`rp-cap`, altta sol) | "Geçmiş tarihe toplantı açılamaz; tarih yalnız ileri alınabilir." | — | sabit | Tasarım metni. Sunucu yalnız bugünden önceki günü reddeder; "yalnız ileri" doğru değil (`dogrulama.md`) |
| E-09-19 | Alt sayaç | metin (`rp-cap`, altta sağ) | "N yaklaşan toplantı" | — | sayı | sekmeye göre metin bilinmiyor |

### 2.4 Detay — başlık (`rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-20 | Üst satır | kicker (`rp-kicker`) | "Bugün · 21 Ekim 2026 Çarşamba · 14:00" | göreli gün ("Bugün") yalnız örnek | tarih + saat | Göreli gün dışındaki biçim bilinmiyor |
| E-09-21 | Toplantı başlığı | h1 (`rp-h1`) | başlık | — | başlık | kırıntıda da var |
| E-09-22 | Koordinatörlük kodları + sayı | rozet + metin | kodlar (ilki koyu, `title="Sahip koordinatörlük"`) + "N koordinatörlük davetli" | — | liste | |
| E-09-23 | "Üyeler dahil" | hap (`rp-pill--violet`, göz ikonu) | "Üyeler dahil"; `title="Üyeler dahil: bağlı koordinatörlüklerin üyeleri de bu toplantıyı görür ve not ekleyebilir"` | yalnız bayrak açıkken (varsayım) | boole | E-09-71 ile aynı bayrak (varsayım) |
| E-09-24 | "Düzenle" | düğme (`t-btn--secondary`, kalem) | "Düzenle" | §4 | — | düzenleme formu tasarlanmamış |
| E-09-25 | Diğer işlemler | ikon düğme (…) | `aria-label="Diğer işlemler: tarihi ileri al, sil"` | §4 | — | menü görseli yok; "Sil" → E-09-81 |

### 2.5 Detay — konferans şeridi (`rp-conf`) — video bağımlı, F4'te statik
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-26 | Konferans şeridi | `section` (`aria-label="Görüntülü konferans"`), video ikonu, vurgu degrade | "Canlı" hapı (`rp-pill--live` + nokta), süre (`rp-num` 20px, "32:14"), açıklama satırı | yalnız "Canlı" durumu çizili; başlamamış/bitmiş durumu yok | süre (dk:sn) | BE-023, KR-26 |
| E-09-27 | Bağlı sayısı ve yüzler | metin + avatar yığını (`rp-avstack`, `rp-av--sm`, `title`=ad) | "· 6 / 25 kişi bağlı" | — | bağlı / tavan, bağlı kişilerin baş harfleri | BE-022 |
| E-09-28 | Bilgi satırı | metin (`rp-cap`) | "Host olarak katılırsın · başka bir cihazdan girersen bu cihazdaki bağlantı kapanır · oda boş kalırsa 5 dk sonra kendiliğinden kapanır" | "Host" kısmı role bağlı (varsayım) | sabit | |
| E-09-29 | "Konferansı bitir" | düğme (`t-btn--ghost`, tehlike rengi) | "Konferansı bitir" | yalnız host (varsayım) | — | statik |
| E-09-30 | "Katıl" | düğme (`t-btn--primary`, video ikonu) | "Katıl" | — | — | statik; 09d'ye geçiş |

### 2.6 Detay — Gündem kartı (`t-card`, `aria-labelledby="ag-title"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-31 | Kart başlığı + ilerleme | başlık "Gündem" + `rp-agprog` (çubuk + "4 / 7") | yüzde genişlik; `title="4 / 7 işaretli"` | `data-all="true"` (tümü işaretli) için ayrı stil var | işaretli / toplam | |
| E-09-32 | Gündem maddesi | satır (`rp-agenda`, ızgara `20px | 1fr | auto | 32px`, min 52px) | onay kutusu (`t-check`, 18px, `aria-label`=metin) + metin (14px) | işaretli: `rp-agenda--done` (opaklık .62, üstü çizili) | metin, işaretli mi | Sıralama: örnekte işaretsizler üstte (bkz. §7) |
| E-09-33 | İşaretleyen bilgisi | metin (`rp-cap rp-nowrap`) | "<kısaltılmış ad> · HH:MM" (biçim: "<ad> <soyad baş harfi>. · HH:MM") | yalnız işaretliyken | işaretleyen kişi + saat | Ad kısaltma kuralı: ad(lar) + soyadı baş harfi (örnek verisinde tutarsız, §7) |
| E-09-34 | Madde işlemleri | ikon düğme (…) | `aria-label="<madde> işlemleri"` | — | — | menü içeriği tasarımda yok |
| E-09-35 | Madde ekleme | satır (`label.rp-addrow`) + metin girişi | yer tutucu "Gündem maddesi ekle ve Enter’a bas", sayaç "0 / 300" | — | — | |

### 2.7 Detay — Notlar kartı (`aria-labelledby="nt-title"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-36 | Kart başlığı | başlık "Notlar" + sayaç | — | — | toplam not | |
| E-09-37 | Not süzgeci | sekme grubu (`rp-seg`, `aria-label="Not filtresi"`) | "Tümü N", "Göreve dönüşen N", "Benim N" | seçili | üç sayaç | |
| E-09-38 | Not yazma alanı | `rp-composer`: textarea (`aria-label="Not yaz"`) + ipucu + düğme | yer tutucu "Toplantı notu yaz… Katılan herkes not ekleyebilir."; ipucu "Notu daha sonra göreve dönüştürebilirsin · 0 / 2000"; düğme "Not ekle" (`t-btn--primary t-btn--sm`) | boşken düğme durumu çizilmemiş | — | |
| E-09-39 | Not öğesi | `article.rp-note`: avatar (baş harf) + başlık satırı + gövde | ad (13px/600), rol rozeti (`rp-role`; `--k` Koordinatör, `--a` Admin, düz Üye), saat ("14:15"), "· düzenlendi" | düzenlenmiş | yazar adı, yazarın rolü, zaman, metin, düzenlendi mi | Rol rozeti yazarın o andaki rolü mü, toplantıdaki rolü mü bilinmiyor |
| E-09-40 | Göreve dönüştü bağlantısı | bağlantı (`rp-tasklink`, tik) → görev | "Göreve dönüştü · <görev kodu>" + `rp-cap` ek bilgi | yalnız dönüşmüşse | görev kodu; ek bilgi: örnekte bir yerde "atanan · tarih aralığı", diğerinde "koordinatörlük · tarih aralığı" | Görev kodu BE-005'e bağlı; ek bilgi tutarsız (§7) |
| E-09-41 | "Göreve dönüştür" | düğme (`t-btn--secondary t-btn--sm`) | "Göreve dönüştür" | yalnız dönüşmemişse ve yetkiliyse | — | E-09-74 penceresini açar |
| E-09-42 | Kilit notu | metin (`rp-cap`, sağda, `title` aynı) | "Göreve dönüştüğü için yazarı artık düzenleyemez" | dönüşmüş + **üye** yazar bakıyorsa (K29) | — | Kilit yalnız üye yazarında; yönetici/koordinatör yazar dönüşmüş notunu düzenleyebilir (GAP-070, `backend.md` §3) |
| E-09-43 | Not işlemleri | ikon düğme (…) | `aria-label="Not işlemleri: <liste>"`; örnek listeler: "düzenle, sil", "sil", "sil (üye notunu koordinatör düzenleyemez)" | izinlere göre liste değişir | — | menü görseli yok |
| E-09-44 | "N not daha göster" | düğme (`t-btn--ghost t-btn--sm`, ortada) | "8 not daha göster" | kalan yoksa gizli (varsayım) | kalan sayı | sayfalama biçimi `mekanizma.md` §5 |

### 2.8 Detay — Katılımcılar kartı (`rp-aside`, `aria-labelledby="pp-title"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-45 | Kart başlığı + "Ekle" | başlık "Katılımcılar N" + düğme (`t-btn--secondary t-btn--sm`, +) | "Ekle" | §4 | toplam | kişi seçici tasarlanmamış |
| E-09-46 | Eklenemeyenler uyarısı | `rp-warn` (`role=status`, altın üçgen) + kapat (x) | "**N kişi eklenemedi.** <Ad> sezona üye değil, <Ad>’ın hesabı silinmiş." | kapatılabilir | ad + neden listesi | Ekleme sonrası kısmi başarı |
| E-09-47 | Koordinatörlük grubu | `section.rp-ppg` (`aria-label`=ad) başlık | ad (`rp-trunc`, `title`=kod) + kişi sayısı | — | grup adı, sayı | Grup = katılımcının koordinatörlüğü (varsayım) |
| E-09-48 | Katılımcı satırı | `rp-pp` (`data-role`) | avatar (baş harf) + canlı nokta (`rp-pp__live`, `title="Konferansta"`) + ad + kısa rol ("admin", "koord.", "üye") + çıkar (x) | x yalnız hover/odakta görünür; canlı nokta video bağımlı (statik) | ad, rol, konferansta mı | grup başında admin/koordinatörler |
| E-09-49 | Üye aç/kapa | düğme (`rp-ppmem`, `aria-expanded`) | kapalı: avatar yığını (en çok 4) + "N üye"; açık: "Üyeleri gizle" + liste (`rp-ppmem__list`) | aç/kapa | üye sayısı, ilk 4 baş harf | yalnız grupta üye varsa |
| E-09-50 | Kart alt notu | metin | "Katılımcıları bağlı koordinatörlüklerin koordinatörleri yönetir. Yalnız sezona üye hesaplar eklenebilir." | — | sabit | |

### 2.9 Detay — Koordinatörlükler kartı
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-51 | Kart başlığı + "Değiştir" | başlık "Koordinatörlükler N" + bağlantı düğmesi (`rp-link rp-linkbtn`, kalem) | "Değiştir"; `title="Koordinatörlük kümesini yalnız admin değiştirebilir"` | yalnız admin (gizli mi devre dışı mı belirsiz, §7) | sayı | değiştirme penceresi tasarlanmamış |
| E-09-52 | Koordinatörlük satırı | ızgara (kod rozeti + ad + not) | "<KOD> · <koordinatörlük adı> · Sahip" | ilk satır `rp-code--own` + "Sahip" | kod, ad, sahip mi | |
| E-09-53 | Kart alt notu | metin | "İlk koordinatörlük sahiptir. Bir koordinatörlük silinse de adı bu toplantıda kalır." | — | sabit | Silinmiş birimin ad anlık görüntüsü gerekir |

### 2.10 Detay — Bilgi kartı
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-54 | Bilgi listesi | `dl.rp-dl` | "Açan" (ad), "Oluşturulma" (mono `GG.AA.YYYY`), "Kimler görür" (cümle: "Admin, N koordinatörlüğün koordinatör ve üyeleri"), "Konferans" ("LiveKit · en çok 25 kişi"), "Rolün" ("Admin, <KOD> koordinatörü") | — | oluşturan, oluşturulma tarihi, görünürlük cümlesi (türetilmiş), konferans sağlayıcı + tavan, izleyenin rolü | "Kimler görür" "Üyeler dahil" bayrağına göre değişir (varsayım) |

### 2.11 Görüşme tam ekran (09d) — F4'te statik
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-55 | Üst şerit | `rp-call__top` | "Canlı" hapı; başlık (15px/600); alt "HH:MM’de başladı · host olarak bağlısın"; avatar yığını; "6 / 25"; "Toplantı sayfası" (`t-btn--ghost t-btn--sm`); Küçült ikonu | — | başlık, başlama saati, rol, bağlı / tavan | |
| E-09-56 | Ana görüntü | `rp-call__view` | ekran paylaşımı (`role=img`, `aria-label="<ad> ekranını paylaşıyor"`) + etiket "<ad> ekranını paylaşıyor" | paylaşım yokken konuşan kişi büyük karo (`rp-vtile--main`, CSS'te var, çizilmemiş) | — | |
| E-09-57 | Karo şeridi | `rp-strip` > `rp-vtile--sm` | avatar (baş harf) + ad etiketi + mikrofon ikonu | `--talk` (konuşan, vurgu çerçeve), `--nocam`, `--me` ("Sen"), mikrofon kapalı ikonu | katılımcılar | |
| E-09-58 | Denetim çubuğu | `rp-call__ctrl` (`role=toolbar`, `aria-label="Görüşme denetimleri"`), `rp-cbtn` | "Sessize al", "Kamerayı kapat", "Ekranı paylaş", "Galeri", "Paneli gizle" (`--on`), "Küçült" | `--on` (vurgu), `--off` (tehlike) | — | |
| E-09-59 | "Herkes için bitir" / "Ayrıl" | düğmeler (ghost tehlike / `t-btn--danger`) | "Herkes için bitir", "Ayrıl" | ayırıcıdan sonra | — | |
| E-09-60 | Yan panel sekmeleri | `rp-seg` (`aria-label="Yan panel"`) + kapat (x) | "Gündem 4/7", "Notlar N", "Kişiler N" | seçili | sayaçlar | |
| E-09-61 | Yan panel not alanı | `rp-composer` | yer tutucu "Görüşme sırasında not al…", "0 / 2000", "Not ekle" | — | — | E-09-38 ile aynı eylem |
| E-09-62 | Yan panel not öğesi | kompakt `rp-note` (28px avatar) | ad, rol rozeti, "bugün HH:MM", gövde; alt: "Göreve dönüştür" / görev kodu bağlantısı, "Düzenle", "Sil" (metin bağlantıları) | dönüşmüşse görev kodu | | 09b'de … menüsü, burada açık bağlantılar (§7) |

### 2.12 Küçültülmüş görüşme (09e) — F4'te statik
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-09-63 | Küçük pencere | `rp-pip` (`role=region`, `aria-label="Küçültülmüş toplantı"`), 360px, sağ alt | video alanı düğmesi (`aria-label="Görüşmeyi büyüt"`, 196px): paylaşım küçük resmi, etiket "<ad> · ekran" (ses dalgası `rp-eq`), "Canlı · 6 / 25" | — | | |
| E-09-64 | Pencere çubuğu | `rp-pip__bar` | başlık + "N dakikadır sürüyor"; ikon düğmeler: "Mikrofonu kapat", "Kamerayı aç" (`--off`), "Büyüt", "Ayrıl" (`--leave`) | | süre (dk) | |
| E-09-65 | Gezinme ipucu | metin (örnekte Görevler sayfasının `rp-sub`'ı) | "Görüşme sürerken sistemde gezinebilirsin; toplantı sağ altta küçük pencerede devam eder." | | | Tuval açıklaması gibi; uygulamaya girmesi belirsiz (§7) |

## 3. Pencereler, menüler, açılır paneller

### 3.1 Yeni toplantı (09c, "koordinatör görünümü") — `t-modal role=dialog`
| Kimlik | Öğe | Metin / biçim | Not |
|---|---|---|---|
| E-09-66 | Pencere başlığı | "Yeni toplantı" / "<sezon> sezonuna bağlı bir toplantı aç." + kapat (x) | tetikleyici E-09-03 |
| E-09-67 | Başlık girişi | etiket "Başlık", sayaç "N / 255" | |
| E-09-68 | Tarih + saat | "Tarih" (`GG.AA.YYYY`), "Saat" (140px, `HH:MM`); ipucu "Bugünden önceki günler seçilemez." | tarih seçici görseli yok |
| E-09-69 | Davet biçimi | etiket "Kimleri davet ediyorsun?"; `role=radiogroup`: "Koordinatörlük — Seçtiğin birimlerdeki herkes" / "Kişiler — Yalnız seçtiğin kişiler" | "Kişiler" seçiliyken içerik çizilmemiş; CSS'te `rp-invite*` sınıfları var ama kullanılmamış |
| E-09-70 | Koordinatörlük çipleri | `rp-chipbtn` (`aria-pressed`), ad + üye sayısı | seçim sırası = sahip? (§7) |
| E-09-71 | "Tüm üyelere de davet gönder" | onay kutusu + "İşaretlemezsen yalnızca koordinatörler davet edilir." | E-09-23 "Üyeler dahil" ile ilişkili (varsayım) |
| E-09-72 | Davet özeti | `rp-invsum`: avatar yığını + "**N kişi davet edilecek** K koordinatörlükten · sen de katılımcı olursun" | istemcide hesap |
| E-09-73 | Alt düğmeler | "Vazgeç" (ghost), "Toplantıyı oluştur" (primary) | |

### 3.2 Göreve dönüştür (09c, "Nottan görev oluşturma") — `t-modal role=dialog`
| Kimlik | Öğe | Metin / biçim | Not |
|---|---|---|---|
| E-09-74 | Pencere başlığı | "Göreve dönüştür" / "<toplantı başlığı> · <yazar>’nun notu" + kapat | tetikleyici E-09-41, E-09-62 |
| E-09-75 | Not alıntısı | `rp-quote`, not gövdesi | salt okunur |
| E-09-76 | Görev başlığı | etiket "Görev başlığı", sayaç "N / 255", ipucu "Boş bırakırsan notun ilk 100 karakteri kullanılır." | önceden doldurulmuş görünüyor |
| E-09-77 | Hedef koordinatörlük | `t-select` + ipucu "Admin olarak sezondaki her koordinatörlüğü seçebilirsin. Koordinatörler yalnız yönettikleri ve toplantıya bağlı birimleri görür." | seçenek kümesi role göre |
| E-09-78 | Başlangıç / Bitiş | iki tarih girişi; hata durumu: kenarlık tehlike, `aria-invalid`, ileti "Bitiş bugünden ve başlangıçtan önce olamaz." | atanan alanı yok |
| E-09-79 | Bilgi kutusu | "Görev, nottaki “göreve dönüştü” işareti ve denetim kaydı birlikte yazılır. Biri başarısız olursa hiçbiri kaydedilmez. Not bir kez dönüştürülebilir." | |
| E-09-80 | Alt düğmeler | "Vazgeç", "Görevi oluştur" (hatada `aria-disabled`, opaklık .5) | |

### 3.3 Silme onayı (09c) — `t-modal role=alertdialog`
| Kimlik | Öğe | Metin / biçim | Not |
|---|---|---|---|
| E-09-81 | Silme onayı | "Toplantı silinsin mi?" / "<başlık> · <gün ay>"; gövde "Toplantı listeden kalkar ve artık değiştirilemez. **Canlı konferans hemen kapanır, N kişinin bağlantısı kesilir.**" + "Admin, Silinenler sekmesinden geri yükleyebilir. Geri yüklense de konferans geri gelmez."; düğmeler "Vazgeç", "Sil" (`t-btn--danger`) | Kalın cümle yalnız canlı konferansta (varsayım); video statikken gösterilmesi belirsiz; tetikleyici E-09-25 |

### 3.4 Silinen toplantılar (09c, "yalnız admin") — `t-card`
| Kimlik | Öğe | Metin / biçim | Not |
|---|---|---|---|
| E-09-82 | Kart başlığı | "Silinen toplantılar N" | E-09-05 sekmesinin içeriği (varsayım) |
| E-09-83 | Silinen satırı | `rp-del`: başlık (14px/600) + "<sahip kodu> · <toplantı günü ay> · <silen ad> sildi, <GG.AA>"; "Geri yükle" (`t-btn--secondary t-btn--sm`), kalıcı sil ikonu (çöp, tehlike, `aria-label="Kalıcı sil"`) | Kalıcı silme onay penceresi tasarlanmamış |
| E-09-84 | Kalıcı silme notu | "Kalıcı silme notları, gündemi, katılımcıları, koordinatörlük bağlarını ve konferans kayıtlarını birlikte siler; geri alınamaz." | |

### 3.5 Tasarlanmamış menü/pencereler
Koordinatörlük süzgeci açılır menüsü (E-09-06), toplantı Düzenle formu (E-09-24), Diğer işlemler menüsü ve "tarihi ileri al" penceresi (E-09-25), gündem maddesi menüsü ve düzenleme (E-09-34), not işlemleri menüsü ve not düzenleme (E-09-43), katılımcı ekleme kişi seçicisi (E-09-45), koordinatörlük kümesini değiştirme (E-09-51), "Kişiler" davet listesi (E-09-69), kalıcı silme onayı (E-09-83). Her biri bilinmiyor; uygulayıcı ortak `t-modal`/menü bileşenleriyle kurmalı, ürün sahibine sorulmalı.

## 4. Metinler ve etiket sözlüğü
- Sekmeler: "Yaklaşan", "Geçmiş", "Silinenler"; not süzgeci: "Tümü", "Göreve dönüşen", "Benim"; görüşme paneli: "Gündem", "Notlar", "Kişiler".
- Gün grupları: "Bugün", "Bu hafta", "Gelecek hafta" + "21 Ekim Çarşamba" / "22 – 25 Ekim" / "26 Ekim – 1 Kasım" (en dash, boşluklu).
- Durumlar: "Canlı", "Bekliyor" (tarih kutusu), "Henüz başlamadı" (yalnız `renderVals()` içinde, görünmüyor), "· düzenlendi", "Göreve dönüştü · <kod>".
- Rol adları: rozet "Admin" / "Koordinatör" / "Üye"; kısa "admin" / "koord." / "üye"; Bilgi kartında "Admin, <KOD> koordinatörü".
- Tarih/saat: tarih kutusunda ay kısaltması 3 harf ("Eki"); saat `HH:MM` mono; oluşturulma `GG.AA.YYYY` mono; form girişleri `GG.AA.YYYY` ve `HH:MM`; süre "32:14" (dk:sn, `rp-num`); "N dakikadır sürüyor"; "HH:MM’de başladı"; not saati "14:15" (bugün) / "bugün 14:31" (09d).
- Sayaçlar: gündem "işaretli / toplam" ("4 / 7", sağ ve sol boşluklu; 09d sekmesinde boşluksuz "4/7"); bağlı "6 / 25"; karakter sayaçları "0 / 300" (gündem), "0 / 2000" (not), "N / 255" (başlık).
- Boş: "not yok" (liste sayacı). Liste/not/gündem boş durum metinleri tasarımda yok.
- Kesme işareti tipografik (’).

## 5. Açık tema farkı
Açık tema artboard'u yok; liste, detay ve pencereler token'larla döner (yalnız token). **İstisna:** 09d (`rp-call`) ve 09e (`rp-pip`) renkleri sabit koyudur ve tema token'larını yerel olarak ezer; açık temada da koyu kalır.

## 6. Erişilebilirlik ipuçları
- Sekme grupları `role=tablist` + `aria-selected`; Silinenler sekmesinde açıklayıcı `title`.
- Satır tamamı `<a>`; tarih kutusundaki canlı nokta `aria-hidden`; sayaç ikonlarında `title` ("Gündem", "Notlar", "Katılımcılar").
- Gündem onay kutusu `aria-label`=madde metni; madde menüsü `aria-label="<madde> işlemleri"`; ekleme girişi `aria-label="Yeni gündem maddesi"`.
- Not menüsü `aria-label="Not işlemleri: <izinli eylemler>"` (izin listesi etikette okunuyor).
- Katılımcı çıkar düğmesi `aria-label="<ad> katılımcılardan çıkar"`, yalnız hover ve `:focus-visible`'da görünür; üye aç/kapa `aria-expanded`.
- Uyarı `role=status`; silme `role=alertdialog`; form hatası `aria-invalid` + `aria-describedby`; devre dışı birincil düğme `aria-disabled`.
- Görüşme `role=dialog`, denetimler `role=toolbar`; küçük pencere `role=region`; hareket azaltmada animasyonlar kapalı.
- Konferans şeridi `section aria-label="Görüntülü konferans"`; Bilgi kartı `aside aria-label="Toplantı bilgileri"`.

## 7. Tasarımda belirsiz / çelişkili
1. **Eylem görünürlüğü kaynağı:** `istemci-akislari.md` §4 tablosunda toplantı işlemleri için satır bulunamadı (yalnız görev işlemleri var). Yeni toplantı, düzenle, sil, gündem, not yazma/düzenleme/silme, katılımcı ekle/çıkar, koordinatörlük değiştir ve nottan görev için kuralı backend analisti netleştirmeli. Tasarımdaki ipuçları ("Katılan herkes not ekleyebilir", "Katılımcıları bağlı koordinatörlüklerin koordinatörleri yönetir", "Koordinatörlük kümesini yalnız admin değiştirebilir", "üye notunu koordinatör düzenleyemez", "göreve dönüştüğü için yazarı artık düzenleyemez") kural kanıtı değildir.
2. **Konferans F4'te statik ama detayda baskın:** konferans şeridi (E-09-26…30), listedeki Canlı/Bekliyor (E-09-10), katılımcı canlı noktası (E-09-48), silme onayındaki "bağlantısı kesilir" cümlesi (E-09-81), Bilgi kartındaki "Konferans" satırı ve kalıcı silme notundaki "konferans kayıtları" video modülüne bağlı. "Bekliyor" durumunun anlamı (zamanı geldi ama başlamadı mı?) bilinmiyor.
3. **Tarih süzgeci:** BE-021 "koordinatörlük ve tarih süzgeci" diyor, tasarımda yalnız koordinatörlük düğmesi ve zaman sekmeleri var.
4. **Geçmiş sekmesi** çizilmemiş: gün gruplarının adı ("Geçen hafta"?), sıralama yönü ve satırdaki sayaç biçimi bilinmiyor. Alt sayaç (E-09-19) sekmeye göre ne yazar, bilinmiyor.
5. **Silinenler yeri:** listede sekme (E-09-05), 09c'de ayrı kart (E-09-82). Varsayım: sekme seçilince liste alanında kart gösterilir.
6. **Not eylemlerinin biçimi:** 09b'de "…" menüsü, 09d'de açık "Düzenle" / "Sil" bağlantıları.
7. **Dönüşmüş not ek bilgisi:** bir örnekte "<atanan kişi> · tarih aralığı", diğerinde "<koordinatörlük> · tarih aralığı". Göreve dönüştür formunda atanan alanı yok; atanan kişinin nereden geldiği bilinmiyor.
8. **İşaretleyen adı kısaltması** tutarsız (bir örnekte soyad baş harfe kısaltılmış, başka örnekte tam yazılmış).
9. **Gündem sıralaması:** örnekte işaretsiz maddeler üstte, işaretliler altta; sunucu sırası mı, işaret durumuna göre istemci sıralaması mı bilinmiyor. Madde sürükleyerek sıralama yok.
10. **"Değiştir" (E-09-51)** admin dışında gizli mi, devre dışı mı (title ipucu devre dışı gösterimini düşündürüyor) belirsiz.
11. **"Üyeler dahil" (E-09-23) ↔ "Tüm üyelere de davet gönder" (E-09-71):** aynı bayrak mı? Biri görünürlük ("görür ve not ekleyebilir"), diğeri davet diyor.
12. **Sahip koordinatörlük** formda nasıl belirlenir (ilk seçilen çip mi, açanın birimi mi) bilinmiyor; 09c `renderVals()` `own: 'Sahip'` verisi taşıyor ama ekranda kullanılmıyor.
13. **"Kişiler" davet biçimi** ve katılımcı **"Ekle"** için kişi seçici yok; `rp-invite*` CSS sınıfları tanımlı ama kullanılmıyor (çizilmiş ama kaldırılmış olabilir).
14. **Dosyalar:** görev özetinde "dosyalar" anılıyor ama 09b'de dosya bölümü yok.
15. **Görev kodu** (biçim: "<KOD>-<sayı>") BE-005'e bağlı (görev kısa kodu yok).
16. **Yükleniyor / hata / boş durumlar** hiçbir artboard'da yok.
17. **E-09-65** gezinme ipucu Görevler sayfasının alt başlığına yazılmış; tuval açıklaması mı, gerçek ipucu mu belirsiz.
18. **Bilgi kartında sağlayıcı adı** ("LiveKit") ve tavan ("en çok 25 kişi") kullanıcıya gösteriliyor.
19. `rp-mtwrap` sınıfı kullanılıyor ama kuralı tanımlı değil (genişlik sınırlayıcı olabilir; bilinmiyor).
20. 09b `renderVals()` içinde `onClick="{{ p.remove }}"` / `{{ g.memToggle }}` tanımsız; etkileşim yalnız niyet olarak okunmalı.
