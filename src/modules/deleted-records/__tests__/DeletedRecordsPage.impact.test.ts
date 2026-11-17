import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  department,
  mountPage,
  ORIGIN,
  resetAll,
  sent,
  server,
  serverDefaults,
  settle,
  world,
  type Mounted,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  server.use(...serverDefaults())
  world.departments = [[department('d5')]]
})
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetAll()
})
afterAll(() => server.close())

const confirm = useConfirm()
const toasts = () => useToast().queue.value.map((t) => t.message)
const IMPACT = '/v1/departments/d5/delete-impact'
const DELETE = '/v1/admin/permanent/departments/d5'
const mountDepartments = () => mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk' })
const purge = async (page: Mounted) => {
  await page.wrapper.get('[data-action="purge"]').trigger('click')
  await settle()
}
const notice = (page: Mounted) => page.wrapper.find('[data-testid="dr-notice"]')

describe('koordinatörlük kalıcı silme etkisi (BE-164)', () => {
  it('GET başlıksız ve CSRF’siz; onay gövdesi şirket geneli sayıları söyler; DELETE onaya kadar yok', async () => {
    const page = await mountDepartments()
    await purge(page)
    const [get] = sent(IMPACT)
    expect(sent(IMPACT)).toHaveLength(1)
    expect(get!.headers.get('X-Nizamio-Program')).toBeNull()
    expect(get!.headers.get('X-Nizamio-Department')).toBeNull()
    expect(get!.headers.get('X-Requested-With')).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    const body = confirm.current.value!.options.body!
    expect(body).toContain(
      'Etki şirket genelindedir: koordinatörlüğün bütün programlardaki kayıtları silinir.',
    )
    // 3 açık + 2 tamamlanmış + 4 silinmiş = 9; silinmişin içindeki 1 tanesi ayrıca sayılmaz.
    expect(body).toContain(
      '9 görev silinecek: 3 açık, 2 tamamlanmış, 4 zaten silinmiş (bunların 1 tanesi koordinatörlükle birlikte silinmişti).',
    )
    expect(body).toContain(
      '7 dosya silinecek (silinmiş görevlerin ekleri ve çöpteki dosyalar dahil).',
    )
    expect(body).toContain('5 kişinin ekip üyeliği kaldırılacak; hesaplar silinmez.')
    expect(body).toContain('1 programdaki koordinatörlük bağı kaldırılacak.')
    expect(body).toContain('2 toplantı silinmez; koordinatörlük adının kopyasıyla kalır.')
    expect(body).toContain('Sezon 2026: 2 açık, 1 tamamlanmış, 3 silinmiş görev; bağ kaldırılacak.')
    expect(body).toContain(
      'Adı bilinmeyen program: 1 açık, 1 tamamlanmış, 1 silinmiş görev; bağlı değil.',
    )
    expect(body.at(-1)).toBe('Sayılar okuma anının görüntüsüdür; onaydan önce değişebilir.')
  })

  it('gerçek sıfır etki ayrı cümlelerle söylenir', async () => {
    world.impacts.set('d5', {
      active_items: 0,
      completed_items: 0,
      deleted_items: 0,
      deleted_with_department: 0,
      file_count: 0,
      member_count: 0,
      meeting_count: 0,
      programs: [],
    })
    const page = await mountDepartments()
    await purge(page)
    const body = confirm.current.value!.options.body!
    expect(body).toEqual(
      expect.arrayContaining([
        'Silinecek görev yok.',
        'Silinecek dosya yok.',
        'Kaldırılacak ekip üyeliği yok.',
        'Programa bağlı değil.',
        'Etkilenen toplantı yok.',
      ]),
    )
  })

  it('iptal: DELETE gitmez', async () => {
    const page = await mountDepartments()
    await purge(page)
    confirm.cancel(confirm.current.value!.id)
    await settle()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
  })

  it('onay: tek DELETE (CSRF + program başlığı), başarıda gerçek sonuç sayıları', async () => {
    server.use(
      http.delete(`${ORIGIN}${DELETE}`, () =>
        HttpResponse.json({
          department_id: 'd5',
          status: 'purged',
          work_items_deleted: 9,
          files_deleted: 7,
          program_links_removed: 1,
          memberships_deleted: 5,
        }),
      ),
    )
    const page = await mountDepartments()
    await purge(page)
    await confirm.accept(confirm.current.value!.id)
    await settle()
    const deletes = sent(DELETE, 'DELETE')
    expect(deletes).toHaveLength(1)
    expect(deletes[0]!.headers.get('X-Requested-With')).not.toBeNull()
    expect(deletes[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(toasts()).toEqual([
      'Birim d5 kalıcı olarak silindi: 9 görev, 7 dosya, 1 program bağı, 5 ekip üyeliği.',
    ])
  })

  it('permanent_blocked: onay ve DELETE yok, sayılı engel bildirimi; yeniden basınca taze okur', async () => {
    world.impacts.set('d5', {
      permanent_blocked: true,
      permanent_blockers: { tables: 2, projects: 0, pending_proposals: 1 },
    })
    const page = await mountDepartments()
    await purge(page)
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    expect(notice(page).text()).toContain('Kalıcı silinemez: 2 tablo, 1 bekleyen tablo önerisi.')
    world.impacts.set('d5', {})
    await purge(page)
    expect(sent(IMPACT)).toHaveLength(2)
    expect(confirm.current.value).not.toBeNull()
    expect(notice(page).exists()).toBe(false)
  })

  it('okuma hatası: onay ve DELETE yok; yeniden denenince taze okunur', async () => {
    world.failures.set(`GET ${IMPACT}`, { status: 500, code: 'platform.internal' })
    const page = await mountDepartments()
    await purge(page)
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    expect(notice(page).text()).toContain('Silme etkisi okunamadı; hiçbir şey silinmedi.')
    world.failures.clear()
    await purge(page)
    expect(confirm.current.value).not.toBeNull()
  })

  it('404: zaten yok bilgisi, liste yenilenir; DELETE yok', async () => {
    world.failures.set(`GET ${IMPACT}`, { status: 404, code: 'organization.department_not_found' })
    const page = await mountDepartments()
    world.departments = [[]]
    await purge(page)
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    expect(notice(page).text()).toContain('Koordinatörlük artık bulunamadı. Liste yenilendi.')
    expect(page.wrapper.find('[data-record-key]').exists()).toBe(false)
  })

  it('deleted=false: durum değişti bilgisi; onay yok', async () => {
    world.impacts.set('d5', { deleted: false })
    const page = await mountDepartments()
    await purge(page)
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    expect(notice(page).text()).toContain('Koordinatörlük artık silinmiş durumda değil.')
  })

  it('403: yetki bildirimi, DELETE yok', async () => {
    world.failures.set(`GET ${IMPACT}`, { status: 403, code: 'organization.not_authorized' })
    const page = await mountDepartments()
    await purge(page)
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
    expect(confirm.current.value).toBeNull()
    expect(notice(page).text()).toContain('yalnız şirket yöneticisi görebilir')
  })

  it('okuma sürerken ikinci tık ikinci istek ya da yazma açmaz; yükleniyor bildirimi görünür', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    world.impactGate = () => gate
    const page = await mountDepartments()
    const button = page.wrapper.get('[data-action="purge"]')
    await button.trigger('click')
    await button.trigger('click')
    expect(notice(page).text()).toContain('Silme etkisi okunuyor…')
    expect(notice(page).attributes('role')).toBe('status')
    release()
    await settle()
    expect(sent(IMPACT)).toHaveLength(1)
    expect(confirm.current.value).not.toBeNull()
  })

  it('okuma sürerken kapsam değişirse geç yanıt onay açmaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    world.impactGate = () => gate
    const page = await mountDepartments()
    await page.wrapper.get('[data-action="purge"]').trigger('click')
    page.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    release()
    await settle()
    expect(confirm.current.value).toBeNull()
    expect(sent(DELETE, 'DELETE')).toHaveLength(0)
  })

  it('DELETE’te bayat 409 department_usage: sunucu iletisi değil, bilinen alan ve sayılar', async () => {
    server.use(
      http.delete(`${ORIGIN}${DELETE}`, () =>
        HttpResponse.json(
          {
            code: 'organization.department_in_use',
            message: 'sunucu iletisi',
            request_id: 'r1',
            fields: [
              { field: 'tables', code: 'organization.department_usage', message: '2' },
              { field: 'bilinmeyen', code: 'organization.department_usage', message: '9' },
            ],
          },
          { status: 409 },
        ),
      ),
    )
    const page = await mountDepartments()
    await purge(page)
    await confirm.accept(confirm.current.value!.id)
    await settle()
    expect(toasts()).toEqual(['Kalıcı silinemedi: 2 tablo. Önce bunları kaldırın.'])
  })

  it('409 alanları yoksa genel engel metni; sayı olmayan değer sayı sayılmaz', async () => {
    server.use(
      http.delete(`${ORIGIN}${DELETE}`, () =>
        HttpResponse.json(
          {
            code: 'organization.department_in_use',
            message: 'x',
            request_id: 'r1',
            fields: [
              { field: 'projects', code: 'organization.department_usage', message: '2 adet' },
            ],
          },
          { status: 409 },
        ),
      ),
    )
    const page = await mountDepartments()
    await purge(page)
    await confirm.accept(confirm.current.value!.id)
    await settle()
    expect(toasts()).toEqual(['Kalıcı silinemedi: proje. Önce bunları kaldırın.'])
  })

  it('gerçek onay penceresi: etki satırları görünür, çift tıklamada tek DELETE gider', async () => {
    const page = await mountPage({ path: '/silinen-kayitlar?tur=koordinatorluk', host: true })
    await purge(page)
    const dialog = document.body.querySelector('[data-testid="confirm-dialog"]')!
    expect(dialog.textContent).toContain('9 görev silinecek')
    expect(dialog.textContent).toContain('Sayılar okuma anının görüntüsüdür')
    const accept = document.body.querySelector<HTMLButtonElement>('[data-testid="confirm-accept"]')!
    accept.click()
    accept.click()
    await settle()
    expect(sent(DELETE, 'DELETE')).toHaveLength(1)
  })
})
