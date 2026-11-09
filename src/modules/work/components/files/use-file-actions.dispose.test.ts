/**
 * İndirme bileti — sahip sökülmesi (W66b): bilet isteği beklerken bileşen sökülür, geç 201 gelir.
 * Bilet TÜKETİLMEZ (`redeemDownload` 0, bağlantı tıklanmaz), sonuç yine sıfırlanır (`finally`;
 * bilet gözlemcide/DOM'da kalmaz). Canlı sahipte indirme eskisi gibi. Gerçek hook + MSW.
 */
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, type Ref } from 'vue'

import { useToast } from '@/shared/ui'

import {
  COORD_SCOPE,
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

// Gerçek bilet mutasyonu sarmalanır: sıfırlama ve sonuç ref'i gözlenir; tarayıcıya verme sayılır.
const spies = vi.hoisted(() => ({
  resets: [] as Array<() => void>,
  outcomes: [] as Array<Ref<unknown>>,
  redeems: [] as string[],
}))

vi.mock('../../api', async (original) => {
  const api = await original<typeof ApiModule>()
  return {
    ...api,
    useDownloadTicket: () => {
      const ticket = api.useDownloadTicket()
      const reset = vi.fn(() => ticket.reset())
      spies.resets.push(reset)
      spies.outcomes.push(ticket.outcome)
      return { ...ticket, reset }
    },
  }
})
vi.mock('./download', async (original) => {
  const real = await original<typeof DownloadModule>()
  return {
    ...real,
    redeemDownload: (url: string, name: string) => {
      spies.redeems.push(url)
      return real.redeemDownload(url, name)
    },
  }
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  spies.resets.length = 0
  spies.outcomes.length = 0
  spies.redeems.length = 0
  useToast().clear()
  resetHarness()
})
afterAll(() => server.close())

function mountActions() {
  const h = harness(COORD_SCOPE)
  let actions!: ReturnType<typeof useFileActions>
  const Owner = defineComponent({
    setup() {
      actions = useFileActions(item, fileItem())
      return () => null
    },
  })
  const wrapper = mount(Owner, {
    global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  return { actions, unmount: () => wrapper.unmount() }
}

/** Bilet isteği sunucuda bekletilir; `release` geçerli bileti döndürür. */
function lateTicket() {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  let arrived!: () => void
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  server.use(
    http.post(`${ORIGIN}/v1/download-tickets`, async () => {
      arrived()
      await held
      return json({ ticket: TICKET, url: `/v1/downloads/${TICKET}`, expires_at: 'x' }, 201)
    }),
  )
  return { reached, release }
}

describe('indirme bileti — sahip sökülmesi (W66b)', () => {
  it('bilet beklerken sökülme → geç yanıt: redeemDownload 0, bağlantı yok, bilet sıfırlanır', async () => {
    const late = lateTicket()
    const clicks = captureLinkClicks()
    const { actions, unmount } = mountActions()
    const run = actions.download()
    await late.reached
    unmount()
    late.release()
    await expect(run).resolves.toBeUndefined()
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(spies.redeems).toEqual([])
    expect(clicks.hrefs).toEqual([])
    expect(spies.resets[0]).toHaveBeenCalledTimes(1)
    expect(spies.outcomes[0]!.value).toBeUndefined()
    expect(document.body.innerHTML).not.toContain(TICKET)
    expect(useToast().queue.value).toEqual([])
  })

  it('canlı sahip: indirme eskisi gibi açılır, bilet sıfırlanır', async () => {
    const late = lateTicket()
    const clicks = captureLinkClicks()
    const { actions, unmount } = mountActions()
    const run = actions.download()
    await late.reached
    late.release()
    await run
    expect(spies.redeems).toEqual([`/v1/downloads/${TICKET}`])
    expect(clicks.hrefs).toEqual([`/v1/downloads/${TICKET}`])
    expect(spies.resets[0]).toHaveBeenCalledTimes(1)
    expect(spies.outcomes[0]!.value).toBeUndefined()
    unmount()
  })
})
