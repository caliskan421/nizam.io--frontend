/**
 * Çöpü boşalt: türleri SIRAYLA boşaltır (tek tür ya da `Not ve gündem`in üç türü). Her tür kendi
 * `purgeLoop`'unu (≤50'lik çağrılar, ilerleme yoksa durur) çalıştırır; sıradaki tür önceki türün son
 * başarılı çağrısının yakalanmış bağlamıyla sürer (kapsam/oturum değişirse motor göndermez). Bir tür
 * kesilir ya da protokol sonucuyla durursa sonrakine geçilmez; önceden silinenler geri gelmez ve
 * özet bunu söyler. Sonuç kimlikleri satır anahtarına (`kind:id`) çevrilir.
 */
import type { Ref } from 'vue'

import { reachesOwner } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'

import { emptyRun, mergeRun, type BatchRun, type BatchSummary } from '../model/batch'
import type { LifecycleKind } from '../model/lifecycle'
import { PURGE_ALL_CONFIRM, summarizePurgeAll } from '../model/purge-all'
import { purgeLoop, type PurgeContext, type PurgeOutcome } from './purge-loop'
import type { LifecycleHub } from './use-lifecycle-hub'

export interface PurgeSequenceDeps {
  hub: LifecycleHub
  scope: { programId: string | null }
  state: {
    stop: { requested: boolean }
    progress: Ref<{ done: number; left: number | null }>
    summary: Ref<BatchSummary | null>
  }
  toast: { push: (toast: { message: string }) => unknown }
  refresh: () => Promise<unknown>
}

export const purgeTarget = (programId: string | null, kind: LifecycleKind) => ({
  programId: programId ?? '',
  confirm: PURGE_ALL_CONFIRM[kind],
})

export async function runPurgeSequence(
  deps: PurgeSequenceDeps,
  kinds: readonly LifecycleKind[],
  first: PurgeOutcome,
): Promise<void> {
  const { hub, scope, state } = deps
  let run: BatchRun = emptyRun()
  let remaining = 0
  let ended: 'done' | 'cancelled' | 'interrupted' = 'done'
  let context: PurgeContext | undefined
  for (const [index, kind] of kinds.entries()) {
    const target = purgeTarget(scope.programId, kind)
    const start = index === 0 ? first : await hub.purgeAll[kind](target, { context })
    const before = run.succeeded.length
    const result = await purgeLoop(hub.purgeAll[kind], target, start, {
      shouldStop: () => state.stop.requested,
      onProgress: (done, left) => {
        state.progress.value = { done: before + done, left }
      },
    })
    const tagged = mergeRun(emptyRun(), result.run, kind)
    run = {
      succeeded: [...run.succeeded, ...tagged.succeeded],
      failed: [...run.failed, ...tagged.failed],
    }
    remaining += result.remaining ?? 0
    context = result.context
    if (result.stopped) {
      if (!reachesOwner(result.stopped)) return
      notifyOutcome(result.stopped)
      await deps.refresh()
      ended = 'interrupted'
      break
    }
    if (result.state === 'cancelled') {
      ended = 'cancelled'
      break
    }
  }
  const made = summarizePurgeAll(run, remaining, ended)
  if (made.tone === 'success') deps.toast.push({ message: made.message })
  else state.summary.value = made
}
