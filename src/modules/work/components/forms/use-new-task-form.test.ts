import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { useToast } from '@/shared/ui'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import { formsHarness, resetForms, type WhoSeed } from './__tests__/forms-harness'
import { useNewTaskForm } from './use-new-task-form'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const COORD: WhoSeed = { rows: [{ departmentId: 'd1', role: 'koordinator' }] }
const ADMIN: WhoSeed = { companyAdmin: true }
const members = [
  { account_id: 'acc-1', full_name: 'Ayşe', membership_id: 'm1', role: 'uye', status: 'active' },
  { account_id: 'acc-2', full_name: 'Bora', membership_id: 'm2', role: 'uye', status: 'active' },
]

function setup(scope = COORD_SCOPE, who: WhoSeed = COORD, departmentId: string | null = 'd1') {
  server.use(http.get(`${ORIGIN}/v1/departments/:id/members`, () => json({ members })))
  const h = formsHarness(scope, who)
  h.departments([
    { id: 'd1', name: 'Yazılım' },
    { id: 'd2', name: 'Elektronik' },
  ])
  const open = ref(true)
  const created = vi.fn()
  const close = vi.fn()
  const r = h.run(() =>
    useNewTaskForm({ open: () => open.value, departmentId: () => departmentId, created, close }),
  )
  return { h, r, open, created, close }
}

async function fill(r: ReturnType<typeof setup>['r'], values: Record<string, unknown> = {}) {
  r.form.setValues({ title: 'Rapor', startOn: '2026-11-10', endOn: '2026-11-12', ...values })
  await nextTick()
}

const toasts = () => useToast().queue.value.map((t) => t.message)
const keys = () => sent('POST', '/v1/work-items').map((q) => q.headers.get('Idempotency-Key'))

describe('useNewTaskForm — açılış', () => {
  it('koordinatörde tek seçenek kendiliğinden seçilir; kanıt bayrağı açık', async () => {
    const { r, h } = setup(COORD_SCOPE, COORD, null)
    await h.flush()
    expect(r.form.values.departmentId).toBe('d1')
    expect(r.form.values.evidence).toBe(true)
    expect(r.departments.canAssignExtra.value).toBe(true)
  })

  it('yöneticide izin dışı önseçim düşer, çok seçenekte sessiz seçim yok (§1)', async () => {
    const { r, h } = setup(ADMIN_SCOPE, ADMIN, 'd9')
    await h.flush()
    expect(r.form.values.departmentId).toBe('')
    expect(sent('GET', '/v1/departments/d9/members')).toHaveLength(0)
  })

  it('departman değişince atanan ve ek atananlar temizlenir; adaylar yeni departmandan', async () => {
    const { r, h } = setup(ADMIN_SCOPE, ADMIN, 'd1')
    await h.flush()
    await fill(r, { assignee: 'acc-1', extra: ['acc-2'] })
    r.form.setFieldValue('departmentId', 'd2')
    await nextTick()
    await h.flush()
    expect(r.form.values.assignee).toBe('')
    expect(r.form.values.extra).toEqual([])
    expect(sent('GET', '/v1/departments/d2/members')).toHaveLength(1)
  })
})

