import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'

import {
  errorEnvelope,
  http,
  HttpResponse,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import FileActions from './FileActions.vue'
import { file, mountWith, stubObjectUrls, target, type StandingSeed } from './__tests__/support'

let urls: ReturnType<typeof stubObjectUrls>
const calls: { deleted: string[]; renamed: string[] } = { deleted: [], renamed: [] }
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  urls = stubObjectUrls()
  calls.deleted = []
  calls.renamed = []
})
afterEach(() => {
  resetHarness()
  useToast().clear()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
enableAutoUnmount(afterEach)

const ADMIN_SEED: StandingSeed = { companyAdmin: true }
const COORD_SEED: StandingSeed = { rows: [{ departmentId: 'd1', role: 'koordinator' }] }
const MEMBER_SEED: StandingSeed = { rows: [{ departmentId: 'd1', role: 'uye' }] }

function actions(standing: StandingSeed | null, over: Record<string, unknown> = {}) {
  return mountWith(
    FileActions,
    {
      file: file(),
      target,
      onDeleted: (id: string) => calls.deleted.push(id),
      onRenamed: (id: string) => calls.renamed.push(id),
      ...over,
    },
    { standing, confirm: true },
  )
}
const q = (id: string) => document.body.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)
const has = (id: string) => q(id) !== null
const toastMessages = () => useToast().queue.value.map((t) => t.message)

describe('FileActions görünürlüğü (K1, yalnız capability olguları)', () => {
  it('yönetici: yükleyen kendisiyse indir + adlandır + sil; stub düğmeler devre dışı', () => {
    actions(ADMIN_SEED)
    expect(['file-download', 'file-rename', 'file-delete'].every(has)).toBe(true)
    expect(q('file-retag')!.disabled).toBe(true)
    expect(q('file-move')!.disabled).toBe(true)
    expect(document.body.querySelector('[data-design-stub="BE-074"]')).not.toBeNull()
    expect(document.body.querySelector('[data-design-stub="BE-075"]')).not.toBeNull()
  })

  it('yönetici başkasının dosyasını silemez (gizli), adlandırabilir', () => {
    actions(ADMIN_SEED, { file: file({ uploaded_by_account_id: 'baska' }) })
    expect(has('file-rename')).toBe(true)
    expect(has('file-delete')).toBe(false)
  })

  it('koordinatör başkasının dosyasını adlandırır ama silemez', () => {
    actions(COORD_SEED, { file: file({ uploaded_by_account_id: 'baska' }) })
    expect(has('file-rename')).toBe(true)
    expect(has('file-delete')).toBe(false)
  })

  it('üye yalnız kendi dosyasında adlandırır/siler; başkasınınkinde yalnız indirir', () => {
    actions(MEMBER_SEED)
    expect(has('file-rename') && has('file-delete')).toBe(true)
    document.body.innerHTML = ''
    actions(MEMBER_SEED, { file: file({ uploaded_by_account_id: 'baska' }) })
    expect(has('file-download')).toBe(true)
    expect(has('file-rename') || has('file-delete')).toBe(false)
  })

  it('mercek yetki değildir: ekip satırı olmayan üye ekip eylemi görmez', () => {
    actions({ rows: [] })
    expect(has('file-rename') || has('file-delete')).toBe(false)
  })

  it('stub düğmeler tıklanınca hiçbir istek atılmaz (sıfır yazma)', async () => {
    const { h } = actions(ADMIN_SEED)
    q('file-retag')!.click()
    q('file-move')!.click()
    await settleQueries(h.queryClient)
    expect(sent('PATCH', '/v1/files/f1')).toHaveLength(0)
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(0)
  })
})

describe('İndir (bilet akışı)', () => {
  const ticket = () =>
    http.post(`${ORIGIN}/v1/download-tickets`, () =>
      json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: '2026-11-12T12:01:00Z' }, 201),
    )

  it('dosyanın departman başlığıyla bilet → tüketim → kaydet; bildirim', async () => {
    server.use(
      ticket(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
        HttpResponse.arrayBuffer(new Uint8Array([1]).buffer, {
          headers: { 'Content-Disposition': 'attachment; filename="rapor.pdf"' },
        }),
      ),
    )
    const { h } = actions(COORD_SEED)
    q('file-download')!.click()
    await settleQueries(h.queryClient)
    await vi.waitFor(() => expect(urls.clicked).toEqual(['rapor.pdf']))
    const [issue] = sent('POST', '/v1/download-tickets')
    expect(issue!.body).toEqual({ method: 'GET', path: '/v1/files/f1/download' })
    expect(issue!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(toastMessages()).toEqual(['rapor.pdf indirildi.'])
  })

  it('429 Retry-After: saniyeli metin, otomatik tekrar yok', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        errorEnvelope('platform.rate_limited', 429, { 'Retry-After': '12' }),
      ),
    )
    const { h } = actions(COORD_SEED)
    q('file-download')!.click()
    await settleQueries(h.queryClient)
    await vi.waitFor(() => expect(toastMessages()).toHaveLength(1))
    expect(toastMessages()[0]).toContain('12 saniye')
    expect(sent('POST', '/v1/download-tickets')).toHaveLength(1)
    expect(urls.clicked).toEqual([])
  })

  it('tüketimde 404 records.file_not_found: i18n metni, sunucu message yok', async () => {
    server.use(
      ticket(),
      http.get(`${ORIGIN}/v1/downloads/tk_1`, () => errorEnvelope('records.file_not_found', 404)),
    )
    const { h } = actions(COORD_SEED)
    q('file-download')!.click()
    await settleQueries(h.queryClient)
    await vi.waitFor(() => expect(toastMessages()).toHaveLength(1))
    expect(toastMessages()[0]).toBe('Dosya bulunamadı.')
  })

  it('sahip bilet beklerken sökülürse bilet tüketilmez, bildirim yok', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, async () => {
        await gate
        return json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: 'x' }, 201)
      }),
    )
    const { h, wrapper } = actions(COORD_SEED)
    q('file-download')!.click()
    await nextTick()
    wrapper.unmount()
    release()
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/downloads/tk_1')).toHaveLength(0)
    expect(toastMessages()).toEqual([])
  })
})

