import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queryKeys } from '@/shared/http/query-keys'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

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
import { $, formsHarness, resetForms, type WhoSeed } from './__tests__/forms-harness'
import DeleteTaskAction from './DeleteTaskAction.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => resetForms())
afterAll(() => server.close())

const PATH = '/v1/work-items/w1'
const ADMIN: WhoSeed = { companyAdmin: true }

function render(who: WhoSeed = ADMIN, scope = ADMIN_SCOPE) {
  const h = formsHarness(scope, who)
  return { h, wrapper: h.mount(DeleteTaskAction, { item: workItem({ title: 'Rapor' }) }) }
}

async function openConfirm() {
  $('[data-testid="wf-delete"]')!.click()
  const dialog = useConfirm()
  await vi.waitFor(() => expect(dialog.current.value).not.toBeNull())
  return dialog
}

describe('DeleteTaskAction (E-03-56, E-03-64)', () => {
  it.each([
    ['yönetici', ADMIN, true],
    ['görevin koordinatörü', { rows: [{ departmentId: 'd2', role: 'koordinator' }] }, true],
    ['başka birimin koordinatörü', { rows: [{ departmentId: 'd1', role: 'koordinator' }] }, false],
    ['atanmış üye', { rows: [{ departmentId: 'd2', role: 'uye' }] }, false],
  ] as const)('%s → görünür: %s (s.139; yetkisiz gizli)', (_n, who, visible) => {
    render(who, COORD_SCOPE)
    expect($('[data-testid="wf-delete"]') !== null).toBe(visible)
  })

  it('tasarım: tehlike simge düğmesi, erişim adı "Görevi sil"', () => {
    render()
    const button = $('[data-testid="wf-delete"]')!
    expect(button.className).toContain('t-iconbtn--danger')
    expect(button.getAttribute('aria-label')).toBe('Görevi sil')
  })

  it('istemci onayı; vazgeçte istek yok', async () => {
    const { wrapper } = render()
    const dialog = await openConfirm()
    expect(dialog.current.value!.options.tone).toBe('danger')
    expect(dialog.current.value!.options.body?.[0]).toContain('"Rapor"')
    dialog.cancel(dialog.current.value!.id)
    await vi.waitFor(() => expect(dialog.current.value).toBeNull())
    expect(sent('DELETE', PATH)).toHaveLength(0)
    expect(wrapper.emitted('deleted')).toBeUndefined()
  })

  it('onay → deleteWorkItem (görevin kapsamı, CSRF, confirm yok) → deleted + liste yeniden', async () => {
    server.use(http.delete(`${ORIGIN}${PATH}`, () => json({ status: 'deleted' })))
    const { h, wrapper } = render()
    const list = queryKeys.workItems.list(h.store.snapshot, { department: null })
    h.queryClient.setQueryData(list, { seeded: true })
    const dialog = await openConfirm()
    await dialog.accept(dialog.current.value!.id)
    await vi.waitFor(() => expect(wrapper.emitted('deleted')).toEqual([['w1']]))
    const [req] = sent('DELETE', PATH)
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(req!.headers.get('X-Requested-With')).toBe('XMLHttpRequest')
    expect(req!.query.get('confirm')).toBeNull()
    expect(h.queryClient.getQueryState(list)?.isInvalidated).toBe(true)
    expect(useToast().queue.value.map((t) => t.message)).toEqual(['Görev silindi.'])
  })

  it('hata: kod metni bildirimi, deleted yok', async () => {
    server.use(http.delete(`${ORIGIN}${PATH}`, () => errorEnvelope('work.not_authorized', 403)))
    const { wrapper } = render()
    const dialog = await openConfirm()
    await dialog.accept(dialog.current.value!.id)
    await vi.waitFor(() =>
      expect(useToast().queue.value.map((t) => t.message)).toEqual(['Bu işlem için yetkiniz yok.']),
    )
    expect(wrapper.emitted('deleted')).toBeUndefined()
  })
})
