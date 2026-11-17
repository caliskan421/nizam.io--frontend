/**
 * Çöpü boşalt döngüsü (BE-115): ≤50'lik çağrıları sırayla gönderir. İLK çağrı ortak onayın
 * başlatıcısında (`confirmWrite`) onayın yakaladığı bağlamla gider; sonraki çağrılar ilk
 * çağrının bağlamını (`MutationSuccess.context`) taşır — kapsam/oturum değişirse motor göndermez
 * (CX-F1-E-02). Durma kuralı `shouldContinue`; kullanıcı kesmesi parçalar arasında denetlenir.
 * Başarısız protokol sonucu (5xx, ağ, 4xx) döngüyü durdurur ve çağırana verilir; işlenenler
 * kalıcıdır, kör tekrar yoktur.
 */
import type { MutationOutcome } from '@/shared/http/mutation'

import { emptyRun, mergeRun, type BatchRun } from '../model/batch'
import { shouldContinue } from '../model/purge-all'
import type { DeletedBatchResult, PurgeAllTarget } from '../model/types'

export type PurgeOutcome = MutationOutcome<PurgeAllTarget, DeletedBatchResult, unknown>
export type PurgeSubmit = (
  vars: PurgeAllTarget,
  opts: { context?: PurgeContext },
) => Promise<PurgeOutcome>
export type PurgeContext = NonNullable<Extract<PurgeOutcome, { kind: 'success' }>['context']>

export interface PurgeLoopResult {
  run: BatchRun
  remaining: number | null
  /** `done`: kural gereği bitti; `cancelled`: kullanıcı kesti; `stopped`: protokol sonucu durdurdu. */
  state: 'done' | 'cancelled' | 'stopped'
  stopped: PurgeOutcome | null
  /** Son başarılı çağrının bağlamı: sıradaki tür aynı yakalanmış bağlamla sürer. */
  context: PurgeContext | undefined
}

export async function purgeLoop(
  submit: PurgeSubmit,
  target: PurgeAllTarget,
  first: PurgeOutcome,
  hooks: { shouldStop: () => boolean; onProgress: (done: number, left: number) => void },
): Promise<PurgeLoopResult> {
  let run = emptyRun()
  let remaining: number | null = null
  let outcome = first
  let context: PurgeContext | undefined
  for (;;) {
    if (outcome.kind !== 'success') {
      return { run, remaining, state: 'stopped', stopped: outcome, context }
    }
    context = outcome.context
    run = mergeRun(run, outcome.data)
    // Başarısız kayıt her çağrıda aday kalır ve yeniden başarısız olur: kimlik başına tek satır.
    run = { ...run, failed: [...new Map(run.failed.map((line) => [line.id, line])).values()] }
    remaining = outcome.data.remaining ?? 0
    hooks.onProgress(run.succeeded.length, remaining)
    if (!shouldContinue(outcome.data)) {
      return { run, remaining, state: 'done', stopped: null, context }
    }
    if (hooks.shouldStop()) {
      return { run, remaining, state: 'cancelled', stopped: null, context }
    }
    outcome = await submit(target, { context: outcome.context })
  }
}