describe('useNewTaskForm — gönderim (K5)', () => {
  it('başarı: S3 seçilen departman, IK, gövde; created + kapanış + bildirim', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () => json(workItem({ work_item_id: 'w9' }), 201)),
    )
    const { r, h, created, close } = setup()
    await h.flush()
    await fill(r, { assignee: 'acc-1' })
    await r.submit()

    const [req] = sent('POST', '/v1/work-items')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(isValidIdempotencyKey(req!.headers.get('Idempotency-Key') ?? '')).toBe(true)
    expect(req!.body).toEqual({
      title: 'Rapor',
      start_on: '2026-11-10',
      end_on: '2026-11-12',
      priority: 'orta',
      completion_evidence_required: true,
      assignee_account_id: 'acc-1',
    })
    expect(created).toHaveBeenCalledWith(expect.objectContaining({ work_item_id: 'w9' }))
    expect(close).toHaveBeenCalledOnce()
    expect(toasts()).toEqual(['Görev oluşturuldu.'])
  })

  it('geçersiz form gönderilmez', async () => {
    const { r, h, created } = setup()
    await h.flush()
    await r.submit()
    expect(sent('POST', '/v1/work-items')).toHaveLength(0)
    expect(r.form.errors.value.title).toBe('Başlık gerekli.')
    expect(created).not.toHaveBeenCalled()
  })

  it('IK gönder başına: 422 alan hatası → düzeltip yeniden gönderme yeni anahtar', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () =>
        ++calls === 1
          ? errorEnvelope('work.input_invalid', 422, [
              { field: 'start_on', code: 'work.input_invalid', message: 'x' },
            ])
          : json(workItem(), 201),
      ),
    )
    const { r, h, created, close } = setup()
    await h.flush()
    await fill(r)
    await r.submit()
    expect(r.form.errors.value.startOn).toBe('Girilen bilgiler geçersiz.')
    expect(close).not.toHaveBeenCalled()

    await fill(r, { startOn: '2026-11-11' })
    await r.submit()
    const [a, b] = keys()
    expect(a).toBeTruthy()
    expect(a).not.toBe(b)
    expect(created).toHaveBeenCalledOnce()
  })

  it('kısmi başarı: görev oluşturuldu, ek atama başarısız → gerçek durum metni', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () =>
        json(workItem({ work_item_id: 'w9', department_id: 'd1' }), 201),
      ),
      http.post(`${ORIGIN}/v1/work-items/w9/assignments`, () =>
        errorEnvelope('work.assignment_duplicate', 409),
      ),
    )
    const { r, h, created } = setup()
    await h.flush()
    await fill(r, { assignee: 'acc-1', extra: ['acc-2'] })
    await r.submit()

    const [assign] = sent('POST', '/v1/work-items/w9/assignments')
    expect(assign!.body).toEqual({ account_ids: ['acc-2'] })
    expect(assign!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(created).toHaveBeenCalledOnce()
    expect(toasts()).toEqual(['Görev oluşturuldu, ek atama yapılamadı.'])
  })

  it('yöneticide (koordinatör değil) ek atama adımı koşmaz', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () => json(workItem({ work_item_id: 'w9' }), 201)),
    )
    const { r, h } = setup(ADMIN_SCOPE, ADMIN, 'd1')
    await h.flush()
    await fill(r, { extra: ['acc-2'] })
    await r.submit()
    expect(sent('POST', '/v1/work-items')).toHaveLength(1)
    expect(sent('POST', '/v1/work-items/w9/assignments')).toHaveLength(0)
  })

  it('sonuç bilinmiyor → bildirim; "Yeniden gönder" aynı anahtar + aynı gövde', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () =>
        ++calls === 1 ? errorEnvelope('platform.internal', 500) : json(workItem(), 200),
      ),
    )
    const { r, h, created } = setup()
    await h.flush()
    await fill(r)
    await r.submit()
    const notice = r.notice.value
    expect(notice?.kind).toBe('unknown_outcome')
    expect(created).not.toHaveBeenCalled()

    if (notice?.kind !== 'unknown_outcome' || !notice.retry) throw new Error('tekrar yok')
    await r.resolved(await notice.retry())
    const [a, b] = sent('POST', '/v1/work-items')
    expect(a!.headers.get('Idempotency-Key')).toBe(b!.headers.get('Idempotency-Key'))
    expect(b!.body).toEqual(a!.body)
    expect(created).toHaveBeenCalledOnce()
    expect(r.notice.value).toBeNull()
  })

  it('sonuç bilinmiyor → "Yeniden gönder" başarı → ek atama adımı koşar (kısmi metin yok)', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () =>
        ++calls === 1
          ? errorEnvelope('platform.internal', 500)
          : json(workItem({ work_item_id: 'w9', department_id: 'd1' }), 200),
      ),
      http.post(`${ORIGIN}/v1/work-items/w9/assignments`, () => json({ added: 1 })),
    )
    const { r, h, created } = setup()
    await h.flush()
    await fill(r, { assignee: 'acc-1', extra: ['acc-2'] })
    await r.submit()
    expect(sent('POST', '/v1/work-items/w9/assignments')).toHaveLength(0)
    const notice = r.notice.value
    if (notice?.kind !== 'unknown_outcome' || !notice.retry) throw new Error('tekrar yok')

    await r.resolved(await notice.retry())
    const [assign] = sent('POST', '/v1/work-items/w9/assignments')
    expect(assign!.body).toEqual({ account_ids: ['acc-2'] })
    expect(assign!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(created).toHaveBeenCalledOnce()
    expect(toasts()).toEqual(['Görev oluşturuldu.'])
  })

  it('CX-F1-E-03 (d): "Yeniden gönder" yanıtı beklerken kapsam A→B → ek atama gönderilmez, kısmi metin', async () => {
    let calls = 0
    let arrive!: () => void
    let release!: () => void
    const arrived = new Promise<void>((r) => (arrive = r))
    const released = new Promise<void>((r) => (release = r))
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, async () => {
        if (++calls === 1) return errorEnvelope('platform.internal', 500)
        arrive()
        await released
        return json(workItem({ work_item_id: 'w9', department_id: 'd1' }), 200)
      }),
      http.post(`${ORIGIN}/v1/work-items/w9/assignments`, () => json({ added: 1 })),
    )
    const { r, h, created } = setup()
    await h.flush()
    await fill(r, { assignee: 'acc-1', extra: ['acc-2'] })
    await r.submit()
    const notice = r.notice.value
    if (notice?.kind !== 'unknown_outcome' || !notice.retry) throw new Error('tekrar yok')

    const retried = notice.retry()
    await arrived
    h.store.commit({ programId: 'p2', lens: 'coordinator', departmentId: 'd3' })
    release()
    await r.resolved(await retried)
    expect(sent('POST', '/v1/work-items')).toHaveLength(2)
    expect(sent('POST', '/v1/work-items/w9/assignments')).toHaveLength(0)
    expect(created).toHaveBeenCalledOnce()
    expect(toasts()).toEqual(['Görev oluşturuldu, ek atama yapılamadı.'])
  })

  it('"Yeniden gönder" başarı + ek atama başarısız → kısmi başarı metni', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () =>
        ++calls === 1
          ? errorEnvelope('platform.internal', 500)
          : json(workItem({ work_item_id: 'w9', department_id: 'd1' }), 200),
      ),
      http.post(`${ORIGIN}/v1/work-items/w9/assignments`, () =>
        errorEnvelope('work.assignee_not_member', 422),
      ),
    )
    const { r, h, created } = setup()
    await h.flush()
    await fill(r, { extra: ['acc-2'] })
    await r.submit()
    const notice = r.notice.value
    if (notice?.kind !== 'unknown_outcome' || !notice.retry) throw new Error('tekrar yok')
    await r.resolved(await notice.retry())
    expect(created).toHaveBeenCalledOnce()
    expect(toasts()).toEqual(['Görev oluşturuldu, ek atama yapılamadı.'])
  })

  it('alanla eşlenmeyen hata ortak bildirime (sunucu message değil, kod metni)', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items`, () => errorEnvelope('work.not_authorized', 403)),
    )
    const { r, h, close } = setup()
    await h.flush()
    await fill(r)
    await r.submit()
    expect(toasts()).toEqual(['Bu işlem için yetkiniz yok.'])
    expect(close).not.toHaveBeenCalled()
  })
})
