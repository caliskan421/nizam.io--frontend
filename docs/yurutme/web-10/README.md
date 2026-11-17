# WEB-10 — v0.26 P45 arşiv ve silinenler canlıya alma

**F10 kaynak ve bağımsız kabul tamam — 2026-11-17.** Son kaynak5a8a9815, Opus tur2 UYGUN/açıkbulgu0; faz bu kaynağı taşıyan kapanış PR’ının kendi üç CI SUCCESS + MERGED koşuluyla kapanır. **Açılış:** Ürün sahibi: «sen sonraki frontend fazına geç». Yönetici Codex; Sonnet uygulama, Terra bağımsız test/tanık, Opus yalnız salt okunur denetim. F9 kapanışı PR175/main215ae5d9, CI44026445257 üç SUCCESS;863 dosya6328 test ve15 gerçek backend testi başarılı.

## Kapsam ve kaynak

Koordinatörün F10 kapsamı, yayımlı **v0.26.0-api /4d4adc0f** BE-P45 paketinin mevcut ekranlarda tüketilmesidir. Bu paket BE-F8 değildir; backend süreci ürün sahibinde kalır. Başlangıç web pini v0.25.0-api; pin değişimi ayrı kabul edilir. Daha yeni etiket kendiliğinden kapsama girmez.

2026-11-17 kesin P45 ürün kararları backend `.git/koordinator/plan-p45.md` başından ve proje `memory/p45-kararlar.md` kaydından doğrulandı: süresiz saklama; dosya/alt görev/görev notu/toplantı notu/gündem yumuşak silme; görevsiz yükleme yok; başka göreve taşıma; dosya tavanı100; dosya adı+görev başlığı+yükleyen araması. GAP234 birleşik liste dahildir, GAP233 küçük resim/önizleme türevi dışıdır. Eski P45 ertelemesi bu kararlarla aşılmıştır.

Mevcut06/07 arşiv,12 silinen kayıtlar ve work/meetings silme yüzleri kullanılır; yeni sayfa/artboard yok. BE075/076/077/109/110/111/115/163/165 ve BE069/112 ürün kararı kayıtları tek tek tam/kısmi/kalır olarak eşlenecek. Başlangıç163 kayıt=77 bağlı84 açık2 vazgeçildi;24 benzersiz çalışma-zamanı stub kimliği. Yeni BE kimliği gerekirse yalnız koordinatör BE167'den verir.

Dışı: BE-F8'in yayımlanmamış karşılıkları, Tablolar, audit/01b, Takvim/Kurumsal hafıza, Ü/K yeni panelleri, profil, Asistan, GAP233 ve yeni saklama zamanlayıcısı. Rol/sözleşme uydurulmaz; backend/mobil/program depolarına yazılmaz.

## Yürütme

1. O1 W190: etiket farkı, kabul matrisi, sahiplik ve süreç belgeleri (Codex); Sonnet salt okunur uygulama keşfi ve Terra bağımsız risk/test planı.
2. W191: pin v025→v026, üreticiler/hata sözlüğü/etiketler ve atomik zorunlu semantik uyum. Dosya/çocuk silme artık geri alınamaz diye sunulamaz;100 tavanına aykırı metin kalamaz. Yeni işlev/stub kaldırma bu paketten ayrılır.
3. W192: silinenler veri/yaşam döngüsü katmanı, dokuz tür/ebeveyn, birleşik fetcher, batch/purge ve sorgu anahtarları (ortak sahip).
4. W193: mevcut silinenler UI'sında Dosya/Alt görev/Not ve gündem, Tümü gerçek sunucu listesi, satır/panel ve karma seçim; BE163 program kapsamlı purge. W192 ile aynı modül sahibi, ardışık.
5. W194: arşiv başka göreve taşıma ve kapsamlı arama; BE069 görev zorunluluğu ve BE077 güncel üçlü kapsam; records değişen anahtarları W192 SHARED-READY sonrasında devralır.
6. W195: Terra bütünleşik testler ve gerçek backend tanığı; W196: Codex kapanış belgeleri; W197: Sonnet somut denetim düzeltmeleri için rezerv. Opus bağımsız denetim ve Codex PR/CI/kapanış.


P78 hızlı politika sürer: aynı anda en fazla2 işçi, etkilenen yerel testler, tam paket CI'da, tek390/1440 koyu üretim paketi dumanı; gerçek backend CI+ayrı tanık. Pin semantiği değiştiğinden salt tip üretimi güvenli teslim değildir; uyumluluk aynı PR'da testlenir. Her PR kendi üç CI SUCCESS ve kabul sonrası MERGED olur. F10 tamamlandı denmesi ayrıca faz sonu bağımsız hüküm ve gerçek tanık gerektirir.

Yerel F9 Docker ROFS geçmiş sınırlamadır; yeni gerçek tanıktan önce salt okunur ön kontrol yapılır. Ortak Docker restart/prune yoktur; kalan dead kaynaklar F9 doğrulama kaydındadır.

## Belgeler

- [İlerleme ve kararlar](ilerleme.md)
- [Canlıya alma matrisi](canliya-alma-matrisi.md)
- [Uygulayıcı sözleşmesi](ortak-sozlesme.md)


## Kaynak kabul sonucu

Dokuz BE bağlandı (075/076/077/109/110/111/115/163/165), iki kesin P45 kararı vazgeçildi (069/112). Kayıt163=86 bağlı73 açık4 vazgeçildi. Standart testsiz/yorum hariç üretim TS/Vue taraması24 kimlik35 kullanımdan17 kimlik26 kullanıma indi; yeni kimlik/stub eklenmedi. [F10 raporu](../../backend-eksikleri/rapor-F10.md), [bağımsız doğrulama](../../backend-eksikleri/dogrulama-F10.md), [Opus son hükmü](../../reviews/WEB-10-opus.md).

PR176–178 üç CI ile birleşti. PR179 üçSUCCESS olsa da Opus P2 nedeniyle birleşmeden durduruldu; silinenler, arşiv, W197 düzeltmeleri ve W196 kayıtları aynı son pakete alındı. Son paket kendi tam kalite/imaj/gerçek backend CI'ını koşar. Bu koşul gerçekleşince F10 kapanır; [F11 açılmadı](../web-11/README.md).


## Kesin kapanış — 2026-11-17

[PR180](https://github.com/caliskan421/nizam.io--frontend/pull/180) HEADd9346fd6, kendi [CI44082578155](https://github.com/caliskan421/nizam.io--frontend/actions/runs/44082578155) kalite/imaj/gerçek backend üç SUCCESS sonrasında **MERGED**: main984a1a37. Kalite884 dosya6639 test, gerçek E2E15/15. Son paket kabulü ve Opus tur2 UYGUN/açık0 ile F10 kapandı; yukarıdaki gelecek zamanlı son paket koşulları gerçekleşmiştir. F10'a ait çalışma ağaçları/dallar ve sahip olunan Docker kaynakları temizlendi. Kullanıcının sonraki talimatıyla F11 mevcut ekranlardaki hazır eksikler kapsamıyla açıldı; güncel kayıt WEB-11'dir.
