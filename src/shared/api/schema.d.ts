// BU DOSYA ÜRETİLMİŞTİR — elle düzenlenmez. `pnpm gen:api` ile yeniden üretilir.
// Kaynak: nizam.io--backend etiket v0.11.0-api (4d0bbd0605ade5adfc0599e9586944ed8dab7bcb) — docs/api/openapi.yaml

export interface paths {
    "/.well-known/nizamio-instance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Açık sistem bilgi (keşif) ucu. */
        get: operations["systemInfo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/healthz/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Süreç ayakta mı (bağımlılık denetlemez). */
        get: operations["healthLive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/healthz/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bağımlılıklar erişilebilir mi. */
        get: operations["healthReady"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Yönetici hesap açma (parola çağıran verir). */
        post: operations["openAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/accounts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Yönetici hesap silme (yumuşak); oturumlar düşer.
         * @description Silinen hesabın aktif atamaları her `(program, departman)` için
         *     silmeyi yapana devredilir; tamamlanmış atamalar kalır, ekip satırları
         *     yetki vermez (ADR-0023 kural 7).
         */
        delete: operations["deleteAccount"];
        options?: never;
        head?: never;
        /** Yönetici hesap güncelleme; parola atanırsa hedefin oturumları düşer. */
        patch: operations["updateAccount"];
        trace?: never;
    };
    "/v1/admin/accounts/{id}/unlock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Kilitli hesabın kilidini açar. */
        post: operations["unlockAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/deleted/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Silinmiş hesaplar (imleçli). */
        get: operations["listDeletedAccounts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/deleted/departments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Silinmiş departmanlar (imleçli). */
        get: operations["listDeletedDepartments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/deleted/meetings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Silinmiş toplantılar — yönetici yaşam döngüsü yolu (aynı use-case). */
        get: operations["adminListDeletedMeetings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/deleted/work-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Silinmiş görevler (imleçli; korunan ek sayısıyla). */
        get: operations["listDeletedWorkItems"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/permanent/accounts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Silinmiş hesabı kalıcı siler. */
        delete: operations["permanentDeleteAccount"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/permanent/departments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Silinmiş departmanı kalıcı siler. */
        delete: operations["permanentDeleteDepartment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/permanent/meetings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Silinmiş toplantıyı kalıcı siler. */
        delete: operations["permanentDeleteMeeting"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/permanent/work-items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Silinmiş görevi ve eklerini kalıcı siler. */
        delete: operations["permanentDeleteWorkItem"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/restore/accounts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Silinmiş hesabı geri yükler. */
        patch: operations["restoreAccount"];
        trace?: never;
    };
    "/v1/admin/restore/departments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Silinmiş departmanı geri yükler. */
        patch: operations["restoreDepartment"];
        trace?: never;
    };
    "/v1/admin/restore/meetings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Silinmiş toplantıyı geri yükler. */
        patch: operations["restoreMeeting"];
        trace?: never;
    };
    "/v1/admin/restore/work-items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Silinmiş görevi geri yükler. */
        patch: operations["restoreWorkItem"];
        trace?: never;
    };
    "/v1/admin/security/reset-lockouts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Bütün giriş kilitlerini ve başarısız deneme kayıtlarını sıfırlar. */
        post: operations["resetLockouts"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Bilinen kullanıcı listesi (imleçli).
         * @description `memberships` her ekip satırını `program:departman:rol` etiketiyle
         *     taşır. `role` süzgeci "herhangi bir programda bu rol" demektir
         *     (ADR-0023 kural 18).
         */
        get: operations["listUsers"];
        put?: never;
        /**
         * Kullanıcı oluşturur veya mevcut hesabı aktarır.
         * @description Hesap açar (ya da `transfer_account_id` ile var olan hesabı aktarır)
         *     ve `program_id` programındaki departman ekibine ekler; `program_id`
         *     zorunludur ve departman bu programa bağlı olmalıdır
         *     (`422 organization.department_not_linked`). Koordinatör yalnız bu
         *     programda koordine ettiği departmana `uye` ekler (ADR-0023 kural 18).
         */
        post: operations["createUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Kullanıcıyı siler (geri alınabilir silme).
         * @description Koordinatörün silme kapsamı güncellemeyle aynıdır: hedefin her ekip
         *     satırı, çağıranın koordinatör olduğu bir `(program, departman)` içinde
         *     `uye` rolündedir. Silinen hesabın aktif atamaları her `(program,
         *     departman)` için silmeyi yapana devredilir; ekip satırları yetki vermez
         *     (ADR-0023 kural 7, 8).
         */
        delete: operations["deleteUser"];
        options?: never;
        head?: never;
        /**
         * Kullanıcı günceller.
         * @description Koordinatör yalnız silebileceği hesabı günceller: hedef şirket
         *     yöneticisi değildir ve hedefin her ekip satırı (her programda),
         *     çağıranın koordinatör olduğu bir `(program, departman)` içinde `uye`
         *     rolündedir (ADR-0023 kural 8).
         */
        patch: operations["updateUser"];
        trace?: never;
    };
    "/v1/assistant/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * YZ asistanına soru sorar; cevap SSE akışıdır (salt okunur araçlar, kapsam çağırandan).
         * @description Yalnız `NIZAMIO_ASSISTANT_ENABLED=true` iken kayıtlıdır; bayrak kapalıyken yol tanımsızdır ve `404 platform.route_not_found` döner.
         *
         *     Cevap `text/event-stream` akışıdır; her olay `event: <ad>` ve tek satır
         *     `data: <JSON>` taşır (şemalar `AssistantEvent*`). Olay sırası: `metin` parçaları
         *     ve `arac`/`gorunum` olayları dönüşümlü; başarıda kapanış `adlar` (varsa),
         *     `kaynaklar`, `kullanim`, `bitti`.
         *
         *     Akış BAŞLAMADAN doğan hata (kapsam, kota, kapasite, sohbet sahipliği, ilk
         *     model çağrısının arızası) normal hata zarfıyla döner. Akış başladıktan
         *     SONRA doğan hata durum kodunu değiştiremez: yanıt HTTP 200 kalır ve akış
         *     tek bir `hata` olayıyla (`AssistantEventError`; kod `assistant.limit_exceeded`,
         *     `assistant.refused`, `assistant.provider_unavailable` ya da `platform.internal`)
         *     biter, `bitti` gelmez. Hiçbir olay araç sonucunun ham verisini taşımaz;
         *     kişiler modele ve akışa `Üye-N` takma adıyla girer, `adlar` olayı yalnız
         *     o soruda görülen takma adların görünen adını taşır.
         */
        post: operations["assistantChat"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/assistant/conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Çağıranın seçili programdaki sohbetleri (en yeni önce, en çok 200).
         * @description Yalnız `NIZAMIO_ASSISTANT_ENABLED=true` iken kayıtlıdır; bayrak kapalıyken yol tanımsızdır ve `404 platform.route_not_found` döner. Yalnız çağıranın kendi sohbetleri listelenir.
         */
        get: operations["assistantConversations"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/assistant/conversations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sohbet ve görünür mesajları (kullanıcı soruları ve asistan cevapları).
         * @description Yalnız `NIZAMIO_ASSISTANT_ENABLED=true` iken kayıtlıdır; bayrak kapalıyken yol tanımsızdır ve `404 platform.route_not_found` döner. Başkasının ya da başka programın sohbeti `assistant.not_found` alır
         *     (varlık sızmaz). Araç sonuçları ve takma ad tablosu dönmez.
         */
        get: operations["assistantConversation"];
        put?: never;
        post?: never;
        /**
         * Çağıranın sohbetini mesajlarıyla kalıcı siler.
         * @description Yalnız `NIZAMIO_ASSISTANT_ENABLED=true` iken kayıtlıdır; bayrak kapalıyken yol tanımsızdır ve `404 platform.route_not_found` döner. Başkasının ya da başka programın sohbeti `assistant.not_found` alır.
         */
        delete: operations["deleteAssistantConversation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Giriş. Web: gövdede token + HttpOnly yenileme çerezi; mobil (X-Nizamio-Client: mobile): access + refresh gövdede. */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Oturumu (ve soyunu) kapatır; web yenileme çerezini siler. */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Parola değiştirme; diğer oturumlar düşer. */
        post: operations["changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Yenileme ve rotasyon. Mobil belirteç gövdede; web belirteci çerezde (gövde {}). */
        post: operations["refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chat-attachments/{attachmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sohbet ekini indirir (sohbet üyesi; indirme bileti hedefi).
         * @description Mesaj silinmiş, ek yok ya da sohbete erişim yoksa 404 `messaging.message_not_found`. Tarayıcı ve
         *     indirme yöneticisi `POST /v1/download-tickets` ile bilet alır (ADR-0013).
         */
        get: operations["downloadChatAttachment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chat-file-refs/{refId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sohbette paylaşılan dosyayı indirir (sohbet üyesi; indirme bileti hedefi).
         * @description Erişim mesaja bağlıdır: mesaj silindiyse ya da çağıran sohbetten çıktıysa (bilet tüketiminde
         *     dahil) 404 `messaging.ref_not_found`. Dosya türünde olmayan referans, yok olan ya da başka
         *     programa taşınan dosya aynı cevabı alır. Genel dosya indirme ucunun yetkisi değişmez.
         *     Belirteç taşıyamayan istemci (tarayıcı gezintisi, indirme yöneticisi) `POST /v1/download-tickets`
         *     ile bu yola bilet alır (ADR-0013); tüketimde aynı denetimler tüketim anındaki durumla koşar.
         */
        get: operations["downloadChatSharedFile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chat-refs/{refId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Paylaşılan öğenin okuyana sınırlı özeti (sohbet üyesi).
         * @description Referans yok, mesajı silinmiş ya da çağıran sohbet üyesi değilse 404 `messaging.ref_not_found`.
         *     Hedef canlı okunur: görev/dosya yoksa ya da başka programdaysa, koordinatörlüğün bağı
         *     kalktıysa 200 `available: false` ve kart alanları yok. Görev kartı kod alanı taşımaz.
         */
        get: operations["getChatRefSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Seçili programdaki sohbetler (son etkinliğe göre, imleçli).
         * @description İlk sayfada (imleç boş) ve yazma izni açıkken programın kendiliğinden grupları
         *     (bağlı her koordinatörlük ve "Genel") tembel ve idempotent kurulur; salt okunur
         *     modda liste onlarsız döner. Satırda çağıranın grup rolü yoktur (`role` alanı
         *     yalnız `GET /v1/chats/{chatId}` cevabındadır).
         */
        get: operations["listChats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Sohbet bilgisi (çağıranın grup rolü dahil). */
        get: operations["getChat"];
        put?: never;
        post?: never;
        /** Grubu siler (yönetici ya da kurucu; iz satırı kalır). */
        delete: operations["deleteChat"];
        options?: never;
        head?: never;
        /**
         * Grup adını (yönetici/kurucu) ya da kaynağını (yönetici) değiştirir.
         * @description Kaynak değişimi "kapat + aç"tır: eski kaynağın o anki üyeleri başlangıçlarıyla elle
         *     üyeliğe yazılır, yeni kaynak `source_since` ile başlar.
         */
        patch: operations["updateChat"];
        trace?: never;
    };
    "/v1/chats/{chatId}/admins/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Üyeyi grup yöneticisi yapar (hedef ŞY ya da koordinatör). */
        put: operations["grantChatAdmin"];
        post?: never;
        /** Grup yöneticiliğini alır. */
        delete: operations["revokeChatAdmin"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Ek mesajı gönderir (multipart, tek dosya; 201 yeni, 200 aynı istemci kimliğinin tekrarı).
         * @description İzinli 11 tür (records ile aynı: pdf, png, jpg, csv, doc/docx, xls/xlsx, ppt/pptx, pages); tavan
         *     `NIZAMIO_MESSAGING_ATTACHMENT_MAX_BYTES` (varsayılan 25 MB). Açıklama isteğe bağlıdır; ek mesajında
         *     `body` boş olabilir. Tek istek tek dosyadır.
         *     Aynı `client_message_id` ile farklı gönderim (açıklama, yanıtlanan mesaj ya da ekin adı, MIME
         *     türü veya boyutu) 409 `messaging.idempotency_key_reused` alır; aynı gönderimin tekrarı 200 döner.
         */
        post: operations["sendChatAttachment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Sohbetin güncel üyeleri (elle + kaynaklı; en çok 200, `truncated`). */
        get: operations["listChatMembers"];
        put?: never;
        /** Gruba elle üye ekler (ekleme kuralı; tek istekte en çok 200). */
        post: operations["addChatMembers"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/members/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Üyeyi çıkarır; hedef çağıranın kendisiyse gruptan ayrılmadır. */
        delete: operations["removeChatMember"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sohbet geçmişi (`seq` imleçli; tombstone dönmez).
         * @description `before`, `after`, `around` en çok biri verilir; hiçbiri yoksa son sayfa. İmleç
         *     sohbet içi sıra numarasıdır (`seq`), zaman damgasına indirgenmez.
         */
        get: operations["listChatMessages"];
        put?: never;
        /**
         * Mesaj gönderir ya da yanıtlar (201 yeni, 200 aynı istemci kimliğinin tekrarı).
         * @description Tekrar yetkiyi atlamaz: erişimini kaybetmiş çağıran 404 alır. Aynı istemci
         *     kimliğiyle gönderilmiş mesaj silinmişse 409 `messaging.message_deleted`; aynı istemci
         *     kimliğiyle farklı gönderim (gövde, yanıtlanan mesaj, bahsetme, referans ya da anket) 409 `messaging.idempotency_key_reused`.
         *     Yanıtlanan mesaj yoksa 404 `messaging.message_not_found`. Tekrar çocuk
         *     yazmaz; ilk mesajın bahsetme ve referanslarını döndürür. Yeni olay yoktur:
         *     bahsetme ve referans `message.created` ile duyurulur.
         */
        post: operations["sendChatMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/messages/{messageId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Mesajı siler (gönderen ya da grup yöneticisi; tombstone). */
        delete: operations["deleteChatMessage"];
        options?: never;
        head?: never;
        /** Mesajı düzenler (yalnız gönderen; düzenlendi işareti). */
        patch: operations["editChatMessage"];
        trace?: never;
    };
    "/v1/chats/{chatId}/messages/{messageId}/pin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Mesajı sabitler (birebirde iki taraf; grupta yönetici ya da kurucu).
         * @description Tekrar sabitleme sabitlenme anını değiştirmez. Silinen mesaj sabitten düşer.
         */
        put: operations["pinChatMessage"];
        post?: never;
        /** Mesajı sabitten kaldırır. */
        delete: operations["unpinChatMessage"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/messages/{messageId}/poll/close": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Anketi bitirir (yalnız açan). */
        post: operations["closeChatPoll"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/messages/{messageId}/reaction": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Mesaja tepki koyar (kişi başına tek tepki; yenisi eskinin yerine). */
        put: operations["setChatReaction"];
        post?: never;
        /** Tepkiyi kaldırır (yoksa da 204). */
        delete: operations["deleteChatReaction"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/messages/{messageId}/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Mesajdan görev açar (şirket yöneticisi ya da hedef departmanın koordinatörü).
         * @description Açıklama mesaj gövdesidir; `title` boşsa gövdenin ilk 100 karakteri. Başlangıç bugünden,
         *     bitiş başlangıçtan önce olamaz. Aynı mesajdan ikinci görev serbesttir (uyarı istemcide,
         *     mesajın `task_ids` alanı). Görev ve mesaj bağı tek transaction'dadır; commit sonrası
         *     `message.updated` yayılır.
         */
        post: operations["createTaskFromChatMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/messages/{messageId}/vote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Ankete oy verir (küme önceki oyun yerine geçer; boş küme oyu geri çeker).
         * @description Tek seçimli ankette en çok bir seçenek. Kapanmış ya da son tarihi geçmiş ankete 409 `messaging.poll_closed`. Anket olmayan mesaj 404 `messaging.message_not_found`.
         */
        put: operations["voteChatPoll"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/pins": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Sabit mesajlar (pinned_at DESC; imleçsiz, tavanlı truncated). */
        get: operations["listChatPins"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Okundu imlecini verilen mesaja ilerletir (geri gitmez). */
        post: operations["markChatRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/refs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sohbetin paylaşılanları (görev, koordinatörlük, dosya; en yeniden eskiye, statik satır).
         * @description Satır statiktir; kart `GET /v1/chat-refs/{refId}` ile okunur. Silinmiş mesajın
         *     referansı listede yoktur. `cursor` önceki sayfanın son `ref_id`'sidir.
         */
        get: operations["listChatRefs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/{chatId}/typing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Yazıyor olayını yayar (her zaman 204; DB okuması yok).
         * @description Yetki abonelik kümesindendir: çağıranın bu programda sohbeti tutan açık akışı yoksa olay sessizce düşer. İstemci ≥ 3 sn aralıkla gönderir.
         */
        post: operations["sendChatTyping"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/candidates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Birebir ya da gruba ekleme için aday kişiler (en çok 200; `truncated`).
         * @description Silinmiş hesap ve çağıranın kendisi listeye girmez. Listede olmayan kişiyle
         *     birebir açılamaz ya da gruba eklenemez (istemci "neden yazamıyorum" metnini
         *     birebir kuralından gösterir).
         */
        get: operations["listChatCandidates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/direct": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Birebir sohbet açar ya da mevcut olanı döndürür (201 yeni, 200 mevcut).
         * @description Birebir kuralı (iki yönlü; roller seçili programdan) yalnız YENİ sohbet açılırken
         *     uygulanır: rolü sonradan değişen çift mevcut sohbetini 200 ile açar. Karşı taraf
         *     silinmiş hesapsa ya da kural izin vermiyorsa 403 `messaging.not_authorized`.
         */
        post: operations["openDirectChat"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Grup sohbeti kurar (kurucu + ilk üyeler; kaynak ayarı yalnız ŞY/koordinatör kurucuda). */
        post: operations["createGroupChat"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Görünür bütün sohbetlerde okundu imlecini son mesaja çeker. */
        post: operations["markAllChatsRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chats/stream": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sohbet olaylarının anlık akışı (SSE; içeriksiz olaylar).
         * @description Olaylar kalıcı değildir ve outbox olayı değildir; yük içeriksizdir (yalnız
         *     kimlikler). İstemci içeriği güncel yetkiyle HTTP okumasından alır.
         *
         *     Kimlik, program yetkisi ve abonelik akış başlığından ÖNCE verilir; hata normal
         *     hata zarfıyla döner. Akış başladıktan sonra hata zarfı yazılmaz, bağlantı kapanır.
         *     Sunucu ilk çerçevede `: ok`, sonra 25 sn'de bir `: ping` yorum satırı yazar.
         *     Akış `NIZAMIO_HTTP_STREAM_TIMEOUT` bütçesiyle sınırlıdır; bütçe dolunca, bağlantı
         *     kuyruğu taşınca ya da sunucu kapanırken bağlantı kapanır.
         *
         *     Yeniden bağlanma protokolü: istemci ÖNCE aboneliği kurar, SONRA sohbet listesini
         *     ve açık sohbetin görünen penceresini `after` imleciyle uzlaştırır. Olayları ≥ 1 sn
         *     birleştirip toplu okur. Belirteç yalnız `Authorization` başlığında taşındığı için
         *     tarayıcı `EventSource` kullanamaz; fetch akışıyla okur.
         */
        get: operations["streamChatEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/date-change-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Tarih talepleri (yönetici inceleme yüzü). */
        get: operations["listDateChangeRequests"];
        put?: never;
        /** Tarih değişikliği talebi açar (görev başına tek bekleyen). */
        post: operations["requestDateChange"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/date-change-requests/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** İncelenmiş tarih talebini siler. */
        delete: operations["deleteDateChangeRequest"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/date-change-requests/{id}/review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tarih talebini onaylar ya da reddeder. */
        post: operations["reviewDateChangeRequest"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/date-change-requests/mine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Çağıranın açtığı tarih talepleri. */
        get: operations["myDateChangeRequests"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Departman listesi. */
        get: operations["listDepartments"];
        put?: never;
        /** Departman oluşturur. */
        post: operations["createDepartment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Departmanı siler (geri alınabilir silme). */
        delete: operations["deleteDepartment"];
        options?: never;
        head?: never;
        /** Departman günceller. */
        patch: operations["updateDepartment"];
        trace?: never;
    };
    "/v1/departments/{id}/assignable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Departmana atanabilir hesap havuzu.
         * @description Bu programda bu departmanın koordinatörüne açıktır. Havuz =
         *     herhangi bir programda ekip satırı olan canlı hesaplar − bu
         *     `(program, departman)` ekibi; `roles` etiketleri yalnız seçili programdaki
         *     diğer departman rolleridir (ADR-0023 kural 17).
         */
        get: operations["listAssignable"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/coordinator": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Departman koordinatörünü atar.
         * @description Ekip programa göredir (ADR-0023): koordinatörlük yalnız
         *     `X-Nizamio-Program` programındaki bu departman için yazılır; başka
         *     programda koordinatörlük vermez. Departman bu programa bağlı değilse
         *     `422 organization.department_not_linked`. Yalnız şirket yöneticisi.
         */
        post: operations["assignCoordinator"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/coordinator/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Koordinatörlüğü kaldırır; görev etkisi varsa onay ister.
         * @description Ekip programa göredir (ADR-0023): yalnız `X-Nizamio-Program` programındaki
         *     koordinatörlük kaldırılır. Onay kapısı ve devir bu programın bu
         *     departmanındaki aktif atamalarla sınırlıdır. Yalnız şirket yöneticisi.
         */
        delete: operations["removeCoordinator"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Departman üye listesi (yönetim yüzü).
         * @description Ekip programa göredir (ADR-0023): liste birebir `X-Nizamio-Program`
         *     programındaki bu departmanın ekibidir; roller bu programa göredir.
         *     Şirket yöneticisine ve bu programda bu departmanın koordinatörüne
         *     açıktır; başka programdaki koordinatörlük yetki vermez. Departman
         *     programa bağlı değilse (program yoksa da) 422
         *     `organization.department_not_linked`.
         */
        get: operations["listMembers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/memberships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Hesabı departmana rolle bağlar.
         * @description Ekip programa göredir (ADR-0023): hesap yalnız `X-Nizamio-Program`
         *     programındaki bu departmanın ekibine eklenir; aynı hesap başka
         *     programlarda ayrı satırlarla bulunabilir ve onlar etkilenmez. Departman
         *     bu programa bağlı değilse `422 organization.department_not_linked`.
         *     Şirket yöneticisi ya da bu programda bu departmanın koordinatörü
         *     çağırır; koordinatörün atadığı rol `uye`'ye zorlanır ve koordinatör
         *     şirket yöneticisini ya da herhangi bir programda `uye` dışında ekip
         *     satırı olan hesabı ekleyemez (403).
         */
        post: operations["assignMembership"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/departments/{id}/memberships/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Üyeyi departmandan çıkarır; görev etkisi varsa onay ister.
         * @description Ekip programa göredir (ADR-0023): yalnız `X-Nizamio-Program` programındaki ekip
         *     satırı silinir; hesabın başka programlardaki ekip satırları kalır. Onay
         *     kapısı (`?confirm=true`) ve devir yalnız bu programın bu departmanındaki
         *     aktif atamalar içindir. Şirket yöneticisi ya da bu programda bu
         *     departmanın koordinatörü çağırır.
         */
        delete: operations["removeMember"];
        options?: never;
        head?: never;
        /**
         * Üyelik rolünü değiştirir; görev etkisi varsa onay ister.
         * @description Ekip programa göredir (ADR-0023): yalnız `X-Nizamio-Program` programındaki
         *     ekip satırının rolü değişir. Onay kapısı ve devir yalnız bu programın bu
         *     departmanındaki aktif görev atamalarını sayar; diğer programların
         *     atamalarına dokunulmaz. Yalnız şirket yöneticisi.
         */
        patch: operations["updateMembershipRole"];
        trace?: never;
    };
    "/v1/departments/{id}/task-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Departmanın seçili programdaki görev özeti.
         * @description Sayım `(program, departman)` kapsamlıdır: yalnız `X-Nizamio-Program`
         *     programının kalemleri sayılır. Departman programa bağlı değilse
         *     (program yoksa da) 422 `organization.department_not_linked`.
         *     Kalıcı departman silme engeli bu uçtan
         *     bağımsız, bütün programları sayan katalog geneli sayımdır.
         */
        get: operations["taskSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/download-tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * İndirme bileti üretir (tarayıcı/indirme yöneticisi için; ADR-0013).
         * @description Yetki tüketimde, hedef ucun kendi kuralıyla verilir. Kapsam başlıkları verilirse bilete yazılır ve tüketimde hedefe taşınır. Oturum başına en çok 16 açık bilet.
         */
        post: operations["issueDownloadTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/downloads/{ticket}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * İndirme biletini tüketir ve hedef isteği bilet sahibinin kimliğiyle yürütür.
         * @description Kimlik `Authorization` başlığından değil biletten gelir (gönderilen başlık yok sayılır). Başarıda gövde, Content-Type ve Content-Disposition hedef uçtandır; hedefin kendi hata kodları (403/404/422/429/503) da dönebilir. Yanıt her durumda `Referrer-Policy: no-referrer` ve `Cache-Control: no-store` taşır.
         */
        get: operations["redeemDownloadTicket"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/files/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Dosyayı siler (metadata + nesne). Yalnız dosyanın `(program, departman)` ekibinde satırı olan yükleyen siler (aksi 403 `records.not_authorized`); ikinci silme 404 `records.file_not_found` alır. */
        delete: operations["deleteFile"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/files/{id}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Tek dosyayı indirir (yetkisiz çağıran da bulunamadı alır). */
        get: operations["downloadFile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/files/{id}/name": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Görünen adı değiştirir (uzantı verilirse dosyanın türüyle uyumlu olmalı; uzantısız ad olduğu gibi yazılır; depolama nesnesine dokunmaz). Yönetici, ekibin koordinatörü ya da dosyanın `(program, departman)` ekibinde satırı olan yükleyen; aksi 403 `records.not_authorized`. */
        patch: operations["renameFile"];
        trace?: never;
    };
    "/v1/instance/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Kurulum profili: yalnız yapılandırma alanları. */
        get: operations["instanceProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Oturumdaki hesabın kimliği. */
        get: operations["me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me/chat-unread": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Programlar arası okunmamış sohbet özeti (program seçici rozeti).
         * @description Ekip satırı olan programlar; şirket yöneticisine bütün programlar. `mentioned`
         *     programdaki herhangi bir sohbetin bahsetme rozetidir (`GET /v1/chats` `mentioned`).
         */
        get: operations["getChatUnreadOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/me/departments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Hesabın departmanları ve rolleri.
         * @description Çağıranın bütün programlardaki ekip satırları: her öğe bir
         *     `(program, departman)` çiftidir (`program_id`, `program_name`,
         *     `department_id`, programdaki ad `display_name`, `role`). Aynı departman
         *     iki programda ekipteyse iki ayrı öğe döner; rol öğenin programına
         *     göredir. Kapsam başlığı gerekmez (S1).
         */
        get: operations["myDepartments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meeting-agenda/{itemId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Gündem maddesini kalıcı siler. */
        delete: operations["deleteAgendaItem"];
        options?: never;
        head?: never;
        /** Gündem maddesinin başlığını ve/veya işaretini günceller. */
        patch: operations["updateAgendaItem"];
        trace?: never;
    };
    "/v1/meeting-notes/{noteId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Notu yumuşak siler (sahiplik matrisi). */
        delete: operations["deleteMeetingNote"];
        options?: never;
        head?: never;
        /** Not içeriğini günceller (sahiplik matrisi). */
        patch: operations["updateMeetingNote"];
        trace?: never;
    };
    "/v1/meeting-notes/{noteId}/convert-to-task": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Notu göreve dönüştürür (tek transaction). */
        post: operations["convertNoteToTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meetings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Görünür toplantılar (imleçli). */
        get: operations["listMeetings"];
        put?: never;
        /** Toplantı açar; ilk gündem aynı transaction, katılımcılar en iyi çabayla. */
        post: operations["createMeeting"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meetings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Toplantı detayı: katılımcılar, gündem, notların ilk sayfası. */
        get: operations["getMeeting"];
        put?: never;
        post?: never;
        /** Toplantıyı yumuşak siler. */
        delete: operations["deleteMeeting"];
        options?: never;
        head?: never;
        /** Toplantı günceller (departman seti yalnız yönetici yolunda). */
        patch: operations["updateMeeting"];
        trace?: never;
    };
    "/v1/meetings/{id}/agenda": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Gündem maddeleri (sıralı; tek sayfa). */
        get: operations["listAgenda"];
        put?: never;
        /** Gündem maddesi ekler (en çok 50). */
        post: operations["addAgendaItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meetings/{id}/conference": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Toplantıya bağlı görüntülü konferansı başlatır (yönetici ve bağlı departmanın koordinatörü). Aktif konferans varsa yeni satır açılmaz ve 200 döner. */
        post: operations["startConference"];
        /** Konferansı bitirir. Aktif konferans yoksa ya da sağlayıcı odayı kapatamazsa da 204 döner. */
        delete: operations["endConference"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meetings/{id}/conference/token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Konferansa katılım token'ı üretir (toplantıyı gören her rol; hesap başına dakikada 30). Yazma izninden geçmez. */
        post: operations["joinConference"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meetings/{id}/notes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Toplantı notları (imleçli). */
        get: operations["listMeetingNotes"];
        put?: never;
        /** Toplantı notu ekler (üye için dakikada 20 not). */
        post: operations["addMeetingNote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meetings/{id}/participants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Katılımcı ekler. */
        post: operations["addMeetingParticipant"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meetings/{id}/participants/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Katılımcı çıkarır. */
        delete: operations["removeMeetingParticipant"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/meetings/deleted": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Silinmiş toplantılar (imleçli; yalnız yönetici). */
        get: operations["listDeletedMeetings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Çağıranın uygulama içi bildirimleri (imleçli; metin taşımaz). */
        get: operations["listNotifications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tek bildirimi okundu işaretler (yalnız kendi kaydı). */
        post: operations["markNotificationRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Bütün bildirimleri okundu işaretler. */
        post: operations["markAllNotificationsRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/targets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cihaz (web push) aboneliği kaydı; kendi hesabına idempotent. */
        post: operations["registerPushTarget"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/targets/{target_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Kendi cihaz aboneliğini kapatır (başkasının/olmayanın cevabı aynı 404). */
        delete: operations["unregisterPushTarget"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/unread-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Okunmamış bildirim sayısı. */
        get: operations["countUnreadNotifications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/notifications/vapid-public-key": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Web push açık anahtarı ve açıklık bilgisi (`enabled=false` hata değildir). */
        get: operations["pushPublicKey"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/program": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Kapsamdaki program.
         * @description Görünürlük `GET /v1/programs` ile aynıdır: çağıranın bu programda
         *     ekip satırı yoksa (ve şirket yöneticisi değilse) `404 program.not_found`.
         */
        get: operations["readProgram"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/program-transfers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Aktarım geçmişi (imleçli). */
        get: operations["listTransfers"];
        put?: never;
        /**
         * Programlar arası görev aktarımı ya da ters aktarım (hep ya da hiç; hız sınırlı). Aynı anahtar + aynı gövde ilk sonucu 200 ile tekrarlar.
         * @description Atanan kişi hedef programın aynı departman ekibinde yoksa `uye` olarak
         *     eklenir ve `granted_memberships`'e yazılır; ters aktarım yalnız bu
         *     aktarımın eklediği ve kişinin o çiftte başka aktif ataması olmayan ekip
         *     satırlarını kaldırır. Hedefte bağ kurulacaksa adı katalog adıdır; bu ad
         *     hedef programda başka bir bağda varsa `409
         *     program.department_link_name_exists` (hiçbir şey yazılmaz; ADR-0023
         *     kural 12).
         */
        post: operations["transferWorkItems"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/program-transfers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Tek aktarım kaydı. */
        get: operations["readTransfer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/program-transfers/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Aktarım ön izlemesi (salt okunur; hız sınırlı).
         * @description `granted_memberships`, hedef programın departman ekibine `uye` olarak
         *     eklenecek atanan kişilerdir (bilgi; engel değildir ve parmak izine
         *     girmez). Ön izleme, kurulacak bağın katalog adının hedef programdaki
         *     başka bir bağın adıyla çakışmasını göstermez; yürütme bu durumda
         *     `409 program.department_link_name_exists` döner
         *     (GAP-193).
         */
        post: operations["previewTransfer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/program/departments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Kapsamdaki programa bağlı (canlı) departmanlar; programdaki adla.
         * @description Görünürlük `readProgram` ile aynıdır: şirket yöneticisi ya da bu programda ekip
         *     satırı olan hesap; aksi `404 program.not_found`. Yumuşak silinmiş ya da bağı
         *     kaldırılmış departman listede yoktur. Liste programdaki ada (eşitlikte
         *     departman kimliğine) göre bayt sırasıyla sıralıdır;
         *     sayaç ya da toplam taşımaz. Sayfasızdır: 200'den fazla canlı bağ varsa
         *     departman kimliği sırasıyla ilk 200 canlı bağ, ada göre sıralı döner ve
         *     `X-Result-Truncated: true` konur. Görev ekranında şirket yöneticisinin departman
         *     seçimi bu listeden yapılır (istemci departmanlar arası tarama yapmaz).
         *     Programda herhangi bir departmanda ekip satırı olan hesap programın bütün
         *     bağlı departmanlarının adını görür (yapısal bilgi, yetki değil); üye ve
         *     koordinatör departman seçimi için `/v1/me/departments` kullanır.
         */
        get: operations["listProgramDepartments"];
        put?: never;
        /**
         * Departmanı kapsamdaki programa bağlar (isteğe bağlı ad ve ekip kopyasıyla).
         * @description Ad verilmezse katalog adı kopyalanır. `copy_members_from_program_id`
         *     verilirse kaynak programdaki aynı departmanın ekibi rolleriyle
         *     kopyalanır (silinmiş hesaplar hariç). Bağ zaten varsa 201 ve var olan
         *     bağ döner; ekip yeniden kopyalanmaz (ADR-0023).
         */
        post: operations["linkDepartment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/program/departments/{departmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Departmanın kapsamdaki programla bağını kaldırır.
         * @description Kapsamda canlı (silinmemiş) görev varsa bağ korunur ve 409
         *     `program.department_link_in_use` döner. Yoksa bağ ve bu programdaki
         *     departman ekibi aynı transaction'da silinir (ADR-0023 kural 9).
         */
        delete: operations["unlinkDepartment"];
        options?: never;
        head?: never;
        /**
         * Departmanın kapsamdaki programdaki adını değiştirir.
         * @description Yalnız bu bağın adı değişir; aynı departmanın başka programlardaki adı ve
         *     katalog adı etkilenmez. Ad tekilliği program içinde ve büyük/küçük harfe
         *     duyarsızdır (ADR-0023 kural 4).
         */
        patch: operations["renameDepartmentLink"];
        trace?: never;
    };
    "/v1/program/work-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Seçili programın görünür görevleri (imleçli; departman başlığı yok).
         * @description Görev listesinin program bağlamındaki ucudur (WORK-K81). Satır biçimi
         *     `listWorkItems` ile aynıdır (`WorkItemList`: tarihler, adlı atananlar, gecikme
         *     etiketleri, `subtask_counts`, `pending_date_request`); toplam ya da sayaç eklenmez.
         *     Bekleyen tarih talebi satır başına yetkiyle dolar (yönetici her satırda,
         *     koordinatör kendi departmanının satırında; üye satırında `null`; kural tekil
         *     görev uçlarıyla aynıdır) ve listeyle aynı sorguda okunur; departman başına ek
         *     istek gerekmez.
         *
         *     Görünürlük çağıranın **bu programdaki** ekip satırlarından sunucuda, tek sorguda
         *     hesaplanır: şirket yöneticisi programın bütün görevlerini, koordinatör koordinatörü
         *     olduğu departmanların bütün görevlerini, üye üyesi olduğu departmanlarda yalnız
         *     kendisine atanan görevleri görür; birden çok rolü olan hesap birleşimi görür (aynı
         *     görev bir kez döner). Silinmiş görev ve silinmiş departmanın satırı yetki vermez.
         *
         *     `department_id` verilirse görünürlükle **kesişir**, yetkiyi genişletmez: koordinatör
         *     olunmayan departman süzülürse yalnız o departmanda kendisine atanan görevler döner
         *     (ekip satırı yoksa boş liste). Programa bağlı olmayan ya da yumuşak silinmiş
         *     (bağı duran) departman `404 work.program_scope_invalid`. Boş ya da yalnız
         *     boşluktan oluşan `department_id` süzgeç verilmemiş sayılır (`limit` ve `cursor`
         *     boş değerleriyle aynı gelenek).
         *
         *     Hiçbir programda ekip satırı olmayan ve yönetici olmayan hesap `403
         *     organization.membership_required`; bu programda ekip satırı olmayan ve yönetici
         *     olmayan hesap, var olmayan programla aynı `404 work.program_scope_invalid` alır
         *     (programın varlığı sızmaz). Sıra `(created_at, id)`; imleç opak; `limit`
         *     varsayılanı 50, 200 üstü 200'e çekilir. Tek görev istekleri yine görevin kendi
         *     `program_id` ve `department_id` başlıklarıyla gider.
         */
        get: operations["listProgramWorkItems"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/programs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Program (dönem) listesi.
         * @description Şirket yöneticisi bütün programları görür; diğer kullanıcı yalnız
         *     ekip satırı olan programları görür (görünürlük doğrudan ekip
         *     satırlarından okunur, departman bağı zincirinden değil — ADR-0023
         *     kural 2).
         */
        get: operations["listPrograms"];
        put?: never;
        /** Program oluşturur; aynı ad varsa mevcut döner (200). */
        post: operations["createProgram"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/programs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Programı siler; parola yeniden doğrulanır. */
        delete: operations["deleteProgram"];
        options?: never;
        head?: never;
        /** Program günceller. */
        patch: operations["updateProgram"];
        trace?: never;
    };
    "/v1/programs/{id}/reset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Dönem sıfırlama: program ve katılım bağları kalır, dönem içeriği silinir (parola yeniden doğrulanır). */
        post: operations["resetProgram"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/records/archive/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Arşiv dosya listesi (süzgeçli, imleçli; kapsam sunucuda sabit). */
        get: operations["archiveAttachments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/records/archive/files/download-zip": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Seçili dosyaları ZIP olarak akıtır (en çok 100 kimlik; dışa aktarım kotası). */
        get: operations["archiveSelectionZip"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/records/archive/folders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Koordinatörlük başına dosya özeti (üyeye tek sanal klasör). */
        get: operations["archiveFolders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/records/archive/folders/{id}/download-zip": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Klasörü ZIP olarak akıtır (kullanıcı başına dışa aktarım kotası). */
        get: operations["archiveFolderZip"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/records/archive/period/download-zip": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dönemin tam arşivini ZIP olarak akıtır (yalnız şirket yöneticisi; dışa aktarım kotası). */
        get: operations["archiveFullZip"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/records/archive/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dosyası olan görevler (seçenek listesi). */
        get: operations["archiveTasks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/records/archive/uploaders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Yükleyen hesap kimlikleri (seçenek listesi). */
        get: operations["archiveUploaders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Yönetici dashboard özeti (seçili program). */
        get: operations["reportDashboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/dashboard/coordinatorships": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Koordinatörlük istatistikleri. */
        get: operations["reportDashboardCoordinatorships"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/dashboard/meetings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Toplantı özeti listesi. */
        get: operations["reportDashboardMeetings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/dashboard/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Görev dağılımı listesi. */
        get: operations["reportDashboardTasks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/meetings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Toplantı detay raporu. */
        get: operations["reportMeetingDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/meetings/{id}/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Toplantı PDF raporu (dışa aktarım kotası). */
        get: operations["reportMeetingPdf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/season": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dönem raporu (JSON). */
        get: operations["reportSeason"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/season/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dönem raporu PDF'i (dışa aktarım kotası). */
        get: operations["reportSeasonPdf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Görev detay raporu. */
        get: operations["reportTaskDetail"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/tasks/{id}/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Görev PDF raporu (dışa aktarım kotası). */
        get: operations["reportTaskPdf"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/reports/workload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** İş yükü raporu (üye ve koordinatörlüğe göre). */
        get: operations["reportWorkload"];
        put?: never;
        /** Seçili üyelerin iş yükü PDF'i (boş liste bütün üyeler; dışa aktarım kotası). */
        post: operations["reportWorkloadPdf"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Kapsamdaki görevler (imleçli).
         * @description Satırdaki `pending_date_request` yöneticiye ve bu departmanın koordinatörüne
         *     dolar; üyede her satırda `null` (WORK-K82; tekil görev uçlarıyla aynı kural).
         */
        get: operations["listWorkItems"];
        put?: never;
        /** Görev açar (tarihler `YYYY-MM-DD`). */
        post: operations["createWorkItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Tek görevi açıklamasıyla okur (liste ile aynı rol kümesi, seçili programdaki rol).
         * @description Şirket yöneticisi ve görevin departmanının koordinatörü kapsamdaki her görevi,
         *     atanmış üye yalnız kendi görevini okur. Rol, görevin kendi `(program, departman)`
         *     kapsamından okunur. Kapsam başlığı görevin kapsamıyla uyuşmuyorsa ya da görev
         *     yok/silinmişse 404 `work.item_not_found`. Atanmamış üye 403 `work.not_assigned`
         *     alır: bu uç (notlar ve alt görev uçları gibi) görevin varlığını kapsam içindeki
         *     ekip üyesinden gizlemez.
         */
        get: operations["getWorkItem"];
        put?: never;
        post?: never;
        /** Görevi yumuşak siler. */
        delete: operations["deleteWorkItem"];
        options?: never;
        head?: never;
        /** Görevi günceller; tamamlanma/teslim alanları korumalıdır. */
        patch: operations["updateWorkItem"];
        trace?: never;
    };
    "/v1/work-items/{id}/assignments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Göreve atama ekler. */
        post: operations["addAssignments"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/assignments/{accountId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Atamayı kaldırır. */
        delete: operations["removeAssignment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/claim": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Görevi üstlenir. */
        post: operations["claimWorkItem"];
        /** Üstlenmeyi bırakır. */
        delete: operations["unclaimWorkItem"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/completion-date": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Tamamlanma tarihini yönetici olarak düzeltir. */
        patch: operations["setCompletionDate"];
        trace?: never;
    };
    "/v1/work-items/{id}/dependencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Görevin ön görevleri ve bağımlıları. */
        get: operations["listDependencies"];
        put?: never;
        /** Ön görev bağımlılığı ekler (döngü reddedilir). */
        post: operations["addDependency"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/dependencies/{depId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Bağımlılığı kaldırır. */
        delete: operations["removeDependency"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/extend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Bitişi gün sayısı kadar uzatır (bağımlılara yayılır). */
        post: operations["extendWorkItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/files": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Görevin dosyaları. */
        get: operations["listWorkItemFiles"];
        put?: never;
        /** Göreve dosya yükler (multipart `file` parçası; akışla). CSRF başlığı istenmez (taşıyıcı yalnız Bearer). */
        post: operations["attachFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/notes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Görevin notları. */
        get: operations["listWorkItemNotes"];
        put?: never;
        /** Göreve not ekler (hesap başına hız sınırı). */
        post: operations["addWorkItemNote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/notes/{noteId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Kendi notunu siler. */
        delete: operations["deleteWorkItemNote"];
        options?: never;
        head?: never;
        /** Kendi notunu günceller. */
        patch: operations["updateWorkItemNote"];
        trace?: never;
    };
    "/v1/work-items/{id}/own-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Atanmış üyenin kendi durum geçişi (geçiş günü bugündür). */
        patch: operations["ownStatusWorkItem"];
        trace?: never;
    };
    "/v1/work-items/{id}/pull-completion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tamamlanma tarihini geri çeker (koordinatör ya da görevin `(program, departman)` ekibinde satırı olan atanmış üye; aksi 403 `work.not_authorized`). */
        post: operations["pullCompletion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/pull-end-date": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Bitişi tamamlanma gününe çeker. */
        post: operations["pullEndDate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/subtasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Görevin alt görevleri (ADR-0024). */
        get: operations["listWorkItemSubtasks"];
        put?: never;
        /** Göreve alt görev ekler (koordinatör, şirket yöneticisi; görev başına en çok 50). */
        post: operations["createWorkItemSubtask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/{id}/subtasks/{subtaskId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Alt görevi siler (koordinatör, şirket yöneticisi); dosyaları ana görevde kalır, `subtask_id` referansları boşaltılır. */
        delete: operations["deleteWorkItemSubtask"];
        options?: never;
        head?: never;
        /** Alt görevi değiştirir: başlık/atama/tarih (koordinatör, şirket yöneticisi), `done` (atanan ya da koordinatör). */
        patch: operations["updateWorkItemSubtask"];
        trace?: never;
    };
    "/v1/work-items/{id}/transitions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Durum geçişi (geçiş tablosu; ön koşullar use-case sınırında). */
        post: operations["transitionWorkItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/gantt": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Departman Gantt görünümü. */
        get: operations["coordinatorGantt"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/gantt/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Programın bütün departmanları için Gantt görünümü. */
        get: operations["adminGantt"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/gantt/mine": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Çağıranın atandığı görevlerin Gantt görünümü. */
        get: operations["memberGantt"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/work-items/my-tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Çağıranın atandığı görevler. */
        get: operations["myTasks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AccountLifecycleResult: {
            account_id: string;
            /** @enum {string} */
            status: "restored" | "purged";
        };
        AccountResult: {
            account_id: string;
            /** @description Düşürülen oturum sayısı; sıfırsa alan yoktur. */
            revoked_sessions?: number;
        };
        AddChatMembersRequest: {
            account_ids: string[];
        };
        AddedCount: {
            added: number;
        };
        AgendaItem: {
            agenda_item_id: string;
            /** Format: date-time */
            checked_at: string | null;
            checked_by_account_id: string | null;
            /** Format: date-time */
            created_at: string;
            is_checked: boolean;
            meeting_id: string;
            sort_order: number;
            title: string;
        };
        AgendaItemRequest: {
            title: string;
        };
        AgendaList: {
            items: components["schemas"]["AgendaItem"][];
            /** @description Gündem tek sayfadır; her zaman boş. */
            next_cursor: string;
        };
        ArchiveFileList: {
            files: components["schemas"]["FileListItem"][];
            next_cursor?: string;
        };
        ArchiveFolder: {
            file_count: number;
            folder_id: string;
            /** @description Üyenin "Görevlerim" sanal klasörü. */
            is_virtual: boolean;
            name: string;
        };
        ArchiveFolders: {
            folders: components["schemas"]["ArchiveFolder"][];
        };
        ArchiveTask: {
            file_count: number;
            title: string;
            work_item_id: string;
        };
        ArchiveTasks: {
            tasks: components["schemas"]["ArchiveTask"][];
        };
        ArchiveUploaders: {
            uploaders: string[];
        };
        AssignableAccount: {
            account_id: string;
            full_name: string;
            /** @description Hesabın seçili programda hedef departman dışındaki rol bağları ("departman:rol"); başka programların rolleri yazılmaz. */
            roles: string[] | null;
        };
        AssignableList: {
            accounts: components["schemas"]["AssignableAccount"][] | null;
        };
        AssignMembershipRequest: {
            account_id: string;
            /** @enum {string} */
            role: "koordinator" | "uye";
        };
        AssignmentsRequest: {
            account_ids?: string[];
        };
        AssistantChatRequest: {
            /** @description Devam ettirilecek sohbet; boşsa yeni sohbet açılır. */
            sohbet_id?: string;
            /** @description Soru metni (boş olamaz; uzunluk sınırı domain kuralıdır). */
            soru: string;
        };
        AssistantConversation: {
            baslik: string;
            /** Format: date-time */
            created_at: string;
            id: string;
            /** Format: date-time */
            updated_at: string;
        };
        AssistantConversationDetail: {
            conversation: components["schemas"]["AssistantConversation"];
            messages: components["schemas"]["AssistantMessage"][];
        };
        AssistantConversationList: {
            conversations: components["schemas"]["AssistantConversation"][];
        };
        AssistantEventDone: {
            sohbet_id: string;
        };
        /** @description Akış başladıktan sonra doğan hata (HTTP 200 içinde; akışın son olayı). */
        AssistantEventError: {
            /** @enum {string} */
            kod: "assistant.limit_exceeded" | "assistant.refused" | "assistant.provider_unavailable" | "platform.internal";
            /** @description Kullanıcıya gösterilebilir Türkçe metin; iç ayrıntı taşımaz. */
            mesaj: string;
        };
        AssistantEventNames: {
            /** @description Bu soruda görülen takma ad (`Üye-N`) → görünen ad. E-posta ve hesap kimliği taşımaz. */
            adlar: {
                [key: string]: string;
            };
        };
        AssistantEventSources: {
            /** @description Cevabın dayandığı araç adları. */
            kaynaklar: string[];
        };
        AssistantEventText: {
            /** @description Cevap metninin bir parçası. */
            metin: string;
        };
        AssistantEventTool: {
            /** @enum {string} */
            arac: "bugun" | "kapsamim" | "gorev_dagilimi" | "gorev_listesi" | "is_yuku" | "toplanti_ozeti" | "sezon_ozeti" | "goster";
            /** @description Arayüzde gösterilecek kısa metin. */
            etiket: string;
        };
        AssistantEventUsage: {
            cikis_token: number;
            giris_token: number;
        };
        AssistantEventView: {
            /** @description Çözümlenmiş tipli süzgeç. */
            filtre: {
                [key: string]: unknown;
            };
            /** @description Katalogdaki görünüm adı; istemci rotaya çevirir ve veriyi normal API'den çeker. */
            gorunum: string;
        };
        AssistantMessage: {
            /** Format: date-time */
            created_at: string;
            icerik: string;
            /** @enum {string} */
            rol: "kullanici" | "asistan";
            sira: number;
        };
        ChangePasswordRequest: {
            current_password: string;
            new_password: string;
        };
        ChangePasswordResponse: {
            revoked_sessions: number;
        };
        ChangeRoleRequest: {
            confirm?: boolean;
            /** @enum {string} */
            role: "koordinator" | "uye";
        };
        Chat: {
            /**
             * @description Kendiliğinden kurulan grubun türü; elle kurulan sohbette `null`.
             * @enum {string|null}
             */
            auto_kind: "department" | "general" | null;
            chat_id: string;
            counterpart_account_id: string | null;
            counterpart_name: string | null;
            /** Format: date-time */
            created_at: string;
            created_by_account_id: string | null;
            /** @enum {string} */
            kind: "direct" | "group";
            /** Format: date-time */
            last_message_at: string | null;
            /** Format: int64 */
            last_seq: number;
            /** @description Grupta ad; birebirde `null`. */
            name: string | null;
            /**
             * Format: date-time
             * @description Birebirde karşı tarafın son aboneliğinin kapandığı an (bellek içi). Çevrimiçiyse ya da bilinmiyorsa (hiç bağlanmamış, sunucu yeniden başlamış) null; grupta ya da çevrimiçi sağlayıcısı yoksa null.
             */
            peer_last_seen_at?: string | null;
            /** @description Birebirde karşı tarafın açık aboneliği var mı; yoksa false (hiç bağlanmamış ya da sunucu yeniden başlamış dahil). Grupta ya da çevrimiçi sağlayıcısı yoksa null. */
            peer_online?: boolean | null;
            /**
             * @description Çağıranın gruptaki rolü (birebirde `member`); sohbet listesinde yoktur.
             * @enum {string}
             */
            role?: "admin" | "founder" | "member";
            /** @enum {string} */
            source: "none" | "department" | "program";
            source_department_id: string | null;
        };
        ChatCandidate: {
            account_id: string;
            full_name: string;
            /**
             * @description Seçili programdaki en yüksek rol.
             * @enum {string}
             */
            role: "company_admin" | "coordinator" | "member";
        };
        ChatCandidateList: {
            items: components["schemas"]["ChatCandidate"][];
            truncated: boolean;
        };
        /** @description SSE olay yükü; içeriksizdir (metin, alıntı taşımaz). Kalıcı değildir. */
        ChatEvent: {
            actor_account_id: string;
            /** @description Üyelik/sohbet olayında sohbete giren ve sohbetten düşen hesaplar; diğer olaylarda boş. */
            affected_account_ids: string[];
            chat_id: string;
            message_id: string | null;
        };
        ChatHistory: {
            items: components["schemas"]["ChatMessage"][];
            /**
             * Format: int64
             * @description Birebirde karşı tarafın okundu imleci (tik); grupta `null`.
             */
            peer_read_seq: number | null;
        };
        ChatLastMessage: {
            /** @description Silinmiş mesajda `null`. */
            body: string | null;
            /** Format: date-time */
            created_at: string;
            deleted: boolean;
            message_id: string;
            sender_account_id: string;
            sender_name: string;
            /** Format: int64 */
            seq: number;
        };
        ChatList: {
            items: components["schemas"]["ChatSummary"][];
            /** @description Boşsa son sayfa. */
            next_cursor: string;
        };
        ChatMember: {
            account_id: string;
            founder: boolean;
            /** @description `true` ise üye grubun kaynağından gelir; elle çıkarılamaz (409 `messaging.member_source_managed`). */
            from_source: boolean;
            full_name: string;
            /** @enum {string} */
            role: "admin" | "founder" | "member";
        };
        ChatMemberList: {
            items: components["schemas"]["ChatMember"][];
            truncated: boolean;
        };
        ChatMention: {
            /** @enum {string} */
            kind: "account" | "department" | "all";
            /** @description `all`da yoktur. */
            target_id?: string;
        };
        ChatMessage: {
            attachments: {
                attachment_id: string;
                content_type: string;
                file_name: string;
                /** Format: int64 */
                size_bytes: number;
            }[];
            body: string;
            chat_id: string;
            client_message_id: string;
            /** Format: date-time */
            created_at: string;
            /**
             * Format: int64
             * @description Gövdenin düzenleme sürümü (ADR-0027); tombstone, sabitleme ve tepki artırmaz.
             */
            edit_revision: number;
            edited: boolean;
            /** Format: date-time */
            edited_at: string | null;
            /** @description Gönderimdeki bahsetmeler (düzenleme değiştirmez); ad çözülmez. */
            mentions: components["schemas"]["ChatMention"][];
            message_id: string;
            /** Format: date-time */
            pinned_at: string | null;
            /** @description Anket (soru mesaj gövdesidir); sonuçta oy verenler görünür. */
            poll: {
                /** Format: date-time */
                closed_at: string | null;
                /** Format: date-time */
                closes_at: string | null;
                multi: boolean;
                results: {
                    count: number;
                    label: string;
                    option_index: number;
                    voters: {
                        account_id: string;
                        full_name: string | null;
                    }[];
                }[];
            } | null;
            /** @description Tür başına tepki sayısı; tepki edenler gösterilmez. */
            reactions: {
                count: number;
                /** @enum {string} */
                kind: "like" | "heart" | "check" | "star";
                mine: boolean;
            }[];
            /** @description Paylaşılan öğeler (statik); kart `GET /v1/chat-refs/{refId}` ile okunur. */
            refs: components["schemas"]["ChatMessageRef"][];
            reply_to?: components["schemas"]["ChatMessageQuote"];
            reply_to_message_id: string | null;
            sender_account_id: string;
            /** @description Yalnız geçmiş cevabında. */
            sender_name?: string;
            /** Format: int64 */
            seq: number;
            /** @description Bu mesajdan açılan görevler. */
            task_ids: string[];
        };
        ChatMessageQuote: {
            body: string | null;
            /** @description `true` ise alıntılanan mesaj silinmiştir; diğer alanlar `null`. */
            deleted: boolean;
            message_id: string;
            sender_account_id: string | null;
            sender_name: string | null;
        };
        ChatMessageRef: {
            /** @enum {string} */
            kind: "task" | "department" | "file";
            ref_id: string;
            target_id: string;
        };
        ChatMessageTaskCreated: {
            message: components["schemas"]["ChatMessage"];
            work_item_id: string;
        };
        ChatPins: {
            items: components["schemas"]["ChatMessage"][];
            truncated: boolean;
        };
        ChatRefList: {
            items: components["schemas"]["ChatSharedRef"][];
            next_cursor: string | null;
        };
        ChatRefSummary: {
            /** @description `false` ise hedef artık yoktur; kart alanları gelmez. */
            available: boolean;
            chat_id: string;
            department?: {
                name: string;
            };
            file?: {
                content_type: string;
                /** Format: date-time */
                created_at: string;
                name: string;
                /** Format: int64 */
                size_bytes: number;
            };
            /** @enum {string} */
            kind: "task" | "department" | "file";
            message_id: string;
            ref_id: string;
            target_id: string;
            task?: {
                assignees: {
                    account_id: string;
                    full_name: string | null;
                }[];
                department_id: string;
                department_name: string | null;
                description: string;
                /** Format: date */
                end_on: string;
                /** Format: date */
                start_on: string;
                status: string;
                title: string;
            };
        };
        ChatSharedRef: {
            /** Format: date-time */
            created_at: string;
            /** @enum {string} */
            kind: "task" | "department" | "file";
            message_id: string;
            ref_id: string;
            sender_account_id: string;
            target_id: string;
        };
        ChatSummary: components["schemas"]["Chat"] & {
            last_message: components["schemas"]["ChatLastMessage"] | null;
            /**
             * @description Okundu imlecinden ve üyelik başlangıcından sonraki, başkasının, silinmemiş bir
             *     mesajı çağıranı, çağıranın bu programdaki koordinatörlüğünü ya da herkesi anıyor
             *     (okunmamış sayımıyla aynı sorgu; okundu ile düşer).
             */
            mentioned: boolean;
            unread_count: number;
        };
        ChatUnreadOverview: {
            items: components["schemas"]["ChatUnreadProgram"][];
        };
        ChatUnreadProgram: {
            mentioned: boolean;
            program_id: string;
            program_name: string;
            unread_chats: number;
        };
        CompletionRequest: {
            /** Format: date */
            completed_on: string;
        };
        /** @description Toplantıya bağlı görüntülü konferansın istemci görünümü (ADR-0015 Ek B §3.1). */
        Conference: {
            id: string;
            /** Format: date-time */
            started_at: string;
            started_by_account_id: string;
            /**
             * @description starting: sağlayıcı onayı bekleniyor; live: sürüyor; ending: kapatıldı, oda henüz kapanmadı.
             * @enum {string}
             */
            status: "starting" | "live" | "ending";
        };
        /** @description Gövde boştur; gövdesiz istek de kabul edilir. Bilinmeyen alan 422 alır. */
        ConferenceEmptyRequest: Record<string, never>;
        ConferenceResult: {
            conference: components["schemas"]["Conference"];
        };
        /** @description Katılım token'ı. `token` SIRDIR: log, audit ve hata zarfına yazılmaz; yanıt önbelleğe alınmaz. */
        ConferenceToken: {
            /** Format: date-time */
            expires_at: string;
            /**
             * @description host: yönetici ve toplantıya bağlı departmanın koordinatörü; speaker: toplantıyı gören üye.
             * @enum {string}
             */
            role: "host" | "speaker";
            token: string;
            /** @description İstemcinin bağlanacağı genel adres (wss). */
            url: string;
        };
        ConvertNoteRequest: {
            assignee_account_ids?: string[];
            department_id?: string;
            /**
             * Format: date
             * @description Zorunlu; başlangıçtan önce olamaz.
             */
            end_date: string;
            /**
             * @description Gönderilmezse `orta`; boş dizge de `orta` sayılır.
             * @enum {string}
             */
            priority?: "dusuk" | "orta" | "yuksek" | "acil";
            /**
             * Format: date
             * @description Zorunlu; bitişten sonra olamaz ve bugünden önce olamaz.
             */
            start_date: string;
            /** @description Boşsa notun ilk 100 karakteri. */
            title?: string;
        };
        CoordinatorRequest: {
            account_id: string;
        };
        CoordinatorResult: {
            account_id: string;
            changed: boolean;
            department_id: string;
            membership_id: string;
            role: string;
        };
        CoordinatorshipStat: {
            completed_tasks: number;
            /** Format: double */
            completion_rate: number;
            coordinators: components["schemas"]["ReportPerson"][];
            department_id: string;
            description?: string;
            in_progress_tasks: number;
            kind: string;
            last_activity_at: string | null;
            meeting_count: number;
            member_count: number;
            name: string;
            not_started_tasks: number;
            overdue_tasks: number;
            total_tasks: number;
        };
        CoordinatorshipStatList: {
            coordinatorships: components["schemas"]["CoordinatorshipStat"][];
        };
        CountResult: {
            count: number;
        };
        CreateDepartmentRequest: {
            code?: string;
            description?: string;
            /** @enum {string} */
            kind: "koordinatorluk" | "calisma_grubu";
            name: string;
        };
        CreateGroupChatRequest: {
            member_account_ids: string[];
            /** @description Tek satır, en çok 100 karakter. */
            name: string;
            /** @enum {string} */
            source?: "none" | "department" | "program";
            /** @description `source=department` iken zorunlu; programa bağlı koordinatörlük. */
            source_department_id?: string;
        };
        CreateMeetingRequest: {
            agenda_items?: string[];
            /** @description En az bir departman; ilki sahip departmandır. Hepsi seçili programa katılmış olmalıdır. */
            department_ids: string[];
            /** @description `true` ise koordinatörlere toplantı mesajı gönderilmez. */
            is_instant?: boolean;
            /** @description Tarih-saat; saat dilimi yoksa kurulum saat diliminde yorumlanır. Kurulum saat dilimindeki bugünden önceki bir gün olamaz (422 `collaboration.input_invalid`). */
            meeting_date: string;
            members_included?: boolean;
            participant_ids?: string[];
            title: string;
        };
        CreateProgramRequest: {
            description?: string;
            name: string;
            year?: number;
        };
        CreateSubtaskRequest: {
            /** @description Opsiyonel; yalnız ana göreve atanmış hesap (aksi 422 `work.subtask_assignee_not_assigned`). */
            assignee_account_id?: string;
            /** Format: date */
            end_on?: string;
            /**
             * Format: date
             * @description Opsiyonel; `end_on` ile birlikte verilir. Yalnız bilgidir (Gantt, bağımlılık ve gecikmeye girmez).
             */
            start_on?: string;
            /** @description 1–300 karakter (kırpılarak), kontrol karakteri yok. */
            title: string;
        };
        CreateTaskFromChatMessageRequest: {
            assignee_account_ids?: string[];
            department_id: string;
            /** Format: date */
            end_date: string;
            priority?: string;
            /** Format: date */
            start_date: string;
            title?: string;
        };
        CreateUserRequest: {
            company_admin?: boolean;
            department_id: string;
            email: string;
            full_name?: string;
            /** @description İlk ekip satırının programı; departman bu programa bağlı olmalıdır (ADR-0023). */
            program_id: string;
            role?: string;
            transfer_account_id?: string;
        };
        CreateWorkItemRequest: {
            /** @description Boşsa atamasız açılır. */
            assignee_account_id?: string;
            /** @description Gönderilmezse `true` (ADR-0024). */
            completion_evidence_required?: boolean;
            description?: string;
            /** Format: date */
            end_on: string;
            /**
             * @description Gönderilmezse `orta`; boş dizge de `orta` sayılır.
             * @enum {string}
             */
            priority?: "dusuk" | "orta" | "yuksek" | "acil";
            /**
             * Format: date
             * @description Şirket yöneticisi dışındaki çağıranda en çok 40 gün geçmişte olabilir (aksi 422 `work.input_invalid`).
             */
            start_on: string;
            title: string;
        };
        DashboardReport: {
            active_tasks: number;
            completed_tasks: number;
            coordinatorship_stats: components["schemas"]["CoordinatorshipStat"][];
            deleted_records: number;
            /** Format: date-time */
            generated_at: string;
            overdue_tasks: number;
            overdue_tasks_list: components["schemas"]["OverdueTask"][];
            pending_approvals: number;
            pending_date_changes: number;
            priority_distribution: {
                [key: string]: number;
            };
            program_id: string;
            program_name: string;
            task_status_distribution: {
                [key: string]: number;
            };
            total_admins: number;
            total_coordinators: number;
            total_coordinatorships: number;
            total_members: number;
            total_tasks: number;
            total_users: number;
        };
        DateChangeRequest: {
            /** Format: date */
            new_end_on: string;
            /** Format: date */
            new_start_on: string;
            /** Format: date */
            old_end_on: string;
            /** Format: date */
            old_start_on: string;
            reason?: string;
            request_id: string;
            /** @enum {string} */
            status: "pending" | "approved" | "rejected";
            work_item_id: string;
        };
        DateChangeRequestCreate: {
            /** Format: date */
            new_end_on: string;
            /** Format: date */
            new_start_on: string;
            reason?: string;
            work_item_id: string;
        };
        DateChangeRequestList: {
            requests: components["schemas"]["DateChangeRequest"][];
            total: number;
        };
        DeletedAccount: {
            account_id: string;
            full_name: string;
        };
        DeletedAccountList: {
            accounts: components["schemas"]["DeletedAccount"][];
            next_cursor?: string;
        };
        DeletedDepartment: {
            code?: string;
            /** @description RFC 3339 (UTC); silinme zamanı okunamazsa boş. */
            deleted_at: string;
            department_id: string;
            kind: string;
            name: string;
        };
        DeletedDepartmentList: {
            departments: components["schemas"]["DeletedDepartment"][];
            next_cursor?: string;
        };
        DeleteDepartmentResult: {
            deleted: boolean;
            department_id: string;
        };
        DeletedWorkItem: {
            /** Format: date-time */
            deleted_at: string;
            department_id: string;
            file_count: number;
            status: string;
            title: string;
            work_item_id: string;
        };
        DeletedWorkItemList: {
            items: components["schemas"]["DeletedWorkItem"][];
            next_cursor?: string;
        };
        DeleteProgramRequest: {
            password: string;
        };
        Department: {
            code?: string;
            department_id: string;
            description?: string;
            kind: string;
            name: string;
        };
        DepartmentLifecycleResult: {
            department_id: string;
            /** @enum {string} */
            status: "restored" | "purged";
        };
        DepartmentList: {
            departments: components["schemas"]["Department"][];
        };
        DependencyEdge: {
            dependency_id: string;
            depends_on_work_item_id: string;
            work_item_id: string;
        };
        DependencyList: {
            /** @description Ön görevler. */
            dependencies: components["schemas"]["DependencyEdge"][];
            /** @description Bu göreve bağımlı görevler. */
            dependents: components["schemas"]["DependencyEdge"][];
        };
        DependencyRequest: {
            depends_on_work_item_id: string;
        };
        /** @description Bilet hedefi. İzin listesi kapalıdır: tek dosya indirme, üç ZIP, dört PDF (iş yükü PDF'i tek POST hedefidir, gövde zorunlu). ADR-0013. */
        DownloadTicketRequest: {
            /** @description Yalnız POST hedefinde zorunlu JSON nesnesi (≤ 64 KiB); GET hedefinde gönderilmez. */
            body?: Record<string, never>;
            /** @enum {string} */
            method: "GET" | "POST";
            /** @description Göreli yol + ham sorgu dizesi (ör. `/v1/files/{id}/download`). */
            path: string;
        };
        DownloadTicketResponse: {
            /** Format: date-time */
            expires_at: string;
            /** @description 256 bit, base64url; 60 sn ömürlü, tek kullanımlık. */
            ticket: string;
            /** @description Göreli tüketme yolu (`/v1/downloads/{ticket}`). */
            url: string;
        };
        EditChatMessageRequest: {
            body: string;
            /**
             * Format: int64
             * @description İstemcinin gördüğü mesaj `edit_revision` değeri (ADR-0027). Eksikse 422 `messaging.input_invalid` + `messaging.revision_required`, pozitif değilse `messaging.revision_invalid`; bayatsa ve gövde farklıysa 409 `messaging.edit_conflict`. Tamsayı olmayan değer 422 `messaging.input_invalid` (alan `body`).
             */
            expected_revision: number;
        };
        /** @description C2 §3.3 kararlı hata gövdesi. İç hata metni hiçbir zaman taşınmaz. */
        ErrorEnvelope: {
            /** @description Kararlı makine kodu (`<alan>.<durum>`); katalog docs/api/error-codes.json. */
            code: string;
            correlation_id?: string;
            details?: string;
            fields?: components["schemas"]["FieldError"][];
            message: string;
            /** @description Sunucunun ürettiği istek kimliği (X-Request-Id ile aynı). */
            request_id: string;
        };
        ExtendRequest: {
            /** @description Ek gün sayısı, 1–90 (aksi 422 `work.input_invalid`). */
            days: number;
        };
        ExtendResult: {
            cascade_count: number;
            /** Format: date */
            new_end_on: string;
        };
        FieldError: {
            code: string;
            field: string;
            message: string;
        };
        FileListItem: {
            content_type: string;
            display_name: string;
            file_id: string;
            /** Format: int64 */
            size_bytes: number;
            /** @description Dosyanın bağlı olduğu alt görev (ADR-0024); yoksa alan yoktur. Alt görev silinince boşalır. */
            subtask_id?: string;
            tag: string;
            uploaded_by_account_id: string;
            work_item_id: string;
        };
        FileRecord: {
            content_type: string;
            display_name: string;
            file_id: string;
            /** Format: int64 */
            size_bytes: number;
            /** @description Dosyanın bağlı olduğu alt görev (ADR-0024); yoksa alan yoktur. */
            subtask_id?: string;
            /** @enum {string} */
            tag: "ister" | "plan" | "girdi" | "analiz" | "cikti" | "sonuc";
            work_item_id: string;
        };
        FileRecordList: {
            files: components["schemas"]["WorkItemFileListItem"][];
        };
        Gantt: {
            links: components["schemas"]["GanttLink"][];
            tasks: components["schemas"]["GanttTask"][];
        };
        GanttLink: {
            cross_department: boolean;
            dependency_id: string;
            /** @description Ön görev. */
            source: string;
            /** @description Bağımlı görev. */
            target: string;
        };
        GanttTask: {
            assignee_account_ids: string[];
            /** @description Boşsa tamamlanmamış. */
            completed_on: string;
            department_id: string;
            end_on: string;
            lateness: components["schemas"]["Lateness"];
            /** @description Boşsa planlanan bitiş `end_on`'dur. */
            planned_end_on: string;
            /** @enum {string} */
            priority: "dusuk" | "orta" | "yuksek" | "acil";
            program_id: string;
            start_on: string;
            status: string;
            title: string;
            work_item_id: string;
        };
        GrantedMembership: {
            account_id: string;
            department_id: string;
        };
        HealthResponse: {
            /** @enum {string} */
            status: "live" | "ready";
        };
        InstanceProfile: {
            api_version: string;
            brand_color: string;
            display_name: string;
            /** @description `0.0.0` = asgari yok. Karşılaştırmayı istemci yapar. */
            minimum_mobile_version: string;
            /** @description IANA saat dilimi adı. */
            timezone: string;
        };
        KnownUser: {
            account_id: string;
            full_name: string;
            /** @description Ekip satırı etiketleri, `program:departman:rol` biçiminde. */
            memberships: string[] | null;
        };
        Lateness: {
            days_early: number;
            days_late: number;
            days_overdue: number;
            is_completed_early: boolean;
            is_completed_late: boolean;
            is_overdue: boolean;
        };
        LinkDepartmentRequest: {
            /** @description Verilirse bu programdaki aynı departmanın ekibi rolleriyle kopyalanır. */
            copy_members_from_program_id?: string;
            department_id: string;
            /** @description Departmanın bu programdaki adı; verilmezse katalog adı kopyalanır. */
            display_name?: string;
        };
        LockoutResetResult: {
            accounts_reset: number;
            /** Format: int64 */
            attempts_cleared: number;
        };
        LoginRequest: {
            captcha_token?: string;
            email: string;
            password: string;
        };
        LoginResponse: {
            /** @description Mobil erişim belirteci (yalnız mobil). */
            access_token?: string;
            account_id: string;
            /**
             * Format: int64
             * @description Erişim/oturum belirtecinin bitişi (Unix saniyesi).
             */
            expires_at: number;
            force_password_change: boolean;
            /**
             * Format: int64
             * @description Yenileme belirtecinin bitişi (Unix saniyesi).
             */
            refresh_expires_at?: number;
            /** @description Mobil yenileme belirteci (yalnız mobil; web'de çerezdedir). */
            refresh_token?: string;
            /** @description Web oturum belirteci (yalnız web). */
            token?: string;
        };
        MarkChatReadRequest: {
            message_id: string;
        };
        MarkedCount: {
            marked_count: number;
        };
        Meeting: {
            /** Format: date-time */
            created_at: string;
            created_by_account_id: string;
            /** @enum {string} */
            created_by_role: "admin" | "coordinator";
            /** Format: date-time */
            deleted_at?: string;
            departments: components["schemas"]["MeetingDepartment"][];
            /** Format: date-time */
            meeting_date: string;
            meeting_id: string;
            members_included: boolean;
            owner_department_id: string;
            program_id: string;
            title: string;
            /** Format: date-time */
            updated_at: string;
        };
        MeetingCreated: {
            /** @description Yazılamayan katılımcı kimlikleri. */
            failed_participants: string[] | null;
            meeting: components["schemas"]["Meeting"];
            side_effects: components["schemas"]["MeetingSideEffects"];
        };
        MeetingDepartment: {
            department_id: string;
            /** @description Bağ kurulduğu andaki departman adı. */
            department_name: string;
        };
        MeetingDetail: components["schemas"]["Meeting"] & {
            agenda: components["schemas"]["AgendaItem"][];
            /** @description Aktif ya da kapanmakta olan konferans; yoksa null. Dış oda adı taşınmaz. */
            conference: components["schemas"]["Conference"] | null;
            /** @description Bağlı video sağlayıcısı oda açabiliyor mu (`none` iken false). İstemci başlat düğmesini buna göre gösterir. */
            conference_available: boolean;
            notes: components["schemas"]["MeetingNoteList"];
            participants: components["schemas"]["Participant"][];
            /** @enum {string} */
            viewer_role: "admin" | "coordinator" | "member";
        };
        MeetingLifecycleResult: {
            meeting_id: string;
            /** @enum {string} */
            status: "restored" | "purged";
        };
        MeetingList: {
            items: components["schemas"]["Meeting"][];
            next_cursor: string;
        };
        MeetingNote: {
            author_account_id: string | null;
            author_name: string;
            /**
             * @description Yazarın rol kopyası; eski notlarda boş (null) olabilir.
             * @enum {string|null}
             */
            author_role: "admin" | "coordinator" | "member" | null;
            content: string;
            converted_to_work_item_id: string | null;
            /** Format: date-time */
            created_at: string;
            /**
             * Format: int64
             * @description Not içeriğinin düzenleme sürümü (ADR-0027); dönüşüm işareti ve silme artırmaz.
             */
            edit_revision: number;
            meeting_id: string;
            note_id: string;
            /** Format: date-time */
            updated_at: string;
        };
        MeetingNoteList: {
            items: components["schemas"]["MeetingNote"][];
            next_cursor: string;
        };
        MeetingRevised: components["schemas"]["Meeting"] & {
            side_effects: components["schemas"]["MeetingSideEffects"];
        };
        /** @description İşlemden sonraki en iyi çabalı yan etkilerin özeti; arıza işlemi geri almaz. */
        MeetingSideEffects: {
            event_failed: boolean;
            failed_messages: number;
        };
        Membership: {
            account_id: string;
            department_id: string;
            membership_id: string;
            /** @description Ekip satırının programı (istek kapsamı). */
            program_id: string;
            /** @description `koordinator` ya da `uye`. */
            role: string;
        };
        MembershipChange: {
            membership_id: string;
            unassigned_tasks: number;
            warning: boolean;
        };
        MeResponse: {
            account_id: string;
            /** @description Hesap şirket yöneticisi mi; kaynak organization yetkisi, üyelikten bağımsız */
            company_admin: boolean;
            email: string;
            /** @description Görünen ad */
            full_name: string;
        };
        MonthlyActivity: {
            completed_tasks: number;
            count: number;
            created_tasks: number;
            meetings: number;
            messages: number;
            month: string;
        };
        /** @description Çağıranın bir programdaki ekip satırı (ekip programa göredir, ADR-0023). */
        MyDepartment: {
            department_id: string;
            /** @description Departmanın bu programdaki adı. */
            display_name: string;
            program_id: string;
            program_name: string;
            role: string;
        };
        MyDepartmentList: {
            departments: components["schemas"]["MyDepartment"][] | null;
        };
        MyTask: {
            status: string;
            title: string;
            work_item_id: string;
        };
        MyTaskList: {
            items: components["schemas"]["MyTask"][];
        };
        NoteConverted: {
            note: components["schemas"]["MeetingNote"];
            work_item_id: string;
        };
        NoteRequest: {
            content: string;
        };
        Notification: {
            /** Format: date-time */
            created_at: string;
            id: string;
            is_read: boolean;
            subject_ref: components["schemas"]["NotificationSubject"];
            /** @description Kaynak olay türü (docs/api/events.md). */
            type: string;
        };
        NotificationList: {
            items: components["schemas"]["Notification"][];
            next_cursor?: string;
            unread_count: number;
        };
        NotificationSubject: {
            id: string;
            kind: string;
        };
        OpenAccountRequest: {
            email: string;
            force_password_change?: boolean;
            full_name?: string;
            password: string;
        };
        OpenDirectChatRequest: {
            account_id: string;
        };
        OverdueTask: {
            assignees: components["schemas"]["ReportPerson"][];
            days_overdue: number;
            department_id: string;
            department_name: string;
            /** Format: date */
            due_on: string;
            title: string;
            work_item_id: string;
        };
        Participant: {
            account_id: string;
            full_name: string;
        };
        ParticipantRequest: {
            user_id: string;
        };
        ParticipantResult: {
            meeting_id: string;
            user_id: string;
        };
        Program: {
            /** @description Yalnız oluşturma yanıtında; yeni kayıt açıldıysa `true`. */
            created?: boolean;
            description?: string;
            name: string;
            program_id: string;
            year?: number;
        };
        ProgramDepartment: {
            /** @description Katalog kodu; kod verilmemişse alan yoktur. */
            code?: string;
            department_id: string;
            /** @description Departmanın bu programdaki adı. */
            display_name: string;
        };
        ProgramDepartmentLink: {
            /** @description Bağ kurulurken kopyalanan ekip satırı sayısı (bağ zaten varsa, kopya istenmediyse ya da ad değiştirmede 0). */
            copied_member_count: number;
            department_id: string;
            /** @description Departmanın bu programdaki adı. */
            display_name: string;
            program_id: string;
        };
        ProgramDepartmentList: {
            departments: components["schemas"]["ProgramDepartment"][];
        };
        ProgramList: {
            programs: components["schemas"]["Program"][];
        };
        ProgramResetResult: {
            files: number;
            /** Format: int64 */
            meetings: number;
            /** Format: int64 */
            messages: number;
            program_id: string;
            tasks: number;
        };
        PushPublicKey: {
            enabled: boolean;
            public_key: string;
        };
        RefreshRequest: {
            /** @description Mobil yenileme belirteci. Boş/yoksa web çerezi okunur. */
            refresh_token?: string;
        };
        RefreshResponse: {
            access_token?: string;
            account_id: string;
            /** Format: int64 */
            expires_at: number;
            /** Format: int64 */
            refresh_expires_at: number;
            refresh_token?: string;
            token?: string;
        };
        RegisterTargetRequest: {
            /** @description Push servisinin https uç noktası (izin listesindeki ana makine). */
            endpoint: string;
            keys: {
                auth: string;
                p256dh: string;
            };
            user_agent?: string;
        };
        RemovedCount: {
            removed: number;
        };
        RenameDepartmentLinkRequest: {
            display_name: string;
        };
        RenameFileRequest: {
            display_name: string;
        };
        ReportAgendaItem: {
            is_checked: boolean;
            title: string;
        };
        ReportDepartment: {
            department_id: string;
            kind?: string;
            name: string;
        };
        ReportMeeting: {
            coordinatorships: components["schemas"]["ReportMeetingDepartment"][];
            created_by: components["schemas"]["ReportPerson"];
            /** @enum {string} */
            created_by_role: "admin" | "coordinator";
            /** Format: date-time */
            meeting_date: string;
            meeting_id: string;
            members_included: boolean;
            note_count: number;
            owner_department_id: string;
            participant_count: number;
            participants: components["schemas"]["ReportPerson"][];
            title: string;
        };
        ReportMeetingDepartment: {
            deleted: boolean;
            department_id: string;
            name: string;
        };
        ReportMeetingDetail: {
            agenda: components["schemas"]["ReportAgendaItem"][];
            meeting: components["schemas"]["ReportMeeting"];
            notes: components["schemas"]["ReportMeetingNote"][];
            participants: components["schemas"]["ReportParticipant"][];
        };
        ReportMeetingList: {
            meetings: components["schemas"]["ReportMeeting"][];
        };
        ReportMeetingNote: {
            author: components["schemas"]["ReportPerson"];
            /**
             * @description Yazarın rol kopyası; rolü kaydedilmemiş eski notlarda boş dizge.
             * @enum {string}
             */
            author_role: "" | "admin" | "coordinator" | "member";
            content: string;
            converted_task_title: string | null;
            converted_to_task_id: string | null;
            /** Format: date-time */
            created_at: string;
            note_id: string;
        };
        ReportParticipant: {
            account_id: string;
            full_name: string;
            role: string;
        };
        ReportPerson: {
            account_id: string;
            full_name: string;
        };
        ReportTask: {
            assignees: components["schemas"]["ReportPerson"][];
            /** Format: date */
            completed_on: string | null;
            /** Format: date-time */
            created_at: string;
            created_by: components["schemas"]["ReportPerson"];
            days_early: number;
            days_late: number;
            days_overdue: number;
            department_id: string;
            department_name: string;
            dependency_count: number;
            /** Format: date */
            end_on: string;
            has_pending_dependency: boolean;
            is_completed_early: boolean;
            is_completed_late: boolean;
            is_overdue: boolean;
            note_count: number;
            /** Format: date */
            planned_end_on: string | null;
            /** @enum {string} */
            priority: "dusuk" | "orta" | "yuksek" | "acil";
            /** Format: date */
            start_on: string;
            status: string;
            title: string;
            work_item_id: string;
        };
        ReportTaskDetail: {
            dependencies: components["schemas"]["ReportTaskRef"][];
            description: string;
            recent_notes: components["schemas"]["ReportTaskNote"][];
            task: components["schemas"]["ReportTask"];
        };
        ReportTaskList: {
            tasks: components["schemas"]["ReportTask"][];
            total: number;
        };
        ReportTaskNote: {
            author: components["schemas"]["ReportPerson"];
            content: string;
            /** Format: date-time */
            created_at: string;
        };
        ReportTaskRef: {
            department_name: string;
            status: string;
            title: string;
            work_item_id: string;
        };
        ResetProgramRequest: {
            password: string;
        };
        ReviewRequest: {
            /**
             * @description `approved` ya da `rejected`.
             * @enum {string}
             */
            decision: "approved" | "rejected";
        };
        ReviewResult: {
            affected_tasks_count: number;
        };
        ReviseMeetingNoteRequest: {
            content: string;
            /**
             * Format: int64
             * @description İstemcinin gördüğü not `edit_revision` değeri (ADR-0027). Eksikse 422 `collaboration.input_invalid` + `collaboration.revision_required`, pozitif değilse `collaboration.revision_invalid`; bayatsa ve içerik farklıysa 409 `collaboration.edit_conflict`. Tamsayı olmayan değer 422 `collaboration.input_invalid` (alan `body`).
             */
            expected_revision: number;
        };
        RosterList: {
            members: components["schemas"]["RosterMember"][] | null;
        };
        RosterMember: {
            account_id: string;
            full_name: string;
            membership_id: string;
            role: string;
            /** @enum {string} */
            status: "active" | "deleted";
        };
        SeasonReport: {
            coordinatorship_performance: components["schemas"]["CoordinatorshipStat"][];
            date_change_stats: {
                approved: number;
                pending: number;
                rejected: number;
                total: number;
            };
            /** Format: date-time */
            generated_at: string;
            meeting_stats: {
                converted_to_task: number;
                total_meetings: number;
                total_notes: number;
                total_participants: number;
            };
            message_stats: {
                from_admins: number;
                from_others: number;
                total: number;
            };
            monthly_activity: components["schemas"]["MonthlyActivity"][];
            priority_distribution: {
                [key: string]: number;
            };
            program_id: string;
            program_name: string;
            stats: {
                completed_tasks: number;
                completion_rate: number;
                overdue_tasks: number;
                total_attachments: number;
                total_coordinatorships: number;
                total_meetings: number;
                total_members: number;
                total_messages: number;
                total_notes: number;
                total_tasks: number;
                total_users: number;
            };
            task_status_distribution: {
                [key: string]: number;
            };
            tasks: components["schemas"]["ReportTask"][];
        };
        SendChatMessageRequest: {
            /** @description Düz metin, en çok 5.000 karakter; kontrol karakteri reddedilir. */
            body: string;
            /** @description İstemcinin ürettiği tekrar kimliği; 1–100 bayt yazdırılabilir ASCII, boşluksuz; (sohbet, gönderen) başına tekil. */
            client_message_id: string;
            /**
             * @description Yapılandırılmış bahsetme listesi; sunucu metni ayrıştırmaz. En çok 20 (tekrar sessizce
             *     tekilleşir). `account` hedefinin sohbet üyeliği doğrulanmaz (ad çözülmez, rozet yalnız
             *     görünür sohbette); `department` programa bağlı olmalı; `all` yalnız grupta ve yalnız
             *     yönetici/kurucu (birebirde 422 `messaging.input_invalid`, yetkisiz 403
             *     `messaging.not_authorized`). Düzenleme bahsetmeyi değiştirmez.
             */
            mentions?: components["schemas"]["ChatMention"][];
            /** @description Mesajı anket olarak açar (soru = gövde; yalnız grupta, birebirde 422, alan `poll`). */
            poll?: {
                /**
                 * Format: date-time
                 * @description Şimdiden sonra olmalıdır.
                 */
                closes_at?: string;
                multi?: boolean;
                /** @description 2–10 tekil, tek satır seçenek (en çok 100 karakter). */
                options: string[];
            };
            /**
             * @description Paylaşılan öğeler (görev, koordinatörlük, arşiv dosyası); en çok 10, tekrar tekilleşir.
             *     Hedef gönderenin bugünkü yetkisiyle görünür ve sohbetin programında olmalı; aksi tek
             *     422 `messaging.input_invalid` (`field: refs`) — varlık sızmaz. Denetim gönderim
             *     transaction'ından önce yapılır; aynı istemci kimliğiyle tekrar, referans artık
             *     görünmüyorsa 422 alır (ilk mesaj durur).
             */
            refs?: {
                /** @enum {string} */
                kind: "task" | "department" | "file";
                target_id: string;
            }[];
            reply_to_message_id?: string;
        };
        SetChatReactionRequest: {
            /** @enum {string} */
            kind: "like" | "heart" | "check" | "star";
        };
        StatusResult: {
            /** @description İşlemin sonucu (ör. `deleted`, `claimed`, `unclaimed`, `updated`, `removed`). */
            status: string;
        };
        SubtaskCounts: {
            done: number;
            total: number;
        };
        SystemInfo: {
            api_version: string;
            /** @description Bu sunucu sürümünün sunduğu yetenek adları; bu sürümde [work, program, records, notifications]. Adlar tablo/aile adı değildir. */
            capabilities: string[] | null;
            company_display_name: string;
            /** @description Aktivasyon tamamlanmadıysa boş. */
            instance_id: string;
            minimum_mobile_version: string;
            product_id: string;
            server_version: string;
        };
        TargetResult: {
            status: string;
            target_id: string;
        };
        TaskSummary: {
            active_items: number;
            completed_items: number;
            department_id: string;
        };
        TransferHistory: {
            next_cursor?: string;
            transfers: components["schemas"]["TransferHistoryItem"][];
        };
        TransferHistoryItem: {
            /** Format: date-time */
            created_at: string;
            cut_dependency_count: number;
            department_id: string;
            /** @description Aktarımın hedef programın departman ekibine `uye` olarak eklediği (ön izlemede ekleyeceği) atanan kişiler (ADR-0023 kural 12). */
            granted_memberships: components["schemas"]["GrantedMembership"][];
            moved_file_count: number;
            moved_item_count: number;
            restored_dependency_count: number;
            reverses_transfer_id?: string;
            skipped_work_item_ids?: string[];
            source_program_id: string;
            target_program_id: string;
            transfer_id: string;
            work_item_ids: string[] | null;
        };
        TransferPreview: {
            blockers: string[];
            can_execute: boolean;
            cut_dependency_ids?: string[];
            cycle_work_item_ids?: string[];
            file_count: number;
            /** Format: int64 */
            file_total_bytes: number;
            /** @description Aktarımın hedef programın departman ekibine `uye` olarak eklediği (ön izlemede ekleyeceği) atanan kişiler (ADR-0023 kural 12). */
            granted_memberships: components["schemas"]["GrantedMembership"][];
            missing_access: boolean;
            missing_file_ids?: string[];
            preserved_dependency_count: number;
            preview_fingerprint: string;
            resolved_work_item_ids: string[] | null;
            unresolved_work_item_ids?: string[];
            warnings: string[];
        };
        TransferPreviewRequest: {
            department_id?: string;
            source_program_id?: string;
            target_program_id?: string;
            work_item_ids?: string[] | null;
        };
        /** @description İleri aktarımda kaynak/hedef program, departman ve kalemler; ters aktarımda `reverses_transfer_id`. Eksik/çelişkili alan 422 program.transfer_input_invalid. */
        TransferRequest: {
            add_missing_access?: boolean;
            department_id?: string;
            preview_fingerprint?: string;
            /** @description Doluysa istek o aktarımın tersidir. */
            reverses_transfer_id?: string;
            source_program_id?: string;
            target_program_id?: string;
            work_item_ids?: string[] | null;
        };
        TransferResult: {
            cut_dependency_count: number;
            granted_links: string[];
            /** @description Aktarımın hedef programın departman ekibine `uye` olarak eklediği (ön izlemede ekleyeceği) atanan kişiler (ADR-0023 kural 12). */
            granted_memberships: components["schemas"]["GrantedMembership"][];
            moved_file_count: number;
            moved_work_item_ids: string[] | null;
            replayed: boolean;
            restored_dependency_count: number;
            /** @description Ters aktarımda tersine çevrilen aktarımın kurduğu ama geri alınmayan bağların departman kimlikleri. Bağ, çiftte canlı görev kaldıysa ya da aktarımın eklediği satırlar silindikten sonra çiftin ekibinde aktarım dışı satır (elle eklenen, yeniden eklenen ya da artık `uye` olmayan) kaldıysa korunur (ADR-0023 kural 12). */
            retained_links: string[];
            revoked_links: string[];
            skipped_work_item_ids?: string[];
            transfer_id: string;
        };
        TransitionRequest: {
            /** @description Yalnız `tamamlandi` hedefinde: açık alt görevleri aynı işlemde kapatır (ADR-0024); başka hedefte 422 `work.input_invalid`. Verilmezse açık alt görev 409 `work.subtasks_open` üretir. */
            close_subtasks?: boolean;
            pull_end_date?: boolean;
            /** @description Geri alma geçişlerinde zorunlu gerekçe. */
            reason?: string;
            /**
             * @description Hedef durum.
             * @enum {string}
             */
            to: "baslanmadi" | "devam_ediyor" | "onaya_sunuldu" | "iade_edildi" | "tamamlandi";
        };
        TransitionResult: {
            /** @enum {string} */
            actor: "uye" | "koordinator" | "koordinator_kendi_gorevi";
            /** Format: date */
            end_on?: string;
            from: string;
            to: string;
            work_item_id: string;
        };
        UpdateAccountRequest: {
            email?: string;
            force_password_change?: boolean;
            full_name?: string;
            password?: string;
        };
        UpdateAgendaItemRequest: {
            is_checked?: boolean | null;
            title?: string | null;
        };
        /** @description Verilmeyen alan değişmez; en az biri gerekir. */
        UpdateChatRequest: {
            name?: string;
            /** @enum {string} */
            source?: "none" | "department" | "program";
            source_department_id?: string;
        };
        UpdateDepartmentRequest: {
            code?: string | null;
            description?: string | null;
            /**
             * @description Gönderilmezse ya da boşsa tür değişmez.
             * @enum {string|null}
             */
            kind?: "koordinatorluk" | "calisma_grubu" | null;
            name?: string | null;
        };
        UpdateMeetingRequest: {
            department_ids?: string[] | null;
            /** @description Verilirse kuruluştaki kuralla aynı: geçmiş gün olamaz. */
            meeting_date?: string | null;
            members_included?: boolean | null;
            title?: string | null;
        };
        UpdateProgramRequest: {
            description?: string | null;
            name?: string | null;
            year?: number | null;
        };
        /** @description Verilmeyen alan değişmez. `assignee_account_id`, `start_on`, `end_on` boş dizgeyle kaldırılır (tarihler birlikte). */
        UpdateSubtaskRequest: {
            assignee_account_id?: string;
            /** @description true kapatır, false yeniden açar (tamamlanmış görevde 409 `work.item_completed`). */
            done?: boolean;
            end_on?: string;
            /**
             * Format: int64
             * @description İstemcinin gördüğü `edit_revision` (ADR-0027). title, assignee_account_id, start_on ya da end_on varsa zorunludur (422 `work.input_invalid` + `work.revision_required` / `work.revision_invalid`); yalnız `done` gönderildiğinde gerekmez. Bayat sürüm ve farklı değer 409 `work.edit_conflict`.
             */
            expected_revision?: number;
            start_on?: string;
            title?: string;
        };
        UpdateUserRequest: {
            company_admin?: boolean | null;
            email?: string | null;
            force_password_change?: boolean | null;
            full_name?: string | null;
            reset_password?: boolean | null;
        };
        UpdateWorkItemRequest: {
            /** @description Korumalı alan; dolu gönderilirse 422 work.input_invalid. */
            completed_on?: string | null;
            /** @description Tamamlanma kanıtı bayrağı (ADR-0024); verilmezse değişmez. Değişim audit ve olay yazar. */
            completion_evidence_required?: boolean | null;
            description?: string | null;
            /** Format: date */
            end_on?: string | null;
            /**
             * Format: int64
             * @description İstemcinin gördüğü `dates_revision` (ADR-0027). Gövdede start_on, end_on ya da planned_end_on varsa zorunludur; kodlar `expected_revision` ile aynıdır, 409 zarfının alanı `expected_dates_revision`dır. İki grup tek transaction içindedir: biri çatışırsa hiçbiri yazılmaz.
             */
            expected_dates_revision?: number;
            /**
             * Format: int64
             * @description İstemcinin gördüğü `edit_revision` (ADR-0027). Gövdede title, description, priority ya da completion_evidence_required varsa zorunludur: yoksa 422 `work.input_invalid` + alan kodu `work.revision_required`, pozitif değilse `work.revision_invalid`; bayatsa ve istenen değerler güncelden farklıysa 409 `work.edit_conflict` (alan `expected_revision`). Değerler zaten günceldeyse 200 ve değişiklik yok. Tamsayı olmayan değer 422 `platform.body_invalid` alır (alan bilgisi yok).
             */
            expected_revision?: number;
            /** Format: date */
            planned_end_on?: string | null;
            /** @enum {string|null} */
            priority?: "dusuk" | "orta" | "yuksek" | "acil" | null;
            /** Format: date */
            start_on?: string | null;
            /** @description Korumalı alan; dolu gönderilirse 422 work.input_invalid. */
            submitted_on?: string | null;
            title?: string | null;
        };
        UpdateWorkNoteRequest: {
            content: string;
            /**
             * Format: int64
             * @description İstemcinin gördüğü not `edit_revision` değeri (ADR-0027). Eksikse 422 `work.input_invalid` + `work.revision_required`, pozitif değilse `work.revision_invalid`; bayatsa ve içerik farklıysa 409 `work.edit_conflict`. Tamsayı olmayan değer 422 `platform.body_invalid` (alan bilgisi yok).
             */
            expected_revision: number;
        };
        UserList: {
            next_cursor?: string;
            users: components["schemas"]["KnownUser"][] | null;
        };
        UserResult: {
            account_id: string;
            changed_fields?: string[];
            created?: boolean;
            membership_id?: string;
            revoked_sessions?: number;
            transferred?: boolean;
        };
        VoteChatPollRequest: {
            option_indexes: number[];
        };
        WorkItem: {
            assignee_account_ids: string[];
            /** @description Atananlar görünen adlarıyla; sıra `assignee_account_ids` ile aynıdır. `assignee_account_ids` geriye uyum için korunur. */
            assignees: components["schemas"]["WorkItemAssignee"][];
            /** Format: date */
            completed_on?: string;
            /** @description Tamamlanma kanıtı bayrağı (ADR-0024): açıkken onaya sunma, doğrudan tamamlama ve onay en az bir ek dosya ister. */
            completion_evidence_required: boolean;
            /**
             * Format: date-time
             * @description Görevin oluşturulma zamanı (UTC, RFC 3339; WORK-K83). Görev listeleri, `getWorkItem`,
             *     oluşturma ve güncelleme cevaplarında aynı değerdir; güncelleme değiştirmez. İstemci
             *     "tanımlanma tarihine göre" sıralamayı bu alanla yapar.
             */
            created_at: string;
            /** @description Görevi oluşturan hesabın kimliği (WORK-K83). Satırı görebilen herkes görür. */
            created_by_account_id: string;
            /** @description Oluşturanın görünen adı (WORK-K83); `WorkItemAssignee.full_name` ile aynı kural: hesabın satırı yoksa ya da ad okuması o an başarısızsa `null` (yanıt yine başarılıdır); silinmiş (geri yüklenebilir) hesabın adı döner. */
            created_by_full_name: string | null;
            /**
             * Format: int64
             * @description Tarih grubunun (başlangıç, bitiş, planlanan bitiş) düzenleme sürümü (ADR-0027); PATCH gövdesinde `expected_dates_revision` olarak geri gönderilir. Bu üç değeri ya da tamamlanma gününü değiştiren her yol artırır (form, tarih talebi onayı, uzatma, iki çekme, yönetici ayarı, tamamlanmaya geçiş, bağımlılık zinciri); gönderim çıpası artırmaz.
             */
            dates_revision: number;
            days_early: number;
            days_late: number;
            days_overdue: number;
            department_id: string;
            /**
             * Format: int64
             * @description Görev alanları grubunun (başlık, açıklama, öncelik, kanıt bayrağı) düzenleme sürümü (ADR-0027); PATCH gövdesinde `expected_revision` olarak geri gönderilir. Durum, atama, aktarım ve silme artırmaz.
             */
            edit_revision: number;
            /**
             * Format: date
             * @description Bitiş günü (tarih kaydından). Geç tamamlamada tamamlanma gününe itilmiş olabilir; özgün plan `planned_end_on`dadır.
             */
            end_on: string;
            is_completed_early: boolean;
            is_completed_late: boolean;
            is_overdue: boolean;
            /**
             * @description Görevin bekleyen tarih talebi (WORK-K82). Her cevapta bulunur; `null` "bekleyen talep
             *     yok ya da çağıran görmeye yetkili değil" demektir ve her uçta aynı anlamı taşır.
             *     Görev listeleri (`listProgramWorkItems`, `listWorkItems`), `getWorkItem`, oluşturma
             *     ve güncelleme cevapları aynı kuralla doldurur: şirket yöneticisine her görevde,
             *     koordinatöre yalnız **bu programda** koordinatörü olduğu departmanın görevinde.
             *     Üyeye (birleşik rolde yalnız üye olduğu departmanın görevinde de) `null`.
             *     Onaylanmış ya da reddedilmiş talep görünmez. Yeni oluşturulan görevin bekleyen
             *     talebi olamayacağından oluşturma cevabında her zaman `null`'dır.
             */
            pending_date_request: {
                /** Format: date */
                new_end_on: string;
                /** Format: date */
                new_start_on: string;
                /** @description Talep kimliği (`reviewDateChangeRequest` yolundaki `id`). */
                request_id: string;
            } | null;
            /** Format: date */
            planned_end_on?: string;
            /** @enum {string} */
            priority: "dusuk" | "orta" | "yuksek" | "acil";
            program_id: string;
            /**
             * Format: date
             * @description Planlanan başlangıç günü (tarih kaydından; liste, oluşturma, güncelleme ve tekil uçta dolu).
             */
            start_on: string;
            /** @enum {string} */
            status: "baslanmadi" | "devam_ediyor" | "onaya_sunuldu" | "iade_edildi" | "tamamlandi";
            subtask_counts: components["schemas"]["SubtaskCounts"];
            title: string;
            work_item_id: string;
        };
        WorkItemAssignee: {
            account_id: string;
            /** @description Görünen ad. Hesabın satırı yoksa `null` (boş dize değil); ad okuması o an başarısızsa da geçici olarak `null` (yanıt yine başarılıdır). İstemci nötr etiket gösterir. Silinmiş (geri yüklenebilir) hesabın adı döner. */
            full_name: string | null;
        };
        WorkItemDates: {
            /** Format: date */
            completed_on?: string;
            /** Format: date */
            end_on: string;
            /** Format: date */
            original_completed_on?: string;
            /** Format: date */
            planned_end_on?: string;
            /** Format: date */
            start_on: string;
            /** Format: date */
            submitted_on?: string;
        };
        /** @description Tekil görev cevabı: `WorkItem` alanları ve zorunlu açıklama (boş dize olabilir). Açıklama listede taşınmaz. */
        WorkItemDetail: components["schemas"]["WorkItem"] & {
            description: string;
        };
        /** @description Görev dosya listesinin öğesi: `FileListItem` alanları ve yükleyenin görünen adı. Arşiv listesi (`FileListItem`) bu alanı taşımaz. */
        WorkItemFileListItem: {
            content_type: string;
            display_name: string;
            file_id: string;
            /** Format: int64 */
            size_bytes: number;
            /** @description Dosyanın bağlı olduğu alt görev (ADR-0024); yoksa alan yoktur. Alt görev silinince boşalır. */
            subtask_id?: string;
            tag: string;
            uploaded_by_account_id: string;
            /** @description Yükleyenin görünen adı; satırı olmayan hesapta ya da ad okuması o an başarısızsa (geçici) `null`, silinmiş hesabın adı döner. */
            uploaded_by_full_name: string | null;
            work_item_id: string;
        };
        WorkItemLifecycleResult: {
            /** @enum {string} */
            status: "restored";
            work_item_id: string;
        };
        WorkItemList: {
            items: components["schemas"]["WorkItem"][];
            next_cursor?: string;
        };
        WorkItemNote: {
            author_account_id: string;
            /** @description Yazarın görünen adı; ad çözülemezse (geçici okuma hatası dahil) `null`. */
            author_full_name: string | null;
            content: string;
            /** Format: date-time */
            created_at: string;
            /**
             * Format: int64
             * @description Not içeriğinin düzenleme sürümü (ADR-0027).
             */
            edit_revision: number;
            note_id: string;
            /** Format: date-time */
            updated_at: string;
            work_item_id: string;
        };
        WorkItemNoteList: {
            notes: components["schemas"]["WorkItemNote"][];
            total: number;
        };
        WorkItemPurgeResult: {
            files_deleted: number;
            /** @enum {string} */
            status: "purged";
            work_item_id: string;
        };
        WorkItemSubtask: {
            assignee_account_id?: string;
            /** @description Atananın görünen adı; atanan yoksa ya da ad çözülemezse (geçici okuma hatası dahil) `null`. */
            assignee_full_name: string | null;
            /** Format: date-time */
            created_at: string;
            created_by_account_id: string;
            /** @description Oluşturanın görünen adı; ad çözülemezse (geçici okuma hatası dahil) `null`. */
            created_by_full_name: string | null;
            done: boolean;
            /** Format: date-time */
            done_at?: string;
            done_by_account_id?: string;
            /** @description Kapatanın görünen adı; açık alt görevde ya da ad çözülemezse (geçici okuma hatası dahil) `null`. */
            done_by_full_name: string | null;
            /**
             * Format: int64
             * @description Yönetim alanlarının (başlık, atanan, tarihler) düzenleme sürümü (ADR-0027); kapatma/açma artırmaz, atama kaldırma ve ekip devrinin atanan boşaltması artırır.
             */
            edit_revision: number;
            /** Format: date */
            end_on?: string;
            /** Format: date */
            start_on?: string;
            subtask_id: string;
            title: string;
            /** Format: date-time */
            updated_at: string;
            work_item_id: string;
        };
        WorkItemSubtaskList: {
            subtasks: components["schemas"]["WorkItemSubtask"][];
            total: number;
        };
        WorkloadMember: {
            account_id: string;
            coordinatorships: components["schemas"]["ReportDepartment"][];
            full_name: string;
            tasks: components["schemas"]["WorkloadTask"][];
        };
        WorkloadPdfRequest: {
            /** @description Boş ya da yoksa bütün üyeler. */
            member_ids?: string[] | null;
        };
        WorkloadReport: {
            coordinatorships: components["schemas"]["ReportDepartment"][];
            /** Format: date-time */
            generated_at: string;
            members: components["schemas"]["WorkloadMember"][];
            program_id: string;
            program_name: string;
            total: number;
        };
        WorkloadTask: {
            attachment_count: number;
            /** Format: date */
            completed_on: string | null;
            days_overdue: number;
            department_id: string;
            department_name: string;
            /** Format: date */
            end_on: string;
            has_attachment: boolean;
            is_overdue: boolean;
            /** @description Görevin son notu; not yoksa alan gönderilmez. */
            latest_note?: string;
            /** @enum {string} */
            priority: "dusuk" | "orta" | "yuksek" | "acil";
            /** Format: date */
            start_on: string;
            status: string;
            title: string;
            work_item_id: string;
        };
        WorkNoteRequest: {
            content: string;
        };
        WorkNoteUpdated: {
            /**
             * Format: int64
             * @description Notun yeni düzenleme sürümü (ADR-0027); içerik zaten günceldeyse mevcut sürüm.
             */
            edit_revision: number;
            /** @description Her zaman `updated`. */
            status: string;
        };
    };
    responses: never;
    parameters: {
        /** @description `mobile` ise mobil belirteç çifti gövdede döner; diğer her değer web sayılır. */
        ClientCategory: string;
        /** @description `true` ise görev etkisi onaylanmış sayılır (aksi hâlde 409 organization.confirmation_required). */
        Confirm: "true" | "false";
        /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
        CsrfHeader: string;
        /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
        Cursor: string;
        /** @description Departman kapsamı (S3 uçlarda zorunlu). */
        DepartmentScope: string;
        /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
        IdempotencyKey: string;
        /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
        Limit: number;
        PathAccountID: string;
        PathChatID: string;
        PathDepartmentID: string;
        PathID: string;
        PathItemID: string;
        PathMessageID: string;
        PathNoteID: string;
        PathSubtaskID: string;
        PathUserID: string;
        /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
        ProgramScope: string;
        UserRole: string;
        UserSearch: string;
        UserSortBy: string;
        UserSortOrder: string;
        /** @description Web yenileme belirteci (gövdede `refresh_token` yoksa okunur). */
        WebRefreshCookie: string;
    };
    requestBodies: never;
    headers: {
        /** @description Her API yanıtı önbelleğe alınmaz (`no-store`). */
        CacheControlNoStore: "no-store";
        /** @description Gövdenin bayt uzunluğu. */
        ContentLength: number;
        /** @description Liste üst sınırda kesildiyse `true` (en çok 200 satır). */
        ResultTruncated: "true";
        /** @description Yeniden denemeden önce beklenecek saniye. */
        RetryAfter: number;
        /** @description Web girişinde/yenilemesinde HttpOnly yenileme çerezi; mobil yanıtta yoktur. */
        WebRefreshSetCookie: string;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    systemInfo: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SystemInfo"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    healthLive: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    healthReady: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    openAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OpenAccountRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez / parola özeti kapasitesi dolu */
            503: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateAccountRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez / parola özeti kapasitesi dolu */
            503: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    unlockAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listDeletedAccounts: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeletedAccountList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listDeletedDepartments: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeletedDepartmentList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    adminListDeletedMeetings: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listDeletedWorkItems: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeletedWorkItemList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    permanentDeleteAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountLifecycleResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    permanentDeleteDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DepartmentLifecycleResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    permanentDeleteMeeting: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingLifecycleResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    permanentDeleteWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemPurgeResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    restoreAccount: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountLifecycleResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    restoreDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DepartmentLifecycleResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    restoreMeeting: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingLifecycleResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    restoreWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemLifecycleResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    resetLockouts: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LockoutResetResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listUsers: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
                role?: components["parameters"]["UserRole"];
                search?: components["parameters"]["UserSearch"];
                sort_by?: components["parameters"]["UserSortBy"];
                sort_order?: components["parameters"]["UserSortOrder"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createUser: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateUserRequest"];
            };
        };
        responses: {
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez / parola özeti kapasitesi dolu */
            503: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteUser: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateUser: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateUserRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez / parola özeti kapasitesi dolu */
            503: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    assistantChat: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssistantChatRequest"];
            };
        };
        responses: {
            /** @description SSE akışı (olaylar `AssistantEvent*` şemalarında) */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde çok büyük */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    assistantConversations: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssistantConversationList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    assistantConversation: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssistantConversationDetail"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteAssistantConversation: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    login: {
        parameters: {
            query?: never;
            header: {
                /** @description `mobile` ise mobil belirteç çifti gövdede döner; diğer her değer web sayılır. */
                "X-Nizamio-Client"?: components["parameters"]["ClientCategory"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Set-Cookie": components["headers"]["WebRefreshSetCookie"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Parola özeti kapasitesi dolu */
            503: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    changePassword: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePasswordRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChangePasswordResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Parola özeti kapasitesi dolu */
            503: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    refresh: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: {
                /** @description Web yenileme belirteci (gövdede `refresh_token` yoksa okunur). */
                nizamio_web_refresh?: components["parameters"]["WebRefreshCookie"];
            };
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Set-Cookie": components["headers"]["WebRefreshSetCookie"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RefreshResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    downloadChatAttachment: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                attachmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    /** @description attachment; filename (ASCII yedek) ve filename* (UTF-8). */
                    "Content-Disposition"?: string;
                    "Content-Length": components["headers"]["ContentLength"];
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    downloadChatSharedFile: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                refId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    /** @description attachment; filename (ASCII yedek) ve filename* (UTF-8). */
                    "Content-Disposition"?: string;
                    "Content-Length": components["headers"]["ContentLength"];
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getChatRefSummary: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                refId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatRefSummary"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listChats: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
                /** @description Arama: grup adı, silinmemiş mesaj metni (ILIKE) ya da birebirde karşı tarafın adı (Türkçe duyarlı katlamayla). Mesaj metninde Türkçe katlama yoktur (GAP-213). En çok 100 karakter. */
                q?: string;
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getChat: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chat"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteChat: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateChat: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateChatRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chat"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    grantChatAdmin: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    revokeChatAdmin: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    sendChatAttachment: {
        parameters: {
            query: {
                client_message_id: string;
                reply_to_message_id?: string;
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** @description İsteğe bağlı açıklama; dosya parçasından ÖNCE gönderilir. */
                    body?: string;
                    /** Format: binary */
                    file: string;
                };
            };
        };
        responses: {
            /** @description Aynı istemci kimliğinin tekrarı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMessage"];
                };
            };
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMessage"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listChatMembers: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMemberList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    addChatMembers: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddChatMembersRequest"];
            };
        };
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    removeChatMember: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listChatMessages: {
        parameters: {
            query?: {
                /** @description Bu seq'den sonraki mesajlar (uzlaştırma). */
                after?: number;
                /** @description Bu seq çevresindeki pencere. */
                around?: number;
                /** @description Bu seq'den önceki mesajlar. */
                before?: number;
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
                /** @description Sohbet içi metin araması (ILIKE; Türkçe katlama yok); yalnız `before` ile birleşir, `after`/`around` ile 422 `messaging.invalid_cursor`. */
                q?: string;
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatHistory"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    sendChatMessage: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendChatMessageRequest"];
            };
        };
        responses: {
            /** @description Aynı `client_message_id` ile önceki mesaj */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMessage"];
                };
            };
            /** @description Mesaj yazıldı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMessage"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteChatMessage: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    editChatMessage: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EditChatMessageRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMessage"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    pinChatMessage: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı (gövde yok) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    unpinChatMessage: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı (gövde yok) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    closeChatPoll: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı (gövde yok) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    setChatReaction: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetChatReactionRequest"];
            };
        };
        responses: {
            /** @description Başarılı (gövde yok) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteChatReaction: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı (gövde yok) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createTaskFromChatMessage: {
        parameters: {
            query?: never;
            header: {
                /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
                "Idempotency-Key": components["parameters"]["IdempotencyKey"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateTaskFromChatMessageRequest"];
            };
        };
        responses: {
            /** @description İşlem anahtarı tekrarı: aynı anahtar ve aynı istek ilk kaynağın bugünkü temsilini döndürür; yan etki yok (ADR-0027). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMessageTaskCreated"];
                };
            };
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatMessageTaskCreated"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    voteChatPoll: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
                messageId: components["parameters"]["PathMessageID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VoteChatPollRequest"];
            };
        };
        responses: {
            /** @description Başarılı (gövde yok) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listChatPins: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatPins"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    markChatRead: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MarkChatReadRequest"];
            };
        };
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listChatRefs: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                kind?: "task" | "department" | "file";
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatRefList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    sendChatTyping: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                chatId: components["parameters"]["PathChatID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı (gövde yok) */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listChatCandidates: {
        parameters: {
            query: {
                /** @description `purpose=group` iken mevcut grubun kimliği: üyeler adaylardan düşer. */
                chat_id?: string;
                /** @description `direct` (birebir kuralına uyanlar) ya da `group` (ekleme kuralına uyanlar). */
                purpose: "direct" | "group";
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatCandidateList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    openDirectChat: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OpenDirectChatRequest"];
            };
        };
        responses: {
            /** @description Mevcut birebir (kural sorulmaz) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chat"];
                };
            };
            /** @description Yeni birebir açıldı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chat"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createGroupChat: {
        parameters: {
            query?: never;
            header: {
                /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
                "Idempotency-Key": components["parameters"]["IdempotencyKey"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateGroupChatRequest"];
            };
        };
        responses: {
            /** @description İşlem anahtarı tekrarı: aynı anahtar ve aynı istek ilk kaynağın bugünkü temsilini döndürür; yan etki yok (ADR-0027). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chat"];
                };
            };
            /** @description Grup kuruldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Chat"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    markAllChatsRead: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    streamChatEvents: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description SSE akışı (olay yükü `ChatEvent`) */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listDateChangeRequests: {
        parameters: {
            query?: {
                /** @description `pending` ise yalnız bekleyenler; diğer değerler hepsi. */
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DateChangeRequestList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    requestDateChange: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DateChangeRequestCreate"];
            };
        };
        responses: {
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DateChangeRequest"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteDateChangeRequest: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reviewDateChangeRequest: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReviewResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    myDateChangeRequests: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DateChangeRequestList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listDepartments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DepartmentList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateDepartmentRequest"];
            };
        };
        responses: {
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Department"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DeleteDepartmentResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateDepartmentRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Department"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listAssignable: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AssignableList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsam başlığı eksik */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    assignCoordinator: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CoordinatorRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CoordinatorResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    removeCoordinator: {
        parameters: {
            query?: {
                /** @description `true` ise görev etkisi onaylanmış sayılır (aksi hâlde 409 organization.confirmation_required). */
                confirm?: components["parameters"]["Confirm"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MembershipChange"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası. `work.input_invalid`: çağıran kendi koordinatörlüğünü kaldırmak istedi (öz-koruma yok, atama devri kendisine yönelir — GAP-089). */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listMembers: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RosterList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsam başlığı eksik ya da departman bu programa bağlı değil */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    assignMembership: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignMembershipRequest"];
            };
        };
        responses: {
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Membership"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    removeMember: {
        parameters: {
            query?: {
                /** @description `true` ise görev etkisi onaylanmış sayılır (aksi hâlde 409 organization.confirmation_required). */
                confirm?: components["parameters"]["Confirm"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MembershipChange"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsam başlığı eksik */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateMembershipRole: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangeRoleRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MembershipChange"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    taskSummary: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskSummary"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsam başlığı eksik ya da departman bu programa bağlı değil */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    issueDownloadTicket: {
        parameters: {
            query?: never;
            header: {
                /** @description Hedef S3 ise departman kapsamı (bilete yazılır). */
                "X-Nizamio-Department"?: string;
                /** @description Hedef S2/S3 ise program kapsamı (bilete yazılır). */
                "X-Nizamio-Program"?: string;
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DownloadTicketRequest"];
            };
        };
        responses: {
            /** @description Bilet üretildi */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DownloadTicketResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı ya da oturumun açık bilet tavanı (16) aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    redeemDownloadTicket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ticket: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Hedef ucun yanıtı (dosya, ZIP ya da PDF) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": unknown;
                };
            };
            /** @description Bilet geçersiz (biçim, bilinmeyen, tüketilmiş, süresi dolmuş, oturum geçersiz — ayırt edilmez) */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteFile: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    downloadFile: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    /** @description attachment; filename (ASCII yedek) ve filename* (UTF-8). */
                    "Content-Disposition"?: string;
                    "Content-Length": components["headers"]["ContentLength"];
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    renameFile: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RenameFileRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FileRecord"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    instanceProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InstanceProfile"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeResponse"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getChatUnreadOverview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatUnreadOverview"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    myDepartments: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyDepartmentList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteAgendaItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                itemId: components["parameters"]["PathItemID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateAgendaItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                itemId: components["parameters"]["PathItemID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateAgendaItemRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgendaItem"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteMeetingNote: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                noteId: components["parameters"]["PathNoteID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateMeetingNote: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                noteId: components["parameters"]["PathNoteID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviseMeetingNoteRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingNote"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    convertNoteToTask: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                noteId: components["parameters"]["PathNoteID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConvertNoteRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NoteConverted"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listMeetings: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createMeeting: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateMeetingRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingCreated"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getMeeting: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingDetail"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteMeeting: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateMeeting: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateMeetingRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingRevised"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listAgenda: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgendaList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    addAgendaItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AgendaItemRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AgendaItem"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    startConference: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["ConferenceEmptyRequest"];
            };
        };
        responses: {
            /** @description Aktif konferans zaten var */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConferenceResult"];
                };
            };
            /** @description Konferans başlatıldı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConferenceResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    endConference: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    joinConference: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["ConferenceEmptyRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConferenceToken"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listMeetingNotes: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingNoteList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    addMeetingNote: {
        parameters: {
            query?: never;
            header: {
                /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
                "Idempotency-Key": components["parameters"]["IdempotencyKey"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NoteRequest"];
            };
        };
        responses: {
            /** @description İşlem anahtarı tekrarı: aynı anahtar ve aynı istek ilk kaynağın bugünkü temsilini döndürür; yan etki yok (ADR-0027). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingNote"];
                };
            };
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingNote"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    addMeetingParticipant: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ParticipantRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ParticipantResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    removeMeetingParticipant: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
                userId: components["parameters"]["PathUserID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listDeletedMeetings: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeetingList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listNotifications: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    markNotificationRead: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    markAllNotificationsRead: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MarkedCount"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    registerPushTarget: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterTargetRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TargetResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    unregisterPushTarget: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                target_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    countUnreadNotifications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CountResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    pushPublicKey: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PushPublicKey"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    readProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Program"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listTransfers: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransferHistory"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    transferWorkItems: {
        parameters: {
            query?: never;
            header: {
                /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
                "Idempotency-Key": components["parameters"]["IdempotencyKey"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransferRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransferResult"];
                };
            };
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransferResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    readTransfer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransferHistoryItem"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    previewTransfer: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransferPreviewRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransferPreview"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listProgramDepartments: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgramDepartmentList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    linkDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LinkDepartmentRequest"];
            };
        };
        responses: {
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgramDepartmentLink"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    unlinkDepartment: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                departmentId: components["parameters"]["PathDepartmentID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Kaldırıldı */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    renameDepartmentLink: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                departmentId: components["parameters"]["PathDepartmentID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RenameDepartmentLinkRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgramDepartmentLink"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listProgramWorkItems: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description İsteğe bağlı departman süzgeci; görünürlükle kesişir. Boş ya da yalnız boşluk değer süzgeç yok sayılır. */
                department_id?: string;
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listPrograms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgramList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateProgramRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Program"];
                };
            };
            /** @description Oluşturuldu */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Program"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeleteProgramRequest"];
            };
        };
        responses: {
            /** @description İçerik yok */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez / parola özeti kapasitesi dolu */
            503: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProgramRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Program"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    resetProgram: {
        parameters: {
            query?: never;
            header: {
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ResetProgramRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgramResetResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez / parola özeti kapasitesi dolu */
            503: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    archiveAttachments: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description RFC 3339 alt sınır; çözümlenemeyen değer yok sayılır. */
                from?: string;
                /** @description Sayfa boyu; sayı olmayan ya da negatif değer varsayılana düşer. */
                limit?: number;
                /** @description `belge`, `tablo`, `gorsel`, `arsiv`, `metin`; bilinmeyen değer süzgeçsizdir. */
                mime_category?: string;
                /** @description Ad araması (Türkçe harf duyarsız). */
                search?: string;
                /** @description Sıralama ekseni; izinli liste dışı değer varsayılana düşer. */
                sort?: string;
                /** @description Etiket; küme dışı değer 422 records.tag_invalid. */
                tag?: string;
                /** @description RFC 3339 üst sınır; çözümlenemeyen değer yok sayılır. */
                to?: string;
                /** @description Yükleyen süzgeci. */
                uploader_id?: string;
                /** @description Görev süzgeci. */
                work_item_id?: string;
            };
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ArchiveFileList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    archiveSelectionZip: {
        parameters: {
            query: {
                /** @description Virgülle ayrılmış dosya kimlikleri (1–100). */
                file_ids: string;
            };
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı; gövde akışla gelir. Akış başladıktan sonraki arızada 200 başlamış olabilir; gövde geçerli ZIP olarak tamamlanmaz, hata zarfı eklenmez, bağlantı kesilir. */
            200: {
                headers: {
                    /** @description attachment; filename (ASCII yedek) ve filename* (UTF-8). */
                    "Content-Disposition"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/zip": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    archiveFolders: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ArchiveFolders"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    archiveFolderZip: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı; gövde akışla gelir. Akış başladıktan sonraki arızada 200 başlamış olabilir; gövde geçerli ZIP olarak tamamlanmaz, hata zarfı eklenmez, bağlantı kesilir. */
            200: {
                headers: {
                    /** @description attachment; filename (ASCII yedek) ve filename* (UTF-8). */
                    "Content-Disposition"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/zip": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    archiveFullZip: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı; gövde akışla gelir. Akış başladıktan sonraki arızada 200 başlamış olabilir; gövde geçerli ZIP olarak tamamlanmaz, hata zarfı eklenmez, bağlantı kesilir. */
            200: {
                headers: {
                    /** @description attachment; filename (ASCII yedek) ve filename* (UTF-8). */
                    "Content-Disposition"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/zip": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    archiveTasks: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ArchiveTasks"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    archiveUploaders: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ArchiveUploaders"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportDashboard: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardReport"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportDashboardCoordinatorships: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CoordinatorshipStatList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportDashboardMeetings: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportMeetingList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportDashboardTasks: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "X-Result-Truncated": components["headers"]["ResultTruncated"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportTaskList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportMeetingDetail: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportMeetingDetail"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportMeetingPdf: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    /** @description attachment; filename. */
                    "Content-Disposition"?: string;
                    "Content-Length": components["headers"]["ContentLength"];
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportSeason: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SeasonReport"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportSeasonPdf: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    /** @description attachment; filename. */
                    "Content-Disposition"?: string;
                    "Content-Length": components["headers"]["ContentLength"];
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportTaskDetail: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReportTaskDetail"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportTaskPdf: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    /** @description attachment; filename. */
                    "Content-Disposition"?: string;
                    "Content-Length": components["headers"]["ContentLength"];
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportWorkload: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkloadReport"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    reportWorkloadPdf: {
        parameters: {
            query?: never;
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkloadPdfRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["CacheControlNoStore"];
                    /** @description attachment; filename. */
                    "Content-Disposition"?: string;
                    "Content-Length": components["headers"]["ContentLength"];
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listWorkItems: {
        parameters: {
            query?: {
                /** @description Opak imleç; önceki sayfanın `next_cursor` değeri. */
                cursor?: components["parameters"]["Cursor"];
                /** @description Sayfa boyu. Bütün imleçli listelerde varsayılan 50, üst sınır 200. Sınır dışı değer modüle göre farklı işlenir: organization (kullanıcılar, silinmiş departman/hesap), program (aktarım geçmişi) ve work (görevler, silinmiş görevler) 200 üstünü sessizce 200 yapar; organization ve program 0, negatif ya da sayı olmayan değeri 422 ile reddeder, work 0 ve negatifi varsayılana çeker, sayı olmayanı 422 ile reddeder. collaboration ve messaging 0 değerini varsayılan sayar; negatif, 200 üstü ve sayı olmayan değer 422 `collaboration.input_invalid` / `messaging.input_invalid` alır. notifications 1–200 dışını ve sayı olmayan değeri 422 `notifications.input_invalid` ile reddeder. */
                limit?: components["parameters"]["Limit"];
            };
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
                "Idempotency-Key": components["parameters"]["IdempotencyKey"];
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWorkItemRequest"];
            };
        };
        responses: {
            /** @description İşlem anahtarı tekrarı: aynı anahtar ve aynı istek ilk kaynağın bugünkü temsilini döndürür; yan etki yok (ADR-0027). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItem"];
                };
            };
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItem"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    getWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemDetail"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWorkItemRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItem"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    addAssignments: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AssignmentsRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AddedCount"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    removeAssignment: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                accountId: components["parameters"]["PathAccountID"];
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RemovedCount"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    claimWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    unclaimWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    setCompletionDate: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompletionRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemDates"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listDependencies: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DependencyList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    addDependency: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DependencyRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DependencyEdge"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    removeDependency: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                /** @description Bağımlılık kenarının kimliği (`dependency_id`); bağımlı olunan görevin kimliği değildir. */
                depId: string;
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    extendWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExtendRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExtendResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listWorkItemFiles: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FileRecordList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    attachFile: {
        parameters: {
            query: {
                /** @description İsteğe bağlı alt görev (ADR-0024). Görevin alt görevi değilse 422 `records.input_invalid` (alan `subtask_id`). Dosya ana görevin tavanına ve tamamlanma kanıtına sayılır. */
                subtask_id?: string;
                /** @description Kapalı etiket kümesinden biri. Eksikse 422 `records.tag_required`, küme dışıysa 422 `records.tag_invalid`. */
                tag: "ister" | "plan" | "girdi" | "analiz" | "cikti" | "sonuc";
            };
            header: {
                /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
                "Idempotency-Key": components["parameters"]["IdempotencyKey"];
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                };
            };
        };
        responses: {
            /** @description İşlem anahtarı tekrarı: aynı anahtar ve aynı istek ilk kaynağın bugünkü temsilini döndürür; yan etki yok (ADR-0027). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FileRecord"];
                };
            };
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FileRecord"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listWorkItemNotes: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemNoteList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    addWorkItemNote: {
        parameters: {
            query?: never;
            header: {
                /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
                "Idempotency-Key": components["parameters"]["IdempotencyKey"];
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkNoteRequest"];
            };
        };
        responses: {
            /** @description İşlem anahtarı tekrarı: aynı anahtar ve aynı istek ilk kaynağın bugünkü temsilini döndürür; yan etki yok (ADR-0027). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemNote"];
                };
            };
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemNote"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteWorkItemNote: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
                noteId: components["parameters"]["PathNoteID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateWorkItemNote: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
                noteId: components["parameters"]["PathNoteID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWorkNoteRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkNoteUpdated"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    ownStatusWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransitionRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransitionResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    pullCompletion: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CompletionRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemDates"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    pullEndDate: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemDates"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    listWorkItemSubtasks: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemSubtaskList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    createWorkItemSubtask: {
        parameters: {
            query?: never;
            header: {
                /** @description İstemcinin ürettiği opak işlem anahtarı (en az 128 bit; ör. base64url 22 karakter; ADR-0027). Uzunluk baştaki/sondaki boşluk kırpıldıktan sonra bayt olarak 22–200'dür. Eksik ya da sınır dışı anahtar 422; program aktarımında `program.transfer_input_invalid`, oluşturma uçlarında modülün `<mod>.input_invalid` zarfı (alan `idempotency_key`, kod `<mod>.request_key_required` / `<mod>.request_key_invalid`). Aynı anahtar + aynı istek ilk sonucu döndürür (oluşturmada 200 + kaynağın bugünkü temsili, güncel görme yetkisiyle); farklı istek 409 `<mod>.idempotency_key_reused`. Anahtar aktör + uç tablosu kapsamındadır; sunucu kaynağı yaşadıkça tutar (kalıcı silinen kaynakta anahtar da gider). */
                "Idempotency-Key": components["parameters"]["IdempotencyKey"];
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSubtaskRequest"];
            };
        };
        responses: {
            /** @description İşlem anahtarı tekrarı: aynı anahtar ve aynı istek ilk kaynağın bugünkü temsilini döndürür; yan etki yok (ADR-0027). */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemSubtask"];
                };
            };
            /** @description Başarılı */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemSubtask"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    deleteWorkItemSubtask: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
                subtaskId: components["parameters"]["PathSubtaskID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StatusResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    updateWorkItemSubtask: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
                subtaskId: components["parameters"]["PathSubtaskID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSubtaskRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkItemSubtask"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    transitionWorkItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
                /** @description Her yazma isteğinde zorunlu CSRF başlığı (değer serbest, boş olamaz). */
                "X-Requested-With": components["parameters"]["CsrfHeader"];
            };
            path: {
                id: components["parameters"]["PathID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransitionRequest"];
            };
        };
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransitionResult"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Kapsamda bulunamadı */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Çakışma / durum uyuşmazlığı */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Gövde sınırı aşıldı */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    coordinatorGantt: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Gantt"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    adminGantt: {
        parameters: {
            query?: {
                /** @description `true` ise yalnız gecikenler. */
                overdue?: string;
            };
            header: {
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Gantt"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    memberGantt: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Gantt"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    myTasks: {
        parameters: {
            query?: never;
            header: {
                /** @description Departman kapsamı (S3 uçlarda zorunlu). */
                "X-Nizamio-Department": components["parameters"]["DepartmentScope"];
                /** @description Program kapsamı (S2/S3 uçlarda zorunlu; S0/S1'de yok sayılır). */
                "X-Nizamio-Program": components["parameters"]["ProgramScope"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Başarılı */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MyTaskList"];
                };
            };
            /** @description Kimlik doğrulanmamış */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Yetkisiz */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Doğrulama hatası */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Hız sınırı aşıldı */
            429: {
                headers: {
                    "Retry-After": components["headers"]["RetryAfter"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Sunucu hatası */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
            /** @description Bağımlılık erişilemez */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
}
