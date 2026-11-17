// G1: kısmi 409 (ADR-0043 restore yarışı) sonrası satır yeniden okumada kaybolursa seçim (URL)
// ve odak temizlenir; satır hâlâ varsa seçim korunur. Sahte MSW ağı; gerçek backend yarışı değil.
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  department,
  mountPage,
  ORIGIN,
  resetAll,
  sent,
  server,
  serverDefaults,
  settle,
  world,
  type Mounted,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  server.use(...serverDefaults())
  world.departments = [[department('d5'), department('d6')]]
})
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetAll()
})
afterAll(() => server.close())

const DELETE = '/v1/admin/permanent/departments/d5'
const partial = () =>
  HttpResponse.json(
    { code: 'organization.permanent_requires_deleted', message: 'ham', request_id: 'r' },
    { status: 409 },
  )
const selected = (page: Mounted) => page.router.currentRoute.value.query.kayit
const rowButton = (page: Mounted, id: string) =>
  page.wrapper.get(`[data-record-key$=":${id}"] [data-action="purge"]`)

async function purgeSelected(page: Mounted, wait = true) {
  const button = rowButton(page, 'd5')
  ;(button.element as HTMLElement).focus()
  await button.trigger('click')
  await settle()
  const accepted = useConfirm().accept(useConfirm().current.value!.id)
  if (wait) await accepted
}

const mountSelected = () =>
  mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk&kayit=d5', host: true })

describe('kısmi 409 sonrası seçim ve odak', () => {
  it('satır yeniden okumada yok: URL seçimi temizlenir, odak komşu satıra, tek DELETE, danger toast', async () => {
    server.use(
      http.delete(`${ORIGIN}${DELETE}`, () => {
        world.departments = [[department('d6')]]
        return partial()
      }),
    )
    const page = await mountSelected()
    expect(selected(page)).toBe('d5')
    await purgeSelected(page)
    await settle()
    expect(sent(DELETE, 'DELETE')).toHaveLength(1)
    expect(useToast().queue.value.map((t) => t.tone)).toEqual(['danger'])
    expect(selected(page)).toBeUndefined()
    expect(page.wrapper.find('[data-record-key$=":d5"]').exists()).toBe(false)
    expect(document.activeElement).not.toBe(document.body)
    expect(page.wrapper.element.contains(document.activeElement)).toBe(true)
  })

  it('satır hâlâ var: seçim korunur, sıçrama ya da yanlış temizlik yok', async () => {
    server.use(http.delete(`${ORIGIN}${DELETE}`, partial))
    const page = await mountSelected()
    await purgeSelected(page)
    await settle()
    expect(sent(DELETE, 'DELETE')).toHaveLength(1)
    expect(selected(page)).toBe('d5')
    expect(page.wrapper.find('[data-record-key$=":d5"]').exists()).toBe(true)
  })
})
