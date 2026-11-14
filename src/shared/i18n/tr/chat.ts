/**
 * F7 sohbet metinleri — TEK ağaç (`chat.*`); alt dallar O2b işçilerine ayrılmıştır: `list`
 * (konuşma listesi), `thread` (akış/başlık/mesaj), `composer` (yazma çubuğu), `dialogs` (10c yedi
 * pencere), `states` (boş/yükleniyor/hata/bağlantı). Metinler `docs/ekranlar/10-mesajlar/
 * ozellikler.md` §4 ve `istemci-akislari.md` §10.6'dan birebir (Türkçe İ/ı korunur). Sunucu
 * `message` alanı gösterilmez (hata kodu → `errors.*`). Tasarımdaki sözleşme dışı metinler
 * (iletme, sessize alma, anonim anket, "Koordinatörler" grubu) çizilmez; devre dışı ipucu
 * `chat.states.soon`'dur.
 */
export const trChat = {
  chat: {
    list: {
      title: 'Mesajlar',
      listLabel: 'Konuşmalar',
      newChat: 'Yeni konuşma',
      newChatLabel: 'Yeni konuşma veya grup',
      search: 'Ara: kişi, grup ya da mesaj',
      searchLabel: 'Ara',
      filterLabel: 'Konuşma süzgeci',
      filterAll: 'Tümü',
      filterUnread: 'Okunmamış',
      filterGroups: 'Gruplar',
      filterPeople: 'Kişiler',
      loadedHint: 'yüklenen konuşmalar içinde',
      more: 'Daha fazla yükle',
      unreadBadge: '{n} okunmamış mesaj',
      mentionBadge: 'Sizi anan okunmamış mesaj var',
      you: 'Sen: ',
      deletedPreview: 'silinmiş mesaj',
      filePreview: 'Dosya',
      unknownPerson: 'Bilinmeyen kişi',
    },
    thread: {
      select: 'Bir konuşma seçin',
      back: 'Geri',
      kindSystem: 'Sistem grubu',
      kindGroup: 'Grup',
      kindDirect: 'Birebir',
      info: '{name} bilgisi',
      typing: '{name} yazıyor…',
      typingMany: '{n} kişi yazıyor…',
      today: 'Bugün',
      yesterday: 'Dün',
      pinned: 'Sabitlenen mesaj {i}/{n}',
      edited: 'düzenlendi · {time}',
      deleted: 'silinmiş mesaj',
      replyTo: '{name} kişisine yanıt',
      unreadDivider: '{n} okunmamış mesaj',
      reaction: { like: '👍', heart: '❤️', check: '✅', star: '⭐' },
    },
    composer: {
      placeholder: 'Mesaj yaz…',
      send: 'Gönder',
      sending: 'Gönderiliyor',
      retry: 'Tekrar dene',
      unverified: 'Gönderim doğrulanamadı — Tekrar dene',
      cancel: 'Vazgeç',
      attach: 'Ekle',
      peerLeft: 'Bu kişi artık programda değil; mesaj gönderilemez.',
      rateLimited: 'Biraz sonra tekrar deneyin',
    },
    dialogs: {
      groupInfo: 'Grup bilgisi',
      messageInfo: 'Mesaj bilgisi',
      newGroup: 'Yeni grup',
      forward: 'Mesajı ilet',
      taskFromMessage: 'Mesajdan görev',
      poll: 'Anket oluştur',
      shareFile: 'Dosya paylaş',
      cannotDirect:
        'Bu kişiyle doğrudan yazışamazsınız: birebir sohbet yalnız koordinatörlük zinciri içinde açılır. Ortak bir grupta yazışabilirsiniz.',
      truncated: 'Liste ilk 200 kişiyle sınırlı',
    },
    states: {
      loading: 'Konuşmalar yükleniyor…',
      error: 'Konuşmalar yüklenemedi.',
      retry: 'Yeniden dene',
      loadingMore: 'Yükleniyor…',
      backToList: 'Listeye dön',
      empty: 'Henüz konuşma yok',
      noMatch: 'Eşleşen konuşma yok',
      notFound: 'Bu konuşma bulunamadı',
      reconnecting: 'Bağlantı yeniden kuruluyor…',
      soon: 'Yakında',
    },
  },
} as const
