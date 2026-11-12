import { enableAutoUnmount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
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
import { PREVIEW_MAX_BYTES } from '../../model/mime'
import FilePreview from './FilePreview.vue'
import { file, mountWith, stubObjectUrls, target } from './__tests__/support'

let urls: ReturnType<typeof stubObjectUrls>
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  urls = stubObjectUrls()
  // Varsayılan yan okuma (yükleyen adı); testler gerektiğinde üzerine yazar.
  server.use(taskFiles('Ali Avcı'))
})
afterEach(() => {
  resetHarness()
  useToast().clear()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})
afterAll(() => server.close())
enableAutoUnmount(afterEach)

const png = () =>
  http.get(`${ORIGIN}/v1/files/f1/download`, () =>
    HttpResponse.arrayBuffer(new Uint8Array([137, 80, 78, 71]).buffer, {
      headers: { 'Content-Type': 'image/png' },
    }),
  )
const taskFiles = (name: string | null) =>
  http.get(`${ORIGIN}/v1/work-items/w1/files`, () =>
    json({
      files: [
        {
          file_id: 'f1',
          work_item_id: 'w1',
          display_name: 'foto.png',
          content_type: 'image/png',
          size_bytes: 10,
          tag: 'sonuc',
          uploaded_by_account_id: 'me-1',
          uploaded_by_full_name: name,
        },
      ],
    }),
  )

function preview(
  props: Record<string, unknown> = {},
  standing: object | null = { companyAdmin: true },
) {
  return mountWith(
    FilePreview,
    {
      file: file({ content_type: 'image/png', display_name: 'foto.png', size_bytes: 408_781 }),
      position: 2,
      total: 15,
      hasMore: false,
      target,
      taskTitle: 'Gölgelendirme çalışmaları',
      ...props,
    },
    { standing },
  )
}
const q = (id: string) => document.body.querySelector<HTMLElement>(`[data-testid="${id}"]`)
const text = (id: string) => q(id)?.textContent?.replace(/\s+/g, ' ').trim()
const btn = (id: string) => q(id) as HTMLButtonElement

