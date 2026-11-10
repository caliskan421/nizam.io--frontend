import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  ganttTask,
  http,
  json,
  MEMBER_SCOPE,
  ORIGIN,
  sent,
  server,
  workItem,
} from '../../__tests__/harness'
import type { GanttFace, GanttTask } from '../../model/types'
import { $, panelHarness, resetPanel, setValue, type WhoSeed } from './__tests__/panel-harness'
import SelectedTaskPanel from './SelectedTaskPanel.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetPanel)
afterAll(() => server.close())

const ITEM = '/v1/work-items/w1'
const FILES = '/v1/work-items/w1/files'
const PENDING = { request_id: 'r7', new_start_on: '2026-11-03', new_end_on: '2026-11-20' }

const WHO = {
  admin: { companyAdmin: true },
  coordinator: { rows: [['d2', 'koordinator']] },
  member: { rows: [['d2', 'uye']] },
  both: { companyAdmin: true, rows: [['d2', 'koordinator']] },
} as const satisfies Record<string, WhoSeed>

const SCOPES = { admin: ADMIN_SCOPE, coordinator: COORD_SCOPE, member: MEMBER_SCOPE }

interface Options {
  who: keyof typeof WHO
  face: GanttFace
  item?: Record<string, unknown>
  task?: Partial<GanttTask>
  files?: number | 'forbidden'
}

function fileList(n: number) {
  return { files: Array.from({ length: n }, (_, i) => ({ file_id: `f${i}` })) }
}

function render({ who, face, item = {}, task = {}, files = 1 }: Options) {
  server.use(
    http.get(`${ORIGIN}${ITEM}`, () => json(workItem(item))),
    http.get(`${ORIGIN}${FILES}`, () =>
      files === 'forbidden' ? errorEnvelope('records.not_authorized', 403) : json(fileList(files)),
    ),
  )
  const h = panelHarness(SCOPES[face], WHO[who])
  const wrapper = h.mount(SelectedTaskPanel, {
    task: ganttTask(task),
    face,
    departmentName: 'Altyapı',
  })
  return { h, wrapper }
}

const has = (id: string) => $(`[data-testid="${id}"]`) !== null
const text = (id: string) => $(`[data-testid="${id}"]`)?.textContent?.trim()
const click = (id: string) => $(`[data-testid="${id}"]`)!.click()

