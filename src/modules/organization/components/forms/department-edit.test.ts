// DepartmentForm düzenleme kipi (E-08-63 Ayarlar, E-08-70 "Düzenle"; `department-edit.ts`).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  sent,
  server,
} from '../../__tests__/harness'
import { $, click, formsHarness, resetForms, setValue, toasts } from './__tests__/harness'
import DepartmentForm from './DepartmentForm.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const LINKS = `${ORIGIN}/v1/program/departments`
const LINK = `${ORIGIN}/v1/program/departments/:departmentId`
const CATALOG = `${ORIGIN}/v1/departments`
const ENTRY = `${ORIGIN}/v1/departments/:id`

const RECORD = {
  department_id: 'd1',
  name: 'Yazılım',
  kind: 'koordinatorluk',
  code: 'YZ',
  description: 'Gömülü yazılım',
}

function readHandlers(
  linked = [{ department_id: 'd1', display_name: 'Yazılım 2026', code: 'YZ' }],
) {
  server.use(
    http.get(LINKS, () => json({ departments: linked })),
    http.get(CATALOG, () => json({ departments: [RECORD] })),
  )
}

async function openForm() {
  const h = formsHarness(ADMIN_SCOPE)
  h.departments([{ id: 'd1', name: 'Eski ad' }])
  const wrapper = h.mount(DepartmentForm, { open: true, departmentId: 'd1' })
  await vi.waitFor(() => expect($('[name="displayName"]')).not.toBeNull())
  await h.flush()
  return { h, wrapper }
}

describe('DepartmentForm — düzenleme (E-08-63, E-08-70)', () => {
  it('açılışta taze okuma (bağ + katalog); değerler dolu; "tüm sezonlarda geçerli" uyarısı', async () => {
    readHandlers()
    await openForm()
    expect(sent('GET', '/v1/program/departments')).toHaveLength(1)
    expect(sent('GET', '/v1/departments')).toHaveLength(1)
    expect(($('[name="displayName"]') as HTMLInputElement).value).toBe('Yazılım 2026')
    expect(($('[name="code"]') as HTMLInputElement).value).toBe('YZ')
    expect(($('[name="kind"]') as HTMLSelectElement).value).toBe('koordinatorluk')
    expect(($('[name="description"]') as HTMLTextAreaElement).value).toBe('Gömülü yazılım')
    expect($('[data-testid="of-catalog-warning"]')?.textContent).toContain(
      'Bu değişiklik tüm sezonlarda geçerlidir.',
    )
  })

  it('yalnız ad değişti → yalnız renameDepartmentLink (program başlığı); saved + kapanış', async () => {
    readHandlers()
    server.use(
      http.patch(LINK, () =>
        json({
          department_id: 'd1',
          display_name: 'Yeni',
          program_id: 'p1',
          copied_member_count: 0,
        }),
      ),
    )
    const { wrapper } = await openForm()
    setValue('[name="displayName"]', 'Yeni')
    await nextTick()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['d1']]))
    const [req] = sent('PATCH', '/v1/program/departments/d1')
    await vi.waitFor(() => expect(req!.body).toBeDefined())
    expect(req!.body).toEqual({ display_name: 'Yeni' })
    expect(req!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(sent('PATCH', '/v1/departments/d1')).toHaveLength(0)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(toasts()).toContain('Programdaki ad güncellendi.')
  })

  it('iki uç ayrı sonuç: ad ok, katalog 409 kod çakışması → kod alanında; yeniden gönderim yalnız kataloğu yollar', async () => {
    readHandlers()
    let catalogCalls = 0
    server.use(
      http.patch(LINK, () =>
        json({
          department_id: 'd1',
          display_name: 'Yeni',
          program_id: 'p1',
          copied_member_count: 0,
        }),
      ),
      http.patch(ENTRY, () =>
        ++catalogCalls === 1
          ? errorEnvelope('organization.department_code_conflict', 409)
          : json({ ...RECORD, code: 'YZ9' }),
      ),
    )
    const { wrapper } = await openForm()
    setValue('[name="displayName"]', 'Yeni')
    setValue('[name="code"]', 'yz2')
    await nextTick()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[data-testid="of-edit-results"]')).not.toBeNull())
    expect($('[data-result="rename:true"]')?.textContent).toContain('Programdaki ad güncellendi.')
    expect($('[data-result="catalog:false"]')?.textContent).toContain(
      'Katalog bilgileri güncellenemedi.',
    )
    expect($('[name="code"]')?.getAttribute('aria-invalid')).toBe('true')
    expect(wrapper.emitted('saved')).toEqual([['d1']])
    expect(wrapper.emitted('update:open')).toBeUndefined()
    const [first] = sent('PATCH', '/v1/departments/d1')
    await vi.waitFor(() => expect(first!.body).toBeDefined())
    expect(first!.body).toEqual({ code: 'YZ2' })

    setValue('[name="code"]', 'YZ9')
    await nextTick()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
    expect(sent('PATCH', '/v1/program/departments/d1')).toHaveLength(1)
    expect(sent('PATCH', '/v1/departments/d1')).toHaveLength(2)
  })

  it('409 program.department_link_name_exists → programdaki ad alanında', async () => {
    readHandlers()
    server.use(http.patch(LINK, () => errorEnvelope('program.department_link_name_exists', 409)))
    await openForm()
    setValue('[name="displayName"]', 'Elektronik')
    await nextTick()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        'Bu programda aynı adla bir departman zaten var.',
      ),
    )
    expect($('[name="displayName"]')?.getAttribute('aria-invalid')).toBe('true')
  })

  it('mevcut kod boşaltılamaz; değişiklik yoksa istek yok', async () => {
    readHandlers()
    const { wrapper } = await openForm()
    setValue('[name="code"]', '')
    await nextTick()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Mevcut kod boşaltılamaz.'))
    setValue('[name="code"]', 'YZ')
    await nextTick()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
    expect(toasts()).toContain('Değişiklik yok.')
    expect(sent('PATCH', '/v1/program/departments/d1')).toHaveLength(0)
    expect(sent('PATCH', '/v1/departments/d1')).toHaveLength(0)
  })

  it('birim seçili programda yoksa açıklama; gönder düğmesi yok', async () => {
    readHandlers([])
    const h = formsHarness(ADMIN_SCOPE)
    h.mount(DepartmentForm, { open: true, departmentId: 'd1' })
    await vi.waitFor(() => expect($('[data-testid="of-edit-missing"]')).not.toBeNull())
    expect($('[data-testid="of-submit"]')).toBeNull()
  })
})
