import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import {
  COORD_SCOPE,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkActorFacts } from '../../model/capabilities'
import { CHILD_STUBS, FACTS } from './__tests__/fixtures'
import DetailActions from './DetailActions.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  useToast().clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetHarness()
  document.body.innerHTML = ''
})
afterAll(() => server.close())

// Bu dosyadaki eylem testleri `DateRequestForm`'u (timeline) saplamayla değiştirir; gerçek
// formla uçtan uca deneme aşağıdaki "gerçek form" bölümündedir (TASLAK satırı: W94 raporu).
const FORM_STUB = { DateRequestForm: true }

function mountActions(facts: WorkActorFacts, over = {}) {
  return mount(DetailActions, {
    props: { item: workItem(over), facts },
    global: { stubs: { ...CHILD_STUBS, ...FORM_STUB } },
  })
}

const action = (wrapper: ReturnType<typeof mountActions>, name: string) =>
  wrapper.find(`[data-action="${name}"]`)

describe('eylem satırı — görünürlük (capabilities, P1)', () => {
  it.each([
    // [ad, olgular, yükle, tarih talebi, sil]
    ['yönetici', FACTS.admin, false, false, true],
    ['koordinatör', FACTS.coordinator, true, true, true],
    ['atanmış üye', FACTS.assignedMember, true, false, false],
    ['atanmamış üye', FACTS.member, false, false, false],
  ])('%s', (_name, facts, upload, dateRequest, remove) => {
    const wrapper = mountActions(facts)
    expect(action(wrapper, 'upload').exists()).toBe(upload)
    expect(action(wrapper, 'date-request').exists()).toBe(dateRequest)
    expect(wrapper.findComponent({ name: 'DeleteTaskAction' }).exists()).toBe(remove)
    // Hatırlat ve Kopyala herkeste.
    expect(action(wrapper, 'remind').exists()).toBe(true)
    expect(action(wrapper, 'copy').exists()).toBe(true)
  })

  it('bekleyen tarih talebi varken "Tarih değişikliği iste" gizli (s.151)', () => {
    const pending = { request_id: 'r1', new_start_on: '2026-11-02', new_end_on: '2026-11-20' }
    const wrapper = mountActions(FACTS.coordinator, { pending_date_request: pending })
    expect(action(wrapper, 'date-request').exists()).toBe(false)
  })
})