describe('açılış: taze okuma, başlık, özet (E-03C-54…62)', () => {
  it('taze getWorkItem + dosya listesi görevin KENDİ kapsamıyla; başka okuma yok', async () => {
    const { h } = render({ who: 'admin', face: 'admin' })
    await settleQueries(h.queryClient)
    for (const path of [ITEM, FILES]) {
      const [req] = sent('GET', path)
      expect(sent('GET', path)).toHaveLength(1)
      expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    }
    expect(sent('GET', '/v1/date-change-requests')).toHaveLength(0)
    expect(sent('GET', '/v1/work-items/w1/dependencies')).toHaveLength(0)
  })

  it('üst satır: Admin yüzünde "KOD-— · koordinatörlük", başlık, durum, kanıt dosyası sayısı', async () => {
    const { h } = render({ who: 'admin', face: 'admin', files: 2 })
    await settleQueries(h.queryClient)
    expect(text('tp-kicker')).toBe('ALT-— · Altyapı')
    expect(text('tp-title')).toBe('Rapor')
    expect(text('tp-status')).toBe('Devam ediyor')
    expect(text('tp-files')).toBe('2 dosya')
    expect(($('[data-testid="tp-start"]') as HTMLInputElement).value).toBe('01.11.2026')
    expect(($('[data-testid="tp-end"]') as HTMLInputElement).value).toBe('10.11.2026')
  })

  it('Koordinatör/Üye yüzünde kod yok, yalnız koordinatörlük adı (E-03C-30)', async () => {
    const { h } = render({ who: 'coordinator', face: 'coordinator' })
    await settleQueries(h.queryClient)
    expect(text('tp-kicker')).toBe('Altyapı')
  })

  it('bitiş girdisi end_on gösterir; planned_end_on ayrı salt okunur bilgi (W97a)', async () => {
    const { h } = render({
      who: 'admin',
      face: 'admin',
      task: { planned_end_on: '2026-11-08' },
      item: { planned_end_on: '2026-11-08', end_on: '2026-11-12' },
    })
    await settleQueries(h.queryClient)
    expect(($('[data-testid="tp-end"]') as HTMLInputElement).value).toBe('12.11.2026')
    expect(text('tp-planned-end')).toBe('İlk plan bitişi: 08.11.2026')
  })

  it('dosya listesi 403 → "—" (ek istek yok)', async () => {
    const { h } = render({ who: 'admin', face: 'admin', files: 'forbidden' })
    await settleQueries(h.queryClient)
    expect(text('tp-files')).toBe('—')
  })

  it('gecikme satırı yalnız gecikmede ("N gün"); gecikmiyorsa çizilmez', async () => {
    const late = ganttTask().lateness
    const a = render({
      who: 'admin',
      face: 'admin',
      task: { lateness: { ...late, is_overdue: true, days_overdue: 41 } },
    })
    await settleQueries(a.h.queryClient)
    expect(text('tp-overdue')).toBe('41 gün')
    expect($('.tp-date--late')).not.toBeNull()
    resetPanel()
    const b = render({ who: 'admin', face: 'admin' })
    await settleQueries(b.h.queryClient)
    expect(has('tp-overdue')).toBe(false)
    expect($('.tp-date--late')).toBeNull()
  })

  it('görev okunamazsa hata durumu + yeniden dene (eylemler çizilmez)', async () => {
    server.use(http.get(`${ORIGIN}${ITEM}`, () => errorEnvelope('work.item_not_found', 404)))
    const h = panelHarness(ADMIN_SCOPE, WHO.admin)
    h.mount(SelectedTaskPanel, { task: ganttTask(), face: 'admin', departmentName: null })
    await settleQueries(h.queryClient)
    expect($('[role="alert"]')).not.toBeNull()
    expect(has('tp-save')).toBe(false)
    expect(has('tp-start')).toBe(false)
  })
})

