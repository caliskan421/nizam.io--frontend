/**
 * İstemcinin kendi ürettiği kararlı hata kodları. Sunucu kataloğunda (error-codes.gen.ts)
 * yoktur; `client.` önekiyle ayrışır ve i18n tablosunda `errors.client.*` anahtarı taşır.
 */
export const CLIENT_ERROR_CODES = [
  /** Ağ hatası: istek sunucuya ulaşmadı veya yanıt alınamadı. */
  'client.network_error',
  /** Yanıt beklenen hata zarfı (JSON) değil. */
  'client.invalid_response',
  /** S2/S3 uç için aktif program/departman kapsamı yok; istek gönderilmedi. */
  'client.scope_missing',
  /** Spec'te olmayan bir uç çağrıldı (operations.gen.ts haritasında yok); istek gönderilmedi. */
  'client.unknown_operation',
  /** Oturum yenilenemedi; yeniden giriş gerekir. */
  'client.session_ended',
  /** Sunucunun API sürümü bu istemcinin desteklediği sürüm değil. */
  'client.unsupported_api_version',
] as const

export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number]
