# Canlıya alma matrisi — stub → v0.25 ucu → ekran satırı

**WEB-9 O1 · W181 · 2026-11-17 · yalnız belge (kod yok).** Taban `main` `a48a3e78`, dal `web9/o1-w181`. Pin bugün `v0.23.0-api`; hedef **`v0.25.0-api`** (P77 + P84: tek pin, v0.24 ve v0.25 karşılıkları F9'dadır). **Kaynak yöntemi:** backend yalnız etiketten okundu (`git show v0.2{3,4,5}.0-api:docs/api/openapi.yaml`, `error-codes.json`, `events.md`, `istemci-akislari.md`, `known-gaps.md`, `internal/modules/{messaging,notifications}/README.md`); `designStub` envanteri koddan (`src/modules/chat/model/stubs.ts`, `src/modules/notifications/model/stubs.ts`, `rg designStub src`). Ayrıntı: [oturum-1-kesif](oturum-1-kesif.md), plan: [pin-yukseltme-v025](pin-yukseltme-v025.md).

Bu belge bir başlatma yetkisi değildir; F9 O2b işçilerinin iş sınırlarını, kabul satırlarını ve çakışma sırasını sabitler. Karar tabanı P77/P84 (ürün sahibi), P78/P79 kullanıcı süreç tercihleri; P80–P83 koordinatör varsayılanı (geçici kabul); P85 yönetim rolü ve P86 mevcut yüzeylerde kapsam uygulaması.

## Okuma kılavuzu

- **Karar:** `tam` = v0.25 etiketinde uç/alan ve kurallar kayıt satırının tüm kapsamını karşılar; `kısmi` = bir bölümü karşılar; `kalır` = karşılığı yok ya da ürün kararıyla kalıcı sınır (stub ve kayıt değişmez). **v0.25 sonrası `kısmi` satır yoktur** (rapor-F8 §6a'nın üç kısmı BE-028/085/156 tamamlandı, aşağıda).
- **Etiket:** karşılığın geldiği ilk etiket (v0.24 = BE-F7, v0.25 = BE-F7b).
- **İşçi:** O2b sahibi; `+` bir BE satırının birden çok W'ye bölündüğünü gösterir (kayıt Durum `bağlandı` yalnız **son** W'de, KESİN 37c).
- **Kapsam başlığı:** S1 = yalnız hesap, S2 = program başlığı, S3 = program + departman başlığı.
- **E-kimlikleri** `docs/ekranlar/{10-mesajlar,14-bildirimler}/README.md` kabul tablolarındadır; README'lerdeki "F9 eki" bölümü bu matrisin ekran yüzüdür (Ek B).

## 1. Özet ve sayılar

### 1.1 Matris satırları (BE kimliği başına)

| Grup | İşçi | tam | kısmi | kalır | toplam |
| --- | --- | --- | --- | --- | --- |
| Sohbet A — liste/okundu/Koordinatörler | W183 | 6 (BE-027†, 081, 082, 086, 160, 162) | 0 | 0 | 6 |
| Sohbet B — akış/bilgi/mesaj bilgisi | W184 | 4 (BE-028, 083, 084, 085) | 0 | 0 | 4 |
| Sohbet C — yazma yüzeyleri | W185b | 3 (BE-029, 080, 161) | 0 | 0 | 3 |
| Bildirimler | W185 | 10 (BE-142, 143, 144, 145, 146, 148, 149, 154, 155, 156) | 0 | 5 (BE-147, 150, 151, 152, 153) | 15 |
| **Toplam** | | **23** | **0** | **5** | **28** |

† BE-027 üç W'ye bölünür (W183 liste, W184 ayar, W185 bildirim zinciri); `bağlandı` yalnız W185 tamamlandığında. Satır sayımında W183'te sayıldı.

**28 satır: 23 tam, 0 kısmi, 5 kalır.** Karşılaştırma: [rapor-F8 §6a](../../backend-eksikleri/rapor-F8.md) (v0.24 eşlemesi, tarihsel kalır): sohbet 13 stub → 7 tam / 2 kısmi / 4 kalır; bildirim 2 stub → 2 canlanır + BE-142/143/145/155 sözlük ve süzgeç. v0.25 ile fark: **BE-027, 029, 080, 160 kalır → tam**; **BE-028, 085, 156 kısmi → tam**; **BE-148, 149, 154 kalır → tam**; BE-147 GAP-246 ile **ürün kararıyla kalıcı**; BE-150…153 kalır (Tablolar / Ü7, F9 DIŞI). §6a'nın doğrulanan kısmı: v0.24 eşlemesi (9 tam + sözlük satırları + 028/085/156 kısmi) etiket gerçeğiyle **birebir doğru**; düzeltme gereken yalnız "F9 = pin v0.24" hedefi (P84) ve "4 kalır" hükmü (v0.25'te kalktı) ile kayıt.md BE-143 Bağ metni (aşağıda §5, Düzeltme D1).

### 1.2 Kodda `designStub` envanteri (doğrulama)

