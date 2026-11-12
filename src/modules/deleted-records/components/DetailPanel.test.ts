import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { fixtureRow } from '../__tests__/fixtures'
import DetailPanel from './DetailPanel.vue'

const base = {
  row: null,
  missing: false,
  busy: false,
  timezone: 'Europe/Istanbul',
  canRestore: true,
  canPurge: true,
}

describe('DetailPanel (E-12-41…54)', () => {
  it('seçim yok: "Bir kayıt seçin"; kayıt yüklenen sayfalarda yoksa ipucu', () => {
    expect(mount(DetailPanel, { props: base }).text()).toContain('Bir kayıt seçin')
    expect(mount(DetailPanel, { props: { ...base, missing: true } }).text()).toContain(
      'Kayıt yüklenen sayfalarda yok.',
    )
  })

  it('görev: durum (geçmiş zaman), silinme, birlikte geri gelecek yalnız dosya; atananlar/yüzde/kalıcı silinme yok', () => {
    const wrapper = mount(DetailPanel, { props: { ...base, row: fixtureRow() } })
    const text = wrapper.text()
    expect(text).toContain('Devam ediyordu')
    expect(text).toContain('12.11.2026 · 13:42')
    expect(text).toContain('birlikte geri gelecek')
    expect(wrapper.get('.dr-linked').text()).toContain('Kanıt dosyası')
    expect(wrapper.get('.dr-linked .rp-count').text()).toBe('2')
    expect(wrapper.findAll('.dr-linked li')).toHaveLength(1)
    for (const absent of [
      'Atananlar',
      'Silen',
      'Kalıcı silinme',
      '%',
      'Yorum',
      'Tarih talebi',
      'Alt görev',
    ]) {
      expect(text, absent).not.toContain(absent)
    }
  })

  it('bilinmeyen görev durumu nötr gösterilir', () => {
    const wrapper = mount(DetailPanel, {
      props: { ...base, row: fixtureRow({ status: 'yeni_durum' }) },
    })
    expect(wrapper.text()).toContain('yeni_durum')
  })

  it('toplantı: silen, yer, davet kipi, koordinatörlükler; dosya bölümü yok', () => {
    const wrapper = mount(DetailPanel, {
      props: {
        ...base,
        row: fixtureRow({
          kind: 'toplanti',
          status: null,
          fileCount: null,
          actor: { accountId: 'a', name: 'Reha Koçak' },
          place: 'Fuar alanı',
          inviteMode: 'person',
          departmentNames: ['Mekanik', 'Fuar'],
        }),
      },
    })
    const text = wrapper.text()
    expect(text).toContain('Reha Koçak')
    expect(text).toContain('Fuar alanı')
    expect(text).toContain('Kişiler')
    expect(text).toContain('Mekanik, Fuar')
    expect(text).not.toContain('birlikte geri gelecek')
  })

  it('koordinatörlük: tür ve kod; hesap: silinme satırı yok', () => {
    const department = mount(DetailPanel, {
      props: {
        ...base,
        row: fixtureRow({
          kind: 'koordinatorluk',
          status: null,
          fileCount: null,
          code: 'OPE',
          departmentKind: 'koordinatorluk',
        }),
      },
    })
    expect(department.text()).toContain('OPE')
    const account = mount(DetailPanel, {
      props: {
        ...base,
        row: fixtureRow({
          kind: 'kullanici',
          status: null,
          fileCount: null,
          deletedAt: null,
          subLine: '',
        }),
      },
    })
    expect(account.text()).not.toContain('Silinme')
  })

  it('eylemler: Geri yükle birincil, Kalıcı sil; uçuşta ve yetkisizde engellenir', async () => {
    const wrapper = mount(DetailPanel, { props: { ...base, row: fixtureRow() } })
    expect(wrapper.get('[data-action="restore"]').classes()).toContain('t-btn--primary')
    await wrapper.get('[data-action="restore"]').trigger('click')
    await wrapper.get('[data-action="purge"]').trigger('click')
    expect(wrapper.emitted('restore')).toHaveLength(1)
    expect(wrapper.emitted('purge')).toHaveLength(1)
    await wrapper.setProps({ busy: true })
    await wrapper.get('[data-action="restore"]').trigger('click')
    expect(wrapper.emitted('restore')).toHaveLength(1)
    await wrapper.setProps({ busy: false, canRestore: false, canPurge: false })
    expect(wrapper.find('[data-action]').exists()).toBe(false)
  })
})
