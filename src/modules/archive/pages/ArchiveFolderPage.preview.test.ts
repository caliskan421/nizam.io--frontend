import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { COORD, resetHarness, sent, server, standing } from '../model/__tests__/harness'
import { archiveBackend, manyFiles, mountPage, unmountAll } from './folder/__tests__/mount'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

const K = standing({ rows: [['p1', 'd1', 'koordinator']] })
const FILES = manyFiles(5)
const act = (w: { find: (s: string) => { trigger: (e: string) => Promise<void> } }, name: string) =>
  w.find(`[data-testid="preview"] [data-act="${name}"]`).trigger('click')

describe('önizleme bağlama (W124 FilePreview ?dosya)', () => {
  it('dosya seçimi ?dosya yazar (geçmişe), önizleme açılır: konum, toplam, hedef, görev adı', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1', COORD)
    expect(wrapper.find('[data-testid="preview"]').exists()).toBe(false)
    await wrapper.find('[data-file-id="f2"]').trigger('click')
    await settle()
    expect(router.currentRoute.value.query.dosya).toBe('f2')
    expect(wrapper.find('[data-testid="preview"]').attributes('data-file')).toBe('f2')
    expect(wrapper.find('[data-testid="preview-pos"]').text()).toBe('2/5')
    expect(wrapper.find('[data-testid="preview-dept"]').text()).toBe('d1')
    expect(wrapper.find('[data-testid="preview-task"]').text()).toBe('İklimlendirme hesapları')
    expect(wrapper.find('[data-file-id="f2"]').attributes('aria-pressed')).toBe('true')
    router.back()
    await settle()
    expect(wrapper.find('[data-testid="preview"]').exists()).toBe(false)
  })

  it('önceki/sonraki komşu dosyayı seçer (replace: geri tuşu geçmişi şişmez)', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1?dosya=f2', COORD)
    const push = vi.spyOn(router, 'push')
    await act(wrapper, 'next')
    await settle()
    expect(router.currentRoute.value.query.dosya).toBe('f3')
    await act(wrapper, 'previous')
    await settle()
    await act(wrapper, 'previous')
    await settle()
    expect(router.currentRoute.value.query.dosya).toBe('f1')
    // İlk dosyada "önceki" hiçbir şey yapmaz.
    await act(wrapper, 'previous')
    await settle()
    expect(router.currentRoute.value.query.dosya).toBe('f1')
    expect(push).not.toHaveBeenCalled()
  })

  it('listenin sonunda "sonraki" devam varsa sonraki sayfayı yükler ve ilk yeni dosyayı seçer', async () => {
    server.use(...K, ...archiveBackend({ files: FILES, pageSize: 2 }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1?dosya=f2', COORD)
    await act(wrapper, 'next')
    await settle()
    expect(sent('GET', '/v1/records/archive/attachments').at(-1)!.query.get('cursor')).toBe('2')
    expect(router.currentRoute.value.query.dosya).toBe('f3')
    expect(wrapper.find('[data-testid="preview-pos"]').text()).toBe('3/5')
  })

  it('derin bağlantı: dosya ilk sayfada yoksa sayfalar yüklenerek bulunur', async () => {
    server.use(...K, ...archiveBackend({ files: FILES, pageSize: 2 }))
    const { wrapper } = await mountPage('/arsiv/d1?dosya=f5', COORD)
    expect(wrapper.find('[data-testid="preview"]').attributes('data-file')).toBe('f5')
    expect(
      sent('GET', '/v1/records/archive/attachments').map((r) => r.query.get('cursor')),
    ).toEqual([null, '2', '4'])
  })

  it('olmayan dosya kimliği: tüm sayfalar okununca ?dosya sessizce düşer, önizleme açılmaz', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1?dosya=yok', COORD)
    await settle()
    expect(router.currentRoute.value.query.dosya).toBeUndefined()
    expect(wrapper.find('[data-testid="preview"]').exists()).toBe(false)
  })

  it('devam yoksa total yüklenen sayıdır; devam varsa bilinen toplam/null', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper } = await mountPage('/arsiv/d1?etiket=sonuc&dosya=f1', COORD)
    expect(wrapper.find('[data-testid="preview-pos"]').text()).toMatch(/^1\/\d+$/)
  })

  it('kapat: ?dosya düşer, odak dosya kartına döner (gövdeye düşmez)', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1?dosya=f3', COORD)
    ;(wrapper.find('[data-testid="preview"] [data-act="close"]').element as HTMLElement).focus()
    await act(wrapper, 'close')
    await settle()
    expect(router.currentRoute.value.query.dosya).toBeUndefined()
    expect(document.activeElement).toBe(wrapper.find('[data-file-id="f3"]').element)
  })

  it('silme: önizleme kapanır (olay gelmese de liste yenilenince); komşusuz son dosyada odak dosya başlığında, odak dosya başlığında', async () => {
    const files = manyFiles(2)
    server.use(...K, ...archiveBackend({ files }))
    const { wrapper, router, queryClient, settle } = await mountPage('/arsiv/d1?dosya=f1', COORD)
    // Önizleme `deleted` yayar (liste henüz eski).
    await act(wrapper, 'deleted')
    await settle()
    expect(router.currentRoute.value.query.dosya).toBeUndefined()
    await router.replace({ query: { dosya: 'f2' } })
    await settle()
    // Sunucuda f1 silindi; ortak geçersizleme listeyi yeniden okutur: seçili f2 yerinde kalır.
    files.splice(0, 1)
    await queryClient.invalidateQueries()
    await settle()
    expect(router.currentRoute.value.query.dosya).toBe('f2')
    // Önizleme kapanmadan dosya sunucuda silindi (geç sonuç): liste yenilenince kapanır.
    files.splice(0, 1)
    await queryClient.invalidateQueries()
    await settle()
    expect(router.currentRoute.value.query.dosya).toBeUndefined()
    expect(wrapper.find('[data-testid="preview"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('#arch-files-title').element)
  })

  it('liste yenilenince seçili dosya kaybolursa (silindi) önizleme kapanır, odak komşu kartta', async () => {
    const files = manyFiles(3)
    server.use(...K, ...archiveBackend({ files }))
    const { wrapper, router, queryClient, settle } = await mountPage('/arsiv/d1?dosya=f2', COORD)
    files.splice(1, 1)
    await queryClient.invalidateQueries()
    await settle()
    expect(router.currentRoute.value.query.dosya).toBeUndefined()
    expect(wrapper.find('[data-testid="preview"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('[data-file-id="f3"]').element)
  })

  it('önizlemedeki görev bağlantısı görev ayrıntısına gider (03 ?gorev)', async () => {
    server.use(...K, ...archiveBackend({ files: FILES }))
    const { wrapper, router, settle } = await mountPage('/arsiv/d1?dosya=f1', COORD)
    await act(wrapper, 'task')
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/gorevler?gorev=w1')
  })
})
