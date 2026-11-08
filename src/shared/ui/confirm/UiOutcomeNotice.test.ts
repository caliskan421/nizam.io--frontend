import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'

import UiOutcomeNotice from './UiOutcomeNotice.vue'

type Outcome = MutationOutcome<unknown, unknown, unknown>
const success: Outcome = {
  kind: 'success',
  data: {},
  status: 201,
  replayed: true,
  idempotencyKey: 'k',
}

describe('UiOutcomeNotice', () => {
  it('sonuç bilinmiyor: "Yeniden gönder" aynı eylemi tekrarlar, yeni sonuç yayılır', async () => {
    const retry = vi.fn(() => Promise.resolve(success))
    const outcome: Outcome = {
      kind: 'unknown_outcome',
      error: new ApiError({ code: 'client.network_error' }),
      reason: 'network',
      draft: {},
      idempotencyKey: 'k',
      firstSentAt: 0,
      retry,
    }
    const wrapper = mount(UiOutcomeNotice, { props: { outcome } })
    expect(wrapper.get('[role="alert"]').text()).toContain('İşlemin sonucu doğrulanamadı')
    await wrapper.get('[data-testid="outcome-retry"]').trigger('click')
    await flushPromises()
    expect(retry).toHaveBeenCalledOnce()
    expect(wrapper.emitted('resolved')?.[0]).toEqual([success])
  })

  it('süre dolmuş: yeniden gönder düğmesi yok', () => {
    const outcome: Outcome = {
      kind: 'unknown_outcome',
      error: new ApiError({ code: 'client.network_error' }),
      reason: 'timeout',
      draft: {},
      idempotencyKey: 'k',
      firstSentAt: 0,
      retry: null,
    }
    const wrapper = mount(UiOutcomeNotice, { props: { outcome } })
    expect(wrapper.find('[data-testid="outcome-retry"]').exists()).toBe(false)
  })

  it('çakışma: değişen alanlar listelenir, alan alan seçim F1 notu', () => {
    const outcome: Outcome = {
      kind: 'edit_conflict',
      error: new ApiError({ code: 'work.edit_conflict', status: 409 }),
      groups: ['expected_revision'],
      draft: {},
      server: null,
    }
    const wrapper = mount(UiOutcomeNotice, { props: { outcome, fields: ['Başlık', 'Öncelik'] } })
    expect(wrapper.findAll('[data-testid="outcome-fields"] li').map((li) => li.text())).toEqual([
      'Başlık',
      'Öncelik',
    ])
    expect(wrapper.text()).toContain('F1’de')
  })

  it('diğer sonuçlarda bir şey çizilmez', () => {
    expect(mount(UiOutcomeNotice, { props: { outcome: success } }).html()).toBe('<!--v-if-->')
    expect(mount(UiOutcomeNotice, { props: { outcome: null } }).html()).toBe('<!--v-if-->')
  })
})