describe('yüz × yetki × görünürlük (P1, P8, P18)', () => {
  it.each([
    // [ad, kim, yüz, düzenlenebilir, Kaydet, Tarih talebi, Diğer işlemler, yardım]
    ['Admin', 'admin', 'admin', true, true, false, true, 'hemen uygulanır'],
    ['Koordinatör', 'coordinator', 'coordinator', true, false, true, true, 'onaya gider'],
    ['Üye', 'member', 'member', false, false, false, false, null],
    [
      'yönetici + koordinatör (koordinatör yüzü)',
      'both',
      'coordinator',
      true,
      true,
      true,
      true,
      'hemen uygulanır',
    ],
    [
      'yönetici Üye yüzünde (P1: yetki yüzden bağımsız)',
      'admin',
      'member',
      true,
      true,
      false,
      true,
      'hemen uygulanır',
    ],
    [
      'yalnız yönetici Koordinatör yüzünde: talep açamaz',
      'admin',
      'coordinator',
      true,
      true,
      false,
      true,
      'hemen uygulanır',
    ],
  ] as const)('%s', async (_n, who, face, editable, save, request, more, help) => {
    const { h } = render({ who, face })
    await settleQueries(h.queryClient)
    expect(($('[data-testid="tp-start"]') as HTMLInputElement).readOnly).toBe(!editable)
    expect(($('[data-testid="tp-end"]') as HTMLInputElement).readOnly).toBe(!editable)
    expect(has('tp-save')).toBe(save)
    expect(has('tp-request')).toBe(request)
    expect(has('tp-more')).toBe(more)
    expect(has('tp-remind')).toBe(more)
    if (help === null) expect(has('tp-help')).toBe(false)
    else expect(text('tp-help')).toContain(help)
  })

  it('bekleyen talep: Admin uzantıyı + Onayla/Reddet görür; talep açan Koordinatörde "Tarih talebi gönder" gizli', async () => {
    const a = render({ who: 'admin', face: 'admin', item: { pending_date_request: PENDING } })
    await settleQueries(a.h.queryClient)
    expect(text('tp-pending')).toContain('03.11.2026 → 20.11.2026')
    expect(has('tp-approve')).toBe(true)
    expect(has('tp-reject')).toBe(true)
    resetPanel()
    const b = render({
      who: 'coordinator',
      face: 'coordinator',
      item: { pending_date_request: PENDING },
    })
    await settleQueries(b.h.queryClient)
    expect(has('tp-request')).toBe(false)
    expect(has('tp-pending')).toBe(true)
    expect(has('tp-approve')).toBe(false)
  })

  it('Üyede bekleyen talep uzantısı hiç yok (sunucu doldursa bile) ve Onayla/Reddet yok', async () => {
    const { h } = render({ who: 'member', face: 'member', item: { pending_date_request: PENDING } })
    await settleQueries(h.queryClient)
    expect(has('tp-pending')).toBe(false)
    expect(has('tp-approve')).toBe(false)
  })

  it('uzantı yalnız seçili görevde: panel başka görevle değişince eskisinin talebi kalmaz', async () => {
    const { h, wrapper } = render({
      who: 'admin',
      face: 'admin',
      item: { pending_date_request: PENDING },
    })
    await settleQueries(h.queryClient)
    expect(has('tp-pending')).toBe(true)
    server.use(
      http.get(`${ORIGIN}/v1/work-items/w2`, () =>
        json(workItem({ work_item_id: 'w2', pending_date_request: null })),
      ),
      http.get(`${ORIGIN}/v1/work-items/w2/files`, () => json(fileList(0))),
    )
    await wrapper.setProps({ task: ganttTask({ work_item_id: 'w2', title: 'Diğer' }) })
    await settleQueries(h.queryClient)
    expect(has('tp-pending')).toBe(false)
    expect(text('tp-title')).toBe('Diğer')
  })

  it('Hatırlat devre dışı + BE-008 stub; tık istek atmaz (E-03C-65)', async () => {
    const { h } = render({ who: 'admin', face: 'admin' })
    await settleQueries(h.queryClient)
    const button = $('[data-testid="tp-remind"]') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.closest('[data-design-stub="BE-008"]')).not.toBeNull()
    const before = sent('POST', '/v1/work-items/w1/remind').length
    button.click()
    await flushPromises()
    expect(sent('POST', '/v1/work-items/w1/remind')).toHaveLength(before)
  })
})

