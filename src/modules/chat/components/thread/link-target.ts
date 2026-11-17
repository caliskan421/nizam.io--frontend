/** Bağlantıyla gelinen hedef mesaj (`?mesaj=<seq>`): geçerli pozitif tam sayı, yoksa `null`. */
export function linkTargetSeq(raw: unknown): number | null {
  const seq = Number(typeof raw === 'string' ? raw : '')
  return Number.isInteger(seq) && seq > 0 ? seq : null
}
