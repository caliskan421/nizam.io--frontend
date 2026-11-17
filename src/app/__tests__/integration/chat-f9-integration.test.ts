// W186: F9 sohbet akışları gerçek App/router + durumlu sözleşme biçimli sahte uçlarla.
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { addMessage, viewOf } from './fake-chat'
import { ORIGIN } from './fake-org'
import {
  $,
  $$,
  ADMIN,
  boot,
  byText,
  chatOf,
  dialogEl,
  DIRECT_ADMIN,
  GROUP,
  idle,
  menuItem,
  pickFile,
  stubBrowserClone,
  messageEls,
  resetChats,
  rowOf,
  sent,
  teardown,
  tool,
  until,
  useChatBackend,
  userClick,
  watchStreams,
  WHO,
} from './chat-support'

const backend = useChatBackend({ coordinator: 'koordinator', member: 'uye' })
beforeAll(() => backend.server.listen({ onUnhandledFrame: 'error' }))
beforeAll(async () => {
  resetChats()
  await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
  await until(() => messageEls().length > 0, 'ısınma')
  teardown()
}, 60_000)
beforeEach(() => {
  resetChats()
  watchStreams()
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
})
afterEach(() => teardown())
afterAll(() => backend.server.close())

describe('W186 F9 uygulama akışları', () => {
  it('iletme sonucu kaybolur: aynı anahtarla tekrar tek hedef mesaj üretir, hedef rotada gerçek mesaj görünür', async () => {
    let calls = 0
    let firstKey = ''
    let targetId = ''
    backend.server.use(
      http.post(
        `${ORIGIN}/v1/chats/${GROUP}/messages/${GROUP}-m60/forward`,
        async ({ request }) => {
          const body = (await request.json()) as { targets: string[] }
          expect(body.targets).toEqual([DIRECT_ADMIN])
          const key = request.headers.get('Idempotency-Key') ?? ''
          calls += 1
          if (calls === 1) {
            firstKey = key
            const target = chatOf(DIRECT_ADMIN)
            const source = chatOf(GROUP).messages.find((m) => m.base.seq === 60)!
            const created = addMessage(target, WHO.admin, source.base.body ?? '', {
              forwarded_from: { message_id: source.base.message_id },
            })
            targetId = created.base.message_id
            return HttpResponse.error()
          }
          expect(key).toBe(firstKey)
          return HttpResponse.json(
            { items: [{ chat_id: DIRECT_ADMIN, message_id: targetId }] },
            { status: 200 },
          )
        },
      ),
    )
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'kaynak')
    await userClick(() => tool(rowOf(60)!, 'Diğer'))
    await userClick(() => menuItem('İlet'))
    await until(() => $('#chat-forward'), 'iletme')
    await userClick(() => $(`#chat-forward [data-chat-id="${DIRECT_ADMIN}"]`))
    await userClick('[data-testid="dlg-submit"]')
    await userClick(() => byText('[role="dialog"] button', 'Yeniden gönder'))
    await until(() => !dialogEl(), 'ileti tamamlandı')
    await idle(app.queryClient)
    expect(calls).toBe(2)
    expect(firstKey).not.toBe('')
    expect(
      chatOf(DIRECT_ADMIN).messages.filter((m) => m.base.message_id === targetId),
    ).toHaveLength(1)
    await app.router.push(`/mesajlar/${DIRECT_ADMIN}`)
    await until(() => $('[data-testid="chat-forwarded"]'), 'hedefte iletildi')
    expect(
      $('[data-testid="chat-forwarded"]')!.closest('[data-testid="chat-message"]')?.textContent,
    ).toContain('Mekanik mesaj 60')
    expect(sent('POST', `/v1/chats/${DIRECT_ADMIN}/messages`)).toHaveLength(0)
  })

  it('görev arşivine tek istek yanıtı kaybolur: tekrar aynı anahtar ve sunucu mesajı gerçek akışa gelir', async () => {
    stubBrowserClone()
    backend.server.use(
      http.get(`${ORIGIN}/v1/program/archive/tasks`, () =>
        HttpResponse.json({
          tasks: [{ work_item_id: 'w1', department_id: 'd1', title: 'Görev Bir', file_count: 0 }],
        }),
      ),
    )
    let calls = 0
    let firstKey = ''
    let created: ReturnType<typeof addMessage> | undefined
    backend.server.use(
      http.post(`${ORIGIN}/v1/chats/${GROUP}/archived-files`, ({ request }) => {
        calls += 1
        const key = request.headers.get('Idempotency-Key') ?? ''
        if (calls === 1) {
          firstKey = key
          created = addMessage(chatOf(GROUP), WHO.admin, 'rapor.pdf', {
            refs: [{ kind: 'file', target_id: 'f1', ref_id: 'r1' }],
          })
          return HttpResponse.error()
        }
        expect(key).toBe(firstKey)
        return HttpResponse.json(
          { file_id: 'f1', message: viewOf(created!, WHO.admin.account_id) },
          { status: 200 },
        )
      }),
    )
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'sohbet')
    await userClick(() => $('.chat-composer__btn[aria-label="Ekle"]'))
    await userClick(() => menuItem('Arşivden dosya'))
    await until(() => $('#chat-share'), 'paylaş')
    await userClick(() => byText('#chat-share button', 'Yeni yükle'))
    await pickFile(
      $('[data-testid="dlg-file-input"]') as HTMLInputElement,
      new File(['pdf'], 'rapor.pdf', { type: 'application/pdf' }),
    )
    await userClick('[data-testid="dlg-save-archive"]')
    const choose = (name: string, value: string) => {
      const el = $(`[name="${name}"]`) as HTMLSelectElement
      el.value = value
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    choose('save-department', 'd1')
    await until(() => $('[name="save-task"] option[value="w1"]'), 'görev')
    choose('save-task', 'w1')
    const tag = $('[name="save-tag"]') as HTMLSelectElement
    choose('save-tag', tag.options[1]!.value)
    await userClick('[data-testid="dlg-submit"]')
    await userClick(() => byText('[role="dialog"] button', 'Yeniden gönder'))
    await until(() => !dialogEl(), 'arşiv tamamlandı')
    await idle(app.queryClient)
    expect(calls).toBe(2)
    expect(firstKey).not.toBe('')
    expect(
      chatOf(GROUP).messages.filter((m) => m.base.message_id === created!.base.message_id),
    ).toHaveLength(1)
    await until(
      () => messageEls().some((el) => el.textContent?.includes('rapor.pdf')),
      'sunucu mesajı',
    )
    expect(sent('POST', `/v1/chats/${GROUP}/attachments`)).toHaveLength(0)
    expect(sent('POST', `/v1/chats/${GROUP}/messages`)).toHaveLength(0)
  })

  it('anonim anket oluşturma ve oy sonrası gerçek kart kendi oyunu gösterir; diğer okuyucuya seçmenler verilmez', async () => {
    const app = await boot({ ...ADMIN, path: `/mesajlar/${GROUP}` })
    await until(() => rowOf(60), 'mesajlar')
    await userClick(() => $('.chat-composer__btn[aria-label="Ekle"]'))
    await userClick(() => menuItem('Anket'))
    const form = await until(() => $('#chat-poll'), 'anket')
    for (const [selector, value] of [
      ['[name="question"]', 'Seçim?'],
      ['[aria-label="Seçenek 1"]', 'A'],
      ['[aria-label="Seçenek 2"]', 'B'],
    ] as const) {
      const el = form.querySelector<HTMLInputElement>(selector)!
      el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    await userClick(() => byText('#chat-poll button', 'Anonim'))
    await userClick('[data-testid="dlg-submit"]')
    await until(() => !dialogEl(), 'anket gönderildi')
    await idle(app.queryClient)
    const message = chatOf(GROUP).messages.at(-1)!
    expect(message.base.poll?.anonymous).toBe(true)
    const seq = message.base.seq
    await until(() => rowOf(seq)?.querySelector('.chat-poll'), 'anket kartı')
    await userClick(() => $$('.chat-poll__opt', rowOf(seq)!)[0] ?? null)
    await until(() => rowOf(seq)?.querySelector('.chat-poll__opt--on'), 'oyum')
    const other = viewOf(message, WHO.member.account_id).poll!
    expect(other.results.every((r) => r.voters.length === 0 && !r.mine)).toBe(true)
    expect(viewOf(message, WHO.admin.account_id).poll!.results[0]!.mine).toBe(true)
  })
})