describe('Admin "Kaydet" (updateWorkItem + expected_dates_revision; E-03C-58/59, P18)', () => {
  it('yalnız değişen tarih + sürüm; görevin kendi başlıkları; başarıda bildirim', async () => {
    server.use(http.patch(`${ORIGIN}${ITEM}`, () => json(workItem({ end_on: '2026-11-15' }))))
    const { h } = render({ who: 'admin', face: 'admin' })
    await settleQueries(h.queryClient)
    setValue('[data-testid="tp-end"]', '15.11.2026')
    click('tp-save')
    await settleQueries(h.queryClient)
    const [req] = sent('PATCH', ITEM)
    expect(req!.body).toEqual({ end_on: '2026-11-15', expected_dates_revision: 7 })
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(useToast().current.value?.message).toBe('Tarihler kaydedildi.')
  })

  it('geçersiz / ters / değişmeyen girdi istek atmaz', async () => {
    const { h } = render({ who: 'admin', face: 'admin' })
    await settleQueries(h.queryClient)
    setValue('[data-testid="tp-start"]', '99.11.2026')
    click('tp-save')
    await flushPromises()
    expect($('.tp-date__error')!.textContent).toContain('gg.aa.yyyy')
    setValue('[data-testid="tp-start"]', '20.11.2026')
    click('tp-save')
    await flushPromises()
    expect($('.tp-date__error')!.textContent).toContain('Bitiş, başlangıçtan önce olamaz.')
    setValue('[data-testid="tp-start"]', '01.11.2026')
    click('tp-save')
    await flushPromises()
    expect(text('tp-error')).toBe('Tarihler değişmedi.')
    expect(sent('PATCH', ITEM)).toHaveLength(0)
  })

  it('istek sürerken Kaydet ve Onayla kilitli: çift gönderim yok', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.patch(`${ORIGIN}${ITEM}`, async () => {
        await gate
        return json(workItem())
      }),
    )
    const { h } = render({ who: 'admin', face: 'admin', item: { pending_date_request: PENDING } })
    await settleQueries(h.queryClient)
    setValue('[data-testid="tp-end"]', '15.11.2026')
    click('tp-save')
    await flushPromises()
    expect(($('[data-testid="tp-save"]') as HTMLButtonElement).disabled).toBe(true)
    expect(($('[data-testid="tp-approve"]') as HTMLButtonElement).disabled).toBe(true)
    click('tp-save')
    await flushPromises()
    expect(sent('PATCH', ITEM)).toHaveLength(1)
    release()
    await settleQueries(h.queryClient)
    expect(sent('PATCH', ITEM)).toHaveLength(1)
  })

  it('sonuç bilinmiyor: kör tekrar yok, taslak korunur, görev yeniden okunur', async () => {
    server.use(http.patch(`${ORIGIN}${ITEM}`, () => new Response(null, { status: 502 })))
    const { h } = render({ who: 'admin', face: 'admin' })
    await settleQueries(h.queryClient)
    setValue('[data-testid="tp-end"]', '15.11.2026')
    const reads = sent('GET', ITEM).length
    click('tp-save')
    await settleQueries(h.queryClient)
    expect(sent('PATCH', ITEM)).toHaveLength(1)
    expect(($('[data-testid="tp-end"]') as HTMLInputElement).value).toBe('15.11.2026')
    expect(sent('GET', ITEM).length).toBeGreaterThan(reads)
  })

  it('409 edit_conflict: gerçek çakışan alan sorulur; "benimki" seçilince YENİ tabanla tek ikinci istek', async () => {
    let calls = 0
    server.use(
      http.patch(`${ORIGIN}${ITEM}`, () => {
        calls += 1
        return calls === 1
          ? errorEnvelope('work.edit_conflict', 409, [
              { field: 'expected_dates_revision', code: 'work.edit_conflict' },
            ])
          : json(workItem({ end_on: '2026-11-15', dates_revision: 9 }))
      }),
    )
    const { h } = render({ who: 'admin', face: 'admin' })
    await settleQueries(h.queryClient)
    // Sunucu bu arada bitişi başka değere çekti (sürüm 8): bizim bitiş taslağımızla çakışır.
    server.use(
      http.get(`${ORIGIN}${ITEM}`, () =>
        json(workItem({ end_on: '2026-11-12', dates_revision: 8 })),
      ),
    )
    setValue('[data-testid="tp-end"]', '15.11.2026')
    click('tp-save')
    await settleQueries(h.queryClient)
    const dialog = $('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain('12.11.2026')
    expect(dialog!.textContent).toContain('15.11.2026')
    expect(sent('PATCH', ITEM)).toHaveLength(1)
  })
})

