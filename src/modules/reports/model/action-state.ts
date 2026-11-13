/**
 * Rapor düğmesinin durum makinesi (13 `mekanizma.md` §3.1; tek ortak bileşen, dört yerde aynı):
 * `ready → preparing → downloaded | failed`, ek olarak `cooldown(N)` (yalnız `Retry-After`
 * taşıyan 429'larda), `locked` (başka bir rapor üretiliyor) ve `disabled` (BE kaynaklı eksik).
 * Saf fonksiyon: ekran bileşeni ve testler aynı kararı kullanır.
 */
import type { ReportFailure } from './types'

export type ReportActionPhase = 'idle' | 'downloaded' | 'failed'

export type ReportActionState =
  'disabled' | 'preparing' | 'locked' | 'cooldown' | 'failed' | 'downloaded' | 'ready'

export interface ReportActionInputs {
  disabled: boolean
  /** Bu düğmenin (örneğin) isteği sürüyor. */
  pending: boolean
  /** Sekmede (başka bir düğmeyle) bir rapor üretiliyor (`reportGate.busy`). */
  gateBusy: boolean
  /** Ortak geri sayımın kalan saniyesi (`reportGate.cooldown`). */
  cooldown: number
  phase: ReportActionPhase
}

export function reportActionState(input: ReportActionInputs): ReportActionState {
  if (input.disabled) return 'disabled'
  if (input.pending) return 'preparing'
  if (input.gateBusy) return 'locked'
  if (input.cooldown > 0) return 'cooldown'
  if (input.phase === 'failed') return 'failed'
  if (input.phase === 'downloaded') return 'downloaded'
  return 'ready'
}

/** Düğme tıklanabilir mi (yalnız hazır/başarısız/indirildi; başarısızda "Yeniden dene"). */
export function canStart(state: ReportActionState): boolean {
  return state === 'ready' || state === 'failed' || state === 'downloaded'
}

/** Başarısızlık düğmede "Yeniden dene" gösterir mi (sayaç olmayan, kullanıcı eylemiyle tekrar). */
export function showsRetry(failure: ReportFailure | null): boolean {
  return (
    failure !== null && failure.kind !== 'export_in_progress' && failure.kind !== 'rate_limited'
  )
}
