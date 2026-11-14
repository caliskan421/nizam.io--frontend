// İskelet sözleşmesi (KESİN 22): gövdeden BAĞIMSIZ — derlenmiş props/emits bildirimlerini
// denetler; bileşeni bağlamaz, gövdede metin/`data-placeholder` beklemez. Gövde (W158/W159)
// dolunca bu test kırılmaz: yalnız prop/emit adı değişirse kırılır.
import { describe, expect, it } from 'vitest'

import NotificationPanel from './NotificationPanel.vue'
import PushOptInCard from './PushOptInCard.vue'

const emitsOf = (c: { emits?: unknown }) => [...((c.emits as string[] | undefined) ?? [])].sort()
const propsOf = (c: { props?: unknown }) => Object.keys((c.props as object | undefined) ?? {})

describe('NotificationPanel sözleşmesi', () => {
  it('props: open; emits: close, navigate', () => {
    expect(propsOf(NotificationPanel)).toEqual(['open'])
    expect(emitsOf(NotificationPanel)).toEqual(['close', 'navigate'])
  })
})

describe('PushOptInCard sözleşmesi', () => {
  it('props yok; emits: dismissed, enabled', () => {
    expect(propsOf(PushOptInCard)).toEqual([])
    expect(emitsOf(PushOptInCard)).toEqual(['dismissed', 'enabled'])
  })
})
