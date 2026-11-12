import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useToast } from '@/shared/ui'

import { useWorkItemList } from '../../api'
import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkItemDetail } from '../../model/types'
import type { WorkDetailTab } from '../index'
import { CHILD_STUBS, seedStanding, type StandingRowFixture } from './__tests__/fixtures'
import WorkDetailPanel from './WorkDetailPanel.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  useToast().clear()
  document.body.innerHTML = ''
})
afterAll(() => server.close())

const ITEM = '/v1/work-items/w1'

function backend(item: WorkItemDetail | Response, files = 2, notes = 3) {
  server.use(
    http.get(`${ORIGIN}${ITEM}`, () => (item instanceof Response ? item : json(item))),
    http.get(`${ORIGIN}${ITEM}/files`, () =>
      json({
        files: Array.from({ length: files }, (_, i) => ({
          file_id: `f${i}`,
          work_item_id: 'w1',
          display_name: `dosya-${i}.pdf`,
          content_type: 'application/pdf',
          size_bytes: 1,
          tag: 'plan',
          uploaded_by_account_id: 'acc-1',
          uploaded_by_full_name: null,
        })),
      }),
    ),
    http.get(`${ORIGIN}${ITEM}/notes`, () => json({ notes: [], total: notes })),
    http.get(`${ORIGIN}/v1/program/departments`, () =>
      json({
        departments: [
          { department_id: 'd1', display_name: 'Mekanik sistemler', code: 'MEK' },
          { department_id: 'd2', display_name: 'Yazılım' },
        ],
      }),
    ),
  )
}

const COORD_D1: StandingRowFixture[] = [{ department: 'd1', role: 'koordinator' }]

function setup(scope: ScopeSelection, companyAdmin: boolean, rows: StandingRowFixture[]) {
  const h = harness(scope)
  h.queryClient.setDefaultOptions({ queries: { retry: false, retryDelay: 0 } })
  seedStanding(h.queryClient, companyAdmin, rows)
  const mountPanel = (props: { workItemId: string; initialTab?: WorkDetailTab }) =>
    mount(WorkDetailPanel, {
      props,
      attachTo: document.body,
      global: {
        plugins: [[VueQueryPlugin, { queryClient: h.queryClient }]],
        stubs: CHILD_STUBS,
      },
    })
  return { h, mountPanel }
}

const tabs = (wrapper: ReturnType<ReturnType<typeof setup>['mountPanel']>) =>
  wrapper.findAll('[role="tab"]')

describe('ayrıntı paneli — açılış ve üst bilgi (E-03-19, E-03-41, E-03-45)', () => {
  it('K/Ü derin bağlantı: getWorkItem görevin kapsamıyla; kicker, başlık, sekme sayıları ayrıntı uçlarından', async () => {
    backend(
      workItem({
        department_id: 'd1',
        title: 'Faz3 asfalt',
        subtask_counts: { total: 4, done: 1 },
      }),
    )
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    await vi.waitFor(() => expect(wrapper.find('h2').exists()).toBe(true))

    const [request] = sent('GET', ITEM)
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(wrapper.get('h2').text()).toBe('Faz3 asfalt')
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="detail-kicker"]').text()).toBe('MEK · Mekanik sistemler'),
    )
    const section = wrapper.get('[data-testid="work-detail"]')
    expect(section.attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))

    await vi.waitFor(() =>
      expect(tabs(wrapper).map((t) => t.text().replace(/\s+/g, ' '))).toEqual([
        'Özet',
        'Alt görevler 4',
        'Dosyalar 2',
        'Notlar 3',
      ]),
    )
    expect(sent('GET', `${ITEM}/notes`)[0]!.headers.get('X-Nizamio-Department')).toBe('d1')
  })

  it('yükleniyor: iskelet + aria-busy', () => {
    server.use(http.get(`${ORIGIN}${ITEM}`, () => new Promise<Response>(() => undefined)))
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    expect(wrapper.find('[data-testid="detail-loading"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="work-detail"]').attributes('aria-busy')).toBe('true')
  })
})

