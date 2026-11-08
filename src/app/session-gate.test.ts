import { describe, expect, it } from 'vitest'

import { sessionGate } from './session-gate'

describe('oturum kapısı', () => {
  it('kabukta her rota çizilir', () => {
    for (const routeScope of ['S0', 'S1', 'S2', 'S3'] as const) {
      expect(sessionGate({ status: 'authenticated', shell: true, routeScope })).toBe('render')
    }
  })

  it('S0 rotası oturumdan bağımsız çizilir', () => {
    for (const status of ['unknown', 'anonymous', 'ended', 'unavailable'] as const) {
      expect(sessionGate({ status, shell: false, routeScope: 'S0' })).toBe('render')
    }
  })

  it('oturum açık değilken S0 dışı rota oturum sayfasına yönlenir', () => {
    for (const status of ['anonymous', 'ended', 'unavailable'] as const) {
      expect(sessionGate({ status, shell: false, routeScope: 'S1' })).toBe('to-session')
    }
    // Zorunlu parola değişimi: oturum açık ama kabuk yok → oturum sayfası.
    expect(sessionGate({ status: 'authenticated', shell: false, routeScope: 'S1' })).toBe(
      'to-session',
    )
  })

  it('sessiz refresh sürerken ya da rota çözülmeden beklenir (içerik çizilmez)', () => {
    expect(sessionGate({ status: 'unknown', shell: false, routeScope: 'S1' })).toBe('wait')
    expect(sessionGate({ status: 'anonymous', shell: false, routeScope: undefined })).toBe('wait')
  })
})
