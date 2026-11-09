// Yazma protokolü sonuç metinleri (src/shared/http/mutation/outcome.ts `outcomeMessage`).
// `failed` sonucu hata kodunun kendi metnini (errors.*) kullanır; burada yalnız protokol
// sınıflarının metni vardır. Parametreler vue-i18n adlı yer tutucusuyla: {seconds}, {minutes}.
export const trMutation = {
  mutation: {
    outcome: {
      success: 'İşlem tamamlandı.',
      edit_conflict:
        'Siz düzenlerken kayıt değişti. Değişen alanları karşılaştırıp hangisinin kalacağını seçin.',
      idempotency_key_reused:
        'Bu işlem farklı bilgilerle zaten gönderilmiş. Formu yenileyip yeniden gönderin.',
      conflict_retry: 'Eşzamanlı bir değişiklik nedeniyle işlem tamamlanamadı; yeniden deneyin.',
      unknown:
        'İşlemin sonucu doğrulanamadı. Girdiğiniz bilgiler korundu; aynı işlemi yeniden gönderebilirsiniz.',
      unknown_expired:
        'İşlemin sonucu doğrulanamadı ve yeniden gönderme süresi doldu. Listeyi yenileyip kaydı denetleyin.',
      rate_limited: 'Çok fazla istek gönderildi; biraz bekleyip yeniden deneyin.',
      rate_limited_seconds: 'Çok fazla istek gönderildi; {seconds} saniye sonra yeniden deneyin.',
      rate_limited_minutes: 'Çok fazla istek gönderildi; {minutes} dakika sonra yeniden deneyin.',
      confirmation_required:
        'Bu işlem aşağıdaki görevlerdeki atamayı kaldıracak. Devam etmek istiyor musunuz?',
      partial: 'İlk işlem tamamlandı; sonraki adımlardan bazıları yapılamadı.',
      // Ekran söküldüğü için gönderilmeyen işlem (CX-F1-E-05); bildirim olarak gösterilmez.
      owner_disposed: 'Ekran kapatıldığı için işlem gönderilmedi.',
      scope_changed:
        'Bu işlem başka bir program veya departman seçiliyken başlatılmıştı; yeniden göndermek için o kapsama dönün ya da kaydı denetleyin.',
    },
    action: {
      retry: 'Yeniden gönder',
      confirm: 'Onayla ve devam et',
      cancel: 'Vazgeç',
    },
  },
} as const
