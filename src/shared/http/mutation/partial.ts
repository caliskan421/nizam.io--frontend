/**
 * Kısmi başarı modeli (ortak-kurallar §7, CX-S-03).
 *
 * Birincil yazma (ör. `createWorkItem` tek atananla) başarılıysa sonucu **korunur**; ardından
 * gelen adımlar (ör. `addAssignments`) başarısız olsa da birincil kayıt geri alınmaz ve
 * kullanıcıya ilk yanıtın gerçek durumu söylenir ("görev oluşturuldu, ek atama yapılamadı").
 * Birincil başarısızsa ardıl adımlar koşmaz.
 */
import type { MutationOutcome, MutationSuccess } from './outcome'

export interface FollowUpStep {
  /** Adımın kararlı adı (UI metni modülde: ör. 'assignments'). */
  name: string
  run: () => Promise<MutationOutcome<unknown, unknown, unknown>>
}

export interface StepResult {
  name: string
  outcome: MutationOutcome<unknown, unknown, unknown>
}

export type CompositeOutcome<V, D, S> =
  /** Birincil başarısız: ardıl adımlar koşmadı. */
  | { kind: 'primary_failed'; primary: Exclude<MutationOutcome<V, D, S>, MutationSuccess<D>> }
  /** Birincil ve bütün ardıl adımlar başarılı. */
  | { kind: 'complete'; primary: MutationSuccess<D>; steps: StepResult[] }
  /** Birincil başarılı (korunur), en az bir ardıl adım başarısız. */
  | { kind: 'partial'; primary: MutationSuccess<D>; steps: StepResult[]; failed: string[] }

/**
 * Birincil yazmayı ve (başarılıysa) ardıl adımları sırayla koşturur. Ardıl adımlar
 * birbirinden bağımsız sayılır: biri başarısız olsa da sonrakiler denenir.
 */
export async function runWithFollowUps<V, D, S>(
  primary: () => Promise<MutationOutcome<V, D, S>>,
  followUps: (data: D) => readonly FollowUpStep[],
): Promise<CompositeOutcome<V, D, S>> {
  const first = await primary()
  if (first.kind !== 'success') return { kind: 'primary_failed', primary: first }

  const steps: StepResult[] = []
  for (const step of followUps(first.data)) {
    steps.push({ name: step.name, outcome: await step.run() })
  }
  const failed = steps.filter((s) => s.outcome.kind !== 'success').map((s) => s.name)
  if (failed.length === 0) return { kind: 'complete', primary: first, steps }
  return { kind: 'partial', primary: first, steps, failed }
}
