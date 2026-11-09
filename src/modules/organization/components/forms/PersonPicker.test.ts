import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { JsonBodyType } from 'msw'
import { defineComponent, h as render, nextTick, ref } from 'vue'

import { ADMIN_SCOPE, http, json, knownUser, ORIGIN, sent, server } from '../../__tests__/harness'
import type { PersonOption } from '../../model/types'
import { $, formsHarness, resetForms, setValue } from './__tests__/harness'
import PersonPicker from './PersonPicker.vue'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  vi.useRealTimers()
  resetForms()
})
afterAll(() => server.close())

const USERS = `${ORIGIN}/v1/admin/users`

/** `v-model` taşıyıcısı: seçimi gerçek bir üst bileşen gibi tutar. */
const Host = defineComponent({
  props: { exclude: { type: Array as () => string[], default: () => [] } },
  setup(props) {
    const value = ref<PersonOption | null>(null)
    return { value, props }
  },
  render() {
    return render(PersonPicker, {
      modelValue: this.value,
      'onUpdate:modelValue': (v: PersonOption | null) => (this.value = v),
      excludeAccountIds: this.props.exclude,
      label: 'Kişi',
    })
  },
})

function usersHandler(pages: Record<string, JsonBodyType> = {}) {
  server.use(
    http.get(USERS, ({ request }) => {
      const url = new URL(request.url)
      const cursor = url.searchParams.get('cursor')
      if (cursor && pages[cursor]) return json(pages[cursor])
      return json({
        users: [knownUser('u1', 'Ayşe Yılmaz'), knownUser('u2', 'Bora Kaya')],
        next_cursor: pages.next ? 'c2' : '',
      })
    }),
  )
}

async function mountPicker(exclude: string[] = []) {
  const h = formsHarness(ADMIN_SCOPE)
  const wrapper = h.mount(Host, { exclude })
  await h.flush()
  return { h, wrapper }
}

describe('PersonPicker (E-08-33/79 seçici; P3)', () => {
  it('etkinleşmeden istek yok; odakta listUsers (sort_by=name, asc) ve seçenekler', async () => {
    usersHandler()
    const { h } = await mountPicker()
    expect(sent('GET', '/v1/admin/users')).toHaveLength(0)
    const input = $('[name="person-search"]') as HTMLInputElement
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-label')).toBe('Kişi')
    // W82a: liste yokken `aria-controls` olmayan öğeye başvurmaz; açılınca listeyi gösterir.
    expect(input.hasAttribute('aria-controls')).toBe(false)
    input.dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect($('[role="option"]')).not.toBeNull())
    await h.flush()
    const [req] = sent('GET', '/v1/admin/users')
    expect(req!.query.get('sort_by')).toBe('name')
    expect(req!.query.get('sort_order')).toBe('asc')
    expect(req!.query.get('search')).toBeNull()
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(
      document.getElementById(input.getAttribute('aria-controls')!)?.getAttribute('role'),
    ).toBe('listbox')
    expect(document.body.querySelectorAll('[role="option"]')).toHaveLength(2)
  })

  it('arama ~300 ms gecikmeli sunucu search ile (sahte saat); hariç tutulanlar düşer', async () => {
    usersHandler()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { h } = await mountPicker(['u2'])
    ;($('[name="person-search"]') as HTMLInputElement).dispatchEvent(new Event('focus'))
    await h.flush()
    setValue('[name="person-search"]', 'ay')
    setValue('[name="person-search"]', 'ayş')
    await vi.advanceTimersByTimeAsync(299)
    expect(sent('GET', '/v1/admin/users').some((r) => r.query.get('search'))).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    vi.useRealTimers()
    await vi.waitFor(() =>
      expect(sent('GET', '/v1/admin/users').map((r) => r.query.get('search'))).toContain('ayş'),
    )
    await h.flush()
    const names = [...document.body.querySelectorAll('[role="option"]')].map((o) => o.textContent)
    expect(names.join()).toContain('Ayşe')
    expect(names.join()).not.toContain('Bora')
  })

  it('tıkla seç → v-model; seçili çip kaldırılınca arama döner', async () => {
    usersHandler()
    const { h, wrapper } = await mountPicker()
    ;($('[name="person-search"]') as HTMLInputElement).dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect($('[data-account="u1"]')).not.toBeNull())
    $('[data-account="u1"]')!.click()
    await nextTick()
    expect(wrapper.vm.value).toEqual({ accountId: 'u1', fullName: 'Ayşe Yılmaz' })
    expect($('[data-testid="picker-selected"]')?.textContent).toContain('Ayşe Yılmaz')
    expect($('[name="person-search"]')).toBeNull()
    ;($('.t-chip__x') as HTMLButtonElement).click()
    await h.flush()
    expect(wrapper.vm.value).toBeNull()
    expect($('[name="person-search"]')).not.toBeNull()
  })

  it('klavye: ↓ ↓ Enter ikinciyi seçer; aria-activedescendant izler', async () => {
    usersHandler()
    const { wrapper } = await mountPicker()
    const input = $('[name="person-search"]') as HTMLInputElement
    input.dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect($('[role="option"]')).not.toBeNull())
    const key = (k: string) => input.dispatchEvent(new KeyboardEvent('keydown', { key: k }))
    key('ArrowDown')
    key('ArrowDown')
    await nextTick()
    expect(input.getAttribute('aria-activedescendant')).toMatch(/-1$/)
    key('Enter')
    await nextTick()
    expect(wrapper.vm.value).toEqual({ accountId: 'u2', fullName: 'Bora Kaya' })
  })

  it('boş sonuç metni; "Daha fazla yükle" imleçle sonraki sayfa', async () => {
    usersHandler({
      next: true,
      c2: { users: [knownUser('u3', 'Cem Er')], next_cursor: '' },
    })
    const { h } = await mountPicker(['u1', 'u2'])
    ;($('[name="person-search"]') as HTMLInputElement).dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect($('[data-testid="picker-empty"]')).not.toBeNull())
    $('[data-testid="picker-more"]')!.click()
    await vi.waitFor(() => expect($('[data-account="u3"]')).not.toBeNull())
    await h.flush()
    expect(sent('GET', '/v1/admin/users')[1]!.query.get('cursor')).toBe('c2')
    expect($('[data-testid="picker-more"]')).toBeNull()
  })
})
