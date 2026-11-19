import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  ADMIN,
  errorEnvelope,
  harness,
  http,
  HttpResponse,
  ORIGIN,
  resetHarness,
  s3Requests,
  server,
} from '../../model/__tests__/harness'
import PreviewArea from '../preview/PreviewArea.vue'
import FileGrid from './FileGrid.vue'
import { BASE, file } from './files.fixtures'

const intersections = new Map<Element, (visible: boolean) => void>()
const created = vi.fn(() => 'blob:small')
const revoked = vi.fn()
const mounted: Array<() => void> = []

class TestObserver {
  private target?: Element

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element) {
    this.target = target
    intersections.set(target, (visible) => {
      this.callback(
        [{ isIntersecting: visible } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
    })
  }

  disconnect() {
    if (this.target) intersections.delete(this.target)
  }
}

function visibility(
  wrapper: ReturnType<typeof mount<typeof FileGrid>>,
  id: string,
  visible: boolean,
) {
  const card = wrapper.get(`[data-file-id="${id}"] .arch-card__image-frame`)
  intersections.get(card.element)!(visible)
  return flushPromises()
}

function setupGrid() {
  const h = harness(ADMIN)
  const wrapper = mount(FileGrid, {
    global: { plugins: [[VueQueryPlugin, { queryClient: h.queryClient }]] },
    props: {
      ...BASE,
      programId: 'p1',
      files: [
        file({ file_id: 'pdf', department_id: 'd9' }),
        file({ file_id: 'png', department_id: 'd4', content_type: 'image/png' }),
        file({ file_id: 'svg', content_type: 'image/svg+xml' }),
      ],
    },
  })
  mounted.push(() => wrapper.unmount())
  return { ...h, wrapper }
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', TestObserver)
  Object.assign(URL, { createObjectURL: created, revokeObjectURL: revoked })
})
afterEach(() => {
  for (const cleanup of mounted.splice(0)) cleanup()
  resetHarness()
  intersections.clear()
  vi.clearAllMocks()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
afterAll(() => server.close())

describe('Arşiv kartı küçük resimleri', () => {
  it('görünür PDF için satır kapsamında JPEG okur, görünümden çıkınca URL ve veriyi bırakır', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/files/pdf/thumbnail`, () =>
        HttpResponse.arrayBuffer(new Uint8Array([255, 216, 255, 217]).buffer, {
          headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' },
        }),
      ),
    )
    const { queryClient, wrapper } = setupGrid()
    expect(intersections.size).toBe(2)
    expect(s3Requests()).toHaveLength(0)
    expect(wrapper.get('[data-file-id="svg"] .arch-badge').text()).toBe('IMG')

    await visibility(wrapper, 'pdf', true)
    await settleQueries(queryClient)

    const [request] = s3Requests()
    expect(request?.path).toBe('/v1/files/pdf/thumbnail')
    expect(request?.headers.get('X-Nizamio-Program')).toBe('p1')
    expect(request?.headers.get('X-Nizamio-Department')).toBe('d9')
    expect(s3Requests()).toHaveLength(1)
    expect(wrapper.get('img').attributes('src')).toBe('blob:small')

    await visibility(wrapper, 'pdf', false)

    expect(wrapper.find('img').exists()).toBe(false)
    expect(revoked).toHaveBeenCalledWith('blob:small')
    await vi.waitFor(() => expect(queryClient.getQueryCache().getAll()).toHaveLength(0))
  })

  it('kart ve seçili PDF paneli aynı kapsamlı türev okumasını paylaşır', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/files/pdf/thumbnail`, () =>
        HttpResponse.arrayBuffer(new Uint8Array([255, 216, 255, 217]).buffer, {
          headers: { 'Content-Type': 'image/jpeg' },
        }),
      ),
    )
    const { queryClient, wrapper } = setupGrid()
    await visibility(wrapper, 'pdf', true)
    await settleQueries(queryClient)
    const panel = mount(PreviewArea, {
      props: {
        file: file({ file_id: 'pdf', department_id: 'd9' }),
        target: { programId: 'p1', departmentId: 'd9' },
        typeName: 'PDF',
      },
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    })
    mounted.push(() => panel.unmount())
    await settleQueries(queryClient)

    expect(panel.get('img').attributes('src')).toBe('blob:small')
    expect(s3Requests()).toHaveLength(1)
    await visibility(wrapper, 'pdf', false)
    expect(panel.find('img').exists()).toBe(true)
  })

  it('kart ekrandan çıktığında bekleyen ağ isteğini keser', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const request = input as Request
      return new Promise((_resolve, reject) => {
        request.signal.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          {
            once: true,
          },
        )
      })
    })
    const { wrapper } = setupGrid()
    await visibility(wrapper, 'pdf', true)
    await vi.waitFor(() => expect(network).toHaveBeenCalledTimes(1))
    const request = network.mock.calls[0]?.[0] as Request
    expect(request.cache).toBe('no-store')
    expect(request.signal.aborted).toBe(false)
    await visibility(wrapper, 'pdf', false)
    expect(request.signal.aborted).toBe(true)

    expect(created).not.toHaveBeenCalled()
    expect(wrapper.get('[data-file-id="pdf"] .arch-badge').text()).toBe('PDF')
  })

  it('türev yoksa kartı korur, aynı hatayı otomatik tekrar denemez', async () => {
    server.use(
      http.get(`${ORIGIN}/v1/files/png/thumbnail`, () =>
        errorEnvelope('records.preview_unavailable', 422),
      ),
    )
    const { queryClient, wrapper } = setupGrid()
    await visibility(wrapper, 'png', true)
    await settleQueries(queryClient)

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('[data-file-id="png"] .arch-badge').text()).toBe('IMG')
    expect(s3Requests()).toHaveLength(1)
  })
})
