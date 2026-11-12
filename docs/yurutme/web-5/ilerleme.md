# WEB-5 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F5 AÇILDI 2026-11-12.** Ürün sahibi onayı ve P33–P45 kararları alındı. BE-072 açık (P33 ile yönetici merceği geçici çözüm). Web pini `v0.15.0-api` (F5 boyunca yükseltilmedi). **F6 AÇILMAZ — kullanıcı onayı gerekir** (aşağıdaki "F6'ya devredilenler / borçlar" sonundaki kural).

## Durum

| Oturum                  | Durum                                                                                        | main hash                      |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------------------------------ |
| O1 tespit + kararlar    | Birleşti: #102 (W120), #103 (W119 + P41), #104 (P42–P45)                                     | `2e05468`                      |
| O2a W121                | Birleşti: #105 (arşiv veri katmanı)                                                          | `1937e69`                      |
| O2b W122–W126, W128     | Birleşti: #106 (W126), #107 (W125), #108 (W122), #109 (W124), #110 (W123), #112 (W128)       | `9737845`                      |
| Yaşam döngüsü hotfix    | Birleşti: #111 (test-only)                                                                   | `064e131`                      |
| Borç W129               | Birleşti: #113 (work yetki hizası, ADR-0030)                                                 | `a19c9d5`                      |
| O3 W127                 | PR #114 (`28b9e22`, 4023 test) birleşti; dogrulama-F5 (W130) ayrı dalda yazılıyor           | `8abcb3b`                      |
| O4 kapanış              | W131 belgeler yazıldı; W130 gerçek imaj tanığı yazılıyor; **Codex gpt-6.1-sol bekliyor**; kapanış PR bekliyor | bekliyor                       |

## Kayıtlar

### F5 açıldı (2026-11-12)

- Kararlar: P33 (yönetici merceği, BE-072 öncesi), P34 (etiketler), P35 (yükleme), P36 (silinen kayıtlar ayrı ekran, E-01-02 canlanır), P37 (saklama metni), P38 (06 alt başlık), P39 (rozet gizli), P40 (K/Ü doğrudan 07).
- Açık: BE-072, BE-069 (göreve bağsız yükleme), BE-024 (yeni etiket), BE-025, saklama politikası (ürün kararı ister), 06 PDF segmenti ve arama kapsamı.
- Tasarım kopyası `1794501200-387f` sürümüne yenilendi (01c/01d/Şablon/Kenar-Roller/Ü/K).
- Roller: Fable koordinatör (kod yazmaz); işçiler Sonnet 5.5 medium; Codex gpt-6.1-sol medium read-only yalnız nihai kapı.

### O1 — tespit ve kararlar (W119, W120)

