import { describe, expect, it } from 'vitest'

import { pushView, type PushViewInput } from './push-view'

const base: PushViewInput = {
  keyEnabled: true,
  support: 'supported',
  permission: 'default',
  subscribed: false,
  snoozed: false,
  justEnabled: false,
  deniedByUser: false,
  allowed: true,
}
const view = (patch: Partial<PushViewInput>) => pushView({ ...base, ...patch })

describe('Web Push kutusu görünüm kararı', () => {
  it('varsayılan: izin default, abonelik yok → önerme (E-14-59)', () => {
    expect(view({})).toBe('prompt')
  })

  it('enabled=false ya da bilinmiyor → hiç çizilmez; destek satırı da çizilmez (E-14-60)', () => {
    expect(view({ keyEnabled: false })).toBe('hidden')
    expect(view({ keyEnabled: null })).toBe('hidden')
    expect(view({ keyEnabled: false, support: 'unsupported' })).toBe('hidden')
    expect(view({ keyEnabled: false, support: 'ios_install' })).toBe('hidden')
  })

  it('destek yok → tek satır; iOS ana ekran dışı → yönerge (E-14-70/71)', () => {
    expect(view({ support: 'unsupported', permission: 'unsupported' })).toBe('unsupported')
    expect(view({ support: 'ios_install', permission: 'unsupported' })).toBe('ios')
  })

  it('denied: açılışta çizilmez; yalnız kullanıcı eyleminden sonra Engellendi (E-14-69)', () => {
    expect(view({ permission: 'denied' })).toBe('hidden')
    expect(view({ permission: 'denied', deniedByUser: true })).toBe('blocked')
  })

  it('abonelik varsa çizilmez (sessiz açık); okunmadıysa da çizilmez', () => {
    expect(view({ permission: 'granted', subscribed: true })).toBe('hidden')
    expect(view({ subscribed: null })).toBe('hidden')
  })

  it('granted ama abonelik yok → önerme (doğrudan (b)); az önce açıldıysa adım 3 kartı', () => {
    expect(view({ permission: 'granted', subscribed: false })).toBe('prompt')
    expect(view({ permission: 'granted', subscribed: true, justEnabled: true })).toBe('enabled')
  })

  it('"Şimdi değil" → küçük hâl (E-14-73)', () => {
    expect(view({ snoozed: true })).toBe('snoozed')
  })

  it('yetenek kapısı kapalıysa çizilmez', () => {
    expect(view({ allowed: false })).toBe('hidden')
    expect(view({ allowed: false, justEnabled: true })).toBe('hidden')
  })
})
