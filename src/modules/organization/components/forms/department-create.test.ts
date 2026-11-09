// DepartmentForm oluşturma kipi (E-08-05; `department-create.ts` + `department-link.ts`).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  http,
  HttpResponse,
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

const CATALOG = `${ORIGIN}/v1/departments`
const LINKS = `${ORIGIN}/v1/program/departments`
const DELETED = `${ORIGIN}/v1/admin/deleted/departments`

const created = (id = 'dn', name = 'Yazılım') => ({
  department_id: id,
  name,
  kind: 'koordinatorluk',
})
const linkResult = (id = 'dn', name = 'Yazılım') => ({
  department_id: id,
  display_name: name,
  program_id: 'p1',
  copied_member_count: 0,
})

async function openForm(linked: ReadonlyArray<{ id: string; name: string }> = []) {
  server.use(
    http.get(LINKS, () =>
      json({ departments: linked.map((d) => ({ department_id: d.id, display_name: d.name })) }),
    ),
  )
  const h = formsHarness(ADMIN_SCOPE)
  h.departments(linked)
  const wrapper = h.mount(DepartmentForm, { open: true, departmentId: null })
  await h.flush()
  return { h, wrapper }
}

async function fill(name = 'Yazılım', code = '') {
  setValue('[name="name"]', name)
  setValue('[name="code"]', code)
  await nextTick()
}

