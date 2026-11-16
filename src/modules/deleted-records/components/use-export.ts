/**
 * "CSV indir" eylemi (E-12-05; BE-116): bilet akışı (`shared/download`; ADR-0013) — bilet tıklama
 * anında üretilir (S1 + CSRF; program başlığı bilete yazılır), hemen tüketilir (S0) ve gövde
 * `Content-Disposition` adıyla kaydedilir. CSV `Content-Length` taşımaz (chunked): tamamlanma
 * yalnız akış sonudur; akış ortasında bağlantı kesilirse okuma hata verir, dosya KAYDEDİLMEZ ve
 * "yarım kaldı" kartı gösterilir. Tek uçuş (çift tık yok); otomatik tekrar YOKTUR. Eylem sahibi
 * (sayfa) söküldüğünde, kapsam ya da oturum değiştiğinde ve "İptal"de iptal edilir (bilet
 * tüketilmez / dosya kaydedilmez, bildirim yok). `useToast` kurulumda alınır (KESİN 26a).
 */
import { useQueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'

import { useDownloadFlow, useDownloadLife, type DownloadResult } from '@/shared/download'
import { reportAuthorityLoss } from '@/shared/scope/authority-loss'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import {
  classifyFailure,
  classifyTicketOutcome,
  type ReportFailure,
} from '@/modules/reports/public'

import type { ListQuery } from '../model/filters'
import type { DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'
import { exportTarget, type ExportRequest } from '../model/export'

export type ExportState =
  { kind: 'idle' } | { kind: 'running' } | { kind: 'failed'; failure: ReportFailure }

export interface ExportOptions {
  kind: () => DeletedKind
  query: () => ListQuery
}

export function useDeletedExport(options: ExportOptions) {
  const scope = useScopeStore()
  const client = useQueryClient()
  const toast = useToast()
  const flow = useDownloadFlow<ExportRequest>(exportTarget)
  const state = ref<ExportState>({ kind: 'idle' })
  const life = useDownloadLife()
  const cancel = life.cancel

  function settle(result: DownloadResult<ExportRequest>): void {
    switch (result.kind) {
      case 'saved':
        state.value = { kind: 'idle' }
        toast.push({ message: deletedText('export.saved', { name: result.fileName }) })
        return
      case 'failed':
        reportAuthorityLoss(client, result.error)
        state.value = {
          kind: 'failed',
          failure: classifyFailure(result.error, result.retryAfter),
        }
        return
      case 'ticket_failed': {
        const failure = classifyTicketOutcome(result.outcome)
        state.value = failure === null ? { kind: 'idle' } : { kind: 'failed', failure }
        return
      }
      case 'disposed':
        state.value = { kind: 'idle' }
    }
  }

  async function start(): Promise<void> {
    if (state.value.kind === 'running' || scope.programId === null) return
    const lifeOptions = life.begin()
    state.value = { kind: 'running' }
    const request = { programId: scope.programId, kind: options.kind(), query: options.query() }
    settle(await flow.start(request, lifeOptions))
  }

  return {
    state,
    start,
    cancel,
    dismiss: () => {
      if (state.value.kind === 'failed') state.value = { kind: 'idle' }
    },
  }
}
