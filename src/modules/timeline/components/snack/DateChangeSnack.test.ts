import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import DateChangeSnack from './DateChangeSnack.vue'
import type { DateChangeSnackProps } from '../index'

const BASE: DateChangeSnackProps = {
  face: 'admin',
  title: 'Hidrofor kurulumu',
  before: { start: '2026-06-22', end: '2026-09-10' },
  after: { start: '2026-06-22', end: '2026-10-01' },
  remainingMs: 5000,
  totalMs: 5000,
}

const wrappers: VueWrapper[] = []
afterEach(() => {
  for (const w of wrappers.splice(0)) w.unmount()
  document.body.replaceChildren()
})

function mountSnack(props: Partial<DateChangeSnackProps> = {}) {
  const w = mount(DateChangeSnack, { props: { ...BASE, ...props }, attachTo: document.body })
  wrappers.push(w)
  return w
}

describe('DateChangeSnack — metinler (E-03C-68/69)', () => {
  it('Admin, yalnız bitiş ileri → "süresi N gün uzatıldı" + eski → yeni aralık + bitiş rozeti', () => {
    const w = mountSnack()
    expect(w.attributes('role')).toBe('status')
    expect(w.text()).toContain('Hidrofor kurulumu süresi 21 gün uzatıldı')
    expect(w.find('.rp-snack__old').text()).toBe('22 Haz – 10 Eyl')
    expect(w.find('.rp-snack__new').text()).toBe('22 Haz – 01 Eki')
    expect(w.findAll('.rp-snack__delta').map((b) => b.text())).toEqual(['bitiş +21 gün'])
    expect(w.text()).not.toContain('Değişiklik onaya gider')
  })

  it('Admin, kısaltma ya da başlangıç kayması → "tarihleri değişti" + her fark için rozet', () => {
    const w = mountSnack({
      after: { start: '2026-06-20', end: '2026-09-05' },
    })
    expect(w.text()).toContain('Hidrofor kurulumu tarihleri değişti')
    expect(w.findAll('.rp-snack__delta').map((b) => b.text())).toEqual([
      'başlangıç -2 gün',
      'bitiş -5 gün',
    ])
  })

  it('uzatma sınırı: 90 günden fazla ileri → "tarihleri değişti"', () => {
    const w = mountSnack({ after: { start: '2026-06-22', end: '2027-01-01' } })
    expect(w.text()).toContain('tarihleri değişti')
  })

  it('Koordinatör → "için tarih talebi gönderiliyor" + "Değişiklik onaya gider"', () => {
    const w = mountSnack({ face: 'coordinator' })
    expect(w.text()).toContain('Hidrofor kurulumu için tarih talebi gönderiliyor')
    expect(w.text()).toContain('Değişiklik onaya gider')
  })
})

describe('DateChangeSnack — eylemler', () => {
  it('İptal et → cancel; ✕ → dismiss (ikisi ayrı olay)', async () => {
    const w = mountSnack()
    await w.find('.rp-snack__undo').trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
    expect(w.emitted('dismiss')).toBeUndefined()
    const x = w.find('.rp-snack__x')
    expect(x.attributes('aria-label')).toBe('Kapat')
    await x.trigger('click')
    expect(w.emitted('dismiss')).toHaveLength(1)
    expect(w.emitted('cancel')).toHaveLength(1)
  })

  it('Esc bildirimi kapatır (dismiss), iptal etmez', async () => {
    const w = mountSnack()
    await w.trigger('keydown', { key: 'Escape' })
    expect(w.emitted('dismiss')).toHaveLength(1)
    expect(w.emitted('cancel')).toBeUndefined()
  })
})

describe('DateChangeSnack — geri sayım çubuğu (E-03C-72)', () => {
  const left = (w: VueWrapper) =>
    (w.find('.rp-snack__bar').element as HTMLElement).style.getPropertyValue('--snack-left')

  it('kalan süre oranı CSS değişkeninde; 0–1 aralığına kırpılır', async () => {
    const w = mountSnack({ remainingMs: 2500 })
    expect(left(w)).toBe('0.5')
    await w.setProps({ remainingMs: 0 })
    expect(left(w)).toBe('0')
    await w.setProps({ remainingMs: 9000 })
    expect(left(w)).toBe('1')
    await w.setProps({ totalMs: 0 })
    expect(left(w)).toBe('0')
  })
})

describe('DateChangeSnack — odak dönüşü (KESİN 27)', () => {
  function host() {
    const open = ref(true)
    const Host = defineComponent({
      setup() {
        return () => [
          h('button', { id: 'trigger', type: 'button' }, 'çubuk'),
          open.value
            ? h(DateChangeSnack, {
                ...BASE,
                onCancel: () => (open.value = false),
                onDismiss: () => (open.value = false),
              })
            : null,
        ]
      },
    })
    const w = mount(Host, { attachTo: document.body })
    wrappers.push(w)
    const trigger = document.getElementById('trigger') as HTMLButtonElement
    trigger.focus()
    return { open, trigger }
  }

  // Odak tetikleyiciden bildirimin içine alınır (focusin relatedTarget = tetikleyici).
  function focusInto(selector: string, from: HTMLElement) {
    const el = document.querySelector<HTMLElement>(selector)!
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: from }))
    el.focus()
  }

  it.each([
    ['İptal et', '.rp-snack__undo'],
    ['✕', '.rp-snack__x'],
  ])('%s ile kapanınca odak tetikleyiciye döner, gövdeye düşmez', async (_name, selector) => {
    const { open, trigger } = host()
    focusInto(selector, trigger)
    document.querySelector<HTMLElement>(selector)!.click()
    await nextTick()
    expect(open.value).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it('Esc ile kapanınca odak tetikleyiciye döner', async () => {
    const { open, trigger } = host()
    focusInto('.rp-snack__undo', trigger)
    document
      .querySelector('.rp-snack')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(open.value).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it('süre dolup (eylem sonrası söküm) bildirim kalkınca odak tetikleyiciye döner', async () => {
    const { open, trigger } = host()
    focusInto('.rp-snack__undo', trigger)
    open.value = false
    await nextTick()
    expect(document.activeElement).toBe(trigger)
  })

  it('odak bildirimin dışındaysa kapanış odağı çalmaz', async () => {
    const { open, trigger } = host()
    const other = document.createElement('input')
    document.body.append(other)
    other.focus()
    open.value = false
    await nextTick()
    expect(document.activeElement).toBe(other)
    expect(document.activeElement).not.toBe(trigger)
  })
})
