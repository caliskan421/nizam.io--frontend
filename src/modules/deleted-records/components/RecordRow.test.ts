import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { fixtureRow } from '../__tests__/fixtures'
import RecordRow from './RecordRow.vue'

const NOW = new Date('2026-11-12T12:00:00Z')
const base = {
  row: fixtureRow(),
  selected: false,
  busy: false,
  timezone: 'Europe/Istanbul',
  now: NOW,
  canRestore: true,
  canPurge: true,
}

describe('RecordRow (E-12-25…37)', () => {
  it('tür rozeti, başlık, alt satır, tarih + saat + "bugün"', () => {
    const wrapper = mount(RecordRow, { props: base })
    expect(wrapper.get('.dr-logtype').attributes('data-kind')).toBe('gorev')
    expect(wrapper.get('.dr-logtype').text()).toBe('Görev')
    expect(wrapper.get('.dr-title').text()).toBe('Saha pano montajı')
    expect(wrapper.get('.dr-record .rp-cap').text()).toBe('Mekanik › Görevler')
    expect(wrapper.get('.dr-dt__d').text()).toContain('12.11.2026')
    expect(wrapper.get('.dr-today').text()).toBe('bugün')
    expect(wrapper.get('.dr-dt__t').text()).toBe('13:42')
    expect(wrapper.get('.dr-dt').attributes('title')).toContain('12 Kasım 2026')
    // Kod yok (BE-005), uyarı rozeti yok, seçim kutusu yok.
    expect(wrapper.find('.dr-code').exists()).toBe(false)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('eski tarihte "bugün" etiketi yok; tarihsiz satırda "—"', () => {
    const old = mount(RecordRow, {
      props: { ...base, row: fixtureRow({ deletedAt: '2026-10-01T10:00:00Z' }) },
    })
    expect(old.find('.dr-today').exists()).toBe(false)
    const none = mount(RecordRow, { props: { ...base, row: fixtureRow({ deletedAt: null }) } })
    expect(none.get('.dr-dt').text()).toBe('—')
  })

  it('koordinatörlük kodu mono kicker; alt satır boşsa çizilmez', () => {
    const wrapper = mount(RecordRow, {
      props: { ...base, row: fixtureRow({ kind: 'koordinatorluk', code: 'OPE', subLine: '' }) },
    })
    expect(wrapper.get('.dr-code').text()).toBe('OPE')
    expect(wrapper.find('.dr-record .rp-cap').exists()).toBe(false)
  })

  it('silen: toplantıda ad (+ avatar), bilinmeyende "Bilinmiyor", diğer türlerde "—"', () => {
    const named = mount(RecordRow, {
      props: {
        ...base,
        row: fixtureRow({ kind: 'toplanti', actor: { accountId: 'a', name: 'Reha Koçak' } }),
      },
    })
    expect(named.get('.dr-actor').text()).toContain('Reha Koçak')
    expect(named.find('.rp-av').exists()).toBe(true)
    const unknown = mount(RecordRow, {
      props: {
        ...base,
        row: fixtureRow({ kind: 'toplanti', actor: { accountId: null, name: '' } }),
      },
    })
    expect(unknown.get('.dr-actor').text()).toBe('Bilinmiyor')
    expect(unknown.find('.rp-av').exists()).toBe(false)
    expect(mount(RecordRow, { props: base }).get('.dr-actor').text()).toBe('—')
  })

  it('seçili satır işaretlenir; tıklama, Enter ve Boşluk seçer; eylem düğmeleri seçmez', async () => {
    const wrapper = mount(RecordRow, { props: { ...base, selected: true } })
    expect(wrapper.attributes('aria-current')).toBe('true')
    expect(wrapper.classes()).toContain('rp-sel')
    await wrapper.trigger('click')
    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('select')).toHaveLength(3)
    await wrapper.get('[data-action="restore"]').trigger('click')
    await wrapper.get('[data-action="purge"]').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(3)
    expect(wrapper.emitted('restore')).toHaveLength(1)
    expect(wrapper.emitted('purge')).toHaveLength(1)
  })

  it('yetki yoksa eylem düğmeleri DOM’da yok; uçuşta aria-disabled ve tıklama yayılmaz', async () => {
    const readonly = mount(RecordRow, { props: { ...base, canRestore: false, canPurge: false } })
    expect(readonly.find('[data-action]').exists()).toBe(false)
    const busy = mount(RecordRow, { props: { ...base, busy: true } })
    expect(busy.get('[data-action="restore"]').attributes('aria-disabled')).toBe('true')
    await busy.get('[data-action="restore"]').trigger('click')
    await busy.get('[data-action="purge"]').trigger('click')
    expect(busy.emitted('restore')).toBeUndefined()
    expect(busy.emitted('purge')).toBeUndefined()
  })

  it('kalıcı sil düğmesinin erişim adı kayıt adını içerir', () => {
    expect(
      mount(RecordRow, { props: base }).get('[data-action="purge"]').attributes('aria-label'),
    ).toBe('Saha pano montajı kalıcı sil')
  })
})
