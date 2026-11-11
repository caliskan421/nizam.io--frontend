# WEB-4 nihai Codex kapısı

## Tur 1 — 2026-11-12

Model: `gpt-6.1-sol`, reasoning `medium`, sandbox `read-only`. Gerçek kabuk araç izi ana frontend `.git/koordinator/web4-codex-tur1-trace.jsonl`; ilk eylem HEAD/status, kaynakta değişiklik yok.

HEAD: `292d01ca45e5217abf027e287c168275c8c3dc12` — çalışma ağacı temiz.

**Hüküm: KOŞULLU UYGUN.** İncelenen kaynakta engelleyici yetki aşımı, pin ihlali veya sökülmüş sahip adına yeni yazma başlatan kusur saptamadım. Aşağıdaki üç bulgu **F4 kapanmadan giderilmeli**; mevcut yeşil koşular bunları sınamıyor.

**CX-F4-Ö-01 — Not düzenleyicide bekleyen gönderim yeni taslağı düşürebiliyor. Önem: orta.**

- Kaynak: `src/modules/meetings/components/notes/use-note-edit.ts:44–59`, başarıda düzenleyiciyi koşulsuz kapatan `:22–29`; `MeetingNotes.vue:171–174`.
- Tetikleyici: Kaydet ile PATCH beklerken metni değiştirmek veya Vazgeç ardından başka notu düzenlemek. İlk isteğin başarısı `editing.value=null` yaparak sonradan açılmış/değiştirilmiş taslağı kapatır. Kaydet de kilitlenmediğinden aynı sürümle ikinci PATCH gönderilebilir ve gereksiz 409 uzlaştırması açılabilir.
- Sınıf: İlk isteğin tamamlanması ve onun yerel UI etkisi; ikinci Kaydet ayrıca **yeni yazma kararıdır**. `reachesOwner` yaşayan düzenleyicinin değişmesini denetlemez. E-09-43/K5 düzenleme ve uzlaştırma akışıyla bağlantılıdır; sökülmüş sahip veya izinli kısmi başarı bildirimi kusuru değildir.
- En küçük düzeltme: Düzenleme işlemi boyunca gönderim kilidi kurmak; giriş/Kaydet/Vazgeç davranışını bu kilitle tutarlı yapmak. Düzenleyici değişimine izin verilecekse sonucu başlangıçtaki düzenleme kimliğine bağlamak.
- Doğrulama: PATCH’i beklet → ikinci Kaydet’i dene → tam bir PATCH; bekleme sırasında taslak/değişik not senaryosunda yeni taslak kaybolmamalı. Gerçek 409 seçim akışı da korunmalı.
- Bağımsız varyant taraması: Toplantı oluşturma, gündem ekleme/düzenleme ve görev dönüşümünde pending kapıları mevcut. Work not düzenleyicisi `NoteComposer.vue:57–82` giriş ve eylemleri `busy` ile kilitliyor. Ortak mutasyon katmanı tüketicinin düzenleyici kimliğini korumuyor.

**CX-F4-Ö-02 — Toplantı formunda kabul edilen satır içi sunucu hataları yok. Önem: orta.**

- Kaynak: `src/modules/meetings/components/forms/MeetingForm.vue:134–159,179–196`; `src/shared/ui/confirm/notify.ts:38–57`.
- Tetikleyici: Oluşturma veya düzenlemede sunucunun `fields[]` içeren 422 yanıtı. Sonuç yalnız `notifyOutcome` ile genel bildirime çevriliyor; ilgili alanın hata metni ve erişilebilir hata bağı oluşmuyor.
- Kabul bağı: E-09-68 “sunucu 422 satır içi”, E-09-73 “422/403 kodları → satır içi”; mekanizma §6. İstemci ön doğrulaması sunucunun alan hatasını göstermenin yerine geçmez.
- En küçük düzeltme: Mevcut alan-hata eşleme kalıbıyla izinli `fields[].code` değerlerini ilgili girişlere bağlamak; `aria-invalid`/`aria-describedby` eklemek. Genel hatalar ortak bildirimde kalabilir.
- Doğrulama: Gerçek formda tarih ve başlık alanları için ayrı 422 yanıtları; taslak korunmalı, hata ilgili girişte görünmeli, sunucu `message` metni taşınmamalı. Oluşturma ve PATCH yolları birlikte sınanmalı.

**CX-F4-K-01 — Koordinatörlük seçimi kabul edilen çip yüzünü karşılamıyor. Önem: düşük.**

- Kaynak: `src/modules/meetings/components/forms/MeetingDepartments.vue:12–28`; karşılığı `docs/tasarim/kaynak/Toplanti-Formlar.dc.html:59`.
- Tetikleyici/sonuç: Oluşturma formunda departmanlar açıldığında seçimler native checkbox/radio etiketleri olarak çiziliyor. E-09-70’in kabul ettiği `aria-pressed` çipler yerine ayrı bir yüz kullanılmış; mevcut `aria-pressed` yalnız “Sahip” düğmesine ait.
- Kabul bağı: E-09-70 ve K13. Kaynak çizimi ve W110 `form-dark-390.png` karşılaştırmasıyla görülen farktır; kişisel refactor tercihi değildir. P32’nin türetilmiş özel kişi modalı kararı bu departman kontrolünü değiştirmiyor.
- En küçük düzeltme: Departman seçimlerini kaynak çip görünümü ve seçim semantiğine döndürmek; sayı gizleme, sahip sırası ve K sahip kısıtını korumak.
- Doğrulama: Klavye/seçim/sahip sırası testleri ve iki tema × üç genişlikte üretim görüntüsü.

