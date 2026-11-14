// W160 · O3: sohbet entegrasyon testlerinin ortak kurulumu (W82a harness'i + durumlu sahte sohbet
// sunucusu). Dünya: `seedWorld` kişileri; Mekanik Ekibi grubu (Kerem yönetici), iki birebir.
import { flushPromises } from '@vue/test-utils'
import { vi } from 'vitest'

import { createBackend, seedWorld, until, $, $$, click } from './harness'
import { addMessage, createChatState, makeChat, member, type ChatState } from './fake-chat'
import { chatHandlers } from './fake-chat-server'
import { emit, type ChatEventName, type EmitOptions } from './fake-chat-stream'
import { PEOPLE } from './world'

export {
  $,
  $$,
  boot,
  byText,
  click,
  fill,
  idle,
  switchScope,
  teardown,
  toasts,
  until,
  PEOPLE,
} from './harness'
export { ORIGIN } from './fake-org'

export const ADMIN = {
  email: PEOPLE.admin.email,
  scope: { programId: 'p1', lens: 'admin' as const },
}
export const COORD = {
  email: PEOPLE.coord.email,
  scope: { programId: 'p1', lens: 'coordinator' as const, departmentId: 'd1' },
}
export const MEMBER = {
  email: PEOPLE.member.email,
  scope: { programId: 'p1', lens: 'member' as const, departmentId: 'd1' },
}

export type Roles = Parameters<typeof createBackend>[0]
export const chat: { state: ChatState } = { state: createChatState() }
export let backend!: ReturnType<typeof createBackend>

export function useChatBackend(roles: Roles) {
  backend = createBackend(roles)
  return backend
}

/** Hesap kayıtları (kişi → sunucu hesabı). */
const acc = (key: keyof typeof PEOPLE) => ({ ...PEOPLE[key], admin: key === 'admin' })
export const WHO = {
  admin: acc('admin'),
  coord: acc('coord'),
  member: acc('member'),
  second: acc('second'),
  free: acc('free'),
}

/** Mekanik Ekibi (g1): Kerem yönetici; 60 mesaj (Ayşe 40'ına kadar okumuş → 20 okunmamış). */
export const GROUP = 'g1'
export const GROUP_MESSAGES = 60
/** Ayşe–Cem birebiri (d1): yönetici üye değil. Yasemin–Ayşe birebiri (d2). */
export const DIRECT_OTHERS = 'dm1'
export const DIRECT_ADMIN = 'dm2'

export function seedChats(): ChatState {
  const state = createChatState()
  const group = makeChat(
    GROUP,
    'group',
    [
      member(WHO.coord.account_id, 'admin'),
      member(WHO.admin.account_id),
      member(WHO.member.account_id),
      member(WHO.second.account_id),
    ],
    { name: 'Mekanik Ekibi' },
  )
  for (let i = 1; i <= GROUP_MESSAGES; i += 1) {
    addMessage(group, i % 3 === 0 ? WHO.second : WHO.coord, `Mekanik mesaj ${i}`)
  }
  group.reads = {
    [WHO.coord.account_id]: GROUP_MESSAGES,
    [WHO.admin.account_id]: GROUP_MESSAGES,
    [WHO.member.account_id]: 40,
    [WHO.second.account_id]: GROUP_MESSAGES,
  }
  const others = makeChat(DIRECT_OTHERS, 'direct', [
    member(WHO.member.account_id),
    member(WHO.second.account_id),
  ])
  addMessage(others, WHO.second, 'Cem: yarın toplantı var mı?')
  const withAdmin = makeChat(DIRECT_ADMIN, 'direct', [
    member(WHO.admin.account_id),
    member(WHO.member.account_id),
  ])
  addMessage(withAdmin, WHO.member, 'Ayşe: raporu gönderdim')
  state.chats.push(group, others, withAdmin)
  return state
}

/** Dünya: ortak veri + sohbetler; sohbet uçları `server.use` ile eklenir. */
export function seedChatWorld(): void {
  seedWorld(backend.db)
  chat.state = seedChats()
  backend.server.use(...chatHandlers(backend.db, chat.state))
}

