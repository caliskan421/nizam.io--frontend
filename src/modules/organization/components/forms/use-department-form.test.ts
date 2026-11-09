// Koordinatörlük formu yaşamı (`use-department-form.ts` + `form-kit.ts` `useFormDialog`):
// kapsam değişince açık pencere kapanır; sökülmüş bileşen geç yanıtta bildirim/emit yapmaz ve
// ardıl adım (bağ) gönderilmez (KESİN 20).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { ADMIN_SCOPE, http, json, ORIGIN, sent, server } from '../../__tests__/harness'
import { click, formsHarness, resetForms, setValue, toasts } from './__tests__/harness'
import DepartmentForm from './DepartmentForm.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

function gatedCreate() {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  server.use(
    http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: [] })),
    http.post(`${ORIGIN}/v1/departments`, async () => {
      await gate
      return json({ department_id: 'dn', name: 'Yazılım', kind: 'koordinatorluk' }, 201)
    }),
    http.post(`${ORIGIN}/v1/program/departments`, () =>
      json(
        { department_id: 'dn', display_name: 'Yazılım', program_id: 'p1', copied_member_count: 0 },
        201,
      ),
    ),
  )
  return () => release()
}

async function submitting() {
  const h = formsHarness(ADMIN_SCOPE)
  h.departments([])
  const wrapper = h.mount(DepartmentForm, { open: true })
  await h.flush()
  setValue('[name="name"]', 'Yazılım')
  await nextTick()
  click('[data-testid="of-submit"]')
  await vi.waitFor(() => expect(sent('POST', '/v1/departments')).toHaveLength(1))
  return { h, wrapper }
}

describe('DepartmentForm yaşamı', () => {
  it('kapsam (program) değişince açık pencere kapanır; ardıl bağ adımı eski bağlamla gönderilmez', async () => {
    const release = gatedCreate()
    const { h, wrapper } = await submitting()
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    await nextTick()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    await wrapper.setProps({ open: false })
    release()
    await h.flush()
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['dn']]))
    expect(sent('POST', '/v1/program/departments')).toHaveLength(0)
    expect(toasts()).toContain(
      'Departman kataloğa eklendi ancak programa bağlanamadı. Programa eklemeyi yeniden deneyin.',
    )
  })

  it('sökülmüş bileşen: bağ adımı gönderilmez; kısmi sonuç yalnız uygulama düzeyinde (W82c)', async () => {
    const release = gatedCreate()
    const { h, wrapper } = await submitting()
    wrapper.unmount()
    release()
    await h.flush()
    // Katalog kaydı gerçek, bağ yok: tek uygulama düzeyi bildirim (pushAppNotice); emit yok.
    expect(toasts()).toEqual([
      'Departman kataloğa eklendi ancak programa bağlanamadı. Programa eklemeyi yeniden deneyin.',
    ])
    expect(wrapper.emitted('saved')).toBeUndefined()
    expect(sent('POST', '/v1/program/departments')).toHaveLength(0)
  })
})