**Kabul ve önceki borçların değerlendirmesi**

- `v0.15.0-api` pini korunuyor. Backend şema ve meetings README kuralları etiketten `git show` ile okundu. Person CREATE/PATCH sınırları, iki kipin katılımcı yönetimi ve BE-067 aday kapsamı kaynakta ayrılmış.
- Gerçek üst bileşen bağlantıları mevcut. Okuyucuların `sessionBound` ve signal yolları; `submit`/`rerun` dönüşlerinde sahip denetimi; anahtarsız belirsizlikte ortak yeniden okuma ve tekrarın düşürülmesi incelendi. İzinli bileşik kısmi başarı `pushAppNotice` yolu kusur sayılmadı.
- W108 aktarım teklifinde mercek/eskimiş yanıt denetimleri mevcut. W109 bağlı DOM’da seçim/scope temizliği assertion’ları ve gerçek hit-test/scroll/growth sonuçları önceki borçlara anlamlı kanıt sağlıyor.
- W110 modal düzeltmesi kaynakta mevcut; idempotent `deactivate` ve koşullu söküm regresyonları uygun. Son fare ve klavye JSON’larında altı görünümün tamamında iç/dış odak dönüşü başarılı.
- F5 değişiklikleri belge hazırlığında kalıyor; uygulama modülü/rota eklenmemiş. BE-072 engelleyici, ürün soruları geçici kabul olarak korunmuş.

**Belge ve kanıt sınırları**

- Bu turda dosya değiştirmedim; test/build çalıştırmadım, push/PR yapmadım. Hüküm kaynak, test assertion’ları ve kalıcı anonim sonuç/görüntü incelemesidir; bütün dosyaları eksiksiz kapsadığım iddiası yok.
- Ortak Git dizini doğrulandı: `../nizam.io--frontend/.git`. Fixture/state/env/auth dosyaları okunmadı.
- `707fd07` ile incelenen HEAD arasında uygulama/üretim girdilerinde fark yok. Kayıtlı tam kapı **484 dosya / 3259 test**; CI yeşilliği depo kaydına dayanıyor, bu turda uzak CI bağımsız sorgulanmadı.
- Önceki imajın 36 rol/tema/genişlik görünümü ile son imajın altı ŞY görünümü ayrı değerlendirildi. Gerçek HTTP yazmaları, gerçek UI akışları ve MSW entegrasyonları birbirinin yerine sayılmadı. Eksik gerçek UI ve kapsamlı tasarım karşılaştırması kayıtta doğru biçimde açık.
- İncelenen farkta workflow/lint/test yapılandırması gevşetilmemiş; toplantı testlerinde skip veya timeout artırımı görülmedi. Tarihsel kırmızı koşular kayıtlarda korunuyor.
- Gerçek VoiceOver ve E-03C-27/41 kullanıcı görsel kabulü **açık borçtur**. Otomatik doğrulanmış sayılmadı; bunlar için yeni onay akışı gerekmiyor.

F4 kapanış koşulu: **Ö-01, Ö-02 ve K-01’in düzeltme ve ilgili doğrulama kanıtlarıyla kapatılması**, ardından kapanış kaydının gerçek son baş/kapı sonucuna bağlanmasıdır.

### Koordinatör takibi

Koşullar açık: Ö-01 W111, Ö-02/K-01 W112 ayrı işçilerde. F4 kapanmadı. Main `4683af5` üzerinde son tam kapı 484 dosyada3259 test (205,41 sn), typecheck/lint/format/build/gen:check geçti; bu koşulları sınamadığı için nihai kabul yerine geçmez.


### Tur 2 öncesi düzeltme kanıtı

Ö-01 W11143dc571/#99 birleşti (098ecba), tam485/3260; bekletilen PATCH tek gönderim ve yeni taslak korunumu, gerçek409 yolu. Ö-02/K-01 W112bbfde3d: 487dosya3266test, type/lint/format/gen/build geçti; alan422create/PATCH ve ARIA, yerelmesaj, çip/owner/person testleri. Önceki iki eski checkboxseçici hatası gerçekçip seçimine uyarlandı; assertion/timeout gevşetilmedi. W112W111'i içerir; b14eef8→bbfde3d ağaçfarkı0. Her işçinin üretim+Caddy altıgörünümü taşma/CSP/pageerror0; W111menü/editör odağı, W112Enterçipseçimi6/6. Kalıcıkanıtlar `.git/koordinator/web4-w111/results.json`, `web4-w112/results.json` ve PNG'ler. W112CI henüzbekleniyor; bu kayıt ikinci bağımsız hüküm değildir.
