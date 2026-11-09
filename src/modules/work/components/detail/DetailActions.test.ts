import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'

import { workItem } from '../../model/__tests__/harness'
import type { WorkActorFacts } from '../../model/capabilities'
import { CHILD_STUBS, FACTS } from './__tests__/fixtures'
import DetailActions from './DetailActions.vue'

afterEach(() => {
  useToast().clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mountActions(facts: WorkActorFacts, over = {}) {
  return mount(DetailActions, {
    props: { item: workItem(over), facts },
    global: { stubs: CHILD_STUBS },
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

  it('Tarih değişikliği iste: devre dışı, F3 notu, stub yok (E-03-54, P5)', () => {
    const button = action(mountActions(FACTS.coordinator), 'date-request')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-label')).toContain('F3')
    expect(button.element.closest('[data-design-stub]')).toBeNull()
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
