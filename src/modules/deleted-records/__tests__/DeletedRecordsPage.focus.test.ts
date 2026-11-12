// KESİN 27: onay, menü ve panel kapanınca odak tetikleyiciye (o yoksa mantıklı komşuya) döner;
// her kapanış yolu (Esc, Vazgeç, eylem sonrası söküm) sınanır. Gerçek ConfirmHost bağlıdır.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useConfirm } from '@/shared/ui/confirm'

import {
  mountPage,
  resetAll,
  server,
  serverDefaults,
  settle,
  task,
  world,
  type Mounted,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  server.use(...serverDefaults())
  world.dictionary = [{ department_id: 'd1', display_name: 'Mekanik' }]
})
afterEach(() => {
  useConfirm().clear()
  resetAll()
})
afterAll(() => server.close())

const restoreButton = (page: Mounted, id: string) =>
  page.wrapper.get(`[data-record-key$=":${id}"] [data-action="restore"]`)
const dialog = () => document.querySelector<HTMLElement>('[data-testid="confirm-dialog"]')
const next = async () => {
  await new Promise<void>((resolve) => queueMicrotask(resolve))
  await settle()
}

describe('onay kapanışında odak dönüşü', () => {
  it('Esc: pencere kapanır, odak satırdaki Geri yükle düğmesine döner', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    const page = await mountPage({ host: true })
    const trigger = restoreButton(page, 'w1')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await next()
    expect(dialog()).not.toBeNull()
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await next()
    expect(dialog()).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('Vazgeç düğmesi: odak tetikleyiciye döner, istek yok', async () => {
    world.tasks = [[task('w1')]]
    const page = await mountPage({ host: true })
    const trigger = page.wrapper.get('[data-record-key$=":w1"] [data-action="purge"]')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await next()
    const cancel = [...dialog()!.querySelectorAll('button')].find(
      (b) => b.textContent === 'Vazgeç',
    )!
    cancel.click()
    await next()
    expect(dialog()).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
  })

  it('eylem sonrası satır düşer: odak sıradaki satıra, son satırsa segmente gider (gövdeye düşmez)', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    const page = await mountPage({ host: true })
    await restoreButton(page, 'w1').trigger('click')
    await next()
    const accept = dialog()!.querySelector<HTMLButtonElement>('.t-btn--primary')!
    accept.click()
    await next()
    expect(document.activeElement).toBe(page.wrapper.get('[data-record-key$=":w2"]').element)
    await restoreButton(page, 'w2').trigger('click')
    await next()
    dialog()!.querySelector<HTMLButtonElement>('.t-btn--primary')!.click()
    await next()
    expect(page.wrapper.findAll('[data-record-key]')).toHaveLength(0)
    expect(document.activeElement).toBe(page.wrapper.get('[data-kind="gorev"]').element)
    expect(document.activeElement).not.toBe(document.body)
  })

  it('panelden eylem: vazgeçince odak panel düğmesinde; başarıda seçim temizlenir ve odak gövdeye düşmez', async () => {
    world.tasks = [[task('w1'), task('w2')]]
    const page = await mountPage({ host: true, path: '/silinen-kayitlar?kayit=w1' })
    const trigger = page.wrapper.get('[data-testid="dr-panel"] [data-action="restore"]')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await next()
    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await next()
    expect(document.activeElement).toBe(trigger.element)
    await trigger.trigger('click')
    await next()
    dialog()!.querySelector<HTMLButtonElement>('.t-btn--primary')!.click()
    await next()
    expect(page.router.currentRoute.value.query.kayit).toBeUndefined()
    expect(page.wrapper.get('[data-testid="dr-panel"]').text()).toContain('Bir kayıt seçin')
    expect(document.activeElement).not.toBe(document.body)
  })
})
