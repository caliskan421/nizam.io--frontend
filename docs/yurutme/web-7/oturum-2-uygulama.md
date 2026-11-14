# O2 — Sohbet, bildirim paneli ve SSE uygulama planı (uygulandı)

**Durum (2026-11-14): uygulandı.** O2a W154 #141 (`e9b1cce`), O2b W158 #142, W155 #143, W157 #144, W156 #146, W159 #145 (main `5ae9bf8`); hash'ler ve test sayıları [ilerleme](ilerleme.md)'de. Aşağıdaki tablo özgün plandır. O1 (W151–W153) birleşince koordinatör istemleri üretir; her W istemindeki **Tespit** satırı [10-mesajlar](../../ekranlar/10-mesajlar/README.md) ve [14-bildirimler](../../ekranlar/14-bildirimler/README.md) kabul tablolarına bağlanır. Her teslim typecheck/tam lint/format/test/gen/build; UI'da üretim + Caddy CSP + Playwright 390/1024/1440 × iki tema ve dar etkileşim (KESİN 17, 30). W154 başında pin yeterliliği yeniden doğrulanır.

| W | İş / sahiplik sınırı | Tespit |
| --- | --- | --- |
| **W154 O2a** | **Veri katmanı:** `src/shared/sse` (KESİN 34), `modules/chat` api/model/public, `modules/notifications` api/model, `query-keys.ts` (sohbet + bildirim aileleri, geçersizleme ilişkileri KESİN 29), rotalar F7 (`routes.catalog.ts`), `CURRENT_PHASE` F7, menü **Mesajlar** + `MenuBadgeKind 'unread'` (E-00-20/21) | 10-mesajlar backend/mekanizma, 14-bildirimler backend, [00-ortak](../../ekranlar/00-ortak/README.md); P54, P59, P65 |
| **W155** | Sohbet listesi + kabuk (10 liste, grup/birebir, yönetici mercek P64, dar ekran P62) | 10-mesajlar README kabul tablosu |
| **W156** | Konuşma akışı + yazma (10b, mesaj gönderme/okundu, SSE tüketimi, P61 kararları) | 10-mesajlar |
| **W157** | Pencereler + ekler + anket (10c; tepki 4 tür, mesajdan görev `?gorev=`, toplantı planla yönlendirme) | 10-mesajlar |
| **W158** | Bildirim paneli + zil (E-00-38 canlı; P57 satır şablonları, hedef çözümleme §9 K3, statikler) | 14-bildirimler |
| **W159** | **Web Push** (izin akışı, `public/sw.js`, CSP `worker-src 'self'`): **P58 dahil** (ürün sahibi 2026-11-14); son işçi; zaman yetmezse F7 kapanışında "geçici kabul: F8" | 14-bildirimler; P58 |

**Paylaşılan dosyalar** W154'te sözleşmeli (query-keys, i18n ağacı `trChat`/`trNotifications`, `icons.ts`, `shared/sse`); diğerleri yalnız kendi bloğu (KESİN 23–24, 28). Dal zinciriyle uyarlanır (KESİN 25); her W ayrı `web7/<oturum>-<wid>` ve `nizam.io--frontend-wt-<wid>`. Dallar oluşturuldu ve birleşti. Backend paketi açılmadığı için hiçbir W yeni BE kimliği vermez; `YENİ-EKSİK` satırları koordinatöre gider.
