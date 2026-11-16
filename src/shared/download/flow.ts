/**
 * İndirme bileti akışı (ADR-0013): `issueDownloadTicket` (S1, CSRF; hedefin kapsam başlıkları bilete
 * yazılır) → hemen `redeemDownloadTicket` (S0, 60 sn, tek kullanım). Arşiv (dosya/ZIP) ve rapor
 * (dört PDF) aynı akışı kullanır; hedef yolunu çağıran üretir (`toTarget`). Bilet önbelleğe/duruma
 * girmez (`gcTime: 0`, her indirmeden sonra `reset`). `Idempotency-Key` gönderilmez (sözleşme
 * istemiyor; yazma kapısı yalnız kapsam/oturum/sahip denetimi için kullanılır).
 *
 * Sahip bilet beklerken söküldüyse ya da `signal` iptal edildiyse bilet TÜKETİLMEZ (`disposed`).
 */
import { api } from '@/shared/http'
import { ownerLife, useProtectedMutation } from '@/shared/http/mutation'

import { redeemAndSave } from './redeem'
import type { DownloadResult, DownloadTarget, DownloadTicket } from './types'

/** İki iptal sinyalinden biri iptal olunca iptal olan sinyal (yoksa ilki). */
export function linkSignals(first: AbortSignal, second?: AbortSignal): AbortSignal {
  if (second === undefined) return first
  const controller = new AbortController()
  const forward = (source: AbortSignal) => () => controller.abort(source.reason)
  for (const source of [first, second]) {
    if (source.aborted) controller.abort(source.reason)
    else source.addEventListener('abort', forward(source), { once: true })
  }
  return controller.signal
}

/** `POST /v1/download-tickets` gövdesi; `body` GET hedefinde hiç gönderilmez. */
export function ticketBody(target: DownloadTarget) {
  const base = { method: target.method, path: target.path }
  // Şemada `body: Record<string, never>` (serbest JSON nesnesi): çalışma anında hedefin gövdesi.
  return target.method === 'POST' && target.body !== undefined
    ? { ...base, body: target.body as Record<string, never> }
    : base
}

export interface DownloadStartOptions {
  /** Eylem iptali (sahip sökülmesi, kapsam/oturum değişimi, "İptal"). */
  signal?: AbortSignal
  /**
   * Bağlam doğrulayıcısı (kapsam/program, oturum nesli/hesap, sahip canlı): bilet yanıtından sonra
   * tüketimden ÖNCE ve dosya kaydından ÖNCE yeniden sorulur; `false` ise tüketim isteği atılmaz /
   * dosya kaydedilmez (`disposed`, bildirim yok; KESİN 26). Verilmezse yalnız `signal` geçerlidir.
   */
  isCurrent?: () => boolean
}

export function useDownloadFlow<V>(toTarget: (vars: V) => DownloadTarget) {
  let external: AbortSignal | undefined
  const ticket = useProtectedMutation<V, DownloadTicket>({
    operation: 'issueDownloadTicket',
    gcTime: 0,
    send: (vars, ctx) => {
      const target = toTarget(vars)
      return api.POST('/v1/download-tickets', {
        params: { header: target.headers },
        body: ticketBody(target),
        signal: linkSignals(ctx.signal, external),
      })
    },
  })
  const owner = ownerLife()

  async function start(request: V, options: DownloadStartOptions = {}): Promise<DownloadResult<V>> {
    const { signal, isCurrent } = options
    if (signal?.aborted) return { kind: 'disposed' }
    external = signal
    const stale = () => signal?.aborted === true || isCurrent?.() === false
    const fallbackName = toTarget(request).fallbackName
    const outcome = await ticket.submit(request)
    try {
      if (outcome.kind !== 'success' && stale()) return { kind: 'disposed' }
      if (outcome.kind !== 'success') return { kind: 'ticket_failed', outcome }
      // Sahip söküldü ya da eylem iptal: bilet tüketilmez, indirme açılmaz.
      const current = () => owner.alive() && isCurrent?.() !== false
      if (stale() || !current()) return { kind: 'disposed' }
      return await redeemAndSave(outcome.data.url, fallbackName, signal, current)
    } finally {
      // Bilet bellekte kalmaz (hata yolunda ve söküm sonrasında da).
      ticket.reset()
      external = undefined
    }
  }

  return { start, isPending: ticket.isPending }
}
