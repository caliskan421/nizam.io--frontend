/**
 * Çocuk türlerin (dosya, alt görev, görev notu, toplantı notu, gündem) tekil yazma sonucunun ekran
 * yorumu (v0.26). Hata yorumu `outcome.ts` `failed` ile ortaktır (sunucu `message` gösterilmez).
 * Başarıda tek fark: dosya geri yüklemede ad çakışması numaralandıysa (`renamed`) yeni ad söylenir.
 * Sonuç bilinmiyorsa (ağ, 5xx) kör tekrar yok; liste korumalı yazmayla yeniden okunur.
 */
import type { MutationOutcome } from '@/shared/http/mutation'

import { deletedText } from './messages'
import { failed, type Interpreted, type LifecycleAction } from './outcome'

type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

function renamedTo(data: unknown): string | null {
  const result = data as { renamed?: unknown; display_name?: unknown } | null
  return result?.renamed === true && typeof result.display_name === 'string'
    ? result.display_name
    : null
}

export function interpretChildOutcome(
  action: LifecycleAction,
  title: string,
  outcome: AnyOutcome,
): Interpreted | null {
  if (outcome.kind === 'success') {
    if (action === 'purge')
      return { kind: 'done', message: deletedText('feedback.purged', { title }) }
    const name = renamedTo(outcome.data)
    return {
      kind: 'done',
      message: name
        ? deletedText('feedback.restoredRenamed', { title, name })
        : deletedText('feedback.restored', { title }),
    }
  }
  if (outcome.kind === 'failed') return failed(action, outcome.error.code)
  return null
}
