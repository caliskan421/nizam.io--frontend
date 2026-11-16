import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  errorEnvelope,
  http,
  json,
  MEMBER_SCOPE,
  ORIGIN,
  sent,
  server,
  standingHandlers,
} from '../../__tests__/harness'
import { mountRole, resetRole, stubBrowserClone } from '../../__tests__/role-harness'
import { useMessageCoordinator } from './use-message-coordinator'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => {
  stubBrowserClone()
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetRole()
})
afterAll(() => server.close())

let write: (id: string | null) => Promise<void> = async () => {}
const Host = defineComponent({
  setup() {
    write = useMessageCoordinator().writeTo
    return () => h('div')
  },
})
const MEMBER = { companyAdmin: false, rows: [{ department_id: 'd1', role: 'uye' }] }

describe('useMessageCoordinator (E-Ü1-21)', () => {
  it('hesap yoksa istek gitmez; başarıda /mesajlar/:id; tekrar tıklama aynı sohbeti açar (200)', async () => {
    let status = 201
    server.use(
      ...standingHandlers(MEMBER),
      http.post(`${ORIGIN}/v1/chats/direct`, () => json({ chat_id: 'ch-1' }, status)),
    )
    const page = await mountRole(Host, MEMBER_SCOPE)
    await write(null)
    expect(sent('/v1/chats/direct')).toHaveLength(0)
    await write('acc-9')
    expect(page.router.currentRoute.value.path).toBe('/mesajlar/ch-1')
    status = 200
    await page.router.push('/')
    await write('acc-9')
    expect(page.router.currentRoute.value.path).toBe('/mesajlar/ch-1')
    expect(sent('/v1/chats/direct')).toHaveLength(2)
  })

  it('403 → bildirim, gezinme yok (sunucu iletisi gösterilmez)', async () => {
    server.use(
      ...standingHandlers(MEMBER),
      http.post(`${ORIGIN}/v1/chats/direct`, () => errorEnvelope('messaging.not_authorized', 403)),
    )
    const page = await mountRole(Host, MEMBER_SCOPE)
    await write('acc-9')
    expect(page.router.currentRoute.value.path).toBe('/')
    const message = useToast().current.value?.message
    expect(message).toBeTruthy()
    expect(message).not.toContain('sunucu iletisi')
  })
})
