/**
 * Panel yazmalarının ortak sonuç işleme yardımcıları (K5, ortak-kurallar §7): hata kodu → i18n
 * metni (sunucu `message` alanı gösterilmez); 409 sonrası görev yeniden okunur. Yeniden okuma
 * eylemin YAKALANMIŞ kapsamıyla yapılır (sonradan seçilen kapsama dokunulmaz).
 */
import type { QueryClient } from '@tanstack/vue-query'

import type { MutationOutcome } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { errorText } from '@/shared/i18n'
import type { ScopeSnapshot } from '@/shared/scope/scope'

type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

/** Başarısız sonucun hata kodu; başarısızlık değilse `null`. */
export function failedCode(outcome: AnyOutcome): string | null {
  return outcome.kind === 'failed' ? outcome.error.code : null
}

/** Satır içi gösterilecek hata metni (yalnız `failed`); diğer sınıflar ortak bildirimden gider. */
export function failedText(outcome: AnyOutcome): string | null {
  return outcome.kind === 'failed' ? errorText(outcome.error) : null
}

/** 409 ailesi (ya da `conflict_retry`): görev bayat olabilir → yeniden okunmalı. */
export function needsReread(outcome: AnyOutcome): boolean {
  if (outcome.kind === 'conflict_retry') return true
  return outcome.kind === 'failed' && outcome.error.status === 409
}

/** Görevi (yakalanmış kapsamla) yeniden okutur. */
export function rereadItem(
  client: QueryClient,
  fallback: ScopeSnapshot,
  outcome: AnyOutcome,
  workItemId: string,
): void {
  const scope = (outcome.kind === 'failed' && outcome.context?.scope) || fallback
  void client.invalidateQueries({
    queryKey: queryKeys.workItems.item(scope, workItemId),
    exact: true,
  })
}
