# WEB-10 canlıya alma matrisi — uygulama ve kabul

Yetkili kaynak v0.26.0-api/4d4adc0f. İlk tablo nihai kaynak karşılığıdır; fazın yürürlüğü bağımsız denetim ve kapanış PR’ının kendi üç CI SUCCESS + MERGED koşuluna bağlıdır. Gerçek/sahte/CI kanıt ayrımı [doğrulamada](../../backend-eksikleri/dogrulama-F10.md).

| Satır     | Gelen karşılık / sınır                                                                                                                 | Durum                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| BE075     | moveFile, aynı programda başka göreve taşıma; kaynak tamamlanmış409, hedef yükleme yetkisi ve100 tavanı                                | tam (W194)              |
| BE076     | dosya soft-delete, şirket yöneticisine S2 liste/restore/purge/toplu; silme nesneyi anında yok etmez                                    | tam (W194)              |
| BE077     | search_scope=all; dosya adı+görev başlığı+yükleyen, güncel P45 kararıyla serbest etiket araması vaadi yok; bu alan yeni eksik sayılmaz | tam (W194)              |
| BE109     | alt görev soft-delete/restore/purge; ebeveyn, atanan ve50 tavanı                                                                       | tam (W193)              |
| BE111     | görev notu/toplantı notu/gündem; birleşik Not ve gündem görünümü                                                                       | tam (W193)              |
| BE110     | listDeletedRecords, dokuz tür, sunucu birleşik sırası/imleci; yalnız next_cursor yoksa bitiş                                           | tam (W193)              |
| BE115/163 | purgeAllDepartments scope=program; şirket geneline düşüş yok                                                                           | tam (W193)              |
| BE165     | çöpteki görevin dosyaları arşiv listesi/toplam/ZIP'ten dışlanır; doğrudan indirme farklı sözleşmedir                                   | tam (W194, W195 gerçek PNG/ZIP) |
| BE069     | görevsiz yükleme yapılmayacak(v1); görev seçimi zorunlu                                                                                | vazgeçildi (P45)        |
| BE112     | süresiz saklama; kalan süre/otomatik silme vaadi yok                                                                                   | vazgeçildi (P45)        |

Yeni32 işlem: dosya yaşam döngüsü6+taşıma1, alt görev6, görev notu6, toplantı notu6, gündem6 ve birleşik liste1. DeletedSummary dokuz terim+notes grubu taşır; notes toplamda ikinci kez sayılmaz. Ayrı tür toplu uçları kullanılır; türler arası tek atomik yazma iddiası yoktur.

## Uygulama ve kabul eşlemesi

| W    | Sahiplik / ortak dosya                                                                                     | E ve anlamlı doğrulama                                                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W191 | api-pin/generated, defaults/typed fixtures, errors, silme onayları/tavan metinleri, e2e/deploy tag         | gen:check; özet altı yeni alan; gerçek silme204/tazeleme akışı korunur ve kalıcı iddiası yok; yumuşak silme/100 tavanı                                             |
| W192 | deleted-records API/model, query-keys ve deleted-records sözlüğü tek sahibi                                | dokuz tür/ebeveyn; S2 ve şirket yöneticisi; restore/purge 404/409/422; batch100/purge50, scope/session/owner geç sonuç; renamed; server birleşik imleç             |
| W193 | deleted-records sayfa/bileşen/rota ve entegrasyon; W192'nin ardışık devamı                                 | E12-09 Tümü, E12-11/12/15 yeni türler, E12-21…23 karma batch/CSV; program purge, kısa sayfa+cursor devam, kind+id, bilinmeyen türde yazma yok                      |
| W194 | archive API/model/components, records effect anahtarları devralınır; BE069/075/077/076 eski stub temizliği | E06-59 başka göreve taşı; E06-06/26 sunucu kapsamlı arama; E06-60/64 doğru çöp metni, kaynak/hedef rolleri, kaynak tamamlandı409, hedefte100 sınırı, iptal/renamed |
| W195 | Terra test/tanık; ürün yazmaz                                                                              | arşiv/görev/toplantı/silinenler gerçek bileşen entegrasyonu; gerçek PNG sil/restore/indir; taşıma; dokuz tür ve program purge; BE165 ZIP/liste/sayı dışlama        |

BE077 güncel P45 üç alan aramasıyla bağlandı; serbest etiket araması açık yeni backend eksiği olarak sürdürülmedi. BE069 ve BE112 kesin ürün kararıyla vazgeçildi; görev zorunluluğu ve süresiz saklama korunur. Son kaynakta dokuz bağlandı, iki vazgeçildi; yeni kimlik yok. Kayıt86 bağlı73 açık4 vazgeçildi, runtime stub17 kimlik26 kullanım. Faz, son başlığın kendi üçSUCCESS+MERGED koşulu gerçekleştiğinde kapanır.
