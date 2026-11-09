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
    // W96 — 03d alt görev (E-03C-13, 33, 44…53, 73)
    subtasks: {
      mode: {
        label: 'Alt görev gösterimi',
        closed: 'Kapalı',
        all: 'Tümünü aç',
      },
      show: '{label} alt görevlerini göster',
      hide: '{label} alt görevlerini gizle',
      group: '{label} alt görevleri',
      loading: 'Alt görevler yükleniyor',
      empty: 'Alt görev yok',
      noDate: 'Tarih yok',
      statusOpen: 'Açık',
      statusDone: 'Tamamlandı',
      progress: 'Biten alt görev oranı',
      count: '{done}/{total}',
      countLabel: '{done} / {total} alt görev bitti',
    },
  },
} as const
