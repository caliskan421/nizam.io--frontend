// Etki önizlemesi → onay devri: bağlam okumadan ÖNCE yakalanır ve onaya taşınır. Geç/bayat
// durumlar sahte MSW ağı ve kancalarla kurulur (gerçek ağ ya da gerçek çıkış akışı değildir).
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type * as ImpactModule from '../model/impact'
import { authSession } from '@/shared/http'
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
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

// Onay gövdesi kurulurken (okuma bitti, onay açılmadan önce) çalışan kanca: okuma sonrası
// `read` ile `confirmWrite` arasındaki boşluğu belirlenimli kurar.
const hooks = vi.hoisted(() => ({ afterRead: null as (() => void) | null }))
vi.mock('../model/impact', async (importOriginal) => {
  const original = await importOriginal<typeof ImpactModule>()
  return {
    ...original,
    impactConfirmBody: (...args: Parameters<typeof original.impactConfirmBody>) => {
      hooks.afterRead?.()
      return original.impactConfirmBody(...args)
    },
  }
})

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  server.use(...serverDefaults())
  world.departments = [[department('d5')]]
})
afterEach(() => {
  hooks.afterRead = null
  useConfirm().clear()
  useToast().clear()
  resetAll()
})
afterAll(() => server.close())

const confirm = useConfirm()
const IMPACT = '/v1/departments/d5/delete-impact'
const DELETE = '/v1/admin/permanent/departments/d5'
const mountDepartments = () => mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk' })
const click = (page: Awaited<ReturnType<typeof mountDepartments>>) =>
  page.wrapper.get('[data-action="purge"]').trigger('click')
const hold = () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  world.impactGate = () => gate
  return release
}
const notice = (page: Awaited<ReturnType<typeof mountDepartments>>) =>
  page.wrapper.find('[data-testid="dr-notice"]')

describe('etki okuması → onay devri (bağlam okumadan önce yakalanır)', () => {
  it('okuma sürerken oturum nesli değişirse onay ve DELETE yok, bildirim sessiz', async () => {
    const release = hold()
    const page = await mountDepartments()
    await click(page)
    authSession.clear()
    release()
    await settle()
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    expect(notice(page).exists()).toBe(false)
  })

  it('okuma sürerken sahip sökülürse onay ve DELETE yok', async () => {
    const release = hold()
    const page = await mountDepartments()
    await click(page)
    page.wrapper.unmount()
    release()
    await settle()
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
  })

  it('okuma bitti, onay açılmadan oturum değişti: eski satır yeni bağlamda onay açamaz', async () => {
    const page = await mountDepartments()
    hooks.afterRead = () => authSession.clear()
    await click(page)
    await settle()
    expect(sent(IMPACT)).toHaveLength(1)
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    expect(notice(page).exists()).toBe(false)
  })

  it('okuma bitti, onay açılmadan kapsam değişti: onay ve DELETE yok', async () => {
    const page = await mountDepartments()
    hooks.afterRead = () =>
      page.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await click(page)
    await settle()
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
  })

  it('kapsam değişmeden aynı kapsam yeniden yazılırsa okuma bozulmaz; normal onay yazar', async () => {
    const release = hold()
    const page = await mountDepartments()
    await click(page)
    page.store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    release()
    await settle()
    expect(confirm.current.value).not.toBeNull()
    await confirm.accept(confirm.current.value!.id)
    await settle()
    expect(sent(DELETE, 'DELETE')).toHaveLength(1)
  })

  it('normal akış: onayla tek DELETE gider', async () => {
    const page = await mountDepartments()
    await click(page)
    await settle()
    await confirm.accept(confirm.current.value!.id)
    await settle()
    expect(sent(DELETE, 'DELETE')).toHaveLength(1)
  })
})

describe('kalıcı silmede restore yarışı 409 (ADR-0043)', () => {
  it('kısmi silme olasılığı söylenir; hiçbir şey silinmedi denmez, otomatik ikinci DELETE yok', async () => {
    server.use(
      http.delete(`${ORIGIN}${DELETE}`, () =>
        HttpResponse.json(
          { code: 'organization.permanent_requires_deleted', message: 'ham', request_id: 'r' },
          { status: 409 },
        ),
      ),
    )
    const page = await mountDepartments()
    await click(page)
    await settle()
    await confirm.accept(confirm.current.value!.id)
    await settle()
    const messages = useToast().queue.value.map((t) => t.message)
    expect(messages).toEqual([
      'Koordinatörlüğün durumu değişti; silme tamamlanamadı. Bazı görev veya dosyalar kalıcı silinmiş olabilir. Listeler yenilendi.',
    ])
    expect(sent(DELETE, 'DELETE')).toHaveLength(1)
  })
})