- **W120** (`web5/o1-kararlar`, #102 `c25c2db`): tasarım kopyası, 06 kabul tablosu P33–P40 ile kapandı, ortak-kurallar §12, web-5 belgeleri ve ortak sözleşme.
- **W119** (`web5/o1-tespit-12`, #103): 12 Silinen kayıtlar tespiti (`docs/ekranlar/12-silinen-kayitlar/`) ve `kayit.md` BE-108…BE-119; BE kimlik bloğu önceden verildi. Ürün sahibi **P41** ekledi: silinen kayıtlara "Koordinatörlük" türü.
- **İkinci karar turu** (12 öneri satırları, aynı W119, `web5/o1-kararlar-12`, #104): P42 "Tümü" sekmesi yok, varsayılan Görev; P43 tür sayacı yalnız açık sekmede, tarih aralığı istemci süzgeci, `silen` yalnız toplantıda; P44 çizilmemiş metinler işçi önerisi gibi; P45 BE-112/109/111/076 ertelendi (rapor-F5 "karar bekler").
- Açık kullanıcı sorusu "Koordinatörlük türü" P41 ile kapandı.

### O2a — W121 arşiv veri katmanı (#105 `1937e69`)

- Teslim `3ada148` (509 dosya / 3450 test). Koordinatör kararları: Caddyfile CSP `img-src 'self' data: blob:` (blob yalnız aynı kökenden fetch edilen raster; test + Codex kapısı notu) W124'e verildi; `work/model/capabilities.ts` v0.11 yükleme/silme kuralını ADR-0030'a hizalama borcu W129'a; **BE-120** (`archiveFullZip` S3 başlık/yönetici) ve **BE-121** (`archiveTasks` yalnız dosyalı görevler) yeni eksikler olarak numaralandı (kayıt satırlarını W122 yazdı); varsayımlar 1–8 kabul.

### O2b — altı işçi, zincir, CI kırmızıları

Altı işçi aynı anda başladı (W122 06, W123 07, W124 önizleme/eylemler + Caddyfile, W125 yükleme, W126 ZIP, W128 silinen kayıtlar). Zincir sırası W122 → W124 → W123 → W128 (W125/W126 bağımsız dosyalarla önce). Birleşme sırası: #106 W126, #107 W125, #108 W122, #109 W124, #110 W123, #112 W128.

- W126 `72ce8e3` (#106); W125 `a66fd3a` → `a693be0` (#107); W122 `77d34d4` → `2413767` → `9adef9b` (#108); W124 `5163ecb` → `49ee71b` → `8036956` (#109, preview anahtarı `archive-preview`, 3515 test); W123 `3c209d9` → `01cde93` (#110, 3520 test, 37 ölçüm 0 sorun); W128 `38bd47b` (#112, 541 dosya / 3675 test, 60 PNG; BE-119 notu sekmede + `title`).
- Koordinatör kararları: W125 YENİ-EKSİK'ler kayda girmedi (boyut/tür sınırı spec'te yok; istemci sayı uydurmaz; fetch ilerlemesi istemci sınırı); W123 "silmede odak komşu karta" varsayımı kabul (06 mekanizma §4.4 farkı rapor-F5'te); W128 varsayımları kabul ("Kullanıcı" etiketi; S2 rota; programsızken Kullanıcı sekmesi yok; aralıkta 5 otomatik sayfa).
- **CI kırmızıları ve dersleri** (işçi raporlarındaki "tam paket yeşil" CI ile çelişti):
  1. `archive/api/lifecycle.test.ts` rename sahipsiz testi 5 s zaman aşımı (main run 43275074907 ve #107). Hotfix #111 `a8c043a`: sahip sökümü testleri uygulama sökümü yerine **sahip etki kapsamını durdurur (`effectScope`)**. Kök neden kanıtlanamadı; W127 gerçek söküm yolunu senaryoladı. Ders: lifecycle testlerinde gerçek zaman beklemesi yok, msw'de kontrol noktalı yanıt.
  2. `UploadDialog.test.ts` "devam ederken…" AssertionError (#107/#108, CI'da tutarlı). W125 `fcb92e4` süre tahmini yerine istek-ulaştı kontrol noktası; yine düşünce `cdbf2da`: **`vi.waitFor` koşul beklemesi** (pending DOM'u) → CI yeşil; koordinatör düzeltmeyi W122/W124/W123/W128 dallarına dağıttı. Ders: CI'da zamanlamaya duyarlı test yazılmaz; koşul beklenir.
  3. Test başlığında `designStub` çağrısı kalıbı (kayıt tutarlılık testi) ve lint düzeltmeleri W128 içinde kapandı.
- "Tam paket" kuralı: teslim öncesi bir kez; `pgrep -f vitest` ile ikiden fazla eşzamanlı tam paket varsa bekle.

### #111 yaşam döngüsü hotfix (`064e131`)

Test-only (`a8c043a`, W121 ajanı, `web5/fix-lifecycle`): bkz. yukarıdaki kırmızı 1. Gerçek söküm yolu W127 görevi olarak devredildi.

### W129 — work capabilities ADR-0030 (#113 `a19c9d5`)

`canUploadFile`/`canDeleteFile` ADR-0030 hizası (yönetici yükler, yükleyen yönetici siler) + arşivle eşlik testi; 03 yetki satırları ve `backend.md` giriş cümlesi güncellendi. e2e'de yönetici-yükleme-gizli varsayımı grep'te yok. 2026-11-12 22:40: O2b tamam, main `a19c9d5`, worktree'ler temizlendi.

### O3 — W127 entegrasyon turu (PR #114, `28b9e22`; birleşti, main `8abcb3b`)

- 06/07 (üç rol, URL gidiş-dönüşü, yükleme, adlandırma/silme/odak, indirme/ZIP, yaşam döngüsü, odak/ARIA) ve 12 (ana sayfa düğmesi, dört sekme, türevler, `work.department_unavailable`, geç sonuç) entegrasyon senaryoları; `src/app/__tests__/integration/archive-*.test.ts` ve `deleted-records-o3.test.ts`. 4023 test. Görsel duman 18 senaryo (üç rol × üç genişlik × iki tema), `failures` boş.
- **Kusurlar** (düzeltildi): **KUSUR 1** kalıcı silme sonrası bildirim kayboluyordu (panel kendi silme sonucundan önce sökülüyordu; `c49ba6a`) — koordinatör kararı: silme sürerken panel açık kalır yaklaşımı kabul, sahip sökülmüş değil, KESİN 26a uyumlu. **KUSUR 2** `PeriodZipButton` BE-120 stub işareti eksikti (`6239ed1`); yönetici 06 "Dosya yükle" bağı silinmez, devre dışı `designStub` BE-072 (tasarım birebir), K/Ü 06 görmez. **KUSUR 3** 06'da K/Ü için gereksiz `listProgramDepartments` ve yönlendirme öncesi `archiveTasks` okumaları (`3a54711`).
- Menü rol sırası / "Dosyalarım" etiketi: rapor-F5 ve yol haritası borcu (menü tanımına rol bilgisi gerekir).

### O4 — kapanış (W130, W131; Codex bekliyor)

- **W131** (`web5/o4-kapanis`): rapor-F5, bu kayıt, oturum-4-kapanis, README, ortak-kurallar §6, 12/06 README kabul kanıtları, 06 mekanizma §4.4 notu, `kayit.md` F5 satırları, pin yükseltme planı, web-6 iskeleti, yol haritası notu (yalnız belge; kod yok).
- **W130**: `dogrulama-F5.md` (gerçek Docker imajı + gerçek backend tanığı, G4 429, tam kapı) — #114 birleşti (`8abcb3b`); W130 ayrı dalda yazıyor, sonucu bu kayda işlenmedi ([dogrulama-F5.md](dogrulama-F5.md) yalnız bağlantı).
- **Codex gpt-6.1-sol medium `-s read-only`** nihai kapı: **bekliyor** (`docs/reviews/WEB-5-codex.md` henüz yok). Hüküm ve kapanış PR satırı (numara, MERGED, son main hash) hükümden sonra eklenir: **bekliyor**.

## F6'ya devredilenler / borçlar

Yeni bir faz açılmadan izlenir; hiçbiri F6'yı kendiliğinden başlatmaz.

| #   | Borç                                                                                                                                             | Kaynak / sahip                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1   | Gerçek cihaz ekran okuyucu (VoiceOver) kabulü: W121–W128 yapılmadı; kullanıcı görsel onayı otomatik geçti sayılmaz                               | F4'ten devralınan Ö-07; W121–W128                     |
| 2   | BE-120 `designStub` işareti W127'de eklendi; BE-120 kendisi açık (dönem ZIP'i yönetici başlığı)                                                  | rapor-F5 Paket 6.2                                   |
| 3   | W127 gerçek bağlamayla duman: Playwright duman W127'de sahte `/v1` ile; gerçek backend tanığı W130 `dogrulama-F5.md`                              | W127 / W130                                          |
| 4   | Lifecycle gerçek söküm yolu: #111 kök neden kanıtlanamadı; W127 gerçek `unmount` senaryoları yazdı, CI sonucuna bağlı (doğrulanamadı)              | #111 / W127                                          |
| 5   | `web-tokens` archive grubu (üç ölçü), üst çubuk arama yuvası, `@media 1100` düzeni                                                               | W123 SAHİPLİK-DIŞI notu                              |
| 6   | Menü rol sırası ve "Dosyalarım" etiketi (menü tanımına rol bilgisi)                                                                              | W122/W127; yol haritası §4 F5 notu                   |
| 7   | W121 gereksiz istekler (`useFolderCards` K/Ü, `archiveTasks` yönlendirme öncesi): W127 KUSUR 3 ile giderildi; kalan başka gereksiz istek bulunmadı (doğrulanamadı: tam ağ sayımı yapılmadı) | W121 / W127                                          |
| 8   | `work/model/capabilities.ts` ADR-0030 hizası: **kapandı** (W129 #113)                                                                            | W129                                                 |
| 9   | 390 kabuk menüsü açık gelince örtme (duman ortamı mı kabuk mu?): W126 notu, W127 sonucu doğrulanamadı                                             | W126 notu                                            |
| 10  | W127 kusur 1 yaklaşımı: silme sürerken panel açık kalır (kabul edilmiş tasarım tercihi; Codex'te sorulabilir)                                    | W127                                                 |
| 11  | Pin yükseltmesi (v0.15 → v0.17 ya da BE-072 paketi sonrası v0.18) ve "Şimdilik" yollarının kaldırılması                                           | [pin-yukseltme-plani.md](pin-yukseltme-plani.md)     |
| 12  | P45 ertelenenler: BE-112, BE-109, BE-111, BE-076 ürün kararı bekler; BE-069, BE-075, BE-077 de karar ister                                       | [rapor-F5](../../backend-eksikleri/rapor-F5.md) §1   |
| 13  | PDF segmenti (06 `tur`) ve arama kapsamı ürün kararı                                                                                             | 06 README "Hâlâ açık"                                |

**F6 AÇILMAZ — kullanıcı onayı.** F6 (raporlar/pano; 01 tam ana sayfa) ürün sahibinin açık onayı ve pin yeterliliği doğrulanmadan açılmaz; [web-6 iskeleti](../web-6/README.md) yalnız hazırlıktır. Onay otomatik geçti sayılmaz; "F5 kapandı" ifadesi Codex hükmü ve kapanış PR'ı MERGED olana kadar kullanılmaz.

### Codex tur 1 (2026-11-13)

HEAD `44eb5fe`: **KOŞULLU UYGUN** ([metin](../../reviews/WEB-5-codex.md)). Engelleyici yok. Koşullar: CX-F5-Ö-01 (kapatılan önizleme geç sayfalama yanıtıyla yeniden açılıyor) ve CX-F5-Ö-02 (yönetici görev eşlemesi hatası süresiz yükleniyor) kod düzeltmesi, W132 PR; CX-F5-K-01 (dogrulama-F5 aynı ad tanığı) ve CX-F5-K-02 (dönem ZIP UI yolu yok, API hazır) belge, `web5/o4-kapanis`'te düzeltildi. Kapanış hash'leri ve tur 2: bekliyor. F5 henüz KAPANMADI.
