import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import type * as ApiModule from '../../api'
import type * as DownloadModule from './download'
import { captureLinkClicks, fileItem, item } from './__tests__/support'
import { useFileActions } from './use-file-actions'

const TICKET = 'T'.repeat(43)

const spies = vi.hoisted(() => ({ resets: [] as Array<() => void>, throwOnRedeem: false }))

// Bilet sıfırlaması gözlenir (gerçek mutasyon sarmalanır); tarayıcıya verme istenirse istisna atar.
vi.mock('../../api', async (original) => {
  const api = await original<typeof ApiModule>()
  return {
    ...api,
    useDownloadTicket: () => {
      const ticket = api.useDownloadTicket()
      const reset = vi.fn(() => ticket.reset())
      spies.resets.push(reset)
      return { ...ticket, reset }
    },
  }
})
vi.mock('./download', async (original) => {
  const real = await original<typeof DownloadModule>()
  return {
    ...real,
    redeemDownload: (url: string, name: string) => {
      if (spies.throwOnRedeem) throw new Error('tarayıcı reddetti')
      return real.redeemDownload(url, name)
    },
  }
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  spies.resets.length = 0
  spies.throwOnRedeem = false
  resetHarness()
  useToast().clear()
  useConfirm().clear()
})
afterAll(() => server.close())

function setup() {
  const h = harness(COORD_SCOPE)
  const actions = h.run(() => useFileActions(item, fileItem()))
  return { h, actions }
}

describe('dosya eylemleri (W46 · E-03-61)', () => {
  it('indirme: görevin kapsamıyla bilet → tarayıcıya verilir; bilet saklanmaz', async () => {
    const ticket = { ticket: TICKET, url: `/v1/downloads/${TICKET}`, expires_at: 'x' }
    server.use(http.post(`${ORIGIN}/v1/download-tickets`, () => json(ticket, 201)))
    const stored = vi.spyOn(Storage.prototype, 'setItem')
    const clicks = captureLinkClicks()
    const { actions } = setup()
    await actions.download()

    const [req] = sent('POST', '/v1/download-tickets')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(clicks.hrefs).toEqual([`/v1/downloads/${TICKET}`])
    expect(clicks.downloads).toEqual(['rapor.pdf'])
    // Bilet ve URL depoya, adres çubuğuna ya da DOM'a yazılmaz.
    expect(document.body.innerHTML).not.toContain(TICKET)
    expect(stored).not.toHaveBeenCalled()
    expect(window.location.href).not.toContain(TICKET)
  })

  it('indirme: tarayıcıya verme istisna atsa da bilet sıfırlanır (finally, CX-F1-K-04)', async () => {
    const ticket = { ticket: TICKET, url: `/v1/downloads/${TICKET}`, expires_at: 'x' }
    server.use(http.post(`${ORIGIN}/v1/download-tickets`, () => json(ticket, 201)))
    spies.throwOnRedeem = true
    const { actions } = setup()
    await expect(actions.download()).rejects.toThrow('tarayıcı reddetti')
    expect(spies.resets).toHaveLength(1)
    expect(spies.resets[0]).toHaveBeenCalledTimes(1)
    expect(document.body.innerHTML).not.toContain(TICKET)
  })

  it('indirme hatası ve geçersiz yol bildirimle; hiçbir şey açılmaz', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () => errorEnvelope('platform.rate_limited', 429)),
    )
    const clicks = captureLinkClicks()
    const { actions } = setup()
    await actions.download()
    expect(clicks.hrefs).toEqual([])
    expect(useToast().current.value?.tone).toBe('danger')

    useToast().clear()
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        json({ ticket: TICKET, url: 'https://kotu.test/x', expires_at: 'x' }, 201),
      ),
    )
    await actions.download()
    expect(clicks.hrefs).toEqual([])
    expect(useToast().current.value?.message).toBe('İndirme bağlantısı açılamadı.')
  })

  it('silme: onay iptal → istek yok; onay → DELETE, dosyalar yeniden okunur', async () => {
    server.use(http.delete(`${ORIGIN}/v1/files/f1`, () => new Response(null, { status: 204 })))
    const { h, actions } = setup()
    const files = queryKeys.workItems.files(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(files, { files: [] })
    const confirm = useConfirm()

    const cancelled = actions.remove()
    await h.flush()
    expect(confirm.current.value?.options.tone).toBe('danger')
    confirm.cancel(confirm.current.value!.id)
    expect(await cancelled).toBe(false)
    expect(sent('DELETE', '/v1/files/f1')).toHaveLength(0)

    const accepted = actions.remove()
    await h.flush()
    await confirm.accept(confirm.current.value!.id)
    expect(await accepted).toBe(true)
    expect(sent('DELETE', '/v1/files/f1')).toHaveLength(1)
    expect(h.queryClient.getQueryState(files)?.isInvalidated).toBe(true)
  })

  it('ad değiştirme sonucu çağırana döner (409 records.name_taken)', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/name`, () => errorEnvelope('records.name_taken', 409)),
    )
    const { actions } = setup()
    const outcome = await actions.renameTo('yeni.pdf')
    expect(outcome.kind).toBe('failed')
    expect(outcome.kind === 'failed' && outcome.error.code).toBe('records.name_taken')
    expect(sent('PATCH', '/v1/files/f1/name')[0]!.body).toEqual({ display_name: 'yeni.pdf' })
  })

  it('CX-F1-E-02 (c): kabulün hemen ardından kapsam A→B → DELETE 0 (yazma onayın bağlamıyla)', async () => {
    server.use(http.delete(`${ORIGIN}/v1/files/f1`, () => new Response(null, { status: 204 })))
    const { h, actions } = setup()
    const confirm = useConfirm()
    const run = actions.remove()
    await h.flush()
    const accepting = confirm.accept(confirm.current.value!.id)
    h.store.commit({ programId: 'p2', lens: 'coordinator', departmentId: 'd3' })
    await accepting
    expect(await run).toBe(false)
    expect(sent('DELETE', '/v1/files/f1')).toHaveLength(0)
  })
})