`rg "designStub\('BE-" src` → **31 kimlik** (rapor-F8 §6a ile aynı). F9 ile etkilenen **15** kimlik, kalan 16'sına dokunulmaz (BE-001, 003, 010, 013, 024, 025, 026, 040, 069, 075…079, 123, 131):

| Modül | Stub (`model/stubs.ts`) | BE | Kodda bağlandığı yer (doğrulandı) | F9 sonrası |
| --- | --- | --- | --- | --- |
| chat | `mute` | 027 | `GroupInfoDialog.vue:90` | kalkar |
| chat | `whoRead` | 028 | `MessageMenu.vue:57` | kalkar |
| chat | `archiveSave` | 029 | (yalnız tanım; ShareFileDialog "Görev arşivine de kaydet" devre dışı, bileşende `CHAT_STUBS` yok) | kalkar |
| chat | `forward` | 080 | `MessageMenu.vue:43` | kalkar |
| chat | `filters` | 081 | tanım (süzgeç istemcide: `ChatFilterTabs.vue`, `chat-view.ts`) | kalkar |
| chat | `ownReadSeq` | 082 | tanım (ayırıcı `unread_count` türetimi: `use-unread-anchor.ts`, `unread.ts`) | kalkar |
| chat | `roleBadge` | 083 | tanım (rozet gizli) | kalkar |
| chat | `sharedCounts` | 084 | tanım (`GroupRefsTab.vue` sayaçsız) | kalkar |
| chat | `taskCard` | 085 | tanım (`TaskChip.vue`/`MessageRow.vue` `task_ids`) | kalkar |
| chat | `lastMessageKind` | 086 | tanım (`ChatRow.vue`/`chat-view.ts` "Dosya" yedeği) | kalkar |
| chat | `coordinatorsGroup` | 160 | tanım | kalkar |
| chat | `anonymousPoll` | 161 | `PollDialog.vue:57` | kalkar |
| chat | `quoteSeq` | 162 | tanım (`QuoteBlock.vue`, `MessageRow.vue` en çok 3 `before` sayfası arama) | kalkar |
| notifications | `AWAITING_TAB` | 144 | `NotificationPanel.vue:66` | kalkar |
| notifications | `INLINE_DECISION` | 146 | `NotificationRow.vue:77` (+`<DesignStub id="BE-146">`) | kalkar |

**Önemli bulgu (W183/W184 işi):** 13 sohbet stub'ından yalnız 4'ü (`mute`, `forward`, `whoRead`, `anonymousPoll`) bileşende tüketilir; kalan 9'u **tanım** olarak durur ve ekranda davranış istemci türetimiyle ya da "yok" olarak kodlanmıştır (istemci süzgeci, `unread_count`'tan ayırıcı, "Dosya" yedeği, en çok 3 `before` sayfası arama). Bu yüzden her satırda **stub + geçici yol birlikte** kaldırılır (KESİN 35a; ölü kod yok) ve "eski yol yok" testi şarttır (KESİN 37f). BE-142/143/145/155/148/149/154/156 için **stub yoktur** (kayıt satırları var, kod genel cümle/istemci türetimi kullanıyor): bunlarda "stub kaldırma" yerine **geçici yolun** (tür → genel cümle, istemci süzgeç, hedef çözümleme P55 kalıbı, "Daha eski bildirimler" etiketi) kaldırılması kabul ölçütüdür.

Sonuç: F9 sonunda `designStub` **31 → 16** (sohbet 13 + bildirim 2 = 15 kalkar). Kayıt Durum `bağlandı` **23 satır**; `tests/lint` `design-stub.test.ts` kodda `bağlandı` kimlik bırakmaz.

## 2. Matris

Sütunlar: BE · E-kimlikleri (README) · v0.25 karşılığı (etiket) · karar · işçi · web yüzeyi/dosya (başlangıç; işçi doğrular) · kabul (gerçek uç testi + eski yol yok).

### 2.1 Sohbet A — W183 (liste, okundu, Koordinatörler, sessize al liste yüzü)

