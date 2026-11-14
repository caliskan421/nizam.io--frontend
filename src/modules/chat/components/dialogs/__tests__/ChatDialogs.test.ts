// ChatDialogs: tek giriş (`request` → pencere) ve odak dönüşü (KESİN 27). Her kapanış yolunda
// (Esc, ✕, Vazgeç/Kapat, dış tık, eylem sonrası söküm) odak tetikleyiciye döner, gövdeye düşmez.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  $,
  clickText,
  json,
  mountDialog,
  msg,
  on,
  pressEscape,
  resetAll,
  resetDialogs,
  server,
  setValue,
  signIn,
} from './harness'
import ChatDialogs from '../../ChatDialogs.vue'
import type { DialogRequest } from '../../../model/dialogs'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetDialogs()
  resetAll()
})
afterAll(() => server.close())
beforeEach(signIn)

const REQUESTS: Record<string, { request: DialogRequest; title: string; footer: string }> = {
  groupInfo: {
    request: { dialog: 'groupInfo', chatId: 'c1' },
    title: 'Grup bilgisi',
    footer: 'Kapat',
  },
  messageInfo: {
    request: { dialog: 'messageInfo', chatId: 'c1', messageId: 'm5' },
    title: 'Mesaj bilgisi',
    footer: 'Kapat',
  },
  newGroup: {
    request: { dialog: 'newGroup', mode: 'group' },
    title: 'Yeni grup',
    footer: 'Vazgeç',
  },
  taskFromMessage: {
    request: { dialog: 'taskFromMessage', chatId: 'c1', messageId: 'm5', seq: 5 },
    title: 'Mesajdan görev',
    footer: 'Vazgeç',
  },
  poll: { request: { dialog: 'poll', chatId: 'c1' }, title: 'Anket oluştur', footer: 'Vazgeç' },
  shareFile: {
    request: { dialog: 'shareFile', chatId: 'c1' },
    title: 'Dosya paylaş',
    footer: 'Vazgeç',
  },
}

function serve() {
  on('get', '/v1/chats/c1', () =>
    json({
      chat_id: 'c1',
      kind: 'group',
      name: 'Eğitim',
      role: 'admin',
      auto_kind: null,
      source: 'none',
      created_by_account_id: null,
    }),
  )
  on('get', '/v1/chats/c1/members', () => json({ items: [], truncated: false }))
  on('get', '/v1/chats/c1/pins', () => json({ items: [], truncated: false }))
  on('get', '/v1/chats/candidates', () => json({ items: [], truncated: false }))
  on('get', '/v1/program/departments', () => json({ departments: [] }))
  on('post', '/v1/chats/c1/messages', () => json(msg(9), 201))
}

function trigger(): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = 'Tetikleyici'
  document.body.appendChild(button)
  button.focus()
  return button
}

async function open(name: string, who = { companyAdmin: true }) {
  serve()
  const button = trigger()
  const { wrapper } = mountDialog(
    ChatDialogs,
    { request: null },
    { who, window: { items: [msg(5)] } },
  )
  await wrapper.setProps({ request: REQUESTS[name]!.request })
  await vi.waitFor(() => expect($('[role="dialog"]')).not.toBeNull())
  return { wrapper, button }
}

/** Üst bileşen kapanış olayında isteği `null` yapar (ChatPage'in yapacağı). */
async function closeAndCheck(
  wrapper: Awaited<ReturnType<typeof open>>['wrapper'],
  button: HTMLElement,
) {
  await vi.waitFor(() => expect(wrapper.emitted('close')).toBeTruthy())
  await wrapper.setProps({ request: null })
  await vi.waitFor(() => expect($('[role="dialog"]')).toBeNull())
  await vi.waitFor(() => expect(document.activeElement).toBe(button))
}

describe('ChatDialogs — tek giriş', () => {
  it.each(Object.keys(REQUESTS))('%s isteği doğru pencereyi açar', async (name) => {
    const { wrapper } = await open(name)
    expect($('.t-modal__title')?.textContent).toBe(REQUESTS[name]!.title)
    expect($('[data-testid="chat-dialogs"]')?.getAttribute('data-dialog')).toBe(
      REQUESTS[name]!.request.dialog,
    )
    await wrapper.setProps({ request: null })
    expect($('[data-testid="chat-dialogs"]')).toBeNull()
  })

  it('kapalıyken (request null) hiçbir şey çizilmez', () => {
    serve()
    mountDialog(ChatDialogs, { request: null })
    expect($('[data-testid="chat-dialogs"]')).toBeNull()
    expect($('[role="dialog"]')).toBeNull()
  })

  it('"Mesajı ilet" açılabilir değildir (BE-080): istek türünde yok', () => {
    expect(Object.keys(REQUESTS)).not.toContain('forward')
  })
})

describe('ChatDialogs — odak dönüşü (KESİN 27)', () => {
  it.each(Object.keys(REQUESTS))('%s: Esc → odak tetikleyiciye döner', async (name) => {
    const { wrapper, button } = await open(name)
    pressEscape()
    await closeAndCheck(wrapper, button)
  })

  it.each(Object.keys(REQUESTS))('%s: ✕ → odak tetikleyiciye döner', async (name) => {
    const { wrapper, button } = await open(name)
    $('.t-modal__head button')!.click()
    await closeAndCheck(wrapper, button)
  })

  it.each(Object.keys(REQUESTS))('%s: Vazgeç/Kapat → odak tetikleyiciye döner', async (name) => {
    const { wrapper, button } = await open(name)
    clickText(REQUESTS[name]!.footer)
    await closeAndCheck(wrapper, button)
  })

  it.each(Object.keys(REQUESTS))('%s: dış tık (perde) → odak tetikleyiciye döner', async (name) => {
    const { wrapper, button } = await open(name)
    const backdrop = $('.t-modal-backdrop')!
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await closeAndCheck(wrapper, button)
  })

  it('eylem sonrası söküm (anket gönderildi): odak tetikleyiciye döner', async () => {
    const { wrapper, button } = await open('poll')
    setValue('input[name="question"]', 'Soru')
    const options = [...document.querySelectorAll<HTMLInputElement>('.chat-dlg__option input')]
    options[0]!.value = 'A'
    options[0]!.dispatchEvent(new Event('input'))
    options[1]!.value = 'B'
    options[1]!.dispatchEvent(new Event('input'))
    $('[data-testid="dlg-submit"]')!.click()
    await closeAndCheck(wrapper, button)
  })

  it("tetikleyici DOM'dan kalktıysa (menü kapandı) odak gövdeye düşmez: yazma alanına gider", async () => {
    const input = document.createElement('textarea')
    input.setAttribute('data-chat-composer-input', '')
    document.body.appendChild(input)
    const { wrapper, button } = await open('poll')
    button.remove()
    pressEscape()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toBeTruthy())
    await wrapper.setProps({ request: null })
    await vi.waitFor(() => expect(document.activeElement).toBe(input))
  })

  it('odak gövdedeyse (menü öğesi kaldırıldıktan sonra açıldı) bağlı tetikleyiciye döner', async () => {
    serve()
    const button = trigger()
    const { wrapper } = mountDialog(ChatDialogs, { request: null })
    await wrapper.setProps({ request: REQUESTS.poll!.request })
    await vi.waitFor(() => expect($('[role="dialog"]')).not.toBeNull())
    ;(document.activeElement as HTMLElement).blur()
    await wrapper.setProps({ request: null })
    await vi.waitFor(() => expect(document.activeElement).toBe(button))
  })
})
