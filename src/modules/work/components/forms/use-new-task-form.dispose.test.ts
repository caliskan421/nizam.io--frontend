// CX-F1-Ö-07: oluşturma yanıtı beklerken form sökülür (geciktirilmiş yanıt). Politika: tam başarı
// ve hata sessiz (bildirim, `created`, `close` yok); KISMİ sonuç (görev oluşturuldu, ek atama
// yapılamadı) uygulama düzeyinde bildirilir — kullanıcı bunu başka ekrandan öğrenemez.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h as render, nextTick } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { useToast } from '@/shared/ui'

import {
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
const members = [
  { account_id: 'acc-1', full_name: 'Ayşe', membership_id: 'm1', role: 'uye', status: 'active' },
  { account_id: 'acc-2', full_name: 'Bora', membership_id: 'm2', role: 'uye', status: 'active' },
]
const toasts = () => useToast().queue.value.map((t) => t.message)

/** Oluşturma ucu yanıtı elle salınır. */
function heldCreate(respond: () => Response) {
  let release!: () => void
  const held = new Promise<void>((resolve) => (release = resolve))
  let arrived!: () => void
  const reached = new Promise<void>((resolve) => (arrived = resolve))
  server.use(
    http.post(`${ORIGIN}/v1/work-items`, async () => {
      arrived()
      await held
      return respond()
    }),
  )
  return { reached, release }
}

async function mountForm() {
  server.use(http.get(`${ORIGIN}/v1/departments/:id/members`, () => json({ members })))
  const h = formsHarness(COORD_SCOPE, COORD)
  h.departments([{ id: 'd1', name: 'Yazılım' }])
  const created = vi.fn()
  const close = vi.fn()
  let form!: ReturnType<typeof useNewTaskForm>
  const wrapper = h.mount(
    defineComponent({
      setup() {
        form = useNewTaskForm({ open: () => true, departmentId: () => 'd1', created, close })
        return () => render('div')
      },
    }),
    {},
  )
  await settleQueries(h.queryClient)
  return { h, form, wrapper, created, close }
}

async function submitThenUnmount(
  ctx: Awaited<ReturnType<typeof mountForm>>,
  gate: ReturnType<typeof heldCreate>,
  extra: string[],
) {
  ctx.form.form.setValues({
    title: 'Rapor',
    startOn: '2026-11-10',
    endOn: '2026-11-12',
    assignee: 'acc-1',
    extra,
  })
  await nextTick()
  const pending = ctx.form.submit()
  await gate.reached
  ctx.wrapper.unmount()
  gate.release()
  await pending
  await settleQueries(ctx.h.queryClient)
}

describe('useNewTaskForm — form beklerken söküldü (CX-F1-Ö-07)', () => {
  it('tam başarı: bildirim yok, created/close çağrılmaz', async () => {
    const gate = heldCreate(() => json(workItem({ work_item_id: 'w9', department_id: 'd1' }), 201))
    const ctx = await mountForm()
    await submitThenUnmount(ctx, gate, [])
    expect(sent('POST', '/v1/work-items')).toHaveLength(1)
    expect(toasts()).toEqual([])
    expect(ctx.created).not.toHaveBeenCalled()
    expect(ctx.close).not.toHaveBeenCalled()
  })

  it('hata: bildirim yok', async () => {
    const gate = heldCreate(() => errorEnvelope('platform.internal', 503))
    const ctx = await mountForm()
    await submitThenUnmount(ctx, gate, [])
    expect(toasts()).toEqual([])
  })

  it('kısmi (bilinçli istisna): ek atama gönderilmez, "oluşturuldu, ek atama yapılamadı" uygulama düzeyinde', async () => {
    const gate = heldCreate(() => json(workItem({ work_item_id: 'w9', department_id: 'd1' }), 201))
    server.use(http.post(`${ORIGIN}/v1/work-items/w9/assignments`, () => json({}, 201)))
    const ctx = await mountForm()
    await submitThenUnmount(ctx, gate, ['acc-2'])
    expect(sent('POST', '/v1/work-items/w9/assignments')).toHaveLength(0)
    expect(toasts()).toEqual(['Görev oluşturuldu, ek atama yapılamadı.'])
    expect(ctx.created).not.toHaveBeenCalled()
    expect(ctx.close).not.toHaveBeenCalled()
  })
})