describe('sekmeler (E-03-45) — klavye, içerik, sıfırlama', () => {
  it('tablist/tabpanel + aria-controls; ←/→/Home/End; içerik W44/W46/W47; görev değişince Özet', async () => {
    backend(workItem({ department_id: 'd1' }))
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w2`, () =>
        json(workItem({ work_item_id: 'w2', department_id: 'd1' })),
      ),
    )
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    await vi.waitFor(() => expect(tabs(wrapper)).toHaveLength(4))

    const panel = wrapper.get('[role="tabpanel"]')
    for (const tab of tabs(wrapper))
      expect(tab.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(wrapper.find('.rp-dl').exists()).toBe(true)

    ;(tabs(wrapper)[0]!.element as HTMLElement).focus()
    await tabs(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(tabs(wrapper)[1]!.attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs(wrapper)[1]!.element)
    expect(wrapper.findComponent({ name: 'SubtaskTab' }).exists()).toBe(true)

    await tabs(wrapper)[1]!.trigger('keydown', { key: 'End' })
    expect(wrapper.findComponent({ name: 'NotesTab' }).exists()).toBe(true)
    await tabs(wrapper)[3]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.findComponent({ name: 'FilesTab' }).exists()).toBe(true)
    await tabs(wrapper)[2]!.trigger('keydown', { key: 'Home' })
    expect(tabs(wrapper)[0]!.attributes('aria-selected')).toBe('true')

    await tabs(wrapper)[3]!.trigger('click')
    expect(tabs(wrapper)[3]!.attributes('aria-selected')).toBe('true')
    await wrapper.setProps({ workItemId: 'w2' })
    await vi.waitFor(() => expect(sent('GET', '/v1/work-items/w2')).toHaveLength(1))
    await vi.waitFor(() => expect(tabs(wrapper)[0]?.attributes('aria-selected')).toBe('true'))
    expect(wrapper.find('.rp-dl').exists()).toBe(true)
  })

  it('initialTab "subtasks" (E-03-32) → Alt görevler sekmesiyle açılır', async () => {
    backend(workItem({ department_id: 'd1' }))
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1', initialTab: 'subtasks' })
    await vi.waitFor(() =>
      expect(wrapper.findComponent({ name: 'SubtaskTab' }).exists()).toBe(true),
    )
    expect(tabs(wrapper)[1]!.attributes('aria-selected')).toBe('true')
  })
})

describe('kapanış (E-03-43, E-03-56, 404)', () => {
  it('Paneli kapat → close("user")', async () => {
    backend(workItem({ department_id: 'd1' }))
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    await wrapper.get('button[aria-label="Paneli kapat"]').trigger('click')
    expect(wrapper.emitted('close')).toEqual([['user']])
  })

  it('DeleteTaskAction deleted → close("deleted")', async () => {
    backend(workItem({ department_id: 'd1' }))
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    await vi.waitFor(() =>
      expect(wrapper.findComponent({ name: 'DeleteTaskAction' }).exists()).toBe(true),
    )
    wrapper.findComponent({ name: 'DeleteTaskAction' }).vm.$emit('deleted', 'w1')
    expect(wrapper.emitted('close')).toEqual([['deleted']])
  })

  it('404 work.item_not_found → close("not_found") + bildirim (bir kez)', async () => {
    backend(errorEnvelope('work.item_not_found', 404))
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    await vi.waitFor(() => expect(wrapper.emitted('close')).toEqual([['not_found']]))
    expect(useToast().current.value?.message).toBe('Görev bulunamadı.')
  })

  it('Admin merceği, görev yüklenen listede yok → "kapsam bilinmiyor" + kapanış; getWorkItem yok', async () => {
    backend(workItem())
    server.use(http.get(`${ORIGIN}/v1/program/work-items`, () => json({ items: [] })))
    const { h, mountPanel } = setup(ADMIN_SCOPE, true, [])
    h.run(() => useWorkItemList(null))
    const wrapper = mountPanel({ workItemId: 'w1' })
    expect(wrapper.emitted('close')).toBeUndefined()
    await vi.waitFor(() => expect(wrapper.emitted('close')).toEqual([['not_found']]))
    expect(useToast().current.value?.message).toBe(
      'Görevin kapsamı bilinmiyor; görevi listeden açın.',
    )
    expect(sent('GET', ITEM)).toHaveLength(0)
  })
})

describe('Admin merceği — liste satırından kapsam, yetki görünümü', () => {
  it('liste okuması bitince görevin kendi kapsamıyla okur; yönetici: salt okunur durum, yükle var (E-03-44, ADR-0030)', async () => {
    backend(workItem({ department_id: 'd2' }))
    server.use(
      http.get(`${ORIGIN}/v1/program/work-items`, () =>
        json({ items: [workItem({ department_id: 'd2' })] }),
      ),
    )
    const { h, mountPanel } = setup(ADMIN_SCOPE, true, [])
    h.run(() => useWorkItemList(null))
    const wrapper = mountPanel({ workItemId: 'w1' })
    await vi.waitFor(() => expect(wrapper.find('h2').exists()).toBe(true))

    expect(sent('GET', ITEM)[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.find('[data-testid="status-readonly"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'StatusMenu' }).exists()).toBe(false)
    expect(wrapper.find('[data-action="upload"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'FileUploadDialog' }).exists()).toBe(true)
    // Not okuma s.143 yöneticiye açık → sayı gelir.
    await vi.waitFor(() => expect(tabs(wrapper)[3]!.text()).toContain('3'))
  })

  it('koordinatör: StatusMenu requestEvidence → yükleme diyaloğu açılır (E-03-58 → E-03-52)', async () => {
    backend(workItem({ department_id: 'd1' }))
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    await vi.waitFor(() =>
      expect(wrapper.findComponent({ name: 'StatusMenu' }).exists()).toBe(true),
    )
    const dialog = wrapper.findComponent({ name: 'FileUploadDialog' })
    expect(dialog.props('open')).toBe(false)
    wrapper.findComponent({ name: 'StatusMenu' }).vm.$emit('requestEvidence')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'FileUploadDialog' }).props('open')).toBe(true)
  })
})

describe('hata durumu', () => {
  it('403 work.not_assigned: hata metni koddan, yeniden dene yok, panel açık kalır', async () => {
    backend(errorEnvelope('work.not_assigned', 403))
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.text()).toContain('Bu görev size atanmamış.')
    expect(wrapper.text()).not.toContain('sunucu iletisi')
    expect(wrapper.find('[role="alert"] button').exists()).toBe(false)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('5xx: yeniden dene → tekrar okur', async () => {
    let fail = true
    backend(workItem({ department_id: 'd1' }))
    server.use(
      http.get(`${ORIGIN}${ITEM}`, () =>
        fail ? errorEnvelope('platform.internal', 503) : json(workItem({ department_id: 'd1' })),
      ),
    )
    const { mountPanel } = setup(COORD_SCOPE, false, COORD_D1)
    const wrapper = mountPanel({ workItemId: 'w1' })
    await vi.waitFor(() => expect(wrapper.find('[role="alert"] button').exists()).toBe(true))
    fail = false
    await wrapper.get('[role="alert"] button').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('h2').exists()).toBe(true))
  })
})
