/**
 * Rapor PDF eylemleri (okuma değil EYLEM): `downloadSeasonPdf()`, `downloadWorkloadPdf(memberIds?)`,
 * `downloadMeetingPdf(id)`, `downloadTaskPdf(id)`. Ortak bilet akışı (`shared/download`): bilet
 * tıklama anında üretilir (S1 + CSRF; program başlığı bilete yazılır), hemen tüketilir (S0),
 * dosya `Content-Disposition` adıyla kaydedilir; bilet/blob önbelleğe girmez. `Idempotency-Key`
 * YOKTUR (sözleşme istemiyor). Otomatik tekrar YOKTUR.
 *
 * Bu sekmedeki bütün rapor üretimleri `reportGate` altındadır (aynı anda tek istek). Eylem şu
 * hâllerde İPTAL edilir (bilet tüketilmez / dosya kaydedilmez, bildirim yok; KESİN 26): sahip
 * (bileşen) söküldü, kapsam (program/mercek/departman) değişti, oturum değişti, `cancel()`.
 * Bildirim için `useToast()` KURULUMDA alınır: sökülmüş ekranın geç sonucu bildirim üretmez.
 *
 * 403 `reporting.not_authorized` ve diğer yetki kaybı kodları ortak kanala bildirilir
 * (`reportAuthorityLoss`: `me`, `me/departments`, program listesi geçersizlenir, K6).
 * 429 `Retry-After` taşıyorsa `reportGate` geri sayımı başlar; bitince indirme KENDİLİĞİNDEN
 * başlamaz.
 */
import { useQueryClient } from '@tanstack/vue-query'
import { readonly, ref } from 'vue'

import { useDownloadFlow } from '@/shared/download'
import { i18n } from '@/shared/i18n'
import { reportAuthorityLoss } from '@/shared/scope/authority-loss'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import { reportGate, type ReportGate, type ReportLease } from '../model/gate'
import { settleDownload } from '../model/settle'
import { reportTarget } from '../model/targets'
import type { ReportRequest, ReportRunInput, ReportRunResult } from '../model/types'
import { bindLeaseCancellation } from './cancellation'

export function useReportDownloads(gate: ReportGate = reportGate) {
  const store = useScopeStore()
  const client = useQueryClient()
  const toast = useToast()
  const flow = useDownloadFlow<ReportRequest>(reportTarget)
  const pending = ref(false)
  let held: ReportLease | null = null
  let runId = 0
  // İptal edilen önceki eylemin çözülmesi beklenir (ortak bilet mutasyonu sıfırlanırken yeni
  // eylemi ezmesin; CX-F6-E-01).
  let unwinding: Promise<unknown> = Promise.resolve()
  const cancel = bindLeaseCancellation(() => held)

  function run(input: ReportRunInput): Promise<ReportRunResult> {
    if (held !== null && !held.signal.aborted) return execute(input)
    const next = unwinding.then(() => execute(input))
    unwinding = next.catch(() => undefined)
    return next
  }

  async function execute(input: ReportRunInput): Promise<ReportRunResult> {
    const programId = store.programId
    if (programId === null) return { kind: 'unavailable' }
    const lease = gate.acquire()
    if (lease === null) return { kind: 'locked' }
    held = lease
    const id = ++runId
    cancel.stamp()
    pending.value = true
    try {
      const result = await flow.start({ ...input, programId }, { signal: lease.signal })
      return settleDownload(result, {
        saved: (name) =>
          toast.push({ message: i18n.global.t('reports.action.downloaded', { name }) }),
        consumeError: (error) => reportAuthorityLoss(client, error),
        cooldown: gate.startCooldown,
      })
    } finally {
      lease.release()
      if (held === lease) held = null
      if (id === runId) pending.value = false
    }
  }

  return {
    run,
    cancel: cancel.now,
    isPending: readonly(pending),
    busy: gate.busy,
    cooldown: gate.cooldown,
    downloadSeasonPdf: () => run({ kind: 'season' }),
    downloadWorkloadPdf: (memberIds?: readonly string[]) => run({ kind: 'workload', memberIds }),
    downloadMeetingPdf: (id: string) => run({ kind: 'meeting', targetId: id }),
    downloadTaskPdf: (id: string) => run({ kind: 'task', targetId: id }),
  }
}
