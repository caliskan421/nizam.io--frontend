import type { QueryClient } from '@tanstack/vue-query'
import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { isValidIdempotencyKey } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'

import {
  errorEnvelope,
  http,
  HttpResponse,
  json,
  ORIGIN,
  requests,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import {
  body,
  item,
  mountWith,
  settle,
  stubBrowserClone,
  type StandingSeed,
} from './__tests__/support'
import FileUploadDialog from './FileUploadDialog.vue'

const COORDINATOR: StandingSeed = {
  accountId: 'acc-7',
  rows: [{ departmentId: 'd2', role: 'koordinator' }],
}
const record = {
  file_id: 'f9',
  work_item_id: 'w1',
  display_name: 'kanit.pdf',
  content_type: 'application/pdf',
  size_bytes: 3,
  tag: 'sonuc',
  subtask_id: 's1',
}

beforeAll(() => {
  stubBrowserClone()
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => resetHarness())
afterAll(() => server.close())
enableAutoUnmount(afterEach)

function open(props: Record<string, unknown> = {}) {
  return mountWith(FileUploadDialog, { open: true, item, ...props }, { standing: COORDINATOR })
}

async function choose(name = 'kanit.pdf') {
  const input = body().find('[data-testid="upload-file"]')
  const file = new File(['abc'], name, { type: 'application/pdf' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

async function submit(client: QueryClient) {
  await body().find('form').trigger('submit')
  await settle(client)
}

const keyOf = (i: number) =>
  sent('POST', '/v1/work-items/w1/files')[i]!.headers.get('Idempotency-Key')

describe('FileUploadDialog (W46 · E-03-52, E-03-35)', () => {
  it('etiket zorunlu: seçilmeden istek yok, alan hatası görünür (P5, varsayılan yok)', async () => {
    const { h } = open()
    await choose()
    await submit(h.queryClient)
    expect(body().text()).toContain('Etiket seçin.')
    expect(requests).toHaveLength(0)
    expect((body().find('[data-testid="upload-tag"]').element as HTMLSelectElement).value).toBe('')
  })

  it('dosya zorunlu', async () => {
    const { h } = open()
    await body().find('[data-testid="upload-tag"]').setValue('plan')
    await submit(h.queryClient)
    expect(body().text()).toContain('Dosya seçin.')
    expect(requests).toHaveLength(0)
  })

  it('başarı: multipart + tag + subtask_id + IK; uploaded + kapanış; görev durumu değişmez', async () => {
    server.use(http.post(`${ORIGIN}/v1/work-items/w1/files`, () => json(record, 201)))
    const { h, wrapper } = open({ subtaskId: 's1' })
    const list = queryKeys.workItems.list(h.store.snapshot, { department: 'd1' })
    h.queryClient.setQueryData(list, { seeded: true })
    await choose()
    await body().find('[data-testid="upload-tag"]').setValue('sonuc')
    await submit(h.queryClient)

    const [req] = sent('POST', '/v1/work-items/w1/files')
    expect(req!.query.get('tag')).toBe('sonuc')
    expect(req!.query.get('subtask_id')).toBe('s1')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(isValidIdempotencyKey(keyOf(0) ?? '')).toBe(true)
    expect(wrapper.emitted('uploaded')).toEqual([[record]])
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    // Yükleme durum geçirmez: geçiş isteği yok, liste yeniden okunmaz.
    expect(requests.filter((r) => r.path.includes('transitions') || r.method === 'PATCH')).toEqual(
      [],
    )
    expect(h.queryClient.getQueryState(list)?.isInvalidated).toBe(false)
  })

  it('görev düzeyi yüklemede subtask_id gönderilmez; başlık kanıt dosyası', async () => {
    server.use(http.post(`${ORIGIN}/v1/work-items/w1/files`, () => json(record, 201)))
    const { h } = open()
    expect(body().text()).toContain('Kanıt dosyası yükle')
    await choose()
    await body().find('[data-testid="upload-tag"]').setValue('girdi')
    await submit(h.queryClient)
    expect(sent('POST', '/v1/work-items/w1/files')[0]!.query.has('subtask_id')).toBe(false)
  })

  it('hata kodu metni yerinde (sunucu iletisi yok); yeniden gönderme yeni eylem = yeni anahtar', async () => {
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/files`, () => errorEnvelope('records.name_taken', 409)),
    )
    const { h, wrapper } = open()
    await choose()
    await body().find('[data-testid="upload-tag"]').setValue('plan')
    await submit(h.queryClient)
    expect(body().find('[data-testid="upload-error"]').text()).toBe('Bu adla bir dosya zaten var.')
    expect(body().text()).not.toContain('sunucu iletisi')
    expect(wrapper.emitted('update:open')).toBeUndefined()

    await choose('baska.pdf')
    await submit(h.queryClient)
    expect(keyOf(1)).not.toBe(keyOf(0))
  })

  it('sonuç bilinmiyor: dosya + etiket korunur, "Yeniden gönder" aynı anahtarla', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/files`, () =>
        ++calls === 1 ? HttpResponse.error() : json(record, 201),
      ),
    )
    const { h, wrapper } = open()
    await choose()
    await body().find('[data-testid="upload-tag"]').setValue('analiz')
    await submit(h.queryClient)
    expect(body().find('[data-testid="outcome-notice"]').exists()).toBe(true)
    expect(wrapper.emitted('update:open')).toBeUndefined()

    await body().find('[data-testid="outcome-retry"]').trigger('click')
    await settle(h.queryClient)
    expect(keyOf(1)).toBe(keyOf(0))
    expect(wrapper.emitted('uploaded')).toEqual([[record]])
  })

  it('yeniden açılışta form sıfırlanır', async () => {
    const { wrapper } = open()
    await body().find('[data-testid="upload-tag"]').setValue('plan')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    expect((body().find('[data-testid="upload-tag"]').element as HTMLSelectElement).value).toBe('')
  })
})
