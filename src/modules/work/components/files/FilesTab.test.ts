import { enableAutoUnmount, mount } from '@vue/test-utils'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { defineComponent, h as render } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import { useConfirm } from '@/shared/ui/confirm'

import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  harness,
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
  seedStanding,
  settle,
  type StandingSeed,
} from './__tests__/support'
import FilesTab from './FilesTab.vue'
import SubtaskFileSlot from './SubtaskFileSlot.vue'

const COORDINATOR: StandingSeed = {
  accountId: 'acc-7',
  rows: [{ departmentId: 'd2', role: 'koordinator' }],
}
const ASSIGNED: StandingSeed = { accountId: 'acc-1', rows: [{ departmentId: 'd2', role: 'uye' }] }
const ADMIN: StandingSeed = { accountId: 'acc-9', companyAdmin: true }

const FILES = [
  fileItem({
    file_id: 'f1',
    display_name: 'ister.docx',
    tag: 'ister',
    uploaded_by_account_id: 'acc-1',
  }),
  fileItem({
    file_id: 'f2',
    display_name: 'son.pdf',
    uploaded_by_account_id: 'acc-7',
    subtask_id: 's1',
  }),
]
const LIST_PATH = '/v1/work-items/w1/files'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  useConfirm().clear()
})
afterAll(() => server.close())
enableAutoUnmount(afterEach)

function serveFiles(files = FILES) {
  server.use(http.get(`${ORIGIN}${LIST_PATH}`, () => json({ files })))
}

async function tab(standing: StandingSeed = COORDINATOR, selection = COORD_SCOPE) {
  const mounted = mountWith(FilesTab, { item }, { standing, selection })
  await settle(mounted.h.queryClient)
  return mounted
}

const row = (w: ReturnType<typeof mountWith>['wrapper'], id: string) =>
  w.find(`[data-testid="file-row"][data-file-id="${id}"]`)

