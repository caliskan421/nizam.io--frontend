import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { runPurgeSequence, type PurgeSequenceDeps } from './purge-sequence'
import type { PurgeOutcome } from './purge-loop'

// Çöpü boşalt dizisi: "Durdur" türler arasında da geçerlidir (F10-OPUS-01). Sonraki türe istek
// atılmadan önce bayrak okunur; önceki türlerin başarıları özette korunur.
const success = (ids: string[]): PurgeOutcome =>
  ({
    kind: 'success',
    data: { succeeded: ids, failed: [], remaining: 0 },
    context: { scope: { programId: 'p1', departmentId: null } },
  }) as unknown as PurgeOutcome

function setup(stopped: boolean) {
  const calls: string[] = []
  const submit = (kind: string) => () => {
    calls.push(kind)
    return Promise.resolve(success([`${kind}-1`]))
  }
  const summary = ref<{ message: string } | null>(null)
  const toast = { push: vi.fn() }
  const deps = {
    hub: {
      purgeAll: {
        task_notes: submit('task_notes'),
        meeting_notes: submit('meeting_notes'),
        agenda_items: submit('agenda_items'),
      },
    },
    scope: { programId: 'p1' },
    state: {
      stop: { requested: stopped },
      progress: ref({ done: 0, left: null as number | null }),
      summary,
    },
    toast,
    refresh: () => Promise.resolve(undefined),
  } as unknown as PurgeSequenceDeps
  return { calls, deps, summary, toast }
}
const KINDS = ['task_notes', 'meeting_notes', 'agenda_items'] as never

describe('runPurgeSequence Durdur', () => {
  it('ilk türün yanıtı gelmişken Durdur istenmişse sonraki türlere çağrı gitmez; önceki başarı özette', async () => {
    const { calls, deps, summary, toast } = setup(true)
    await runPurgeSequence(deps, KINDS, success(['n1', 'n2']))
    expect(calls).toEqual([])
    expect(toast.push).not.toHaveBeenCalled()
    expect(summary.value?.message).toContain('Durduruldu: 2 kayıt silindi')
  })

  it('Durdur istenmemişse üç tür de sırayla boşaltılır', async () => {
    const { calls, deps, summary, toast } = setup(false)
    await runPurgeSequence(deps, KINDS, success(['n1']))
    expect(calls).toEqual(['meeting_notes', 'agenda_items'])
    expect(summary.value).toBeNull()
    expect(toast.push).toHaveBeenCalledTimes(1)
  })
})
