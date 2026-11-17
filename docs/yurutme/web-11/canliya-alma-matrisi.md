# WEB-11 kabul ve sahiplik matrisi

| Kalem | Mevcut yüzey / sözleşme | Karar | Kabul |
| --- | --- | --- | --- |
| BE164 | 12 E-12-36/59 tekil koordinatörlük kalıcı silme; S1 `departmentDeleteImpact` | tam (W199/W201) | Ana davranış kanıtı dab0a05a; son kaynak f7729476: model/API/normal/handoff/error testleri ve gerçekv026 iki program tanığı; Terra son390/1440 run4bc87f39 all11PASS, iptal/engel DELETE0, GET S1 başlıksız, tekDELETE200/CSRF/S2. Uzun başlık/gövde taşması0 |
| Departman restore semantiği | 12 E-12-35/58 tekil/toplu geri yükle; ADR0043 `work_items_restored` | tam (W199/W201) | Gerçek restore200+2 görev toast; yalnız zincirle silinmiş ve hâlâ bağlı programdaki görevler döner; doğru metin, başarı sonucu ve gerekli okuyucular tazelenir |
| Departman toplu/purge kapsam uyarısı | Mevcut toplu ve scope=program çöp boşaltma | tam (W199/W201) | Aday seçimi program, silinen departmanın etkisi şirket geneli; N önizleme yok, kısmi başarı korunur |
| Seçimli S2 ZIP | `programArchiveSelectionZip`, tasarımda program geneli çoklu seçim yok | Bu paket dışı | Hazır uç için yeni seçici/ekran icat edilmez |
| Yeni modüller | audit/Tablolar/profil/Takvim/Asistan/rolpanelleri | Dışı | Menü/rota açılmaz |

Uygulama Sonnet W199; bağımsız test/gerçek tanık Terra W200; kaynak denetimi Opus; belgeler/kayıt/PR-CI Codex. BE164 son durum kapsamı kabul edilen yüzeye göre açıkça raporlanır; 08'de sunulmayan yeni soft-silme akışı yapılmış sayılmaz.


Ana bağımsız kabul: Terra dab0a05a fulltypecheck/build ve6 delta dosyasında43 test PASS; son f7729476 G1/sayaç deltası bağımsız36 test ve gerçek390/1440 run7c5ab117 ile kabul; ilk kaynakta8 dosya70 test ile iki RED dosyasında9 test ayrı/örtüşen kanıtlardır. Gerçek UI/Caddy ve API sınırları doğrulama kaydındadır. Registry BE164 bağlandı;163=87 bağlı72 açık4 vazgeçildi. Faz kapanışı kendi PR üç SUCCESS+MERGED ve son Opus hükmü gerektirir.

G1 satır gerçekten kaybolduğunda seçim/odak temizliği769669d4 ile ve eksik kapsamlı memberships_deleted sayacının başarı toplamından çıkarılmasıf7729476 ile tamamlandı. Ham API/şema değişmez. Geç yenileme scope/session/owner guard’ı kod incelemesidir; ayrıştırıcı runtime yarışı kanıtı yoktur. Son sonuca ilişkin tüm kanıt sınırları doğrulama kaydındadır.
