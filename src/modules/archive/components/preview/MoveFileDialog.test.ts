import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import {
  ADMIN,
  COORD,
  errorEnvelope,
  fileRecord,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import { file, mountWith, target } from './__tests__/support'
import MoveFileDialog from './MoveFileDialog.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  useToast().clear()
  resetHarness()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
enableAutoUnmount(afterEach)

const PATH = `${ORIGIN}/v1/files/f1/work-item`
const el = <T extends Element>(id: string) =>
  document.body.querySelector<T>(`[data-testid="${id}"]`)
const text = () => document.body.textContent ?? ''
const toasts = () => useToast().queue.value.map((t) => t.message)

// Yönetici: program geneli görev listesi (başka departman d9 dahil; kaynak dosya d1'de).
const TASKS = {
  tasks: [
    { department_id: 'd1', file_count: 1, title: 'Kaynak görev', work_item_id: 'w1' },
    { department_id: 'd9', file_count: 0, title: 'Hedef görev', work_item_id: 'w-target' },
    { department_id: 'd9', file_count: 0, title: 'Diğer görev', work_item_id: 'w-other' },
  ],
}
function serve(over: { tasks?: object; subtasks?: object } = {}) {
  server.use(
    http.get(`${ORIGIN}/v1/program/archive/tasks`, () => json(over.tasks ?? TASKS)),
    http.get(`${ORIGIN}/v1/work-items/w-target/subtasks`, () =>
      json(over.subtasks ?? { subtasks: [{ subtask_id: 's-1', title: 'Alt', done: false }] }),
    ),
  )
}

function open(props: Record<string, unknown> = {}) {
  const emitted: Record<string, unknown[]> = { moved: [], moving: [], 'update:open': [] }
  const mounted = mountWith(
    MoveFileDialog,
    {
      open: true,
      file: file(),
      target,
      onMoved: (id: string) => emitted.moved!.push(id),
      onMoving: (v: boolean) => emitted.moving!.push(v),
      'onUpdate:open': (v: boolean) => emitted['update:open']!.push(v),
      ...props,
    },
    { selection: ADMIN, standing: { companyAdmin: true } },
  )
  return { ...mounted, emitted }
}

async function pick(h: ReturnType<typeof open>['h'], id: string, value: string) {
  const select = el<HTMLSelectElement>(id)!
  select.value = value
  select.dispatchEvent(new Event('change'))
  await settleQueries(h.queryClient)
  await nextTick()
}

describe('MoveFileDialog (E-06-59)', () => {
  it('yönetici başka departmandaki hedefi seçer; başlıklar KAYNAK dosyanın departmanıdır, gövde hedef görevdir', async () => {
    serve()
    server.use(http.patch(PATH, () => json({ ...fileRecord, work_item_id: 'w-target' })))
    const { h, emitted } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    await pick(h, 'move-subtask', 's-1')
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    const [req] = sent('PATCH', '/v1/files/f1/work-item')
    expect(req!.body).toEqual({ work_item_id: 'w-target', subtask_id: 's-1' })
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(emitted.moved).toEqual(['f1'])
    expect(emitted['update:open']).toEqual([false])
    expect(toasts()).toEqual(['Dosya “Hedef görev” görevine taşındı.'])
    // Hedef departman seçmek global kapsamı değiştirmedi.
    expect(h.store.snapshot).toMatchObject({ programId: 'p1', departmentId: null })
  })

  it('hedef görev değişince alt görev sıfırlanır; alt görev yalnız seçilen görevden okunur', async () => {
    serve()
    const { h } = open()
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/work-items/w1/subtasks')).toHaveLength(0)
    await pick(h, 'move-task', 'w-target')
    await pick(h, 'move-subtask', 's-1')
    expect(el<HTMLSelectElement>('move-subtask')!.value).toBe('s-1')
    await pick(h, 'move-task', 'w-other')
    expect(el<HTMLSelectElement>('move-task')!.value).toBe('w-other')
    expect(el<HTMLSelectElement>('move-subtask')!.value).toBe('')
  })

  it('dosyanın kendi görevi aday değildir; yalnız o varsa açıklamalı boş durum, gönderim kapalı, PATCH yok', async () => {
    serve({ tasks: { tasks: [TASKS.tasks[0]] } })
    const { h } = open()
    await settleQueries(h.queryClient)
    expect(
      [...document.body.querySelectorAll('[data-testid="move-task"] option')].map((o) =>
        o.getAttribute('value'),
      ),
    ).not.toContain('w1')
    expect(text()).toContain('Dosyayı taşıyabileceğiniz başka görev yok.')
    expect(el<HTMLSelectElement>('move-task')!.disabled).toBe(true)
    expect(el<HTMLButtonElement>('move-submit')!.disabled).toBe(true)
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    expect(sent('PATCH', '/v1/files/f1/work-item')).toHaveLength(0)
  })

  it('dosya değişince pencere kapanır (kaynak görev değişimi seçimi taşımaz)', async () => {
    serve()
    const { h, wrapper, emitted } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    await wrapper.setProps({ file: file({ file_id: 'f2', work_item_id: 'w-target' }) })
    await nextTick()
    expect(emitted['update:open']).toContain(false)
  })

  it('hedef seçilmeden gönderim istek atmaz ve alan hatası gösterir', async () => {
    serve()
    const { h } = open()
    await settleQueries(h.queryClient)
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    expect(sent('PATCH', '/v1/files/f1/work-item')).toHaveLength(0)
    expect(text()).toContain('Hedef görev seçin.')
  })

  it('gerçek (numaralanmış) ad bildirimi: dönen kayıt farklı ad taşırsa o gösterilir', async () => {
    serve()
    server.use(http.patch(PATH, () => json({ ...fileRecord, display_name: 'rapor (2).pdf' })))
    const { h } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    expect(toasts()).toEqual(['Dosya “Hedef görev” görevine “rapor (2).pdf” adıyla taşındı.'])
  })

  it('409 source_completed: pencere açık kalır, sunucu metni yok, istek bir kez', async () => {
    serve()
    server.use(http.patch(PATH, () => errorEnvelope('records.source_completed', 409)))
    const { h, emitted } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    expect(sent('PATCH', '/v1/files/f1/work-item')).toHaveLength(1)
    expect(el('move-error')!.textContent).toContain('Görev tamamlandığı için dosya başka göreve')
    expect(emitted.moved).toEqual([])
    expect(toasts()).toEqual([])
  })

  it('422 work_item_id (hedef görünmüyor): hedef alanı hata verir ve seçim sıfırlanır', async () => {
    serve()
    server.use(
      http.patch(PATH, () =>
        json(
          {
            code: 'records.input_invalid',
            message: 'x',
            request_id: 'r1',
            fields: [{ field: 'work_item_id', code: 'records.input_invalid' }],
          },
          422,
        ),
      ),
    )
    const { h } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    expect(text()).toContain('Hedef görev artık seçilemiyor')
    expect(el<HTMLSelectElement>('move-task')!.value).toBe('')
  })

  it('422 too_many_files: hedef alanında genel sınır hatası (istemci sayı uydurmaz)', async () => {
    serve()
    server.use(http.patch(PATH, () => errorEnvelope('records.too_many_files', 422)))
    const { h } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    expect(text()).toContain('Dosya sayısı sınırına ulaşıldı.')
    expect(text()).not.toMatch(/\b100\b/)
  })

  it('sonuç bilinmiyor: kör tekrar yok (tek PATCH), uyarı gösterilir, başarı bildirimi yok', async () => {
    serve()
    server.use(http.patch(PATH, () => errorEnvelope('platform.internal', 503)))
    const { h, emitted } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    expect(sent('PATCH', '/v1/files/f1/work-item')).toHaveLength(1)
    expect(emitted.moved).toEqual([])
    expect(toasts()).toEqual([])
  })

  it('istek sürerken moving=true yayılır, teslimden sonra false; kapanış engellenir', async () => {
    serve()
    server.use(http.patch(PATH, () => json(fileRecord)))
    const { h, emitted } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    el<HTMLButtonElement>('move-submit')!.click()
    await nextTick()
    expect(el<HTMLButtonElement>('move-cancel')!.disabled).toBe(true)
    await settleQueries(h.queryClient)
    expect(emitted.moving).toEqual([true, false])
    expect(emitted.moved).toEqual(['f1'])
  })

  it('kapsam değişince pencere kapanır; geç sonuç bildirim/taşındı olayı üretmez', async () => {
    serve()
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.patch(PATH, async () => {
        await gate
        return json(fileRecord)
      }),
    )
    const { h, emitted } = open()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-target')
    el<HTMLButtonElement>('move-submit')!.click()
    await nextTick()
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await nextTick()
    release()
    await settleQueries(h.queryClient)
    expect(emitted['update:open']).toContain(false)
    expect(emitted.moved).toEqual([])
    expect(toasts()).toEqual([])
  })

  it('koordinatör: hedef adayları yalnız seçili kapsamın görevleri (S3), yükleme yetkisiyle', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/records/archive/tasks`, () =>
        json({
          tasks: [
            { department_id: 'd1', file_count: 0, title: 'Kendi görev', work_item_id: 'w-own' },
            { department_id: 'd2', file_count: 0, title: 'Yetkisiz', work_item_id: 'w-other' },
          ],
        }),
      ),
    )
    const { h } = mountWith(
      MoveFileDialog,
      { open: true, file: file(), target },
      {
        selection: COORD,
        standing: { rows: [{ departmentId: 'd1', role: 'koordinator' }] },
      },
    )
    await settleQueries(h.queryClient)
    const labels = [...document.body.querySelectorAll('[data-testid="move-task"] option')].map(
      (o) => o.textContent,
    )
    expect(labels).toContain('Kendi görev')
    expect(labels).not.toContain('Yetkisiz')
    expect(sent('GET', '/v1/program/archive/tasks')).toHaveLength(0)
  })
})

// Koordinatör iki departmanda (d1 + d2) çalışır; global kapsam d1. Dosya d1'de.
const MULTI = {
  rows: [
    { departmentId: 'd1', role: 'koordinator' as const, name: 'Mekanik' },
    { departmentId: 'd2', role: 'koordinator' as const, name: 'Yazılım' },
    { departmentId: 'd3', role: 'koordinator' as const, name: 'Fuar', programId: 'p2' },
  ],
}
const task = (id: string, department: string, title: string) => ({
  department_id: department,
  file_count: 0,
  title,
  work_item_id: id,
})
function serveS3() {
  server.use(
    http.get(`${ORIGIN}/v1/records/archive/tasks`, ({ request }) => {
      const dept = request.headers.get('X-Nizamio-Department')
      if (dept === 'd1') return json({ tasks: [task('w-d1', 'd1', 'Mekanik görevi')] })
      if (dept === 'd2') return json({ tasks: [task('w-d2', 'd2', 'Yazılım görevi')] })
      return json(
        { code: 'records.not_authorized', message: 'x', request_id: 'r', fields: [] },
        403,
      )
    }),
    http.get(`${ORIGIN}/v1/work-items/w-d2/subtasks`, () =>
      json({ subtasks: [{ subtask_id: 's-d2', title: 'Alt', done: false }] }),
    ),
  )
}
const labels = (id: string) =>
  [...document.body.querySelectorAll(`[data-testid="${id}"] option`)].map((o) => o.textContent)
function mountMulti(props: Record<string, unknown> = {}) {
  const emitted: unknown[] = []
  const mounted = mountWith(
    MoveFileDialog,
    { open: true, file: file(), target, onMoved: (id: string) => emitted.push(id), ...props },
    { selection: COORD, standing: MULTI },
  )
  return { ...mounted, emitted }
}

describe('MoveFileDialog: yetkili birden çok departman (koordinatör d1 + d2)', () => {
  it('yalnız yetkili departmanlar listelenir (başka program yok); varsayılan kaynak departman; yalnız o departman okunur', async () => {
    serveS3()
    const { h } = mountMulti()
    await settleQueries(h.queryClient)
    expect(labels('move-department')).toEqual(['Mekanik', 'Yazılım'])
    expect(el<HTMLSelectElement>('move-department')!.value).toBe('d1')
    expect(labels('move-task')).toContain('Mekanik görevi')
    const reads = sent('GET', '/v1/records/archive/tasks')
    expect(reads.map((r) => r.headers.get('X-Nizamio-Department'))).toEqual(['d1'])
    expect(sent('GET', '/v1/program/archive/tasks')).toHaveLength(0)
  })

  it('başka departmana geçince görev/alt görev sıfırlanır; kaynak başlığı d1, gövde hedef görev; global kapsam d1 kalır', async () => {
    serveS3()
    server.use(http.patch(PATH, () => json({ ...fileRecord, work_item_id: 'w-d2' })))
    const { h, emitted } = mountMulti()
    await settleQueries(h.queryClient)
    await pick(h, 'move-task', 'w-d1')
    await pick(h, 'move-department', 'd2')
    expect(el<HTMLSelectElement>('move-task')!.value).toBe('')
    expect(labels('move-task')).toContain('Yazılım görevi')
    expect(labels('move-task')).not.toContain('Mekanik görevi')
    await pick(h, 'move-task', 'w-d2')
    await pick(h, 'move-subtask', 's-d2')
    expect(
      sent('GET', '/v1/work-items/w-d2/subtasks')[0]!.headers.get('X-Nizamio-Department'),
    ).toBe('d2')
    el<HTMLButtonElement>('move-submit')!.click()
    await settleQueries(h.queryClient)
    const [req] = sent('PATCH', '/v1/files/f1/work-item')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(req!.body).toEqual({ work_item_id: 'w-d2', subtask_id: 's-d2' })
    expect(emitted).toEqual(['f1'])
    expect(h.store.snapshot).toMatchObject({ programId: 'p1', departmentId: 'd1' })
    // Hedef departman seçimi yalnız d1 ve d2 okumasına yol açtı; yetkisiz d3 için istek yok.
    const depts = sent('GET', '/v1/records/archive/tasks').map((r) =>
      r.headers.get('X-Nizamio-Department'),
    )
    expect(new Set(depts)).toEqual(new Set(['d1', 'd2']))
  })

  it('yetkisiz departman (d3) seçenek değildir; zorla seçilse de istek atılmaz', async () => {
    serveS3()
    const { h } = mountMulti()
    await settleQueries(h.queryClient)
    expect(labels('move-department')).not.toContain('Fuar')
    await pick(h, 'move-department', 'd3')
    await settleQueries(h.queryClient)
    expect(
      sent('GET', '/v1/records/archive/tasks').filter(
        (r) => r.headers.get('X-Nizamio-Department') === 'd3',
      ),
    ).toHaveLength(0)
    expect(sent('PATCH', '/v1/files/f1/work-item')).toHaveLength(0)
  })

  it('yetkili tek departmanda departman seçimi çizilmez', async () => {
    serveS3()
    const { h } = mountWith(
      MoveFileDialog,
      { open: true, file: file(), target },
      { selection: COORD, standing: { rows: [{ departmentId: 'd1', role: 'koordinator' }] } },
    )
    await settleQueries(h.queryClient)
    expect(el('move-department')).toBeNull()
    expect(labels('move-task')).toContain('Mekanik görevi')
  })

  it('kapsam değişince pencere kapanır; uçuştaki taşıma geç sonucu bildirim üretmez', async () => {
    serveS3()
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.patch(PATH, async () => {
        await gate
        return json(fileRecord)
      }),
    )
    const { h, emitted } = mountMulti()
    await settleQueries(h.queryClient)
    await pick(h, 'move-department', 'd2')
    await pick(h, 'move-task', 'w-d2')
    el<HTMLButtonElement>('move-submit')!.click()
    await nextTick()
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await nextTick()
    release()
    await settleQueries(h.queryClient)
    expect(emitted).toEqual([])
    expect(toasts()).toEqual([])
  })
})
