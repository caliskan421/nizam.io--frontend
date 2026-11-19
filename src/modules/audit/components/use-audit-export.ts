import { onScopeDispose, ref, watch } from 'vue'

import { useDownloadFlow, useDownloadLife } from '@/shared/download'
import { errorText } from '@/shared/i18n'
import { outcomeText } from '@/shared/ui/confirm'

import { useAuditScope } from '../model/access'
import { auditExportTarget } from '../model/export'
import type { AuditQuery } from '../model/types'

export function useAuditExport(query: () => AuditQuery | null) {
  const flow = useDownloadFlow(auditExportTarget)
  const life = useDownloadLife()
  const { audience, programId } = useAuditScope()
  const busy = ref(false)
  const status = ref('')
  const waiting = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  watch([query, audience], () => {
    life.cancel()
    status.value = ''
  })
  onScopeDispose(() => clearTimeout(timer))

  function wait(seconds: number | null): void {
    if (!seconds || seconds <= 0) return
    waiting.value = true
    timer = setTimeout(() => {
      waiting.value = false
    }, seconds * 1000)
  }

  async function start(): Promise<void> {
    const filters = query()
    if (!filters || filters.program_id !== programId.value || busy.value || waiting.value) return
    const scope = life.begin()
    const authority = audience.value
    const isCurrent = () => scope.isCurrent() && authority === audience.value
    busy.value = true
    status.value = ''
    try {
      const result = await flow.start(filters, { ...scope, isCurrent })
      if (!isCurrent()) return
      if (result.kind === 'saved') status.value = `${result.fileName} indirildi.`
      if (result.kind === 'failed') {
        wait(result.retryAfter)
        status.value = result.retryAfter
          ? `Yeniden denemek için ${result.retryAfter} saniye bekleyin.`
          : errorText(result.error)
      }
      if (result.kind === 'ticket_failed') {
        const outcome = result.outcome
        if (outcome.kind === 'rate_limited') wait(outcome.retryAfter)
        status.value = outcomeText(outcome)
      }
    } finally {
      busy.value = false
    }
  }

  return { start, busy, waiting, status }
}
