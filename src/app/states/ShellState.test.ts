import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { computed } from 'vue'

import { ApiError } from '@/shared/errors/api-error'

import {
  createFakeLifecycle,
  mountWithScope,
  sideContext,
} from '../shell/side/__tests__/fake-lifecycle'
import ShellState from './ShellState.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

async function mountState(
  content: InstanceType<typeof ShellState>['$props']['content'],
  companyAdmin = true,
  error: unknown = null,
) {
  const ctx = await sideContext()
  const fake = createFakeLifecycle({
    facts: { companyAdmin, coordinator: false, member: false },
  })
  const lifecycle = { ...fake.lifecycle, error: computed(() => error) }
  const wrapper = mountWithScope(ctx, lifecycle, ShellState, { content })
  await flushPromises()
  return { wrapper, lifecycle }
}

describe('kabuk durum alanı', () => {
  it('departman yok (no_lens): yönetici "Departman ekle" /programlar bağlantısı, faz notu yok (K-6)', async () => {
    const { wrapper } = await mountState({ kind: 'open-state', name: 'state.no-department' })
    const state = wrapper.get('[data-open-state="state.no-department"]')
    expect(state.text()).toContain('Programa departman katılmamış')
    const link = state.get('[data-testid="open-state-action"]')
    expect(link.text()).toBe('Departman ekle')
    expect(state.find('button').exists()).toBe(false)
    expect(state.text()).not.toContain('F2’de açılacak')
  })

  it('yönetici olmayan: eylem düğmesi yok', async () => {
    const { wrapper } = await mountState({ kind: 'open-state', name: 'state.no-department' }, false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('seçim bekleniyor / yükleniyor', async () => {
    const selecting = await mountState({ kind: 'selecting' })
    expect(selecting.wrapper.text()).toContain('Kapsam seçin')
    const loading = await mountState({ kind: 'loading' })
    expect(loading.wrapper.get('[role="status"]').attributes('aria-busy')).toBe('true')
  })

  it('hata: metin koddan, yeniden dene standing tazeler', async () => {
    const error = new ApiError({ code: 'identity.unavailable', requestId: 'req-1', status: 503 })
    const { wrapper, lifecycle } = await mountState({ kind: 'error' }, true, error)
    expect(wrapper.get('[role="alert"]').text()).toContain('req-1')
    await wrapper.get('button').trigger('click')
    expect(lifecycle.refreshStanding).toHaveBeenCalledOnce()
  })
})