describe('Kaydet bitiş alanı: yazma her zaman end_on (planned_end_on yazılmaz)', () => {
  it('planned_end_on dolu görevde de PATCH yalnız end_on gönderir', async () => {
    server.use(http.patch(`${ORIGIN}${ITEM}`, () => json(workItem())))
    const { h } = render({
      who: 'admin',
      face: 'admin',
      task: { planned_end_on: '2026-11-08' },
      item: { planned_end_on: '2026-11-08', end_on: '2026-11-12' },
    })
    await settleQueries(h.queryClient)
    setValue('[data-testid="tp-end"]', '13.11.2026')
    click('tp-save')
    await settleQueries(h.queryClient)
    expect(sent('PATCH', ITEM)[0]!.body).toEqual({
      end_on: '2026-11-13',
      expected_dates_revision: 7,
    })
  })
})

describe('Onayla / Reddet (reviewDateChangeRequest; E-03C-64, P5)', () => {
  const REVIEW = '/v1/date-change-requests/r7/review'

  it('Onayla: S1 (başlıksız) POST decision=approved; zincir sayısı sonradan bildirilir, onay diyaloğu yok', async () => {
    server.use(http.post(`${ORIGIN}${REVIEW}`, () => json({ affected_tasks_count: 3 })))
    const { h } = render({ who: 'admin', face: 'admin', item: { pending_date_request: PENDING } })
    await settleQueries(h.queryClient)
    click('tp-approve')
    expect($('[role="dialog"]')).toBeNull()
    await settleQueries(h.queryClient)
    const [req] = sent('POST', REVIEW)
    expect(req!.body).toEqual({ decision: 'approved' })
    expect(req!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    const messages = useToast().queue.value.map((t) => t.message)
    expect(messages).toEqual(['Tarih talebi onaylandı.', '3 bağımlı görevin tarihi de kaydı.'])
  })

  it('Reddet: decision=rejected', async () => {
    server.use(http.post(`${ORIGIN}${REVIEW}`, () => json({ affected_tasks_count: 0 })))
    const { h } = render({ who: 'admin', face: 'admin', item: { pending_date_request: PENDING } })
    await settleQueries(h.queryClient)
    click('tp-reject')
    await settleQueries(h.queryClient)
    expect(sent('POST', REVIEW)[0]!.body).toEqual({ decision: 'rejected' })
    expect(useToast().queue.value.map((t) => t.message)).toEqual(['Tarih talebi reddedildi.'])
  })

  it('409 work.date_request_already_reviewed: kendi iletisi + görev yeniden okunur', async () => {
    server.use(
      http.post(`${ORIGIN}${REVIEW}`, () =>
        errorEnvelope('work.date_request_already_reviewed', 409),
      ),
    )
    const { h } = render({ who: 'admin', face: 'admin', item: { pending_date_request: PENDING } })
    await settleQueries(h.queryClient)
    const reads = sent('GET', ITEM).length
    click('tp-approve')
    await settleQueries(h.queryClient)
    expect(text('tp-error')).toContain('zaten karara bağlanmış')
    expect(sent('GET', ITEM).length).toBeGreaterThan(reads)
  })
})

describe('Koordinatör "Tarih talebi gönder" (aynı DateRequestForm)', () => {
  it('düğme formu panel girdileriyle açar; gönderim tek POST, panel girdisi gönderilir', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/date-change-requests`, () =>
        json({ request_id: 'r1', work_item_id: 'w1', status: 'pending' }, 201),
      ),
    )
    const { h } = render({ who: 'coordinator', face: 'coordinator' })
    await settleQueries(h.queryClient)
    setValue('[data-testid="tp-end"]', '17.11.2026')
    click('tp-request')
    await flushPromises()
    expect(($('input[name="end"]') as HTMLInputElement).value).toBe('17.11.2026')
    $('[data-testid="tp-request-submit"]')!.click()
    await settleQueries(h.queryClient)
    expect(sent('POST', '/v1/date-change-requests')).toHaveLength(1)
    expect(sent('POST', '/v1/date-change-requests')[0]!.body).toMatchObject({
      work_item_id: 'w1',
      new_end_on: '2026-11-17',
    })
    expect(sent('PATCH', ITEM)).toHaveLength(0)
  })
})
