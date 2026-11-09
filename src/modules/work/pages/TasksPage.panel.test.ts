import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  ADMIN_SCOPE,
  http,
  json,
  ORIGIN,
  resetHarness,
  server,
  workItem,
} from '../model/__tests__/harness'
import type { WorkItem } from '../model/types'
import {
  ADMIN,
  isListQuery,
  LIST,
  listHandler,
  listRequests,
  mountPage,
  settle,
  standingHandlers,
  unmountPages,
} from './tasks/__tests__/page-harness'
import TasksPage from './TasksPage.vue'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountPages()
  resetHarness()
})
afterAll(() => server.close())

const ROWS = [
  workItem({ work_item_id: 'w1', title: 'Asfalt', department_id: 'd1' }),
  workItem({ work_item_id: 'w2', title: 'Plan', department_id: 'd2' }),
] as WorkItem[]

describe('Görevler › Liste — ayrıntı paneli (URL gorev)', () => {
  it('derin bağlantı: panel ilk sayfa yüklendikten sonra açılır; satır seçili', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      ...standingHandlers(ADMIN),
      http.get(`${ORIGIN}${LIST}`, async () => {
        await gate
        return json({ items: ROWS })
      }),
    )
    // Liste yanıtı elle salınana dek uçuşta kalır; diğer okumalar yerleşir.
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE, '/gorevler?gorev=w2', isListQuery)
    // Admin merceğinde hedef kapsam yalnız yüklenen satırlardan çözülür (useWorkItemTarget).
    expect(ctx.wrapper.find('[data-panel]').exists()).toBe(false)
    expect(ctx.wrapper.findAll('[data-skeleton]')).toHaveLength(10)
    release()
    await settle()
    const panel = ctx.wrapper.get('[data-panel]')
    expect(panel.attributes()).toMatchObject({ 'data-panel': 'w2', 'data-tab': 'summary' })
    const rows = ctx.wrapper.findAll('.rp-tr--body')
    expect(rows[1]!.classes()).toContain('rp-sel')
    expect(rows[0]!.classes()).not.toContain('rp-sel')
  })

  it('satır tıklaması paneli açar (push); kapat → gorev silinir, tablo tam genişlik', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE, '/gorevler?durum=baslanmadi')
    expect(ctx.wrapper.find('.rp-aside').exists()).toBe(false)
    const link = ctx.wrapper.findAll('a.rp-title')[0]!
    expect(link.attributes('href')).toBe('/gorevler?durum=baslanmadi&gorev=w1')
    await link.trigger('click')
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({ durum: 'baslanmadi', gorev: 'w1' })
    expect(ctx.wrapper.get('.rp-aside [data-panel]').attributes('data-panel')).toBe('w1')

    ctx.wrapper.findComponent({ name: 'WorkDetailPanel' }).vm.$emit('close', 'user')
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({ durum: 'baslanmadi' })
    expect(ctx.wrapper.find('.rp-aside').exists()).toBe(false)
    // Geri tuşu paneli yeniden açar (açma geçmişe kayıt ekledi).
    ctx.router.back()
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({ durum: 'baslanmadi', gorev: 'w1' })
  })

  it('alt görev başlığı → panel "Alt görevler" sekmesinde (E-03-32)', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE)
    await ctx.wrapper.findAll('.rp-subtog')[1]!.trigger('click')
    ctx.wrapper.findComponent({ name: 'SubtaskBlock' }).vm.$emit('openSubtasks', 'w2')
    await settle()
    expect(ctx.wrapper.get('[data-panel]').attributes()).toMatchObject({
      'data-panel': 'w2',
      'data-tab': 'subtasks',
    })
  })

  it('yeni görev oluşturulunca panelde açılır (E-03-57)', async () => {
    server.use(...standingHandlers(ADMIN), listHandler(ROWS))
    const ctx = await mountPage(TasksPage, ADMIN_SCOPE, '/gorevler?koordinatorluk=d2')
    await ctx.wrapper
      .findAll('button')
      .find((b) => b.text() === 'Yeni görev')!
      .trigger('click')
    const dialog = ctx.wrapper.get('[data-new-task]')
    expect(dialog.attributes()).toMatchObject({ 'data-new-task': 'open', 'data-dept': 'd2' })
    ctx.wrapper.findComponent({ name: 'NewTaskDialog' }).vm.$emit('created', ROWS[1])
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({ koordinatorluk: 'd2', gorev: 'w2' })
    // Süzgeçli listenin dışındaki görev panelde açılmaz (hedef çözülemez; W48).
    ctx.wrapper.findComponent({ name: 'NewTaskDialog' }).vm.$emit('created', ROWS[0])
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({ koordinatorluk: 'd2', gorev: 'w2' })
  })
})

describe('Görevler › Liste — kapsam değişimi (README satır dışı varsayım)', () => {
  it('arama/sekme/talep/sıralama korunur; koordinatörlük, panel, imleç ve açık bloklar sıfırlanır', async () => {
    const pending = { request_id: 'r1', new_start_on: '2026-11-01', new_end_on: '2026-11-20' }
    const requested = { ...ROWS[0]!, pending_date_request: pending }
    server.use(...standingHandlers(ADMIN), listHandler([requested], 'c1'))
    const ctx = await mountPage(
      TasksPage,
      ADMIN_SCOPE,
      '/gorevler?durum=baslanmadi&talep=1&q=a&sirala=bitis:artan&koordinatorluk=d2&gorev=w1',
    )
    await ctx.wrapper.findAll('.rp-subtog')[0]!.trigger('click')
    expect(ctx.wrapper.find('[data-subtasks]').exists()).toBe(true)

    ctx.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await settle()
    expect(ctx.router.currentRoute.value.query).toEqual({
      durum: 'baslanmadi',
      talep: '1',
      q: 'a',
      sirala: 'bitis:artan',
    })
    expect(ctx.wrapper.find('[data-panel]').exists()).toBe(false)
    expect(ctx.wrapper.find('[data-subtasks]').exists()).toBe(false)
    const last = listRequests().at(-1)!
    expect(last.headers.get('X-Nizamio-Program')).toBe('p2')
    expect(last.query.has('cursor')).toBe(false)
    expect(last.query.has('department_id')).toBe(false)
  })
})
