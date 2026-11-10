// Zaman çizelgesi modülü (03c; `timeline.*`) metinleri — TEK statik TR ağacı (`trTimeline`),
// `src/shared/i18n/index.ts` `mergeTrees`'e bir kez kayıtlı; çalışma anında ağaca ekleme yok
// (KESİN 24). Her O2b uygulayıcısı yalnız kendi alt dalını ekler (W92 `gantt`, W93 `frame`/`page`,
// W94 `panel`, W95 `snack`, W96 `subtasks`); ikinci kök ağaç ya da dosya açılmaz. Sunucu
// `message` alanı kullanılmaz (hata kodu → `errors.*`); örnek veri yoktur (ortak-kurallar §4).

export const trTimeline = {
  timeline: {
    page: {
      title: 'Zaman çizelgesi',
    },
    // W92 — kendi SVG Gantt çekirdeği (E-03C-21…43). Yalnız bu alt dalı W92 ekler.
    gantt: {
      label: 'Zaman çizelgesi',
      corner: 'görev',
      today: 'bugün',
      unknownGroup: 'Koordinatörlük',
      groupCount: '{done} / {total}',
      groupSummary: '{name}, {done} / {total} görev bitti',
      groupOpened: '{name} açıldı',
      groupClosed: '{name} kapatıldı',
      selected: '{title} seçildi',
      status: {
        baslanmadi: 'Başlamadı',
        devam_ediyor: 'Devam ediyor',
        onaya_sunuldu: 'Onay bekliyor',
        iade_edildi: 'Geri gönderildi',
        tamamlandi: 'Tamamlandı',
        unknown: 'Durum bilinmiyor',
      },
      overdue: '{days} gün gecikmede',
      completedLate: '{days} gün geç bitti',
      dependency: 'Bağımlılığı var',
      rowSummary: '{title}, {status}, {start} – {end}',
      unit: { day: 'g', week: 'hf', month: 'ay' },
      handle: { start: 'Başlangıcı sürükle', end: 'Bitişi sürükle' },
      month: {
        long: {
          m1: 'Ocak',
          m2: 'Şubat',
          m3: 'Mart',
          m4: 'Nisan',
          m5: 'Mayıs',
          m6: 'Haziran',
          m7: 'Temmuz',
          m8: 'Ağustos',
          m9: 'Eylül',
          m10: 'Ekim',
          m11: 'Kasım',
          m12: 'Aralık',
        },
        short: {
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
      },
    },
  },
} as const