| BE | E-kimlikleri | v0.25 karşılığı | Karar | Yüzey / dosyalar | Kabul |
| --- | --- | --- | --- | --- | --- |
| BE-081 | E-10-06, E-10-07 | **v0.24** `listChats` `kind=direct\|group`, `unread=true`, yanıt `total` (süzülü küme sayısı; geçersiz değer 422 `messaging.input_invalid`) | tam | `ChatFilterTabs.vue`, `chat-view.ts`, `use-chat-search.ts`, `api/queries.ts`, `api/fetchers.ts`; sekme sayacı `total`; "yüklenen konuşmalar içinde" etiketi kalkar | sunucu süzgeci + `total` sekme sayısı (süzülü sayfalama); istemci süzgeci yok testi; E-10-07 `unread_chats` (program özeti) değişmez |
| BE-082 | E-10-17, E-10-25 | **v0.24** `read_seq`, `first_unread_seq` (`listChats` satırı + `listChatMessages`), birebirde `peer_read_seq` (listede) | tam | `use-unread-anchor.ts`, `unread.ts`, `ChatRow.vue` (liste tiki), `ConversationPane`; sohbet `around=<first_unread_seq>` ile açılır, ayırıcı o mesajın önüne; **`read_seq`'ten ayırıcı türetmek yasak** (KESİN 37f) | ayırıcı konumu tanığı (kendi mesajı/üyelik başlangıcı sunucu kuralı); liste tiki; `unread_count` türetimi yok testi |
| BE-086 | E-10-12 | **v0.24** `ChatLastMessage.kind` (`text`/`attachment`/`poll`), `attachment_count` | tam | `ChatRow.vue`, `chat-view.ts` ("Dosya"/"Anket" önizleme `kind`'dan; boş `body` sezgisi kalkar) | gerçek yanıt şekliyle sahte sunucu; "body boşsa Dosya" yolu yok |
| BE-162 | E-10-29 | **v0.24** `ChatMessageQuote.seq` | tam | `QuoteBlock.vue`, `MessageRow.vue`, `window-io.ts`: yalnız `listChatMessages?around=<reply_to.seq>`; "en çok 3 `before` sayfası arama" kalkar | pencere dışı alıntıya atlama; silinmiş alıntı davranışı değişmez; eski arama yolu yok |
| BE-160 | E-10-09, E-10-79 | **v0.25** `Chat.source`/`auto_kind` = `coordinators` (program başına "Koordinatörler" grubu; üyeler = koordinatörler + şirket yöneticisi; istemci seçemez; silinemez 409 `messaging.auto_group_protected`, ADR-0051) | tam | `ChatRow` avatarı "K" (yeni artboard yok: tasarım v85 çizili, E-10-09/E-10-79), bilgi kutusu; K-1 geri düşüş (bilinmeyen değer `none` gibi) korunur | Koordinatörler grubu listede + avatar + bilgi kutusu; grup silme/kaynak değiştirme eylemleri gizli (409'a güvenilmez, KESİN 6) |
| BE-027 (liste yüzü) | E-10-07, E-10-16 | **v0.25** `Chat.notify_level` (`all`/`mentions`/`none`; yalnız `getChat` ve liste satırı; yoksa `all`); `setChatNotificationLevel` | tam (+W184) | `ChatRow.vue` sessiz rozeti (`notify_level === 'none'`), liste satırı yan etkileri; **sayaç davranışı** K46/K54 uyarınca bildirim seviyesinden bağımsızdır; sayı sunucu cevabından aynen alınır (A4 çözüldü) | E-10-16 rozeti `notify_level`'dan; `muted` alanı uydurulmaz |

### 2.2 Sohbet B — W184 (akış, bilgi, mesaj bilgisi, görev kartı)

| BE | E-kimlikleri | v0.25 karşılığı | Karar | Yüzey / dosyalar | Kabul |
| --- | --- | --- | --- | --- | --- |
| BE-083 | E-10-28, E-10-69 | **v0.24** `ChatMessage.sender_role` (geçmiş+sabitler; `ChatProgramRole{role: company_admin\|coordinator\|member\|none, department_ids}`), `ChatMember.program_role` | tam | `MessageRow.vue`/`MessageMeta.vue` rozet, `GroupMembersTab.vue` alt yazı ("<Rol> · <Koordinatörlük>"; departman adı programın departman listesinden çözülür: `listProgramDepartments`, `department-code.ts`); rozet gösterimdir, eylem kararı için kullanılmaz (K1) | rozet tanığı; programdan çıkmış `none`; grup rolü ile karışmaz |
| BE-084 | E-10-68 | **v0.24** `getChatSharedCounts` (`files`/`attachments`/`tasks`/`polls`/`departments`), `listChatAttachments`, `listChatTaskLinks` (imleçli, `seq DESC`) | tam | `GroupInfoDialog.vue` sekme sayaçları, `GroupRefsTab.vue` (Dosyalar = arşivden paylaşılanlar + cihaz ekleri iki ayrı liste; Görevler = paylaşılan görev ref + mesajdan açılan görevler), `api/queries.ts`; sayaç `message.created/deleted` olayında yeniden okunur (KESİN 34) | sayaç = liste toplamı; "n+" işareti yok |
| BE-085 | E-10-91, E-10-92 | **v0.24** `listChatMessageTasks` (`available`/`forbidden`/`deleted`; `task{title,status,code,sequence_no,department_id}`); **v0.25** ters bağ `getWorkItemSourceMessage` (S3) | tam (sohbet yönü) | `TaskChip.vue`, `MessageRow.vue`, `TaskFromMessageDialog.vue`: tek istek mesajın görevlerini çözer; `forbidden` → "görevi görme yetkiniz yok", `deleted` → "görev silinmiş"; `message.updated` sonrası yeniden okunur. **Ters bağ W184 kapsamındadır (P86): mevcut görev detayında ortak bağlantı bileşeniyle "Kaynak mesaja git"; `source_message:null` ise gösterilmez. S3 yetkisi/kapsamı korunur, bağlantı doğru program/sohbet ve `around=seq` ile açılır; yeni ekran yapılmaz.** | kart kodu/`sequence_no`; yetki maskesi; `task_ids` + `getWorkItem` yolu (eski) yok |
| BE-028 | E-10-37, E-10-44, E-10-72…75 | **v0.24** `listChatMessageReceipts` (`read`/`unread`/`truncated`; yalnız gönderen: başkasının mesajında 403); **v0.25** `ChatMessage.read_by_all` (grup tiki; yalnız çağıranın kendi grup mesajı; `true`/`false`/`null`=bilinmiyor >200 üye; birebirde `peer_read_seq`) | tam | `MessageMenu.vue` "Mesaj bilgisi" (yalnız kendi mesajında), `MessageInfoDialog.vue`, `MessageMeta.vue` (grup tiki `read_by_all`; `null` → tik çizilmez); `last_read_at` "bu mesajı okuma anı" diye **gösterilmez**; `read.updated` olayında geçmiş yenilenir | receipts tanığı; grup tiki 3 durum; eski "grupta tik yok" yolu yok |
| BE-027 (ayar yüzü) | E-10-65, E-10-70 | **v0.25** `setChatNotificationLevel` PUT `{level}`; S2, CSRF; "Sessize al" = `none`, "Yalnız @bahsedilince bildir" = `mentions` | tam (W183/W185 ile) → **W184 kaydı kapatmaz; `bağlandı` W185 tamamlandığında** | `GroupInfoDialog.vue` (`CHAT_STUBS.mute` kalkar), yazma `useProtectedMutation`; yanıt `ChatNotificationLevel`; `getChat`/liste yeniden okunur | gerçek uç yazma testi; `CHAT_STUBS` yok |

### 2.3 Sohbet C — W185b (yazma yüzeyleri; **ek işçi önerisi**)

| BE | E-kimlikleri | v0.25 karşılığı | Karar | Yüzey / dosyalar | Kabul |
| --- | --- | --- | --- | --- | --- |
| BE-080 | E-10-42, E-10-81…85 | **v0.25** `forwardChatMessage` (`Idempotency-Key`; `targets` 1–10 benzersiz hedef sohbet, isteğe bağlı `note`; **hepsi ya da hiçbiri**: biri reddedilirse 404/422, hiçbiri yazılmaz; sonuç `items[{chat_id,message_id}]`; bahsetme/yanıt bağı taşınmaz; ek bayt kopyası; `forwarded_from{message_id}`) | tam | yeni `ForwardDialog.vue` (yeni ekran değil: 10c "Mesajı ilet" penceresi E-10-81 çizili), hedef seçici `listChats`; `MessageMenu.vue` "İlet" (`forward` stub kalkar; **W184 dalından**); mesajda "İletildi" etiketi yalnız `forwarded_from != null` (kaynak sohbet/gönderen gösterilmez) | `Idempotency-Key` yaşam döngüsü (KESİN 8): tek eylem tek anahtar; anket mesajında İlet gizli; anket 422 `message_id` ve görünmeyen ref 422 `refs` negatifleri; tek hata gösterimi; E-10-84 yetki notu; eski "metni yeniden gönder" yolu yok |
| BE-029 | E-10-103…105 | **v0.25** `archiveChatFile` (multipart; metin alanları `file`'dan **önce**; `Idempotency-Key`; 201/200; görev seçici sohbetin programındaki görevlerden; sohbete `file` referanslı mesaj düşer; yarım iş aynı anahtarla tamamlanır — GAP-248 kabul edilmiş sınır) | tam | `ShareFileDialog.vue` "Görev arşivine de kaydet" + görev seçici + etiket (`CHAT_STUBS.archiveSave` kalkar); yönetici yükleme kuralı (ADR-0030) sunucuda | gerçek uç testi; arşivleme boyunca anahtar sabit; hata sonrası aynı anahtarla yeniden deneme; "iki adımlı attachFile → sendChatMessage.refs" yolu yok |
| BE-161 | E-10-35, E-10-97, E-10-99 | **v0.24** `SendChatMessageRequest.poll.anonymous` (varsayılan `false`; açılışta verilir, değişmez; farklı anonimlik aynı anahtarla 409 `messaging.idempotency_key_reused`), `poll.anonymous`, `results[].mine`; anonimde `voters` herkese `[]` (MESSAGING-K53) | tam | `PollDialog.vue` ("Oylar: Anonim" segmenti etkin, anonim notu E-10-99; `CHAT_STUBS.anonymousPoll` kalkar), `PollCard.vue` (kendi oy `mine`'dan; `voters`'tan aranmaz) | anonimde sızıntı yok testi (3 rol × geçmiş/sabitler/tekrar cevabı); isimli ankette davranış aynı |

### 2.4 Bildirimler — W185

| BE | E-kimlikleri | v0.25 karşılığı | Karar | Yüzey / dosyalar | Kabul |
| --- | --- | --- | --- | --- | --- |
| BE-142 | E-14-27, E-14-28, E-14-75 | **v0.24** `Notification.actor{account_id,full_name}`, `subject{state,title,code,sequence_no,person}`, `detail` (kapalı kodlar; ADR-0048): satır sözlükten kurulur; **v0.25** yeni türler: `messaging.message.mentioned`/`.sent`, `collaboration.meeting.reminder`/`.rescheduled`, `work.digest.daily`; `detail` yeni alanlar (`message_id`, `seq`, `chat_kind`, `lead_minutes`, `meeting_date`, `meeting_date_from/to`, `overdue_count`, `due_soon_count`, `day`) | tam | `notifications/model/dictionary.ts` (13 → **18 tür**), `NotificationRow.vue`, `panel-time.ts`, `public/sw.js` kopyası (push metinsiz: tür+konu+bildirim kimliği; ADR-0009) ve eşleşme testi, i18n `notifications` ağacı | tür × durum (`available`/`forbidden`/`deleted`/`unknown`) cümle tanığı; `unknown` geçici; bilinmeyen tür/alan genel satıra düşer; `actor` konu maskesinden bağımsız |
| BE-143 | E-14-42…46, E-14-76, E-14-89 | **v0.24** `Notification.program_id`, `department_id` (üst düzey, **`action` içinde değil**), `subject_ref`; **v0.25** `subject_ref.kind = chat` (`/mesajlar/:chatId?mesaj=<seq>`, program `program_id`; `detail.seq` ilk okunmamışa ipucu) ve `program` (günlük özet) | tam | `notifications/model/target.ts`, `bell-target.ts` (P55 soğuk bağlantı: liste dışı görev çözülebilir; başka programın kaydı programa geçiş/"bulunamadı"), sohbet bildirimi hedefi `routes.catalog.ts` | soğuk bağlantı testi; `membership` kimliği; sohbet hedefi program değiştirir |
| BE-144 | E-14-03…05, E-14-14, E-14-21, E-14-37 | **v0.24** `awaiting` süzgeci, `NotificationList.awaiting_count`, `unread-count.awaiting_count`; `action.state` `pending`/`resolved` | tam | `NotificationPanel.vue` ("Senden bekleyen" sekmesi etkin; `AWAITING_TAB` kalkar), `TopbarBell`, `api/queries.ts`; zil sayısı (`count` = okunmamış **grup**) ve "Senden bekleyen" (`awaiting_count`) **ayrı iki sayı** | sayaç ayrımı; `awaiting` sayfası `limit`'ten kısa dönebilir (devam `next_cursor`) |
| BE-145 | E-14-16 | **v0.24** `unread_only`, `type` (tekrarlı ≤20), `awaiting`; geçersiz değer 422 `notifications.input_invalid`; imleç süzgeçler arasında taşınır | tam | `use-notification-panel.ts`, `api/queries.ts`; "Okunmamış" sekmesi sunucu süzgeci (istemci süzgeci kalkar) | süzülmüş sayfa boşsa imleç sürer testi |
| BE-146 | E-14-35…41 | **v0.24** `action{kind: review_date_request\|approve_task, request_id, state, resolution{outcome,decided_by,decided_at}}` (yalnız bugün karar verebilene gelir); karar mevcut uçlarla: `reviewDateChangeRequest` (`action.request_id`), görev geçişi (`subject_ref.id`; `tamamlandi`/`iade_edildi`; S3 başlıkları `program_id`+`department_id`) | tam | `NotificationRow.vue` ("Onayla/Reddet" satır içi; `INLINE_DECISION` + `<DesignStub BE-146>` kalkar), "başkası karar verdi" (`resolved` + `decided_by` ≠ ben); karar sonrası liste + iki sayaç tazelenir (KESİN 29) | 3 rol yetki; `approve_task` iade gerekçesi penceresi (K1 `RevertReasonDialog`) yeniden kullanılır, yeni pencere çizilmez |
| BE-155 | E-14-46, E-14-52 | **v0.24** `subject.state` (`available`/`deleted`/`forbidden`/`unknown`); başlık `available` değilse `null` | tam | `NotificationRow.vue`, sözlük "bir görev / silinmiş görev" genel cümlesi, satır konuya bağlanmaz | `forbidden` konuda başlık sızıntısı yok |
| BE-148 | E-14-56 | **v0.25** NOTIFICATIONS-K45 birleştirme: `Notification.group{count,actors[≤5],first_created_at}` (tek kayıtta `null`); satır grubun en yeni kaydı; zil/`unread_count` **grup sayısı**; okundu ve kaldır grubun tamamına; bahsetme birleşmez | tam | `NotificationRow.vue` yığın avatar (istemci çizer) + "Ayşe ve 2 kişi …" cümlesi sözlükte, `use-panel-writes.ts` (okundu/kaldır grup) | grup cümlesi; avatar ≤5; okundu grubun hepsini düşürür (sayaç tanığı) |
| BE-149 | E-14-38, E-14-49, E-14-50, E-14-63 | **v0.25** zamanlı/değişiklik olayları: `collaboration.meeting.reminder` (`meeting_date`, `lead_minutes`), `collaboration.meeting.rescheduled` (`meeting_date_from/to`), `work.digest.daily` (`overdue_count`, `due_soon_count`, `day`; `subject_ref.kind=program`); geç hatırlatma yok (GAP-249 kabul edilmiş sınır) | tam | sözlük (BE-142 ile aynı dosya), "Gündemi aç" (toplantı satırı, E-14-38), özet satırı hedefi (`program`) | sürücü tür × `detail` tanığı; "Toplantıdan 30 dk önce" gerçek `lead_minutes` ile; saat farkı `meeting_date`'ten |
| BE-154 | E-14-17, E-14-57, E-14-96 | **v0.25** NOTIFICATIONS-K47: hesap başına en yeni **200 grup** saklanır (bekleyen karar satırları hariç tutulur, silinmez); "30 gün" iddiası **yok** | tam | "Daha eski bildirimler" etiketi sade (sayı/süre yazılmaz), saklama metni `E-14-57` süresiz iddia taşımaz; kayıt Bağ: tasarımdaki "30 gün" metni **uygulanmaz** (backend karar: adet) | metin testi: "30 gün" yok |
| BE-156 | E-14-31, E-14-33, E-14-34 | **v0.24** `dismissNotification` DELETE (204, kalıcı; grubuyla); **v0.25** `muteNotificationSubject`/`unmuteNotificationSubject` PUT/DELETE `/v1/notifications/subject-mutes/{kind}/{id}` (`kind` yalnız `work_item`/`meeting`; idempotent 204), `Notification.muted`; sessize alınan konunun yeni olayı kayıt/push üretmez, karar bekleyen eylem satırları yine gelir | tam | `NotificationRow.vue` hover şeridi ("Bu görevi/toplantıyı sessize al" `muted`'a göre aç/kapa; "Kaldır"); **W185 mevcut bildirim panelinde "Sessize alınan konular" alt görünümünü ortak liste bileşenleriyle ekler (P86); imleçli `listNotificationSubjectMutes` ve satırda `unmuteNotificationSubject`; yeni ayarlar/profil sayfası yapılmaz** | mute/unmute idempotent; listede limit 1–100 ve imleç; 500 konu tavanında 422 `subject_id` işlenir; `kind` ≠ `work_item`/`meeting` satırında düğme gizli; kaldır sonrası iki sayaç |
| BE-147 | E-14-40 | **yok** — GAP-246 **kabul edilmiş sınır** (ürün kararı 2026-11-16; kalıcı: karar geri alınmaz) | kalır | "Onayladın · Geri al" **çizilmez** (kayıt "Şimdilik" ile aynı) | stub/kodda değişiklik yok |
| BE-150 | E-14-39, E-14-51 | yok (Tablolar bildirim olayları; `tables.*` olay türü yok) | kalır | çizilmez | — |
| BE-151 | E-14-12, E-14-71, E-14-93, E-14-98 | `get/updateNotificationPreferences` (hesap × grup `push_muted`) v0.19'dan beri var; olay × kanal matrisi ve e-posta yok | kalır (**F9 DIŞI: Ü7 profil**) | dokunulmaz | — |
| BE-152 | E-14-59, E-14-67, E-14-80…82, E-14-95 | `registerDeviceToken` var; `listPushTargets`/"deneme gönder" yok | kalır (F9 DIŞI) | dokunulmaz | — |
| BE-153 | E-14-06, E-14-94 | sessiz saat tercihi yok | kalır (F9 DIŞI) | dokunulmaz | — |

## 3. Sohbet bildirimi (BE-027/142/143 ortak, W185; kayıt satırı yok)

v0.25'in en büyük davranış farkı: **her canlı sohbet mesajı bildirim üretir** (ADR-0050; `messaging.message.posted` aile kaydı → alıcıları çözer → `messaging.message.mentioned` ("seni andı") ve `messaging.message.sent` ("yeni mesaj") bildirim türleri; bahsetme birleşmez; push metinsizdir, grup `mesaj`; sohbet başına `notify_level` alıcı çözümüne girer). Web'de [E-14-90 "Sohbet bildirim üretmez"](../../ekranlar/14-bildirimler/README.md) ve 10c "sessize al" ret satırları **kalkar**; "Sohbet ile ilişki" (14 §h) F9 eki ile güncellenir. İstemci kuralları: (a) sohbet bildirimi **istemcide ayrıca okundu işaretlenmez**: `markChatRead`/`markAllChatsRead` sunucuda ilgili sohbet bildirimlerini kapatır, sonra zil + liste tazelenir (`query-keys.ts` ilişkisi: chat okundu → notifications list/unread-count; **W185 ilişki sahibi**; mevcut `thread/use-read-marker.ts` çağrısı korunur, merkezi geçersizleme otomatik çalışır); (b) satır tıklanınca `/mesajlar/:chatId?mesaj=<seq>` (program `program_id`); (c) mesaj metni hiçbir bildirimde yoktur; (d) bildirimde SSE yok (KESİN 34).

## 4. İşçi başına dosya kesişimi ve önerilen zincir

| W | Sahip olduğu dosya kümesi (başlangıç) | Yumuşak zincir |
| --- | --- | --- |
| W182 | `api-pin.json`, `src/shared/api/**` (üretilmiş + `__tests__/defaults.ts`), modül harness'leri, `e2e/backend/up.sh`, deploy etiketi | — (O2a; birleşmeden O2b başlamaz) |
| W183 | `chat/components/list/**` (`ChatRow`, `ChatFilterTabs`, `chat-view`, `use-chat-search`), `chat/api/queries.ts`+`fetchers.ts` (liste), `chat/model/unread.ts`, `thread/use-unread-anchor.ts`, `thread/QuoteBlock.vue`, `chat/model/window-io.ts`; `chat/model/stubs.ts` (kendi stub'larını siler) | W184 ile **paralel**; ortak: `chat/api/queries.ts` (W183 liste, W184 paylaşılanlar → KESİN 23: ilk işçi W183 dosyayı yeniden düzenlemez, W184 yalnız kendi sorgu anahtarlarını ekler) |
| W184 | `thread/{MessageRow,MessageMeta,TaskChip,MessageMenu}.vue`, `dialogs/{GroupInfoDialog,GroupMembersTab,GroupRefsTab,MessageInfoDialog,TaskFromMessageDialog}.vue`, `chat/model/stubs.ts` (kendi satırları); `src/modules/work/components/detail/SourceMessageLink.vue` (+test, yeni ortak bağlantı tüketicisi), `WorkDetailPanel.vue` (`SourceMessageLink` bağlama noktası, görev kimliği/department_id/program kapsamı), `src/modules/work/api/queries.ts` (S3 `getWorkItemSourceMessage`), `src/modules/work/public.ts` (yalnız modül sınırı gerektirirse export) | W183 ile paralel. **`MessageMenu.vue` ve `GroupInfoDialog.vue` yalnız W184'ün** |
| W185b | yeni `dialogs/ForwardDialog.vue`, `dialogs/{ShareFileDialog,PollDialog}.vue`, `thread/PollCard.vue`, `chat/api/writes.ts`, `chat/api/attachments.ts` | **W184 dalından** (`MessageMenu.vue` "İlet" bağlama noktası KESİN 28: W184 `onForward` emit + menü öğesini etkinleştirmeden **bırakır**, W185b diyaloğu bağlar) |
| W185 | `notifications/**` (`NotificationRow`, `NotificationPanel`, `use-notification-panel`, `use-panel-writes`, `model/{dictionary,target}`, `api/*`), `public/sw.js`, `app/shell/topbar/**`, `src/shared/http/query-keys.ts` (chat↔notifications ilişki satırı), `routes.catalog.ts` (yalnız hedef) | W185b ile **paralel**; `chat/api/writes.ts` (markChatRead) W185b'nin: W185 yalnız `query-keys.ts` ilişkisini yazar, `thread/use-read-marker.ts` çağrısı ve mevcut mutation katmanı ilişkiyi otomatik uygular; W185b bu çağrıyı yeniden yazmaz |
| W186 | `src/app/__tests__/integration/{chat,notifications}-*`, `e2e/{chat,notifications}.spec.ts` | tümü main'de |

i18n tek ağaç kalıbı (KESİN 24): `trChat`/`trNotifications` ağaçlarına her W yalnız kendi alt dalını ekler; paylaşılan dosyayı (`chat/messages.ts`, `notifications/messages.ts`) **ilk dokunan W** oluşturmaz, W183/W185 ağaçları açar, W184/W185b dallarını ekler (KESİN 23).

## 5. Düzeltmeler (rapor-F8 §6a ve kayıt metinleri ↔ etiket gerçeği)

| # | Düzeltme | Neden |
| --- | --- | --- |
| D1 | kayıt.md BE-143 Bağ metni "`Notification.action` içinde `program_id`/`department_id`" yanlış: **`Notification.program_id`/`department_id` üst düzey alandır**; `action` yalnız `{kind, request_id, state, resolution}` taşır | `Notification` ve `NotificationAction` şemaları (v0.24/v0.25) |
| D2 | "F9 = pin v0.24 (rapor-F8 §6a, README iskeleti)" → **pin v0.25, tek PR (P84)** | kullanıcı kararı; v0.25 etiketi v0.24'ün kalanlarını karşıladı |
| D3 | rapor-F8 §6a "4 kalır (027, 029, 080, 160)" ve "kısmi 028/085/156" → **hepsi `tam` (v0.25)**; BE-147 GAP-246 ile kalıcı; BE-148/149/154 `tam` | `known-gaps` GAP-242/243/244/245/247 `kapandı`; v0.25 uçları/alanları |
| D4 | rapor-F8 §6a "`streamChatEvents`'e olay eklenmedi; `events.md` yalnız bildirim eylemi" doğru **v0.24 için**; v0.25: `events.md`'ye 6 yeni olay (zamanlı + sohbet) eklendi, **SSE olayı değişmedi** (yalnız bildirim zinciri) | `events.md` v0.24→v0.25; KESİN 34 |
| D5 | rapor-F8 §6a "Sohbet bildirim üretmez / sessize alma yok" (E-14-90, E-10-16/65/70) → artık yanlış | ADR-0050 |
| D6 | tasarım "bildirimler 30 gün tutulur" (E-14-57/96) ≠ backend karar `count:200` | NOTIFICATIONS-K47; GAP-247; metin sade |
| D7 | W177 keşfi "`chat` modül README" yolu: modül adı **`messaging`** (`internal/modules/messaging/README.md`) | `git ls-tree v0.25.0-api internal/modules/` |

**rapor-F8 tarihsel kalır** (düzenlenmez); bu matris ve [kayit.md](../../backend-eksikleri/kayit.md) Bağ notları güncel hükümdür. F9 kapanışında `rapor-F9.md §6a` düzeltilmiş tabloyu taşır.

## 6. Varsayımlar ve karar bekleyenler

**Varsayımlar (koordinatör onayı gerekir; numaralı):**

- **A1** Tek pin v0.23→v0.25 (P84); ara v0.24 PR'ı yok; v0.24 yalnız tarihsel (ürün sahibi kararı, P84).
- **A2** `v1.0.0-rc.1` pin hedefi değildir (P80 ile aynı).
- **A3** Yeni sayfa/artboard yok (P77/P84). P86 kapsamında mevcut görev detayı ve bildirim paneline ortak bileşenlerle gerekli bağlantı/liste eklenir.
- **A4 (kontratla kapandı)** K46/K54: `setChatNotificationLevel` yalnız yeni mesajların bildirimini etkiler; okunmamış sohbet ve mesaj sayaçları seviyeden bağımsızdır. Sunucu sayacı aynen kullanılır; istemci sessiz sohbeti sayaçtan çıkarmaz.
- **A5 (P86 ile çözüldü)** W184 `getWorkItemSourceMessage` ile mevcut görev detayında "Kaynak mesaja git" bağlantısını kurar; null/görünmez kaynakta bağlantı yok. Program/sohbet/seq hedefi ve kapsam değişiminde geç yanıt iptali test edilir. BE-085 iki yön tamamlanmadan kapatılmaz.
- **A6 (P86 ile çözüldü)** W185 mevcut bildirim panelinde ortak liste/geri bileşenleriyle "Sessize alınan konular" alt görünümünü kurar; `listNotificationSubjectMutes` imleçli okunur, `unmuteNotificationSubject` sonrası liste ve panel yenilenir. Ayrı profil/ayar sayfası yok; BE-156 bu yüzey tamamlanmadan kapatılmaz.
- **A7** BE-154: tasarım "30 gün" metni uygulanmaz; backend adet tavanı (200 grup) esas (D6).
- **A8** BE-149 "Gündemi aç" davranışı mevcut toplantı rotasını açar (yeni rota yok).
- **A9** Model düzeni (2026-11-17): işçi Sonnet, test Terra, denetçi Opus; Codex koordinasyon; P79 yerine geçer.
- **A10** Yeni BE kimliği gerekmedi; son BE-166. A4 kontratla cevaplandığından BE-167 adayı değildir.

**SAHİPLİK-DIŞI İHTİYAÇ:** yok (bu W'nin sahibi docs/yurutme/web-9, ekran README F9 ekleri, kayıt Bağ, ortak-kurallar §12, yol haritası §4).

## Ek B. Ekran README F9 ekleri (özet)

[10-mesajlar F9 eki](../../ekranlar/10-mesajlar/README.md#f9-eki--canlıya-alma-web-9-o1-w181) ve [14-bildirimler F9 eki](../../ekranlar/14-bildirimler/README.md#f9-eki--canlıya-alma-web-9-o1-w181): hangi E-satırlarının hangi W ile canlandığı ve kanıt sütunu (W187 O4'te tamamlar).

### Paylaşılan dosya sahiplik protokolü (O1 Opus B2 düzeltmesi)

`src/shared/http/query-keys.ts` tek seferde tek W tarafından düzenlenir: W183 liste `kind/unread` anahtarlarını önce tamamlayıp commit eder; W184 bu commit'i aldıktan sonra paylaşılan okumalar/notify-level ve source-message anahtar/ilişkilerini ekler; W185b bu tabanı aldıktan sonra forward/archive ilişkilerini ekler; W185 son olarak chat↔notifications ve mute/group ilişkilerini ekler. Modül dosyaları paralel ilerleyebilir, merkezi dosya sırayla teslim edilir; anahtar/ilişki eklentisi istemde açıkça sahiplenilir. W185 `markChatRead` çağrısını yeniden yazmaz; mevcut `thread/use-read-marker.ts` merkezi mutation geçersizlemesini kullanır.
