import { shallowRef } from 'vue'

/**
 * Zorunlu parola değişimi tamamlandı; kullanıcı yeni parolasıyla giriş yapacak. Giriş ekranında
 * kısa bildirim gösterilir ve sonraki açık girişte ana sayfaya dönülür. Yalnız bellektedir
 * (sayfa yenilemede kalkar; tercih anahtarı eklenmez).
 */
export const passwordChanged = shallowRef(false)
