import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'
import { ConfirmHost, useConfirm } from '@/shared/ui/confirm'

import {
  COORD_SCOPE,
  http,
  json,
  ORIGIN,
  row,
  sent,
  server,
  standingHandlers,
} from '../../__tests__/harness'
import { mountRole, resetRole, roleHandlers } from '../../__tests__/role-harness'
import ApprovalsCard from './ApprovalsCard.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetRole()
})
afterAll(() => server.close())

const COORD = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'koordinator' }] }
const ITEM = row('onaya_sunuldu', { title: 'Hidrofor' })

const Host = defineComponent({
  setup: () => () =>
    h('div', [h(ApprovalsCard, { items: [ITEM], count: 1, today: '2026-10-21' }), h(ConfirmHost)]),
})

const approve = (page: Awaited<ReturnType<typeof mountRole>>) =>
  vi.waitFor(() => expect(page.wrapper.find('[data-action="approve"]').exists()).toBe(true))

describe('K1/Ü1 yazmaları (use-role-writes)', () => {
  it('409 work.subtasks_open → ortak onay → AYNI hedef close_subtasks: true yeni eylem', async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, async ({ request, params }) => {
        const body = (await request.json()) as { close_subtasks?: boolean }
        bodies.push(body)
        return body.close_subtasks
          ? json({
              work_item_id: params.id,
              from: 'onaya_sunuldu',
              to: 'tamamlandi',
              actor: 'koordinator',
            })
          : json({ code: 'work.subtasks_open', message: 'x', request_id: 'r', fields: [] }, 409)
      }),
      ...standingHandlers(COORD),
      ...roleHandlers({ items: [ITEM] }),
    )
    const page = await mountRole(Host, COORD_SCOPE)
    await approve(page)
    await page.wrapper.get('[data-action="approve"]').trigger('click')
    const confirm = await vi.waitFor(() => {
      const button = [...document.body.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Kapat ve tamamla'),
      )
      expect(button).toBeDefined()
      return button!
    })
    expect(bodies).toEqual([{ to: 'tamamlandi' }])
    confirm.click()
    await vi.waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]).toEqual({ to: 'tamamlandi', close_subtasks: true })
    await vi.waitFor(() => expect(useToast().current.value?.message).toBe('Görev onaylandı'))
  })

  it('onaydan vazgeçmek ikinci istek göndermez', async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, async ({ request }) => {
        bodies.push(await request.json())
        return json({ code: 'work.subtasks_open', message: 'x', request_id: 'r', fields: [] }, 409)
      }),
      ...standingHandlers(COORD),
      ...roleHandlers({ items: [ITEM] }),
    )
    const page = await mountRole(Host, COORD_SCOPE)
    await approve(page)
    await page.wrapper.get('[data-action="approve"]').trigger('click')
    const cancel = await vi.waitFor(() => {
      const button = [...document.body.querySelectorAll('button')].find((b) =>
        /Vazgeç/.test(b.textContent ?? ''),
      )
      expect(button).toBeDefined()
      return button!
    })
    cancel.click()
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
    expect(bodies).toHaveLength(1)
  })

  it('409 transition_not_allowed: ileti i18n’den, görev listesi yeniden okunur; otomatik tekrar yok', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, () => {
        calls += 1
        return json(
          {
            code: 'work.transition_not_allowed',
            message: 'sunucu iletisi',
            request_id: 'r',
            fields: [],
          },
          409,
        )
      }),
      ...standingHandlers(COORD),
      ...roleHandlers({ items: [ITEM] }),
    )
    const page = await mountRole(Host, COORD_SCOPE)
    await approve(page)
    const invalidate = vi.spyOn(page.queryClient, 'invalidateQueries')
    await page.wrapper.get('[data-action="approve"]').trigger('click')
    await vi.waitFor(() => expect(useToast().current.value).not.toBeNull())
    expect(useToast().current.value!.message).not.toContain('sunucu iletisi')
    await vi.waitFor(() => expect(invalidate).toHaveBeenCalled())
    expect(calls).toBe(1)
  })

  it('sahibi sökülmüş geç sonuç: bildirim yok (ortak önbellek uzlaştırması sürer)', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/work-items/:id/transitions`, async ({ params }) => {
        await gate
        return json({ work_item_id: params.id, from: 'a', to: 'b', actor: 'koordinator' })
      }),
      ...standingHandlers(COORD),
      ...roleHandlers({ items: [ITEM] }),
    )
    const page = await mountRole(Host, COORD_SCOPE)
    await approve(page)
    await page.wrapper.get('[data-action="approve"]').trigger('click')
    await vi.waitFor(() =>
      expect(sent('/v1/work-items/' + ITEM.work_item_id + '/transitions')).toHaveLength(1),
    )
    // Yazma uçuşta; sahip sökülür, yanıt salınır, yazmanın GERÇEKTEN bitmesi beklenir (CX-F6-K-01).
    expect(page.queryClient.isMutating()).toBe(1)
    page.wrapper.unmount()
    release()
    await settleQueries(page.queryClient)
    expect(page.queryClient.isMutating()).toBe(0)
    expect(useToast().current.value).toBeNull()
  })
})
