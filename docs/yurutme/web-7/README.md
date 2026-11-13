# WEB-7 — iskelet (F7 AÇILMADI)

**F7 AÇILMADI.** Bu klasör yalnız hazırlıktır; faz, kapsam ve sıra ürün sahibinin açık kararına kadar belirsizdir. Onay otomatik geçti sayılmaz: F7 ancak (1) kullanıcının açık "F7'yi aç" onayıyla, (2) [WEB-6](../web-6/README.md) KAPANDI kaydıyla (W144 gerçek sunucu tanığı, Codex hükmü, kapanış PR MERGED) ve (3) pin yeterliliğinin doğrulanmasıyla açılır. Hiçbir işçi, bu klasöre dayanarak kod, belge PR'ı veya backend isteği başlatmaz.

**Kural (aynen F5/F6 kalıbı):** web yeni faza kendiliğinden geçmez; faz geçişi ürün sahibinin kararıdır. "Backend dursun" (P46) F6 için verilmiş karardır ve F7'ye otomatik taşınmaz; F7 açılırken ayrıca sorulur (backend paketi açılsın mı, hangi sırayla — [rapor-F6 §6](../../backend-eksikleri/rapor-F6.md), [rapor-F5 §1](../../backend-eksikleri/rapor-F5.md)).

## Aday kapsam (karar ister)

Hiçbiri seçilmedi; yol haritası [§4](../../architecture/yol-haritasi-web.md) F7'yi "sohbet + bildirim" (Mesajlar 10/10b/10c), F8'i "asistan" olarak yazar. Tuvale sonradan eklenen ekranlar ve F6'dan devreden satırlar aşağıdadır. Tasarım kaynağı [`../../tasarim/kaynak/`](../../tasarim/README.md) (v85 + v87 rapor dosyaları).

| Aday                                                             | Tasarım artboard / ekran grubu                                                 | Not (kaynak)                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Üye panelleri Ü2–Ü7                                              | `Uye-*` (Görevlerim, Görev pencereleri, Zaman çizelgem, Toplantı detayı, Dosyalarım, Bildirimler ve profil) | F5/F6 kapsamı dışı (P46); Ü1 F6'da uygulandı. Ü7 profil sayfası ile bildirimler birlikte düşünülür                                                                                                          |
| Koordinatör panelleri K2–K8                                      | `Koord-*` (Birimim, Görevler, Görev pencereleri, Ekibim, Zaman çizelgesi ve tarih talepleri, Toplantı detayı, Toplantılar ve pencereler) | K1 F6'da uygulandı; K3 ve K7'de yalnız rapor düğmeleri vardır. `Koord-Gorevler` v85'te kullanıcı tarafından değişti (kayıtlı görünüm segmenti, tarih talebi süzgeci)                                        |
| Bildirimler (zil paneli, Web Push izni)                          | `Bildirimler`                                                                  | Zil sayacı canlı, panel devre dışı (E-00-38, BE-002 vazgeçildi — faz sırası); yol haritası F7                                                                                                              |
| Mesajlar / sohbet                                                | `10-mesajlar` (10, 10b, 10c, A3)                                               | Yol haritası F7; sohbet SSE ve okunmamış rozeti (E-00-21) buna bağlı; menüde gizli                                                                                                                         |
| Asistan paneli                                                   | `Asistan`                                                                      | Yol haritası F8 (F46 paneli, rota kataloğu); menüde gizli (P2)                                                                                                                                             |
| Takvim                                                           | `Takvim`, `Takvim-Hafiza`                                                      | v85 `Sidebar` K/Ü'de "Zaman çizelgesi" yerine Takvim koydu; F6'da menüde gizli, 03c girişi korundu (E-00-46) — **karar ister**: Takvim 03c'nin yerine mi geçer, yanına mı gelir                               |
| Kurumsal hafıza                                                  | `Kurumsal-Hafiza`, `Takvim-Hafiza`                                             | Prototipten import; yol haritasında kalem yok ("sonra"); K14 v1 dışı modül                                                                                                                                 |
| Profil sayfası                                                   | Ü7 (`Uye-Profil`) ve `Sidebar` "Profilim"                          | F6'da oturum kartı rol halkası + "‹rol› · ‹e-posta›", tıklanamaz (E-00-47); profil sayfası olmadan düğme çalışmaz                                                                                          |
| 01b işlem geçmişi                                                | `01b-islem-gecmisi`                                                            | F6 dışı (P46); BE-030/BE-091/BE-010 (audit okuma) backend'siz — "Son işlemler" nötr yer tutucu kalır                                                                                                       |
| Tablolar                                                         | `11-tablolar` (11–11e, A4)                                                     | Backend v0.17'de `tables` modülü var (GAP-224); web pini v0.15 — pin yükseltmesi ayrı karar ([plan](../web-5/pin-yukseltme-plani.md))                                                                      |
| Pin yükseltmesi, F6 borçları                                     | —                                                                              | [F6 borç tablosu](../web-6/ilerleme.md): gerçek cihaz ekran okuyucu, gerçek sunucu e2e, ZIP onayı (BE-120/124), kâğıt ölçüleri, iade gerekçesi (BE-139), BE-122/123/124/125 önceliği                         |

## Ürün sahibine açık sorular

1. F7 hangi kümeyle açılır: yol haritasındaki gibi sohbet + bildirim mi, yoksa rol panelleri (Ü2–Ü7, K2–K8) mi, yoksa ikisi iki ayrı faz mı?
2. Takvim ve Kurumsal hafıza yol haritasına alınacak mı; Takvim 03c'nin yerine mi geçer?
3. Profil sayfası (Ü7) kendi başına küçük bir iş mi, yoksa Bildirimler ile birlikte mi?
4. 01b işlem geçmişi için audit okuma backend paketi (BE-030/BE-091/BE-010) açılsın mı?
5. "Backend dursun" kuralı sürecek mi? Süreceyse F7 kapsamı yalnız mevcut uçlarla sınırlıdır; sürmeyecekse önce [rapor-F6 §6](../../backend-eksikleri/rapor-F6.md) önceliği (BE-122/123/124/125) ve pin yükseltmesi sıralanır.

Bu belge karar vermez; yalnız kararın gerektiği yerleri listeler.

| Dosya                                 | İçerik                                        |
| ------------------------------------- | --------------------------------------------- |
| [ilerleme.md](ilerleme.md)            | Durum: F7 AÇILMADI                            |
