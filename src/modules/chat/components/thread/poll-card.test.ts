// BE-161 (W185b): anket kartı anonim/isimli — gerçek konuşma gövdesi + msw. Anonimde `voters` her
// zaman `[]` (kimse göremez); kendi oyum `mine`'dandır; isimli ankette davranış değişmez.
import type { VueWrapper } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { msg } from '../../__tests__/fixtures'
import { http, noContent, ORIGIN, resetAll, sent, server, signIn } from '../../__tests__/harness'
import type { Poll } from '../../model/types'
import { mountPane, servePane, settle, unmountAll } from '../__tests__/pane-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  unmountAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const poll = (over: Partial<Poll> = {}): Poll => ({
  anonymous: true,
  multi: false,
  closes_at: null,
  closed_at: null,
  results: [
    { option_index: 0, label: 'Cuma', count: 2, mine: true, voters: [] },
    { option_index: 1, label: 'Cumartesi', count: 1, mine: false, voters: [] },
  ],
  ...over,
})

async function card(p: Poll) {
  servePane({ messages: [msg(1, { body: 'Gün?', poll: p })] })
  const view = await mountPane()
  return { ...view, card: view.wrapper.get('.chat-poll') }
}
const opt = (c: Pick<VueWrapper, 'findAll'>, i: number) => c.findAll('.chat-poll__opt')[i]!

describe('anonim anket kartı (E-10-35, E-10-97, E-10-99)', () => {
  it('"anonim" etiketi; kendi oy mine\'dan (voters boş); tek seçimde kişi = Σcount ve yüzde', async () => {
    const { card: c } = await card(poll())
    expect(c.find('.chat-poll__meta').text()).toBe('Tek seçim · anonim')
    expect(c.text()).not.toContain('isimli')
    expect(opt(c, 0).attributes('aria-pressed')).toBe('true')
    expect(opt(c, 1).attributes('aria-pressed')).toBe('false')
    expect(c.text()).toContain('3 kişi oy verdi')
    expect(c.text()).toContain('%67')
  })

  it('anonim çoklu seçim: kişi sayısı türetilemez → yüzde ve "kişi oy verdi" yok; seçenek başına oy sayısı', async () => {
    const { card: c } = await card(poll({ multi: true }))
    expect(c.text()).toContain('2 oy')
    expect(c.text()).toContain('1 oy')
    expect(c.text()).not.toMatch(/kişi oy verdi|%\d/)
    expect(c.find('.chat-poll__meta').text()).toBe('Çoklu seçim · anonim')
  })

  it('sızıntı yok: sunucu yanlışlıkla voters gönderse bile hiçbir oy veren adı çizilmez', async () => {
    const leaky = poll()
    leaky.results[0]!.voters = [{ account_id: 'u9', full_name: 'Gizli Kişi' }]
    const { card: c } = await card(leaky)
    expect(c.text()).not.toContain('Gizli Kişi')
  })

  it('oy ver: anonim ankette de PUT option_indexes; seçili seçeneğe tık oyu geri çeker ([])', async () => {
    const bodies: unknown[] = []
    server.use(
      http.put(`${ORIGIN}/v1/chats/c1/messages/m1/vote`, async ({ request }) => {
        bodies.push(await request.clone().json())
        return noContent()
      }),
    )
    const { card: c, client } = await card(poll())
    await opt(c, 1).trigger('click')
    await settle(client)
    await opt(c, 0).trigger('click')
    await settle(client)
    expect(sent('PUT', '/v1/chats/c1/messages/m1/vote')).toHaveLength(2)
    expect(bodies).toEqual([{ option_indexes: [1] }, { option_indexes: [] }])
  })
})

describe('isimli anket kartı değişmedi (BE-161 regresyon)', () => {
  it('"isimli"; kişi sayısı voters birleşimi; oyum mine\'dan', async () => {
    const named = poll({
      anonymous: false,
      results: [
        {
          option_index: 0,
          label: 'Cuma',
          count: 2,
          mine: true,
          voters: [
            { account_id: 'acc-1', full_name: 'Ben' },
            { account_id: 'u2', full_name: 'İki' },
          ],
        },
        {
          option_index: 1,
          label: 'Cumartesi',
          count: 1,
          mine: false,
          voters: [{ account_id: 'u3', full_name: 'Üç' }],
        },
      ],
    })
    const { card: c } = await card(named)
    expect(c.find('.chat-poll__meta').text()).toBe('Tek seçim · isimli')
    expect(c.text()).toContain('3 kişi oy verdi')
    expect(opt(c, 0).attributes('aria-pressed')).toBe('true')
    // Oyum yalnız `mine`'dır: voters'ta ben olsam bile mine=false ise seçili sayılmaz.
    expect(opt(c, 1).attributes('aria-pressed')).toBe('false')
  })
})
