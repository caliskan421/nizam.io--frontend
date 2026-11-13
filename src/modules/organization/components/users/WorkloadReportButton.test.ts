import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { reportGate } from '@/modules/reports/public'
import {
  browserSave,
  errorEnvelope,
  http,
  ORIGIN,
  resetHarness,
  sent,
  server,
  ticketOk,
} from '@/shared/download/__tests__/harness'
import { i18n } from '@/shared/i18n'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'

import { fakeSelection } from './__tests__/workload-fake'
import { WORKLOAD_SELECTION } from './use-workload-selection'
import WorkloadReportButton from './WorkloadReportButton.vue'

const mounted: VueWrapper[] = []
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  browserSave()
  useToast().clear()
})
afterEach(() => {
  for (const w of mounted.splice(0)) w.unmount()
  reportGate.reset()
  resetHarness()
  vi.restoreAllMocks()
})
afterAll(() => server.close())

function mountButton(selection?: ReturnType<typeof fakeSelection>) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const wrapper = mount(WorkloadReportButton, {
    global: {
      plugins: [pinia, i18n, [VueQueryPlugin, { queryClient: new QueryClient() }]],
      provide: selection ? { [WORKLOAD_SELECTION as symbol]: selection } : {},
    },
  })
  mounted.push(wrapper)
  return wrapper
}

describe('WorkloadReportButton (E-13-59)', () => {
  it('sağlayıcı yok ya da rapor eylemi kapalıyken çizilmez', () => {
    expect(mountButton().find('button').exists()).toBe(false)
    expect(
      mountButton(fakeSelection({ enabled: false }))
        .find('button')
        .exists(),
    ).toBe(false)
  })

  it('etiket seçime göre: yok → "İş yükü raporu (PDF)"; N → "Seçilenlerin iş yükü (PDF) · N"', async () => {
    const selection = fakeSelection()
    const w = mountButton(selection)
    expect(w.get('button').text()).toBe('İş yükü raporu (PDF)')
    selection.toggle('u1')
    selection.toggle('u2')
    await flushPromises()
    expect(w.get('button').text()).toBe('Seçilenlerin iş yükü (PDF) · 2')
  })

  it('program yoksa devre dışı + gerekçe', () => {
    const w = mountButton(fakeSelection({ programReady: false }))
    expect(w.get('button').attributes('disabled')).toBeDefined()
    expect(w.get('button').attributes('title')).toBe('Önce bir program seçin.')
  })

  it('yalnız 422 reporting.input_invalid seçimi temizler (bildirimle); sökülmüş ekran bildirim üretmez', async () => {
    server.use(
      ticketOk(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('reporting.input_invalid', 422)),
    )
    const selection = fakeSelection({ picked: ['u1'] })
    const w = mountButton(selection)
    await w.get('button').trigger('click')
    await vi.waitFor(() => expect(selection.count.value).toBe(0))
    expect(useToast().current.value?.message).toBe('Seçim güncellendi, yeniden deneyin.')
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
  })
})