describe('FilePreview başlık ve gezinme (E-06-46…48)', () => {
  it('"i / N", toplam bilinmiyorsa "i / i+", devam varsa "N+"', async () => {
    const { wrapper } = preview({}, null)
    expect(text('preview-position')).toBe('2 / 15')
    await wrapper.setProps({ hasMore: true })
    expect(text('preview-position')).toBe('2 / 15+')
    await wrapper.setProps({ total: null })
    expect(text('preview-position')).toBe('2 / 2+')
  })

  it('önceki/sonraki olayları yayar; ilk dosyada önceki, son dosyada (devam yoksa) sonraki devre dışı', async () => {
    const { wrapper } = preview({}, null)
    btn('preview-previous').click()
    btn('preview-next').click()
    expect(wrapper.emitted('previous')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
    await wrapper.setProps({ position: 1 })
    expect(btn('preview-previous').disabled).toBe(true)
    await wrapper.setProps({ position: 15 })
    expect(btn('preview-next').disabled).toBe(true)
  })

  it('son yüklenen dosyada devam varsa sonraki etkindir (üst bileşen sayfa yükler)', () => {
    const { wrapper } = preview({ position: 15, hasMore: true }, null)
    expect(btn('preview-next').disabled).toBe(false)
    btn('preview-next').click()
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('düğme devre dışı kalınca odak gövdeye düşmez', async () => {
    const { wrapper } = preview({ position: 2, total: 3 }, null)
    btn('preview-next').focus()
    btn('preview-next').click()
    await wrapper.setProps({ position: 3 })
    await nextTick()
    await nextTick()
    expect(btn('preview-next').disabled).toBe(true)
    expect(document.activeElement).not.toBe(document.body)
    expect(document.activeElement).toBe(btn('preview-previous'))
  })
})

describe('FilePreview kapanış ve odak (KESİN 27)', () => {
  function opened() {
    const card = document.createElement('button')
    card.dataset.fileId = 'f1'
    document.body.appendChild(card)
    card.focus()
    return { card, ...preview({}, null) }
  }

  it('✕ ile kapanır: close yayılır, odak dosya kartına döner', async () => {
    const { card, wrapper } = opened()
    btn('preview-close').focus()
    btn('preview-close').click()
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.activeElement).toBe(card)
  })

  it('Esc ile kapanır: close yayılır, odak dosya kartına döner', async () => {
    const { card, wrapper } = opened()
    q('file-preview')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.activeElement).toBe(card)
  })

  it('panel bölgesi adlı (aside) ve dosya kimliği taşır', () => {
    preview({}, null)
    expect(q('file-preview')!.tagName).toBe('ASIDE')
    expect(q('file-preview')!.getAttribute('aria-label')).toBe('Dosya önizleme')
  })
})

describe('FilePreview önizleme alanı (E-06-49/50, BE-026)', () => {
  it('raster görsel: dosyanın departman başlığıyla okunur, blob: img olarak gösterilir; sökülünce URL serbest', async () => {
    server.use(png())
    const { h, wrapper } = preview({}, null)
    await settleQueries(h.queryClient)
    const img = q('preview-image') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('blob:onizleme-1')
    expect(img.alt).toContain('foto.png')
    const [req] = sent('GET', '/v1/files/f1/download')
    expect(req!.headers.get('X-Nizamio-Department')).toBe('d1')
    expect(req!.headers.get('Idempotency-Key')).toBeNull()
    wrapper.unmount()
    expect(urls.revoked).toEqual(['blob:onizleme-1'])
  })

  it('görsel yüklenirken durum metni gösterilir', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.get(`${ORIGIN}/v1/files/f1/download`, async () => {
        await gate
        return HttpResponse.arrayBuffer(new Uint8Array([1]).buffer)
      }),
    )
    const { h } = preview({}, null)
    await nextTick()
    expect(q('preview-loading')).not.toBeNull()
    release()
    await settleQueries(h.queryClient)
    expect(q('preview-image')).not.toBeNull()
  })

  it('okuma hatası: i18n metni + yeniden dene (sunucu message yok)', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/files/f1/download`, () =>
        errorEnvelope('records.file_not_found', 404),
      ),
    )
    const { h } = preview({}, null)
    await settleQueries(h.queryClient)
    expect(text('preview-failed')).toBe('Önizleme yüklenemedi.')
    server.use(png())
    btn('preview-retry').click()
    await settleQueries(h.queryClient)
    expect(q('preview-image')).not.toBeNull()
  })

  it.each([
    ['PDF', { content_type: 'application/pdf', display_name: 'a.pdf' }, 'PDF', 'önizleme yok'],
    [
      'SVG (gömülmez)',
      { content_type: 'image/svg+xml', display_name: 'a.svg' },
      'Resim',
      'önizleme yok',
    ],
    [
      'HTML (gömülmez)',
      { content_type: 'text/html', display_name: 'a.html' },
      'Metin',
      'önizleme yok',
    ],
    ['çok büyük görsel', { size_bytes: PREVIEW_MAX_BYTES + 1 }, 'Resim', 'çok büyük'],
  ])('%s: istek yok, <img> yok, nötr tür rozeti', async (_n, over, badge, note) => {
    const { h } = preview({ file: file({ content_type: 'image/png', ...over }) }, null)
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/files/f1/download')).toHaveLength(0)
    expect(q('preview-image')).toBeNull()
    expect(text('preview-badge')).toBe(badge)
    expect(text('preview-none')).toContain(note)
    expect(document.body.querySelector('iframe, object, embed')).toBeNull()
  })

  it('tam ekran devre dışı ve designStub BE-026 ile işaretli', () => {
    preview({}, null)
    expect(btn('preview-fullscreen').disabled).toBe(true)
    expect(document.body.querySelector('[data-design-stub="BE-026"]')).not.toBeNull()
  })
})

describe('FilePreview ayrıntıları (E-06-51…55)', () => {
  it('ad, tür · boyut', () => {
    preview({}, null)
    expect(text('preview-name')).toBe('foto.png')
    expect(text('preview-meta')).toBe('Resim · 399,2 KB')
  })

  it('Görev bağlantısı openTask(work_item_id) yayar; başlık yoksa nötr metin', async () => {
    const { wrapper } = preview({}, null)
    expect(text('preview-task')).toBe('Gölgelendirme çalışmaları')
    btn('preview-task').click()
    expect(wrapper.emitted('openTask')).toEqual([['w1']])
    await wrapper.setProps({ taskTitle: null })
    expect(text('preview-task')).toBe('Görevi aç')
    btn('preview-task').click()
    expect(wrapper.emitted('openTask')).toHaveLength(2)
  })

  it('Etiket Türkçe ad + token noktası; bilinmeyen etiket olduğu gibi nötr', async () => {
    const { wrapper } = preview({}, null)
    expect(text('preview-tag')).toBe('Sonuç')
    await wrapper.setProps({ file: file({ content_type: 'application/pdf', tag: 'ozel' }) })
    expect(text('preview-tag')).toBe('ozel')
  })

  it('Yükleyen listWorkItemFiles adından; null → nötr "—" (kimlikten ad uydurulmaz)', async () => {
    server.use(png(), taskFiles('Ali Avcı'))
    const first = preview({}, null)
    await settleQueries(first.h.queryClient)
    expect(text('preview-uploader')).toBe('Ali Avcı')
    first.wrapper.unmount()
    document.body.innerHTML = ''

    server.use(png(), taskFiles(null))
    const second = preview({}, null)
    await settleQueries(second.h.queryClient)
    expect(text('preview-uploader')).toBe('—')
    expect(text('preview-uploader')).not.toContain('me-1')
  })

  it('Tarih statik "—" (BE-070), tahmin edilmez', () => {
    preview({}, null)
    expect(text('preview-date')).toBe('—')
    expect(q('preview-date')!.querySelector('[data-design-stub="BE-070"]')).not.toBeNull()
  })

  it('alt görev bağlıysa adı alt görev listesinden (403 work.not_assigned → nötr)', async () => {
    server.use(
      png(),
      http.get(`${ORIGIN}/v1/work-items/w1/subtasks`, () =>
        errorEnvelope('work.not_assigned', 403),
      ),
    )
    const { h } = preview({ file: file({ content_type: 'image/png', subtask_id: 's1' }) }, null)
    await settleQueries(h.queryClient)
    expect(text('preview-subtask')).toBe('—')
  })

  it('görev/alt görev/yükleyen okumaları yalnız seçili dosya için (liste fan-out yok)', async () => {
    server.use(png(), taskFiles('Ali Avcı'))
    const { h } = preview({}, null)
    await settleQueries(h.queryClient)
    expect(sent('GET', '/v1/work-items/w1/files')).toHaveLength(1)
    expect(sent('GET', '/v1/work-items/w1/subtasks')).toHaveLength(0)
  })
})
