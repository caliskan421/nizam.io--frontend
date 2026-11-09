// Zaman çizelgesi modülü (03c; `timeline.*`) metinleri — TEK statik TR ağacı (`trTimeline`),
// `src/shared/i18n/index.ts` `mergeTrees`'e bir kez kayıtlı; çalışma anında ağaca ekleme yok
// (KESİN 24). Her O2b uygulayıcısı yalnız kendi alt dalını ekler (W92 `gantt`, W93 `frame`/`page`,
// W94 `panel`, W95 `snack`/`drag`, W96 `subtasks`); ikinci kök ağaç ya da dosya açılmaz. Sunucu
// `message` alanı kullanılmaz (hata kodu → `errors.*`); örnek veri yoktur (ortak-kurallar §4).

export const trTimeline = {
  timeline: {
    page: {
      title: 'Zaman çizelgesi',
    },
    // W95 — geri alınabilir bildirim (E-03C-67…72). Başlıkta görev kodu BE-005 gelene dek
    // görev BAŞLIĞIDIR.
    snack: {
      title: {
        extended: '{title} süresi {days} gün uzatıldı',
        changed: '{title} tarihleri değişti',
        request: '{title} için tarih talebi gönderiliyor',
      },
      requestNote: 'Değişiklik onaya gider',
      delta: {
        start: 'başlangıç {delta} gün',
        end: 'bitiş {delta} gün',
      },
      cancel: 'İptal et',
      dismiss: 'Kapat',
      month: {
        m1: 'Oca',
        m2: 'Şub',
        m3: 'Mar',
        m4: 'Nis',
        m5: 'May',
        m6: 'Haz',
        m7: 'Tem',
        m8: 'Ağu',
        m9: 'Eyl',
        m10: 'Eki',
        m11: 'Kas',
        m12: 'Ara',
      },
      range: '{startDay} {startMonth} – {endDay} {endMonth}',
    },
    // W95 — sürükleme / klavye ile tarih değişimi: tutamaç adları, ekran okuyucu duyuruları,
    // gönderim sonucu bildirimleri (gönderim 5 sn sonra gider; P8, P18).
    drag: {
      handle: {
        start: 'Başlangıç tarihini değiştir',
        end: 'Bitiş tarihini değiştir',
      },
      announce: {
        start: '{title}: başlangıç {date}',
        end: '{title}: bitiş {date}',
        pending:
          '{title}: tarih değişikliği 5 saniye sonra gönderilecek. Vazgeçmek için İptal et düğmesini kullanın.',
        cancelled: '{title}: tarih değişikliği iptal edildi, istek gönderilmedi.',
      },
      sent: {
        extended: '{title} süresi {days} gün uzatıldı.',
        extendedCascade: '{title} süresi {days} gün uzatıldı; {count} bağımlı görev de kaydı.',
        changed: '{title} tarihleri güncellendi.',
        requested: '{title} için tarih talebi gönderildi. Değişiklik onaya gider.',
      },
      datesChanged:
        'Görevin tarihleri bu arada değişti; değişiklik gönderilmedi. Güncel tarihleri görüp yeniden deneyin.',
    },
  },
} as const