describe('FilesTab (W46 · E-03-61, E-03-50)', () => {
  it('ortak files anahtarı (03/03c/06): önbellekteki liste okunur, istek atılmaz', async () => {
    const h = harness(COORD_SCOPE)
    seedStanding(h.queryClient, COORDINATOR)
    h.queryClient.setQueryData(queryKeys.workItems.files(h.store.snapshot, 'w1'), {
      files: FILES,
    })
    const wrapper = mount(FilesTab, {
      props: { item },
      global: { plugins: [[VueQueryPlugin, { queryClient: h.queryClient }]] },
    })
    await settle(h.queryClient)
    expect(wrapper.findAll('[data-testid="file-row"]')).toHaveLength(2)
    expect(sent('GET', LIST_PATH)).toHaveLength(0)
  })

  it('sekme ve alt görev yuvaları tek sorguyu paylaşır (satır başına istek yok)', async () => {
    serveFiles()
    const h = harness(COORD_SCOPE)
    seedStanding(h.queryClient, COORDINATOR)
    const Host = defineComponent(() => () => [
      render(FilesTab, { item }),
      render(SubtaskFileSlot, { item, subtask: subtask({ subtask_id: 's1' }) }),
      render(SubtaskFileSlot, { item, subtask: subtask({ subtask_id: 's2' }) }),
    ])
    mount(Host, { global: { plugins: [[VueQueryPlugin, { queryClient: h.queryClient }]] } })
    await settle(h.queryClient)
    const reqs = sent('GET', LIST_PATH)
    expect(reqs).toHaveLength(1)
    expect(reqs[0]!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(reqs[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
  })

  it('satır: ad, etiket · boyut · yükleyen · alt göreve bağlı; kanıt = son dosya', async () => {
    serveFiles()
    const { wrapper } = await tab()
    expect(row(wrapper, 'f2').text()).toContain('son.pdf')
    expect(row(wrapper, 'f2').text()).toContain('Sonuç · 2 KB · Ayşe · alt göreve bağlı')
    expect(wrapper.find('[data-testid="files-evidence-name"]').text()).toBe('son.pdf')
    const link = wrapper.find('[data-testid="files-archive-link"]')
    expect(link.attributes('disabled')).toBeDefined()
    expect(link.text()).toContain("F5'te")
  })

  it('boş liste: "Yok" + boş durum; yükleme düğmesi pencereyi açar', async () => {
    serveFiles([])
    const { wrapper } = await tab()
    expect(wrapper.find('[data-testid="files-evidence-name"]').text()).toBe('Yok')
    expect(wrapper.text()).toContain('Henüz dosya yok')
    await wrapper.find('[data-testid="files-upload"]').trigger('click')
    expect(body().find('[role="dialog"]').exists()).toBe(true)
  })

  it('görünürlük: yönetici yükler, başkasınınkini silemez, ad değiştirir; üye yalnız kendi dosyasında', async () => {
    serveFiles()
    const admin = (await tab(ADMIN, ADMIN_SCOPE)).wrapper
    expect(admin.find('[data-testid="files-upload"]').exists()).toBe(true)
    expect(admin.find('[data-testid="file-delete"]').exists()).toBe(false)
    expect(admin.findAll('[data-testid="file-rename"]')).toHaveLength(2)

    const member = (await tab(ASSIGNED)).wrapper
    expect(member.find('[data-testid="files-upload"]').exists()).toBe(true)
    expect(row(member, 'f1').find('[data-testid="file-delete"]').exists()).toBe(true)
    expect(row(member, 'f2').find('[data-testid="file-delete"]').exists()).toBe(false)
    expect(row(member, 'f2').find('[data-testid="file-rename"]').exists()).toBe(false)
  })

  it('ad değiştir: 409 records.name_taken alanın altında; başarıda liste yeniden okunur', async () => {
    serveFiles()
    let calls = 0
    server.use(
      http.patch(`${ORIGIN}/v1/files/f1/name`, () =>
        ++calls === 1 ? errorEnvelope('records.name_taken', 409) : json(FILES[0]),
      ),
    )
    const { h, wrapper } = await tab()
    await row(wrapper, 'f1').find('[data-testid="file-rename"]').trigger('click')
    await wrapper.find('[data-testid="rename-input"]').setValue('  yeni.docx ')
    await wrapper.find('[data-testid="rename-form"]').trigger('submit')
    await settle(h.queryClient)
    expect(sent('PATCH', '/v1/files/f1/name')[0]!.body).toEqual({ display_name: 'yeni.docx' })
    expect(wrapper.find('[data-testid="rename-form"]').text()).toContain(
      'Bu adla bir dosya zaten var.',
    )

    await wrapper.find('[data-testid="rename-form"]').trigger('submit')
    await settle(h.queryClient)
    expect(wrapper.find('[data-testid="rename-form"]').exists()).toBe(false)
    expect(sent('GET', LIST_PATH)).toHaveLength(2)
  })

  it('sil: kalıcı → istemci onayı; iptal istek atmaz, onay DELETE + yeniden okuma', async () => {
    serveFiles()
    server.use(http.delete(`${ORIGIN}/v1/files/f2`, () => new Response(null, { status: 204 })))
    const { h, wrapper } = await tab()
    const confirm = useConfirm()
    await row(wrapper, 'f2').find('[data-testid="file-delete"]').trigger('click')
    await settle(h.queryClient)
    expect(confirm.current.value?.options.description).toBe('son.pdf')
    confirm.cancel(confirm.current.value!.id)
    await settle(h.queryClient)
    expect(sent('DELETE', '/v1/files/f2')).toHaveLength(0)

    await row(wrapper, 'f2').find('[data-testid="file-delete"]').trigger('click')
    await settle(h.queryClient)
    await confirm.accept(confirm.current.value!.id)
    await settle(h.queryClient)
    expect(sent('DELETE', '/v1/files/f2')).toHaveLength(1)
    expect(sent('GET', LIST_PATH)).toHaveLength(2)
  })

  it('indir: bilet görevin kapsamıyla, yanıt yolu tarayıcıya verilir', async () => {
    serveFiles()
    const ticket = 'k'.repeat(43)
    server.use(
      http.post(`${ORIGIN}/v1/download-tickets`, () =>
        json({ ticket, url: `/v1/downloads/${ticket}`, expires_at: 'x' }, 201),
      ),
    )
    const clicks = captureLinkClicks()
    const { h, wrapper } = await tab()
    await row(wrapper, 'f1').find('[data-testid="file-download"]').trigger('click')
    await settle(h.queryClient)
    expect(sent('POST', '/v1/download-tickets')[0]!.body).toEqual({
      method: 'GET',
      path: '/v1/files/f1/download',
    })
    expect(clicks.hrefs).toEqual([`/v1/downloads/${ticket}`])
  })

  it('okuma hatası: kod metni + yeniden dene', async () => {
    server.use(
      http.get(`${ORIGIN}${LIST_PATH}`, () => errorEnvelope('records.not_authorized', 403)),
    )
    const { wrapper } = await tab()
    expect(wrapper.find('[role="alert"]').text()).toContain('Bu işlem için yetkiniz yok.')
    expect(wrapper.text()).not.toContain('sunucu iletisi')
  })
})
