import { flushPromises } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  COORD_SCOPE,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  sent,
  server,
  subtask,
  workItem,
} from '../../model/__tests__/harness'
import SubtaskAdd from './SubtaskAdd.vue'
import { cleanupSubtasks, mountSubtasks } from './__tests__/subtask-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => cleanupSubtasks())
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/subtasks'

function setup() {
  return mountSubtasks(
    SubtaskAdd,
    { item: workItem(), variant: 'block' },
    { role: 'koordinator' },
    COORD_SCOPE,
  ).wrapper
}

describe('SubtaskAdd (E-03-37)', () => {
  it('yer tutucu + erişim adı; "Ekle" yalnız taslak doluyken', async () => {
    const w = setup()
    const input = w.get('[data-testid="subtask-add-input"]')
    expect(input.attributes('placeholder')).toBe('Alt görev ekle ve Enter’a bas')
    expect(input.attributes('aria-label')).toBe('Rapor için alt görev ekle')
    expect(w.find('[data-testid="subtask-add-submit"]').exists()).toBe(false)
    await input.setValue('  ')
    expect(w.find('[data-testid="subtask-add-submit"]').exists()).toBe(false)
    await input.setValue('Çizim')
    expect(w.find('[data-testid="subtask-add-submit"]').exists()).toBe(true)
  })

  it('Enter: istek, başarıda taslak temizlenir ve odak girişte kalır', async () => {
    server.use(http.post(`${ORIGIN}${PATH}`, () => json(subtask(), 201)))
    const w = setup()
    const input = w.get<HTMLInputElement>('[data-testid="subtask-add-input"]')
    input.element.focus()
    await input.setValue('Çizim')
    await input.trigger('keydown', { key: 'Enter' })
    await vi.waitFor(() => expect(input.element.value).toBe(''))
    expect(document.activeElement).toBe(input.element)
    expect(sent('POST', PATH)[0]!.body).toEqual({ title: 'Çizim' })
  })

  it('sonuç bilinmiyor: taslak korunur, yerinde "Yeniden gönder" AYNI anahtarla', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}${PATH}`, () =>
        ++calls === 1 ? errorEnvelope('platform.internal', 503) : json(subtask(), 201),
      ),
    )
    const w = setup()
    const input = w.get<HTMLInputElement>('[data-testid="subtask-add-input"]')
    await input.setValue('Çizim')
    await w.get('[data-testid="subtask-add-submit"]').trigger('click')
    await vi.waitFor(() => expect(w.find('[data-testid="outcome-notice"]').exists()).toBe(true))
    expect(input.element.value).toBe('Çizim')
    await w.get('[data-testid="outcome-retry"]').trigger('click')
    await vi.waitFor(() => expect(input.element.value).toBe(''))
    await flushPromises()
    const [first, second] = sent('POST', PATH).map((r) => r.headers.get('Idempotency-Key'))
    expect(second).toBe(first)
    expect(w.find('[data-testid="outcome-notice"]').exists()).toBe(false)
  })
})
