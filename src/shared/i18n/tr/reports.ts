// Raporlar modülü (13 Raporlar; F6; `reports.*`) metinleri — TEK statik TR ağacı (`trReports`),
// `src/shared/i18n/index.ts` `mergeTrees`'e bir kez kayıtlı; çalışma anında ağaca ekleme yok
// (KESİN 24). W136 ortak parçaları yazar (sayfa başlıkları, düğme ve durum metinleri, hata
// metinleri); W138 (01f/01g sayfa gövdeleri) ve W139 (düğmelerin ekranlara bağlanması) yalnız
// KENDİ alt dallarını ekler (`season.*`, `meeting.*` gövde dalları, `menu.*` …); ikinci kök
// ağaç ya da dosya açılmaz. Metinler `docs/ekranlar/13-raporlar/ozellikler.md` §2.11'den
// birebirdir; tasarımdaki örnek sayılar ("27 saniye", "15 sn") yerine sunucudan gelen değer
// parametredir. Sunucu `message` alanı kullanılmaz (hata kodu → `errors.*` ya da `reports.failure.*`).

export const trReports = {
  reports: {
    // 01f ve 01g sayfa başlıkları (E-13-14; E-13-46). Gövde metinleri W138'in dalıdır.
    season: { title: 'Dönem sonu raporu' },
    meeting: { title: 'Toplantı raporu' },
    task: { title: 'Görev raporu' },
    // Ortak durum kartları (W138; E-13-68…75, 01h): kart başlığı/kod satırı/alt not.
    states: {
      codeLine: '{status} · {code}',
      auditNote: 'Rapor indirmeleri kayda geçer (denetim).',
      notFound: 'Kayıt bulunamadı.',
      progressStub: 'ilerleme yakında',
    },
    // Rapor düğmeleri (`ReportActionButton`; E-13-02, 41, 55, 59). Etiket varsayılandır; ekran
    // (05b "Kişisel rapor" gibi) kendi etiketini yuvayla verebilir.
    action: {
      label: {
        season: 'Dönem sonu raporu (PDF)',
        meeting: 'Toplantı raporu (PDF)',
        task: 'Görev raporu (PDF)',
        workload: 'İş yükü raporu (PDF)',
      },
      workloadSelected: 'Seçilenlerin iş yükü (PDF) · {n}',
      preparing: 'Hazırlanıyor…',
      cancel: 'İptal',
      cooldown: 'Bekleyin ({seconds} s)',
      retry: 'Yeniden dene',
      locked: 'Bu sırada diğer rapor düğmeleri kilitli',
      downloaded: '{name} indirildi',
    },
    // Durum kartları (E-13-68…72; 01h): `role="status"` / `role="alert"`.
    status: {
      preparing: {
        title: 'Rapor hazırlanıyor…',
        body: '{report} tek seferde üretilir; aynı anda tek rapor. Bu sırada diğer rapor düğmeleri kilitli.',
        progress: 'ilerleme yakında',
        progressLabel: 'Rapor hazırlanıyor, ilerleme bilinmiyor',
      },
      downloaded: { title: 'İndirme tamamlandı' },
      export_in_progress: { title: 'Zaten bir rapor hazırlanıyor' },
      capacity_full: { title: 'Sunucu şu an yoğun, biraz sonra tekrar deneyin' },
    },
    // Hata metinleri (`ReportFailure.messageKey`; yalnız bu beş sınıfın kendi metni vardır,
    // diğerleri `errors.*` kullanır).
    failure: {
      export_in_progress:
        'Önceki raporunuz bitince yeniden deneyin. Başka bir sekme ya da cihazdaki rapor sürüyor olabilir.',
      capacity_full: 'Şu an çok sayıda rapor üretiliyor. Otomatik yeniden deneme yapılmaz.',
      input_invalid: 'Seçim güncellendi, yeniden deneyin.',
      too_large: 'Daha az üye seçin.',
      report_failed: 'Rapor oluşturulamadı.',
    },
  },
} as const
