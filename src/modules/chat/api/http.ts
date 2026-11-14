/**
 * Sohbet uçlarının ortak HTTP yardımcıları. Bütün sohbet uçları S2'dir (`X-Nizamio-Program`);
 * başlık İSTEĞE ÖZELDİR: korumalı yazmada eylemin yakaladığı program değişkende taşınır
 * (K2, ara katman açık başlığı depo kapsamının önüne koyar). Tek S1 uç: `getChatUnreadOverview`.
 */
import type { ProgramTarget } from '../model/types'

export function programHeaders(target: ProgramTarget) {
  return { 'X-Nizamio-Program': target.programId }
}

export { retryTransient } from '@/shared/http/retry'