describe('Dosyayı sil (kalıcı; ortak onay)', () => {
  const DELETE = `${ORIGIN}/v1/files/f1`
  const dialog = () => document.body.querySelector('[role="alertdialog"]')
  const confirmButton = () =>
    [...(dialog()?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Dosyayı sil'),
    )!
  const cancelButton = () =>
    [...(dialog()?.querySelectorAll('button') ?? [])].find((b) =>
      b.textContent?.includes('Vazgeç'),
    )!

  it('onay "Bu işlem geri alınamaz." der; kabulden önce DELETE yok', async () => {
    const { h } = actions(ADMIN_SEED)
    q('file-delete')!.click()
    await nextTick()
    expect(dialog()?.textContent).toContain('Bu işlem geri alınamaz.')
    expect(dialog()?.textContent).toContain('rapor.pdf')
    await settleQueries(h.queryClient)
    expect(sent('DELETE', '/v1/files/f1')).toHaveLength(0)
  })

  it.each([
    ['Vazgeç', () => cancelButton().click()],
    [
      'Esc',
      () => dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
    ],
  ])('%s: istek yok, deleted yok, odak silme düğmesine döner (KESİN 27)', async (_n, close) => {
    const { h } = actions(ADMIN_SEED)
    q('file-delete')!.focus()
    q('file-delete')!.click()
    await nextTick()
    await nextTick()
    close()
    await settleQueries(h.queryClient)
    await nextTick()
    expect(dialog()).toBeNull()
    expect(sent('DELETE', '/v1/files/f1')).toHaveLength(0)
    expect(calls.deleted).toEqual([])
    expect(document.activeElement).toBe(q('file-delete'))
  })

  it('kabul: 204 → dosyanın departman başlığıyla DELETE, deleted, görev dosyaları yeniden okunur', async () => {
    server.use(http.delete(DELETE, () => new HttpResponse(null, { status: 204 })))
    const { h } = actions(ADMIN_SEED)
    const key = queryKeys.workItems.files(h.store.snapshot, 'w1')
    h.queryClient.setQueryData(key, { seeded: true })
    q('file-delete')!.click()
    await nextTick()
    confirmButton().click()
    await settleQueries(h.queryClient)
    const [req] = sent('DELETE', '/v1/files/f1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    expect(calls.deleted).toEqual(['f1'])
    expect(toastMessages()).toEqual(['Dosya silindi.'])
    expect(h.queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('404 records.file_not_found: silinmiş say (deleted), bilgi bildirimi', async () => {
    server.use(http.delete(DELETE, () => errorEnvelope('records.file_not_found', 404)))
    const { h } = actions(ADMIN_SEED)
    q('file-delete')!.click()
    await nextTick()
    confirmButton().click()
    await settleQueries(h.queryClient)
    expect(calls.deleted).toEqual(['f1'])
    expect(toastMessages()).toEqual(['Dosya zaten silinmiş.'])
  })

  it('403 records.not_authorized: nötr bildirim, deleted yok', async () => {
    server.use(http.delete(DELETE, () => errorEnvelope('records.not_authorized', 403)))
    const { h } = actions(ADMIN_SEED)
    q('file-delete')!.click()
    await nextTick()
    confirmButton().click()
    await settleQueries(h.queryClient)
    expect(calls.deleted).toEqual([])
    expect(toastMessages()).toEqual(['Bu işlem için yetkiniz yok.'])
  })

  it('onay açıkken sahip sökülürse onay vazgeçilir, DELETE gitmez', async () => {
    const { h, wrapper } = actions(ADMIN_SEED)
    q('file-delete')!.click()
    await nextTick()
    expect(dialog()).not.toBeNull()
    wrapper.unmount()
    await settleQueries(h.queryClient)
    expect(sent('DELETE', '/v1/files/f1')).toHaveLength(0)
  })

  it('istek sürerken sahip sökülürse geç sonuç deleted/bildirim başlatmaz', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.delete(DELETE, async () => {
        await gate
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { h, wrapper } = actions(ADMIN_SEED)
    q('file-delete')!.click()
    await nextTick()
    confirmButton().click()
    await nextTick()
    wrapper.unmount()
    release()
    await settleQueries(h.queryClient)
    expect(calls.deleted).toEqual([])
    expect(toastMessages()).toEqual([])
  })
})

describe('Yeniden adlandır bağlantısı', () => {
  it('düğme pencereyi açar; Esc ile kapanınca odak düğmeye döner', async () => {
    actions(ADMIN_SEED)
    q('file-rename')!.focus()
    q('file-rename')!.click()
    await nextTick()
    await nextTick()
    const modal = document.body.querySelector('[role="dialog"]')
    expect(modal).not.toBeNull()
    modal!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    await nextTick()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(q('file-rename'))
    expect(calls.renamed).toEqual([])
  })

  it('başarıda renamed yayılır (üst bileşen listeyi yeniden okur)', async () => {
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/name`, () =>
        json({
          file_id: 'f1',
          work_item_id: 'w1',
          display_name: 'yeni.pdf',
          content_type: 'application/pdf',
          size_bytes: 3,
          tag: 'sonuc',
        }),
      ),
    )
    const { h } = actions(ADMIN_SEED)
    q('file-rename')!.click()
    await nextTick()
    const input = document.body.querySelector<HTMLInputElement>('[data-testid="rename-input"]')!
    input.value = 'yeni.pdf'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    document.body.querySelector<HTMLButtonElement>('[data-testid="rename-submit"]')!.click()
    await settleQueries(h.queryClient)
    expect(calls.renamed).toEqual(['f1'])
  })
})
