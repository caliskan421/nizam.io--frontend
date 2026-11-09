/**
 * Program uçlarının ortak HTTP yardımcıları. Program uçları S1'dir (kapsam başlığı yok);
 * `readProgram` S2: program başlığı açıkça eylemin/sorgunun anlık görüntüsünden yazılır.
 * Okumalarda yalnız geçici hatalar tekrarlanır (`retryTransient`, work ile aynı kural).
 */
export { retryTransient } from '@/modules/work/public'

export const PROGRAM_STALE_MS = 30_000
/** `listTransfers` sayfa boyu (P4, §10: sayfa tavanı ≠ toplam tavanı). */
export const TRANSFER_PAGE_LIMIT = 50

/** S2: yalnız program başlığı. */
export function programHeader(programId: string) {
  return { 'X-Nizamio-Program': programId }
}
