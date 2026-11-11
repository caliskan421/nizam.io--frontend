# S3 — Özel kişi seçici kararı

2026-11-11: Kullanıcı “önerin nedir? arka planda claude opus5.5 ile tartışıp karar ver” diyerek eksik açılmış görünüm kararını koordinatöre devretti. Claude CLI modelUsage kaydı `claude-opus-5-5` olan iki salt okunur değerlendirme alındı; koordinatör karşı görüşleriyle aşağıdaki karar kesinleşti. Yeni ürün onayı beklenmez; normal W105/W106/W107 test ve görsel kapıları zorunludur. F5 yetkisi verilmedi.

## Kaynak ve sınır

Açılmış seçici çizimi bulunmadı. Toplanti-Formlar.dc.html 29–33 satırındaki kullanılmamış rp-invite/rp-invite__row stili (18px checkbox, 24px avatar, ad, durum; 38px satır) ile 52–58 kip düğmeleri ve Toplanti-Detay.dc.html Ekle tetikleyicisi tasarım dili kaynağıdır. Bu yeni yüzey **türetilmiştir**, eski çizim bulundu diye kaydedilmez. Ortak hazır organization/PersonPicker ikame edilmez; UiModal, ortak giriş/düğme ve erişilebilirlik altyapısı içeride kullanılır.

## Görünüm ve davranış

- Tek toplantıya özel modal: arama → gerekiyorsa aday kapsamı uyarısı → checkboxlı düz kişi listesi → seçili sayı/Vazgeç/Uygula. İçeride seçim çipi yığını yok. Satırda yalnız gerçek ad ve avatar; mevcut MeetingCandidate modelinde olmayan ekip/rol uydurulmaz.
- Var olan modal max-width/tokenları; desktop 38px, dar ekranda 44px dokunma hedefi, 24px avatar, 18px checkbox kaynak ölçeği. Ölçüler design/web-tokens.json içinde kendi meeting bloğuna eklenir. 390/1024/1440 ve iki tema test edilir. Tek kaydırma yüzeyi mevcut modal gövdesindedir; kısa ekranda negatif yükseklik veya iç içe kaydırıcı yok. Yeni paket/ham renk yok.
- Başlık formda “Kişi seç”, detayda “Katılımcı ekle”; arama “Ad ile ara”. Arama Türkçe yerel küçük harfle adaylar üzerinde yapılır, ağ isteği başlatmaz. Aramada gizlenen seçimler ve yeniden okuma/kesilme nedeniyle aday listesi dışında kalan başlangıç selectedIds sessizce düşürülmez. Sayı bütün taslak seçimi kapsar.
- Mevcut katılımcı checkbox işaretli/devre dışı ve “Katılımcı” etiketli; yeni ekleme sayısına girmez. Gerekirse caller gerçek meeting.participants adlarını candidates.people kopyasına yalnız kilitli gösterim için birleştirir; bu kişiler seçilebilir aday kapsamını genişletmez.
- Form kipi seçimi yerel saklar, [] uygulamak geçerlidir. Açık “Seçimi temizle” kullanıcı eylemi tüm form seçimini silebilir; otomatik temizleme yok. Detay kipi yalnız seçim eksi lockedIds > 0 iken uygulamaya izin verir.
- Loading, hata+Tekrar dene, “Eklenebilecek kişi yok.” ve “Aramayla eşleşen kişi yok.” ayrıdır. K uyarısı: “Yalnız koordine ettiğin koordinatörlüklerin üyeleri listelenir. Diğer kişiler burada görünmez.” Kesilme: “Liste eksik olabilir; tüm adaylar yüklenemedi.” Tam kapsam/başarı iddiası yok; BE-067 açık kalır.
- Açılınca arama odağı, Tab ile native checkboxlar (Space seçim), Vazgeç/Uygula. Aramada Enter göndermez. Sayı aria-live polite. Esc/✕/Vazgeç taslak seçimi atar, yalnız üst modalı kapatır, açan Ekle/Kişileri seç düğmesine odak döner. İç içe form modalı ortak katman/focus-trap ile korunur; ayrıca gerçek test gerekir.

## Bileşen ve sahiplik

MeetingPersonSelector (W105) ağsız sunum bileşeni: mevcut selectedIds, ek lockedIds (varsayılan []), candidates (MeetingCandidates), loading/error, mode (draft/add). select(ids), close, retry emitleri. Prop adlarının kesin TS biçimini W105/W106 birlikte kilitler ve bağımsız iskelet testini günceller. Ağ okuması caller'da mevcut useMeetingCandidates ile sessionBound+signal kapısından gelir.

W105 MeetingPeople özel seçiciyi açar, sorguyu ve detay ekleme yazmalarını yönetir. MeetingDetailPage'deki geçici selectorUnavailable durumu kaldırılır; W105'e yalnız bu people/add bağlantısını ve ilgili testi düzeltme sahipliği verilmiştir. W103'ün diğer detay/gündem davranışları değişmez. MeetingPeople add bildirimi gerekirse korunur ama parent sahte kullanılamıyor mesajı üretmez.

Detay Uygula: seçilen yeni kişiler sırayla ayrı addMeetingParticipant; ilk eylemin context/sahip/oturum/kapsamı bütün adımlarda korunur. Başarısızlar E46 uyarısında toplanır, ilk başarı korunur. unknown sonucunda dizi durur, kör tekrar yok, ortak yeniden okuma+kısmi sonuç; sökülmüş sahibin ekran etkisi yok. Boş/no-op istek yok.

W106 form aynı selector'u kullanır, select yalnız yerel participant_ids taslağını günceller; create payload tek eylemde gönderilir. selectedIds aynen korunur; taslak özeti gerçek seçim sayısıdır, E72 sahte davet toplamı/oluşturanın otomatik katılması metni hâlâ gizlidir. MeetingForm saved(meetingId) ve initialFocus=date ile mevcut parent sözleşmeleri korunur.

## Pinli sözleşme teyidi

v0.15.0-api openapi CreateMeetingRequest 2064–2095: participant_ids zorunlu değil/minItems yok; form boş seçimi kabul eder. person create tam bir sahip department_ids, members_included true yasak, invite_mode sonradan değişmez; person PATCH department_ids yasak. Rol/kip yetkileri W101 capabilities kaynağından. RosterMember.status active/deleted (778–792), hesap account_status active/disabled ayrıdır (876–879); listUsers silinmiş hesabı döndürmez. Disabled hesabı ayrıca dışlama yok; mevcut aday katmanı korunur.

Katılımcılar düz liste, grup/aç-kapa gizli. Video/sağlayıcı/dosya yok. Yeni backend eksiği oluşturulmaz. W107 gerçek selector/form/detail, rol+partial+truncated, bilinmeyen sonuç, scope/session ve nested modal odak senaryolarını kapsar. Gerçek VoiceOver borcu ayrıca açık; bu kararla otomatik kapanmaz.

## Değerlendirme izi

Kalıcı ham görüşler ana frontend .git/koordinator/web4-s3-opus-result.json ve web4-s3-opus-round2.json; istemler aynı dizinde web4-s3-opus-prompt.md ve web4-s3-opus-round2.md. İlk Orca başlatması no_active_sender_terminal ile görev oluşturmadan reddedildi; başka terminal kimliği kullanılmadı. Gerçek değerlendirme Claude CLI yalnız Read/Glob/Grep araçlarıyla, model claude-opus-5-5 üzerinde yapıldı.