describe('eylem satırı — davranış', () => {
  it('Hatırlat: devre dışı + BE-008 stub; tık istek atmaz (E-03-53)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const wrapper = mountActions(FACTS.coordinator)
    const remind = action(wrapper, 'remind')
    expect(remind.attributes('disabled')).toBeDefined()
    expect(remind.element.closest('[data-design-stub="BE-008"]')).not.toBeNull()
    await remind.trigger('click')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('Tarih değişikliği iste: canlı (E-03-54, P8/P18); stub/devre dışı değil, F3 notu yok', () => {
    const button = action(mountActions(FACTS.coordinator), 'date-request')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.attributes('aria-label')).toBe('Tarih değişikliği iste')
    expect(button.element.closest('[data-design-stub]')).toBeNull()
  })

  it("Tarih değişikliği iste → timeline DateRequestForm'u görevin kendi kapsamı ve tarihleriyle açılır", async () => {
    const wrapper = mountActions(FACTS.coordinator, {
      work_item_id: 'w9',
      program_id: 'p1',
      department_id: 'd2',
      start_on: '2026-11-01',
      end_on: '2026-11-10',
    })
    const form = wrapper.findComponent({ name: 'DateRequestForm' })
    expect(form.props()).toMatchObject({ open: false, workItemId: 'w9' })
    await action(wrapper, 'date-request').trigger('click')
    expect(form.props()).toMatchObject({
      open: true,
      workItemId: 'w9',
      target: { programId: 'p1', departmentId: 'd2' },
      startOn: '2026-11-01',
      endOn: '2026-11-10',
    })
  })

  it('yönetici tek başına talep açamaz: düğme de form da yok (P18)', () => {
    const wrapper = mountActions(FACTS.admin)
    expect(action(wrapper, 'date-request').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'DateRequestForm' }).exists()).toBe(false)
  })

  it('Kopyala: /gorevler?gorev=‹id› panoya + bildirim; yazma isteği yok (E-03-55, P7)', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const wrapper = mountActions(FACTS.member, { work_item_id: 'w-42' })
    await action(wrapper, 'copy').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/gorevler?gorev=w-42`)
    expect(useToast().current.value?.message).toBe('Görev bağlantısı panoya kopyalandı.')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('Kopyala: pano yoksa/reddederse tehlike bildirimi', async () => {
    vi.stubGlobal('navigator', {})
    const wrapper = mountActions(FACTS.member)
    await action(wrapper, 'copy').trigger('click')
    await flushPromises()
    expect(useToast().current.value).toMatchObject({
      message: 'Görev bağlantısı kopyalanamadı.',
      tone: 'danger',
    })
  })

  it.each([
    ['başarı', (resolve: () => void) => resolve()],
    ['ret', (_: () => void, reject: () => void) => reject()],
  ] as const)(
    'Kopyala beklerken ayrıntı söküldü (%s): geç bildirim yok (CX-F1-Ö-07)',
    async (_name, settle) => {
      let resolve!: () => void
      let reject!: () => void
      const writeText = vi.fn(
        () => new Promise<void>((ok, fail) => ((resolve = ok), (reject = () => fail(new Error())))),
      )
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      const wrapper = mountActions(FACTS.member)
      await action(wrapper, 'copy').trigger('click')
      expect(writeText).toHaveBeenCalledOnce()
      wrapper.unmount()
      settle(resolve, reject)
      await flushPromises()
      expect(useToast().queue.value).toEqual([])
    },
  )

  it('Kanıt yükle → upload; DeleteTaskAction deleted → deleted', async () => {
    const wrapper = mountActions(FACTS.coordinator)
    await action(wrapper, 'upload').trigger('click')
    expect(wrapper.emitted('upload')).toHaveLength(1)
    wrapper.findComponent({ name: 'DeleteTaskAction' }).vm.$emit('deleted', 'w1')
    expect(wrapper.emitted('deleted')).toEqual([['w1']])
  })
})

describe('eylem satırı — gerçek DateRequestForm (E-03-54/63; 03c ile aynı form)', () => {
  it('Koordinatör: düğme formu açar, gönderim tek POST (görevin kendi kapsamıyla), başarıda bildirim', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w1`, () => json(workItem())),
      http.post(`${ORIGIN}/v1/date-change-requests`, () =>
        json({ request_id: 'r1', work_item_id: 'w1', status: 'pending' }, 201),
      ),
    )
    const h = harness(COORD_SCOPE)
    const wrapper = mount(DetailActions, {
      props: { item: workItem(), facts: FACTS.coordinator },
      attachTo: document.body,
      global: {
        stubs: CHILD_STUBS,
        plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]],
      },
    })
    await action(wrapper, 'date-request').trigger('click')
    await settleQueries(h.queryClient)
    const dialog = document.body.querySelector('[role="dialog"]')!
    expect(dialog).not.toBeNull()
    const end = dialog.querySelector<HTMLInputElement>('input[name="end"]')!
    end.value = '15.11.2026'
    end.dispatchEvent(new Event('input'))
    document.body.querySelector<HTMLButtonElement>('[data-testid="tp-request-submit"]')!.click()
    await settleQueries(h.queryClient)

    const [req] = sent('POST', '/v1/date-change-requests')
    expect(sent('POST', '/v1/date-change-requests')).toHaveLength(1)
    expect(req!.body).toEqual({
      work_item_id: 'w1',
      new_start_on: '2026-11-01',
      new_end_on: '2026-11-15',
    })
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(useToast().current.value?.message).toBe('Tarih talebi gönderildi.')
    await flushPromises()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })
})
