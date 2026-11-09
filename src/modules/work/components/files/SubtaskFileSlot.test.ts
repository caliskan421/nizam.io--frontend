import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  subtask,
} from '../../model/__tests__/harness'
import {
  body,
  captureLinkClicks,
  fileItem,
  item,
  mountWith,
  settle,
  stubBrowserClone,
  type StandingSeed,
} from './__tests__/support'
import SubtaskFileSlot from './SubtaskFileSlot.vue'

const COORDINATOR: StandingSeed = {
  accountId: 'acc-7',
  rows: [{ departmentId: 'd2', role: 'koordinator' }],
}
const ADMIN: StandingSeed = { accountId: 'acc-9', companyAdmin: true }
const LIST_PATH = '/v1/work-items/w1/files'

beforeAll(() => {
  stubBrowserClone()
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => resetHarness())
afterAll(() => server.close())
enableAutoUnmount(afterEach)

function serveFiles(files: ReturnType<typeof fileItem>[]) {
  server.use(http.get(`${ORIGIN}${LIST_PATH}`, () => json({ files })))
}

async function slot(standing: StandingSeed, selection = COORD_SCOPE) {
  const mounted = mountWith(
    SubtaskFileSlot,
    { item, subtask: subtask({ subtask_id: 's1' }) },
    { standing, selection },
  )
  await settle(mounted.h.queryClient)
  return { ...mounted, button: mounted.wrapper.find('[data-testid="subtask-file-slot"]') }
}

describe('SubtaskFileSlot (W46 · E-03-35)', () => {
  it('bağlı dosya adı (birden çoksa +n); tık son dosyayı bilet akışıyla indirir', async () => {
    serveFiles([
      fileItem({ file_id: 'a', subtask_id: 's1', display_name: 'bir.pdf' }),
      fileItem({ file_id: 'b', display_name: 'gorev.pdf' }),
      fileItem({ file_id: 'c', subtask_id: 's1', display_name: 'iki.pdf' }),
    ])
    const ticket = 'z'.repeat(43)
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        json({ ticket, url: `/v1/downloads/${ticket}`, expires_at: 'x' }, 201),
      ),
    )
    const clicks = captureLinkClicks()
    const { h, button } = await slot(COORDINATOR)
    expect(button.text()).toBe('iki.pdf +1')
    expect(button.attributes('data-mode')).toBe('file')
    // Zorunluluk işareti yok (BE-006, P5).
    expect(button.attributes('data-req')).toBeUndefined()
    await button.trigger('click')
    await settle(h.queryClient)
    expect(sent('POST', '/v1/download-tickets')[0]!.body).toEqual({
      method: 'GET',
      path: '/v1/files/c/download',
    })
    expect(clicks.downloads).toEqual(['iki.pdf'])
  })

  it('dosya yok + yetkili: "Kanıt yükle" → pencere; yükleme tag + subtask_id ile', async () => {
    serveFiles([])
    server.use(
      http.post(`${ORIGIN}${LIST_PATH}`, () =>
        json(
          {
            file_id: 'n',
            work_item_id: 'w1',
            display_name: 'k.pdf',
            content_type: 'application/pdf',
            size_bytes: 1,
            tag: 'cikti',
            subtask_id: 's1',
          },
          201,
        ),
      ),
    )
    const { h, button } = await slot(COORDINATOR)
    expect(button.text()).toBe('Kanıt yükle')
    await button.trigger('click')
    const input = body().find('[data-testid="upload-file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['x'], 'k.pdf', { type: 'application/pdf' })],
    })
    await input.trigger('change')
    await body().find('[data-testid="upload-tag"]').setValue('cikti')
    await body().find('form').trigger('submit')
    await settle(h.queryClient)
    const [req] = sent('POST', LIST_PATH)
    expect(req!.query.get('tag')).toBe('cikti')
    expect(req!.query.get('subtask_id')).toBe('s1')
    // Başarı sonrası ortak anahtar yeniden okunur.
    expect(sent('GET', LIST_PATH)).toHaveLength(2)
  })

  it('yönetici: yükleme gizli (s.148) — "Kanıt yok", devre dışı, pencere yok', async () => {
    serveFiles([])
    const { button } = await slot(ADMIN, ADMIN_SCOPE)
    expect(button.text()).toBe('Kanıt yok')
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(body().find('[role="dialog"]').exists()).toBe(false)
    expect(body().find('[data-testid="upload-file"]').exists()).toBe(false)
  })
})
