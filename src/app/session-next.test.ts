import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { isInternalPath, safeNext } from './session-next'

const stub = { template: '<div />' }
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: stub },
    { path: '/gorevler', name: 'work.tasks', component: stub },
    { path: '/oturum', name: 'identity.session', component: stub },
  ],
})

describe('giriş sonrası dönüş hedefi', () => {
  it('uygulama içi yolları kabul eder', () => {
    for (const ok of ['/', '/gorevler', '/gorevler?gorev=w-1&durum=geciken']) {
      expect(isInternalPath(ok)).toBe(true)
    }
  })

  it('dış, mutlak, ağ konumlu ve kontrol karakterli değerleri reddeder', () => {
    const bad = [
      'https://kotu.example/',
      'http://kotu.example',
      '//kotu.example',
      '/\\kotu.example',
      '\\\\kotu.example',
      'javascript:alert(1)',
      'gorevler',
      '',
      '/gorevler\r\nSet-Cookie: a=b',
      '/a\u0000b',
      `/${'a'.repeat(3000)}`,
      undefined,
      42,
      null,
    ]
    for (const value of bad) expect(isInternalPath(value)).toBe(false)
    for (const value of bad) expect(safeNext(value, router)).toBeUndefined()
  })

  it('kayıtlı yolu (sorgusuyla) döndürür, dizi değerinde ilkini alır', () => {
    expect(safeNext('/gorevler?gorev=w-1', router)).toBe('/gorevler?gorev=w-1')
    expect(safeNext(['/gorevler', '/'], router)).toBe('/gorevler')
  })

  it('oturum rotasının kendisine (döngü) dönmez', () => {
    expect(safeNext('/oturum', router)).toBeUndefined()
    expect(safeNext('/oturum?next=%2F', router)).toBeUndefined()
  })
})
