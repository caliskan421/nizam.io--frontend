import { mount, type VueWrapper } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '@/shared/i18n'

import AssistantPanel from './AssistantPanel.vue'

const server = setupServer()
const url = 'http://localhost/v1/assistant'
const record = { id: 'c1', baslik: 'Önceki soru', created_at: '', updated_at: '' }
let wrapper: VueWrapper | undefined
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterAll(() => server.close())
afterEach(() => {
  wrapper?.unmount()
  server.resetHandlers()
})

async function setup(narrow = false) {
  const page = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { name: 'home', path: '/', component: page },
      { name: 'work.tasks', path: '/gorevler', component: page },
      { name: 'memory', path: '/kurumsal-hafiza', component: page },
    ],
  })
  await router.push('/')
  wrapper = mount(AssistantPanel, {
    props: {
      open: true,
      program: 'p1',
      context: 'Ana sayfa',
      roleLabel: 'Üye',
      admin: false,
      scope: { programId: 'p1', departmentId: 'd1', lens: 'member' },
      narrow,
      today: '2026-11-20',
    },
    attachTo: document.body,
    global: { plugins: [i18n, router] },
  })
  return router
}

const panel = () => document.querySelector<HTMLElement>('[data-testid=assistant-panel]')!
const button = (label: string) =>
  [...document.querySelectorAll('button')].find((item) => item.textContent?.trim() === label)!
const listen = (payload: string) =>
  new HttpResponse(payload, { headers: { 'Content-Type': 'text/event-stream' } })
const frame = (name: string, data: unknown) =>
  'event: ' + name + '\ndata: ' + JSON.stringify(data) + '\n\n'

it('özellik bayrağı kapalıyken mobil panel açılır ve soru göndermeden erişilemediğini söyler', async () => {
  const submit = vi.fn(() => listen(''))
  server.use(
    http.get(url + '/conversations', () =>
      HttpResponse.json({ code: 'platform.route_not_found' }, { status: 404 }),
    ),
    http.post(url + '/chat', submit),
  )
  await setup(true)
  await vi.waitFor(() => expect(panel().textContent).toContain('şu anda kullanılamıyor'))
  expect(document.querySelector('[role=dialog]')).not.toBeNull()
  expect(panel().querySelector('textarea')).toBeNull()
  expect(submit).not.toHaveBeenCalled()
})

it('SSE tamamlandığında kaynakları gösterir, görünüm için kullanıcı seçimini bekler ve paneli korur', async () => {
  server.use(
    http.get(url + '/conversations', () => HttpResponse.json({ conversations: [] })),
    http.post(url + '/chat', async ({ request }) => {
      expect(request.headers.get('X-Nizamio-Program')).toBe('p1')
      expect(request.headers.get('X-Nizamio-Department')).toBeNull()
      expect(request.headers.get('X-Requested-With')).toBeTruthy()
      expect(await request.json()).toEqual({ soru: 'Geciken görevlerimi göster' })
      return listen(
        frame('metin', { metin: 'Üye-1 · <b>Geciken</b>' }) +
          frame('gorunum', {
            gorunum: 'gorev_listesi',
            filtre: { program: 'p1', yalniz_geciken: 'true' },
          }) +
          frame('gorunum', { gorunum: 'pano', filtre: { program: 'p2' } }) +
          frame('adlar', { adlar: { 'Üye-1': 'Ayşe' } }) +
          frame('kaynaklar', { kaynaklar: ['hafiza_ara'] }) +
          frame('bitti', { sohbet_id: 'c1' }),
      )
    }),
  )
  const router = await setup()
  await vi.waitFor(() => expect(button('Geciken görevlerimi göster').disabled).toBe(false))
  button('Geciken görevlerimi göster').click()
  await vi.waitFor(() => expect(panel().textContent).toContain('Ayşe · <b>Geciken</b>'))
  expect(panel().querySelector('b')).toBeNull()
  expect(panel().querySelector('a[href="/kurumsal-hafiza"]')).not.toBeNull()
  expect(router.currentRoute.value.path).toBe('/')
  expect(document.querySelector('[role=dialog]')).toBeNull()
  button('Görünümü aç').click()
  await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/gorevler?durum=geciken'))
  expect(panel()).not.toBeNull()
})

it('akış hatasında tamamlanmamış metni veya görünüm önerisini göstermez', async () => {
  server.use(
    http.get(url + '/conversations', () => HttpResponse.json({ conversations: [] })),
    http.post(url + '/chat', () =>
      listen(
        frame('metin', { metin: 'Ara cevap' }) +
          frame('hata', { kod: 'assistant.provider_unavailable', mesaj: 'ham mesaj' }),
      ),
    ),
  )
  await setup()
  await vi.waitFor(() => expect(button('Geciken görevlerimi göster').disabled).toBe(false))
  button('Geciken görevlerimi göster').click()
  await vi.waitFor(() => expect(panel().textContent).toContain('hizmeti şu anda kullanılamıyor'))
  expect(panel().textContent).not.toContain('Ara cevap')
  expect(panel().textContent).not.toContain('ham mesaj')
})

it('geçmişi açar ve yalnız açık kullanıcı onayıyla sohbeti siler', async () => {
  const remove = vi.fn(() => new HttpResponse(null, { status: 204 }))
  server.use(
    http.get(url + '/conversations', () => HttpResponse.json({ conversations: [record] })),
    http.get(url + '/conversations/c1', () =>
      HttpResponse.json({
        conversation: record,
        messages: [{ sira: 1, rol: 'asistan', icerik: 'Kaydedilmiş cevap', created_at: '' }],
      }),
    ),
    http.delete(url + '/conversations/c1', remove),
  )
  await setup()
  await vi.waitFor(() => expect(button('Geçmiş').disabled).toBe(false))
  button('Geçmiş').click()
  await vi.waitFor(() => expect(button('Önceki soru')?.disabled).toBe(false))
  button('Önceki soru').click()
  await vi.waitFor(() => expect(panel().textContent).toContain('Kaydedilmiş cevap'))
  button('Sohbeti sil').click()
  await vi.waitFor(() => expect(button('Sil')).toBeDefined())
  expect(remove).not.toHaveBeenCalled()
  button('Sil').click()
  await vi.waitFor(() => expect(panel().textContent).toContain('Sohbet silindi.'))
  expect(remove).toHaveBeenCalledOnce()
})
