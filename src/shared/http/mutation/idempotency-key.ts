/**
 * `Idempotency-Key` üretimi (ADR-0027, istemci-akislari §8 "İşlem anahtarı").
 *
 * Anahtar **kullanıcı eylemi başına** (gönder düğmesi) bir kez üretilir; form açılışında değil.
 * Aynı eylemin ağ tekrarı aynı anahtarı, yeni eylem yeni anahtarı kullanır (CX-S-02). Sözleşme:
 * kırpılmış hâli 22–200 bayt, en az 128 bit rastgelelik. 16 rastgele bayt base64url (dolgusuz)
 * = 22 ASCII karakter = 22 bayt.
 */
export const IDEMPOTENCY_KEY_MIN_BYTES = 22
export const IDEMPOTENCY_KEY_MAX_BYTES = 200

const RANDOM_BYTES = 16

export function generateIdempotencyKey(
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => globalThis.crypto.getRandomValues(bytes),
): string {
  const bytes = random(new Uint8Array(RANDOM_BYTES))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Sözleşmenin uzunluk kuralı (kırpılmış, UTF-8 bayt): 22–200. */
export function isValidIdempotencyKey(key: string): boolean {
  const length = new TextEncoder().encode(key.trim()).length
  return length >= IDEMPOTENCY_KEY_MIN_BYTES && length <= IDEMPOTENCY_KEY_MAX_BYTES
}