/** Her testten önce: sunucu sıfırlanır, sohbet dünyası yeniden kurulur. */
export function resetChats(): void {
  backend.reset()
  seedChatWorld()
}

export const sent = (method: string, path: string) => backend.sent(method, path)

export const chatOf = (id: string) => chat.state.chats.find((c) => c.chat_id === id)!

/** Sunucu olayı yayar (olay yalnız üye hesapların açık akışlarına gider). */
export function serverEmit(chatId: string, name: ChatEventName, options?: EmitOptions): void {
  emit(chat.state, chatOf(chatId), name, options)
}

/** Başka kişi mesaj yazar: sunucu durumuna eklenir + `message.created` olayı. */
export function peerSays(chatId: string, who: keyof typeof WHO, body: string): string {
  const message = addMessage(chatOf(chatId), WHO[who], body)
  serverEmit(chatId, 'message.created', {
    messageId: message.base.message_id,
    actor: WHO[who].account_id,
  })
  return message.base.message_id
}

/** Gerçek tıklama: işaretçi önce odaklar (`HTMLElement.click()` odaklamaz; KESİN 27). */
export async function userClick(target: string | (() => HTMLElement | null)): Promise<HTMLElement> {
  const probe = typeof target === 'string' ? () => $(target) : target
  const el = await until(probe, `tıklanacak öğe ${String(target)}`)
  el.focus()
  return click(() => el)
}

/** Sahte saat: yalnız zamanlayıcılar (Date/microtask gerçek kalır; harness bekleme döngüsü işler). */
export function fakeClock(): void {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
}

/** Sahte saati `ms` ilerletir ve söz kuyruğunu boşaltır. */
export async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
  await flushPromises()
}

export const rowEls = () => $$('[data-testid="chat-list-pane"] [data-chat-id]')
export const messageEls = () => $$('[data-testid="chat-message"]')
export const messageTexts = () => messageEls().map((el) => el.textContent ?? '')

/** Başka kişi `seq` numaralı mesaja yanıt yazar (alıntı bloğu çizilir); olay yayılmaz. */
export function addPeerReply(
  chatId: string,
  seq: number,
  who: keyof typeof WHO,
  body: string,
): void {
  const target = chatOf(chatId).messages.find((m) => m.base.seq === seq)!
  addMessage(chatOf(chatId), WHO[who], body, {
    reply_to_message_id: target.base.message_id,
    reply_to: {
      body: target.base.body,
      deleted: false,
      message_id: target.base.message_id,
      sender_account_id: target.base.sender_account_id,
      sender_name: target.base.sender_name ?? null,
    },
  })
}

// --- Konuşma sürücüleri ----------------------------------------------------------------------

export const rowOf = (seq: number) => $(`[data-testid="chat-message"][data-seq="${seq}"]`)

/** Satır araç çubuğu düğmesi (erişilebilir adıyla). */
export const tool = (row: HTMLElement, label: string) =>
  row.querySelector<HTMLElement>(`.msg-row__tools button[aria-label="${label}"]`)

/** Açık menü öğesi (görünür metin başlangıcıyla). */
export const menuItem = (label: string) =>
  $$('[role="menuitem"]').find((el) => (el.textContent ?? '').trim().startsWith(label)) ?? null

const field = () => $('[data-chat-composer-input]') as HTMLTextAreaElement | null

/** Yazma alanına metin girer (girdi olayıyla). */
export async function typeText(text: string): Promise<void> {
  const el = await until(field, 'yazma alanı')
  el.focus()
  el.value = text
  el.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

/** Enter: gönderir. */
export async function pressEnter(): Promise<void> {
  const el = await until(field, 'yazma alanı')
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await flushPromises()
}

/** Onay penceresi: "tamam" ya da "vazgeç". */
export async function confirmDialog(answer: 'accept' | 'cancel' = 'accept'): Promise<void> {
  await until(() => $('[data-testid="confirm-dialog"]'), 'onay penceresi')
  const selector = answer === 'accept' ? '[data-testid="confirm-accept"]' : '[data-autofocus]'
  await userClick(() => $(selector, $('[data-testid="confirm-dialog"]')!))
}