describe('DepartmentForm — yeni koordinatörlük (E-08-05)', () => {
  it('alanlar: ad, tür (varsayılan koordinatörlük), kod, açıklama', async () => {
    await openForm()
    for (const name of ['name', 'kind', 'code', 'description']) {
      expect($(`[name="${name}"]`), name).not.toBeNull()
    }
    expect(($('[name="kind"]') as HTMLSelectElement).value).toBe('koordinatorluk')
  })

  it('Türkçe harfli kod istemcide reddedilir; ad zorunlu; istek yok', async () => {
    await openForm()
    await fill('', 'ŞB1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        'Kod yalnız A–Z ve 0–9 içeren 2–10 karakter olmalı.',
      ),
    )
    expect(document.body.textContent).toContain('Ad gerekli.')
    await fill('Yazılım', 'ıb')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[name="code"]')?.getAttribute('aria-invalid')).toBe('true'))
    expect(sent('POST', '/v1/departments')).toHaveLength(0)
  })

  it('oluştur → bağla: kod büyük harf, bağ program başlığıyla; saved + kapanış; anahtarsız', async () => {
    server.use(
      http.post(CATALOG, () => json(created(), 201)),
      http.post(LINKS, () => json(linkResult(), 201)),
    )
    const { wrapper } = await openForm()
    await fill('Yazılım', 'yz1')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['dn']]))
    const [create] = sent('POST', '/v1/departments')
    const [link] = sent('POST', '/v1/program/departments')
    await vi.waitFor(() => expect(link!.body).toBeDefined())
    expect(create!.body).toEqual({ name: 'Yazılım', kind: 'koordinatorluk', code: 'YZ1' })
    expect(create!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(link!.body).toEqual({ department_id: 'dn' })
    expect(link!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(create!.headers.get('Idempotency-Key')).toBeNull()
    expect(link!.headers.get('Idempotency-Key')).toBeNull()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(toasts()).toContain('Koordinatörlük oluşturuldu ve programa eklendi.')
  })

  it('adım 1 ok / adım 2 hata → kısmi başarı metni, saved; "Bu programa ekle" ad ile yeniden', async () => {
    let linkCalls = 0
    server.use(
      http.post(CATALOG, () => json(created(), 201)),
      http.post(LINKS, () =>
        ++linkCalls === 1
          ? errorEnvelope('program.department_link_name_exists', 409)
          : json(linkResult('dn', 'Yazılım 2'), 201),
      ),
    )
    const { wrapper } = await openForm()
    await fill()
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[data-testid="of-partial"]')).not.toBeNull())
    expect($('[data-testid="of-partial"]')?.textContent).toContain(
      'Departman kataloğa eklendi ancak programa bağlanamadı.',
    )
    expect(wrapper.emitted('saved')).toEqual([['dn']])
    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect($('[data-testid="of-submit"]')).toBeNull()
    expect(($('[name="name"]') as HTMLInputElement).disabled).toBe(true)

    setValue('[name="linkDisplayName"]', 'Yazılım 2')
    await nextTick()
    click('[data-testid="of-link-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
    expect(sent('POST', '/v1/departments')).toHaveLength(1)
    const links = sent('POST', '/v1/program/departments')
    expect(links).toHaveLength(2)
    await vi.waitFor(() => expect(links[1]!.body).toBeDefined())
    expect(links[1]!.body).toEqual({ department_id: 'dn', display_name: 'Yazılım 2' })
  })

  it('409 department_code_conflict → kod alanında', async () => {
    server.use(
      http.post(CATALOG, () => errorEnvelope('organization.department_code_conflict', 409)),
    )
    await openForm()
    await fill('Yazılım', 'YZ')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(
        'Bu departman kodu başka bir departmanda kullanılıyor.',
      ),
    )
    expect($('[name="code"]')?.getAttribute('aria-invalid')).toBe('true')
    expect(sent('POST', '/v1/program/departments')).toHaveLength(0)
  })

  it('409 department_exists → katalogda tr-katlamalı eşleşme → "Bu programa ekle" mevcut kimlikle', async () => {
    server.use(
      http.post(CATALOG, () => errorEnvelope('organization.department_exists', 409)),
      http.get(CATALOG, () =>
        json({
          departments: [{ department_id: 'd-old', name: 'YAZILIM', kind: 'koordinatorluk' }],
        }),
      ),
      http.get(DELETED, () => json({ departments: [], next_cursor: '' })),
      http.post(LINKS, () => json(linkResult('d-old', 'YAZILIM'), 201)),
    )
    const { wrapper } = await openForm()
    await fill('yazılım')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect($('[data-testid="of-exists"]')?.textContent).toContain(
        'Mevcut "YAZILIM" departmanını bu programa ekleyebilirsiniz.',
      ),
    )
    click('[data-testid="of-link-submit"]')
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toEqual([['d-old']]))
    const [link] = sent('POST', '/v1/program/departments')
    await vi.waitFor(() => expect(link!.body).toBeDefined())
    expect(link!.body).toEqual({ department_id: 'd-old' })
    expect(sent('POST', '/v1/departments')).toHaveLength(1)
  })

  it('department_exists: bu programda zaten varsa bilgi; silinmişse geri yükleme notu; bağ düğmesi yok', async () => {
    server.use(
      http.post(CATALOG, () => errorEnvelope('organization.department_exists', 409)),
      http.get(CATALOG, () =>
        json({ departments: [{ department_id: 'd1', name: 'Yazılım', kind: 'koordinatorluk' }] }),
      ),
      http.get(DELETED, () =>
        json({
          departments: [
            { department_id: 'dx', name: 'Mekanik', kind: 'koordinatorluk', deleted_at: '' },
          ],
          next_cursor: '',
        }),
      ),
    )
    await openForm([{ id: 'd1', name: 'Yazılım (2026)' }])
    await fill('Yazılım')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect($('[data-testid="of-exists"]')?.textContent).toContain(
        '"Yazılım (2026)" bu programda zaten var.',
      ),
    )
    expect($('[data-testid="of-link"]')).toBeNull()

    await fill('Mekanik')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() =>
      expect($('[data-testid="of-exists"]')?.textContent).toContain(
        '"Mekanik" silinmiş bir departman; önce geri yüklenmesi gerekir.',
      ),
    )
    expect($('[data-testid="of-link"]')).toBeNull()
  })

  it('sonuç bilinmiyor → kör tekrar yok; bağ adımı gönderilmez; çift tık tek istek', async () => {
    server.use(http.post(CATALOG, () => HttpResponse.error()))
    await openForm()
    await fill()
    click('[data-testid="of-submit"]')
    click('[data-testid="of-submit"]')
    await vi.waitFor(() => expect($('[data-testid="outcome-notice"]')).not.toBeNull())
    expect($('[data-testid="outcome-retry"]')).toBeNull()
    expect(sent('POST', '/v1/departments')).toHaveLength(1)
    expect(sent('POST', '/v1/program/departments')).toHaveLength(0)
  })
})
