// Etki okuması hata dalları: programlama hatası (maskelenmez, bildirim takılmaz), 401 sessiz,
// 429 genel "okunamadı" + yeniden deneme. Sahte MSW ağı ve model kancasıyla kurulur.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import { useDeleteImpact, type NoticeSlot } from '../components/use-delete-impact'
import type * as ImpactModule from '../model/impact'
import type { DeletedRow } from '../model/types'
import {
  department,
  mountPage,
  resetAll,
  sent,
  server,
  serverDefaults,
  settle,
  world,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

const hooks = vi.hoisted(() => ({ boom: null as Error | null }))
vi.mock('../model/impact', async (importOriginal) => {
  const original = await importOriginal<typeof ImpactModule>()
  return {
    ...original,
    impactConfirmBody: (...args: Parameters<typeof original.impactConfirmBody>) => {
      if (hooks.boom) throw hooks.boom
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
  hooks.boom = null
  useConfirm().clear()
  useToast().clear()
  resetAll()
})
afterAll(() => server.close())

const IMPACT = '/v1/departments/d5/delete-impact'
const DELETE = '/v1/admin/permanent/departments/d5'

function mountGate() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const notice: NoticeSlot = ref(null)
  let impact!: ReturnType<typeof useDeleteImpact>
  const root = defineComponent({
    setup() {
      impact = useDeleteImpact()
      return () => h('div')
    },
  })
  const wrapper = mount(root, { global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] } })
  const row = { id: 'd5', kind: 'departments' } as DeletedRow
  const gate = () => impact.gate(row, { title: 'Sil', confirmLabel: 'Sil' }, notice, async () => {})
  return { wrapper, impact, notice, gate }
}

describe('etki okuması: programlama hatası', () => {
  it('maskelenmez (reddedilir); bildirim temizlenir, okuma biter, onay ve DELETE yok', async () => {
    const boom = new Error('programlama hatası')
    hooks.boom = boom
    const { wrapper, impact, notice, gate } = mountGate()
    await expect(gate()).rejects.toBe(boom)
    expect(notice.value).toBeNull()
    expect(impact.reading.value).toBe(false)
    expect(useConfirm().current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    wrapper.unmount()
  })
})

describe('etki okuması: 401 ve 429', () => {
  it('401: sessiz; bildirim yok, onay yok, DELETE yok', async () => {
    world.failures.set(`GET ${IMPACT}`, { status: 401, code: 'identity.unauthenticated' })
    const { wrapper, impact, notice, gate } = mountGate()
    await expect(gate()).resolves.toBeNull()
    expect(notice.value).toBeNull()
    expect(impact.reading.value).toBe(false)
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    wrapper.unmount()
  })

  it('429: genel "okunamadı" bildirimi, DELETE yok; yeniden tıklayınca taze okunur', async () => {
    world.failures.set(`GET ${IMPACT}`, { status: 429, code: 'platform.rate_limited' })
    const page = await mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk' })
    const click = async () => {
      await page.wrapper.get('[data-action="purge"]').trigger('click')
      await settle()
    }
    await click()
    expect(page.wrapper.get('[data-testid="dr-notice"]').text()).toContain(
      'Silme etkisi okunamadı; hiçbir şey silinmedi.',
    )
    expect(useConfirm().current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    world.failures.clear()
    await click()
    expect(sent(IMPACT)).toHaveLength(2)
    expect(useConfirm().current.value).not.toBeNull()
  })
})
