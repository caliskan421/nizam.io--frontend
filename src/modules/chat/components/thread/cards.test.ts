import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { msg } from '../../__tests__/fixtures'
import {
  errorEnvelope,
  http,
  json,
  ORIGIN,
  resetAll,
  sent,
  server,
  signIn,
} from '../../__tests__/harness'
import { mountPane, servePane, unmountAll } from '../__tests__/pane-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetAll()
  unmountAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const taskSummary = {
  available: true,
  chat_id: 'c1',
  kind: 'task',
  message_id: 'm1',
  ref_id: 'r1',
  target_id: 't1',
  task: {
    assignees: [],
    department_id: 'd1',
    department_name: 'Elektrik',
    description: '',
    end_on: '2026-12-01',
    start_on: '2026-11-01',
    status: 'todo',
    title: 'Trafo projesi',
  },
}

describe('kartlar ve çipler', () => {
  it('KUSUR 13: silinmiş/erişilemeyen görev (available:false, başlık yok) "artık yok" çipiyle gösterilir', async () => {
    servePane({
      messages: [
        msg(1, {
          body: 'Eski görev kartı',
          refs: [{ kind: 'task', ref_id: 'r9', target_id: 't9' }],
        }),
      ],
    })
    server.use(
      http.get(`${ORIGIN}/v1/chat-refs/r9`, () =>
        json({
          available: false,
          chat_id: 'c1',
          kind: 'task',
          message_id: 'm1',
          ref_id: 'r9',
          target_id: 't9',
        }),
      ),
    )
    const { wrapper } = await mountPane()
    await vi.waitFor(() => expect(wrapper.find('.chat-tref--gone').exists()).toBe(true))
    expect(wrapper.get('.chat-tref--gone').element.tagName).toBe('SPAN')
    expect(wrapper.get('.chat-tref--gone').text()).toBe('Bu öğe artık yok')
    expect(sent('GET', '/v1/work-items/t9')).toHaveLength(0)
  })

  it('görev çipi: gövdedeki "#başlık" çip olur; erişim yoksa (403) not gösterilir, gezinme yok', async () => {
    servePane({
      messages: [
        msg(1, {
          body: 'Bak #Trafo projesi hazır',
          refs: [{ kind: 'task', ref_id: 'r1', target_id: 't1' }],
        }),
      ],
    })
    server.use(
      http.get(`${ORIGIN}/v1/chat-refs/r1`, () => json(taskSummary)),
      http.get(`${ORIGIN}/v1/work-items/t1`, () => errorEnvelope('work.not_authorized', 403)),
    )
    const { wrapper } = await mountPane()
    await vi.waitFor(() => expect(wrapper.find('button.chat-tref').exists()).toBe(true))
    const chip = wrapper.get('button.chat-tref')
    expect(chip.text()).toContain('Trafo projesi')
    await chip.trigger('click')
    await flushPromises()
    expect(wrapper.get('.chat-bub__note').text()).toBe('Bu göreve erişiminiz yok')
    expect(sent('GET', '/v1/work-items/t1')).toHaveLength(1)
  })

  it('ek kartı: tık bilet akışını başlatır; 404 → "artık yok" kartı', async () => {
    servePane({
      messages: [
        msg(1, {
          body: '',
          attachments: [
            {
              attachment_id: 'a1',
              content_type: 'application/pdf',
              file_name: 'Rapor.pdf',
              size_bytes: 2048,
            },
          ],
        }),
      ],
    })
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        errorEnvelope('messaging.message_not_found', 404),
      ),
    )
    const { wrapper } = await mountPane()
    const card = wrapper.get('button.chat-att')
    expect(card.text()).toContain('Rapor.pdf')
    expect(card.text()).toContain('2 KB')
    await card.trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="chat-file-gone"]').exists()).toBe(true),
    )
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
  })

  it('"Göreve dönüştürüldü" çipi task_ids doluyken görünür', async () => {
    servePane({ messages: [msg(1, { task_ids: ['t9'] })] })
    const { wrapper } = await mountPane()
    expect(wrapper.get('[data-testid="chat-converted"]').text()).toBe('Göreve dönüştürüldü')
  })
})
