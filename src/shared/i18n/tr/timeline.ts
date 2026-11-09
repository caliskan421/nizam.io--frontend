// Zaman çizelgesi modülü (03c; `timeline.*`) metinleri — TEK statik TR ağacı (`trTimeline`),
// `src/shared/i18n/index.ts` `mergeTrees`'e bir kez kayıtlı; çalışma anında ağaca ekleme yok
// (KESİN 24). Her O2b uygulayıcısı yalnız kendi alt dalını ekler (W92 `gantt`, W93 `frame`/`page`,
// W94 `panel`, W95 `snack`, W96 `subtasks`); ikinci kök ağaç ya da dosya açılmaz. Sunucu
// `message` alanı kullanılmaz (hata kodu → `errors.*`); örnek veri yoktur (ortak-kurallar §4).

export const trTimeline = {
  timeline: {
    // W93 · sayfa durumları (E-03C-82, 83)
    page: {
      title: 'Zaman çizelgesi',
      stage: 'Zaman çizelgesi alanı',
      loading: 'Zaman çizelgesi yükleniyor',
      loadError: 'Zaman çizelgesi yüklenemedi',
      ceiling: 'Liste sınıra ulaşmış olabilir; süzgeçle daraltın.',
      empty: {
        title: 'Zaman çizelgesinde gösterilecek görev yok',
        text: 'Bu kapsamda henüz görev yok. Görev eklendiğinde tarihleriyle burada görünür.',
      },
      filteredEmpty: {
        title: 'Bu süzgeçle görev yok',
        text: 'Durum ya da koordinatörlük süzgecini değiştirerek yeniden dene.',
        clear: 'Süzgeçleri temizle',
      },
    },
    // W93 · sayfa çerçevesi (E-03C-01…19)
    frame: {
      head: {
        title: 'Görevler',
        tasks: '{n} görev',
        tasksPartial: '{n}+ görev',
        done: '{n} bitti',
        donePartial: '{n}+ bitti',
        overdue: '{n} gecikmede',
        overduePartial: '{n}+ gecikmede',
        partial: 'yüklenen kayıtlar içinde',
        create: 'Yeni görev',
        view: {
          label: 'Görünüm',
          list: 'Liste',
          timeline: 'Zaman çizelgesi',
        },
      },
      toolbar: {
        label: 'Zaman çizelgesi araçları',
        department: {
          label: 'Koordinatörlük',
          menu: 'Koordinatörlük seç',
          all: 'Tümü',
        },
        status: {
          label: 'Durum',
          all: 'Tümü',
          open: 'Açık',
          overdue: 'Geciken',
          done: 'Biten',
        },
        scale: {
          gun: 'Gün ölçeği',
          hafta: 'Hafta ölçeği',
          ay: 'Ay ölçeği',
          zoomOut: 'Uzaklaştır',
          zoomIn: 'Yakınlaştır',
        },
        export: {
          pdf: 'PDF olarak dışa aktar',
          image: 'Görsel olarak indir',
          soon: 'yakında',
        },
        fullscreen: {
          enter: 'Tam ekran',
          exit: 'Tam ekrandan çık',
        },
      },
      strip: {
        kicker: 'görev aralığı',
        label: 'Görev aralığı genel bakışı: {range}',
        labelView: 'Görev aralığı genel bakışı: {range}; görünen aralık {view}',
        here: 'Şu an baktığın yer',
        today: 'Bugün',
        seek: 'Görev aralığında konuma git',
      },
      legend: {
        label: 'Açıklama',
        todo: 'Başlamadı',
        doing: 'Devam ediyor',
        review: 'Onay bekliyor',
        back: 'Geri gönderildi',
        done: 'Tamamlandı',
        doneLate: 'Geç bitti',
        overdue: 'Gecikmede',
        dateRequest: 'Tarih talebi',
        here: 'Baktığın yer',
      },
    },
  },
} as const
