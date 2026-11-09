/**
 * Zaman çizelgesi uçlarının ortak HTTP yardımcıları. Kapsam başlıkları ve tekrar kuralı work
 * modülüyle AYNIDIR (`work/public.ts`): S2 yalnız program, S3 program + departman; okumada
 * yalnız geçici hatalar (ağ, 5xx) en çok iki kez tekrarlanır.
 */
export { programHeaders, retryTransient, scopeHeaders } from '@/modules/work/public'

export const TIMELINE_STALE_MS = 30_000
