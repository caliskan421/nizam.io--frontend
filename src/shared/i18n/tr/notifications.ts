/**
 * F7 bildirim metinleri — TEK ağaç (`notifications.*`); alt dallar O2b işçilerine ayrılmıştır:
 * `bell` (zil), `panel` (başlık/sekme/boş/hata), `rows` (tür sözlüğü + zaman/grup), `push`
 * (Web Push kutusu). Metinler `docs/ekranlar/14-bildirimler/ozellikler.md` §4 ve `backend.md`
 * §4.1'den birebir (Türkçe İ/ı korunur). Yanıt metinsizdir: aktör/başlık/kod/tarih uydurulmaz.
 */
export const trNotifications = {
  notifications: {
    bell: {
      label: 'Bildirimler',
      unread: 'Bildirimler, {n} okunmamış',
      overflow: 'Bildirimler, 9’dan fazla okunmamış',
      badgeOverflow: '9+',
      open: 'Bildirim panelini aç',
      close: 'Bildirim panelini kapat',
      live: '{n} okunmamış bildirim',
    },
    panel: {
      title: 'Bildirimler',
      markAll: 'Tümünü okundu say',
      tabsLabel: 'Bildirim filtresi',
      tabAll: 'Tümü',
      tabUnread: 'Okunmamış',
      tabAwaiting: 'Senden bekleyen',
      older: 'Daha eski bildirimler',
      loading: 'Bildirimler yükleniyor…',
      error: 'Bildirimler yüklenemedi.',
      retry: 'Yeniden dene',
      emptyAll: 'Henüz bildirim yok',
      emptyUnread: 'Okunmamış bildirim yok',
      markedAll: '{n} bildirim okundu sayıldı',
      markedNone: 'Okunmamış bildirim yok',
      soon: 'Yakında',
      close: 'Bildirim panelini kapat',
      olderError: 'Daha eski bildirimler yüklenemedi.',
      listLabel: 'Bildirim listesi',
    },
    rows: {
      unreadDot: 'okunmamış',
      markRead: 'Okundu say',
      review: 'İncele',
      agenda: 'Gündemi aç',
      approve: 'Onayla',
      reject: 'Reddet',
      groupToday: 'Bugün',
      groupYesterday: 'Dün',
      groupOlder: 'Daha eski',
      time: {
        now: 'şimdi',
        minutes: '{n} dk',
        hours: '{n} sa',
      },
      types: {
        work_item_created: { label: 'Görev', text: 'Yeni görev oluşturuldu' },
        work_item_transitioned: { label: 'Görev', text: 'Bir görevin durumu değişti' },
        work_item_assignment_changed: { label: 'Atama', text: 'Bir görevin ataması değişti' },
        work_item_date_changed: { label: 'Tarih', text: 'Bir görevin tarihi değişti' },
        work_date_change_requested: { label: 'Tarih talebi', text: 'Yeni tarih talebi' },
        work_date_change_reviewed: { label: 'Tarih talebi', text: 'Tarih talebi sonuçlandı' },
        meeting_created: { label: 'Toplantı', text: 'Yeni toplantı' },
        meeting_updated: { label: 'Toplantı', text: 'Toplantı üyelere açıldı' },
        membership_assigned: { label: 'Ekip', text: 'Ekibe yeni üye atandı' },
        membership_removed: { label: 'Ekip', text: 'Ekipten üye çıkarıldı' },
        membership_role_changed: { label: 'Ekip', text: 'Ekipte üye rolü değişti' },
        transfer_completed: { label: 'Aktarım', text: 'Görev aktarımı tamamlandı' },
        unknown: { label: 'Bildirim', text: 'Yeni bildirim' },
      },
    },
    target: {
      workNotFound: 'Bu görev bu kapsamda bulunamadı',
    },
    push: {
      title: 'Portal kapalıyken de haber verelim mi?',
      body: 'Tarih talepleri ve onaylar bu tarayıcıya bildirim olarak düşer.',
      later: 'Şimdi değil',
      enable: 'Bildirimleri aç',
      unsupported: 'Bu tarayıcıda kullanılamıyor',
      blocked: 'Bu tarayıcıda bildirimler engelli',
      blockedHint: 'Portal tekrar soramaz; açmak için tarayıcı ayarı gerekir.',
      enabledTitle: 'Bildirimler bu tarayıcıda açık',
      ok: 'Tamam',
    },
  },
} as const
