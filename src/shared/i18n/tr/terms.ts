// Terim anahtarları (kararlı kod → TR). Sunucu terim sözlüğü ileride üstüne yazar (T-14).
export const trTerms = {
  terms: {
    scope: {
      S0: 'Açık',
      S1: 'Oturum',
      S2: 'Program',
      S3: 'Program ve departman',
    },
    session: {
      unknown: 'Oturum denetleniyor',
      anonymous: 'Oturum açılmadı',
      authenticated: 'Oturum açık',
      ended: 'Oturum sonlandı',
      unavailable: 'Sunucuya ulaşılamadı; yeniden deneyin',
    },
    action: {
      retry: 'Yeniden dene',
      refreshMe: 'Bilgileri yenile',
    },
    instance: {
      update_required: 'Güncelleme gerekli',
    },
  },
}
