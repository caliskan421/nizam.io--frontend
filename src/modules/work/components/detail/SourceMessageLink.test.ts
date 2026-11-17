// W184 (BE-085 ters bağ, P86): "Kaynak mesaja git" — S3 `getWorkItemSourceMessage`, görevin kendi
// kapsamıyla; null/erişimsiz/yükleniyor/hatada görünmez; tık `/mesajlar/:chatId?mesaj=<seq>`;
// kapsam ya da oturum değişince geç yanıt bu görünüme uygulanmaz.
import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { authSession } from '@/shared/http'
import { queryKeys } from '@/shared/http/query-keys'

import {
  ADMIN_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../../model/__tests__/harness'
import type { WorkTarget } from '../../model/types'
import SourceMessageLink from './SourceMessageLink.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  document.body.innerHTML = ''
})
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/source-message'
const TARGET: WorkTarget = { programId: 'p1', departmentId: 'd1' }
const SOURCE = { chat_id: 'c7', message_id: 'm41', seq: 41 }

async function mountLink(target: WorkTarget | null = TARGET) {
  const h = harness(ADMIN_SCOPE)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { name: 'work.tasks', path: '/gorevler', component: { template: '<div />' } },
      { name: 'collaboration.chat', path: '/mesajlar/:chatId', component: { template: '<div />' } },
    ],
  })
  await router.push('/gorevler?gorev=w1')
  const wrapper = mount(SourceMessageLink, {
    props: { workItemId: 'w1', target },
    attachTo: document.body,
    global: { plugins: [router, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  return { h, router, wrapper }
}

const link = () => document.body.querySelector('[data-testid="detail-source-message"]')

describe('SourceMessageLink', () => {
  it('kaynak mesaj varken "Kaynak mesaja git"; S3 başlıkları görevin kapsamıyla; tık sohbet + around=seq hedefi', async () => {
    server.use(http.get(`${ORIGIN}${PATH}`, () => json({ source_message: SOURCE })))
    const { router } = await mountLink()
    await vi.waitFor(() => expect(link()).not.toBeNull())
    expect(link()!.textContent).toContain('Kaynak mesaja git')
    const [request] = sent('GET', PATH)
    expect(request!.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request!.headers.get('X-Nizamio-Department')).toBe('d1')
    link()!.querySelector('button')!.click()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/mesajlar/c7?mesaj=41'))
    expect(router.currentRoute.value.query).toEqual({ mesaj: '41' })
  })

  it('source_message: null → hiçbir şey çizilmez (bağ yok / silinmiş / sohbet programda değil / erişim yok)', async () => {
    server.use(http.get(`${ORIGIN}${PATH}`, () => json({ source_message: null })))
    await mountLink()
    await vi.waitFor(() => expect(sent('GET', PATH)).toHaveLength(1))
    await flushPromises()
    expect(link()).toBeNull()
  })

  it.each([
    ['403', errorEnvelope('work.not_assigned', 403)],
    ['404', errorEnvelope('work.item_not_found', 404)],
  ])('%s: bağlantı gizli, bildirim/hata yüzeyi yok', async (_name, response) => {
    server.use(http.get(`${ORIGIN}${PATH}`, () => response))
    await mountLink()
    await vi.waitFor(() => expect(sent('GET', PATH)).toHaveLength(1))
    await flushPromises()
    expect(link()).toBeNull()
    expect(document.body.textContent?.trim()).toBe('')
  })

  it('görev hedefi bilinmiyorsa istek atılmaz', async () => {
    await mountLink(null)
    await flushPromises()
    expect(sent('GET', PATH)).toHaveLength(0)
    expect(link()).toBeNull()
  })

  it('geç yanıt: kapsam (program) yanıt beklenirken değişti → eski programın bağı yeni kapsamda gösterilmez', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    let calls = 0
    server.use(
      http.get(`${ORIGIN}${PATH}`, async () => {
        calls += 1
        if (calls > 1) return json({ source_message: null })
        await gate
        return json({ source_message: SOURCE })
      }),
    )
    const { h } = await mountLink()
    await vi.waitFor(() => expect(calls).toBe(1))
    const before = h.store.snapshot
    h.store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    // Yeni kapsam kendi anahtarıyla ayrı okur ve kendi cevabını (null) gösterir.
    await vi.waitFor(() => expect(calls).toBe(2))
    release()
    await flushPromises()
    expect(link()).toBeNull()
    // Eski yanıt yalnız eski kapsamın anahtarına yazılabilir; yeni kapsamın anahtarına KARIŞMAZ.
    expect(
      h.queryClient.getQueryData(queryKeys.workItems.sourceMessage(h.store.snapshot, 'w1')),
    ).toEqual({ source_message: null })
    expect(queryKeys.workItems.sourceMessage(before, 'w1')).not.toEqual(
      queryKeys.workItems.sourceMessage(h.store.snapshot, 'w1'),
    )
  })

  it('geç yanıt: oturum (hesap) yanıt beklenirken değişti → veri önbelleğe yazılmaz, bağ yok', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}${PATH}`, async () => {
        await gate
        return json({ source_message: SOURCE })
      }),
    )
    const { h } = await mountLink()
    await vi.waitFor(() => expect(sent('GET', PATH)).toHaveLength(1))
    authSession.establish({
      token: 'tok-2',
      account_id: 'acc-other',
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      force_password_change: false,
    } as never)
    release()
    await flushPromises()
    expect(link()).toBeNull()
    expect(
      h.queryClient.getQueryData(queryKeys.workItems.sourceMessage(h.store.snapshot, 'w1')),
    ).toBeUndefined()
    authSession.clear()
  })
})
