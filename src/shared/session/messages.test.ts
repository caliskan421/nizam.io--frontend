import { describe, expect, it } from 'vitest'

import { AuthSession } from './auth-session'
import { MESSAGE_LIMITS, parseSessionMessage, SESSION_MESSAGE_VERSION } from './messages'
import type { RefreshCoordination } from './coordination'

const NOW = 1_800_000_000_000
const NOW_SEC = NOW / 1000
const valid = {
  v: SESSION_MESSAGE_VERSION,
  type: 'token',
  token: 'tok-0000000000000001',
  accountId: 'acc-1',
  expiresAt: NOW_SEC + 900,
  forcePasswordChange: false,
  issuedAt: NOW,
}

describe('parseSessionMessage — sıkı şema', () => {
  it.each([
    ['30 gün', 30 * 24 * 3600],
    ['365 gün', 365 * 24 * 3600],
  ])('uzun ömürlü belirteç (%s) kabul edilir — backend TTL üst sınırı yok', (_name, ttl) => {
    const msg = { ...valid, expiresAt: NOW_SEC + ttl }
    expect(parseSessionMessage(msg, NOW)).toEqual(msg)
  })

  it('geçerli token, logout ve sync-request iletileri kabul edilir', () => {
    expect(parseSessionMessage(valid, NOW)).toEqual(valid)
    expect(parseSessionMessage({ v: 1, type: 'logout', accountId: 'acc-1' }, NOW)).toEqual({
      v: 1,
      type: 'logout',
      accountId: 'acc-1',
    })
    expect(parseSessionMessage({ v: 1, type: 'sync-request' }, NOW)).not.toBeNull()
  })

  it.each([
    ['null', null],
    ['metin', 'token'],
    ['dizi', [valid]],
    ['sürüm yok', { ...valid, v: undefined }],
    ['yanlış sürüm', { ...valid, v: 2 }],
    ['bilinmeyen tür', { ...valid, type: 'grant' }],
    ['ekstra alan', { ...valid, admin: true }],
    ['eksik alan', { ...valid, forcePasswordChange: undefined }],
    ['token sayı', { ...valid, token: 123 }],
    ['token kısa', { ...valid, token: 'abc' }],
    ['token çok uzun', { ...valid, token: 'a'.repeat(MESSAGE_LIMITS.tokenMax + 1) }],
    ['token boşluk içerir', { ...valid, token: 'tok 0000000000000001' }],
    ['hesap boş', { ...valid, accountId: '' }],
    ['hesap biçim dışı', { ...valid, accountId: 'acc/../1' }],
    ['süresi geçmiş', { ...valid, expiresAt: NOW_SEC - 1 }],
    ['bitiş güvenli tamsayı değil', { ...valid, expiresAt: 2 ** 53 }],
    ['bitiş tamsayı değil', { ...valid, expiresAt: NOW_SEC + 0.5 }],
    ['issuedAt eski', { ...valid, issuedAt: NOW - MESSAGE_LIMITS.issuedSkewMs - 1 }],
    ['issuedAt gelecekte', { ...valid, issuedAt: NOW + MESSAGE_LIMITS.issuedSkewMs + 1 }],
    ['bayrak metin', { ...valid, forcePasswordChange: 'false' }],
    ['logout hesapsız', { v: 1, type: 'logout' }],
    ['logout ekstra alan', { v: 1, type: 'logout', accountId: 'acc-1', all: true }],
    ['sync ekstra alan', { v: 1, type: 'sync-request', token: 'x' }],
  ])('%s → reddedilir', (_name, raw) => {
    expect(parseSessionMessage(raw, NOW)).toBeNull()
  })
})

/** Kanalı test eden sahte koordinasyon: `inject` ile ham ileti verilir. */
function channel() {
  let listener: (raw: unknown) => void = () => undefined
  const published: unknown[] = []
  const coordination: RefreshCoordination = {
    crossTabLock: true,
    withLock: (_n, task) => task(),
    publish: (m) => published.push(m),
    subscribe: (fn) => {
      listener = fn
    },
  }
  return { coordination, published, inject: (raw: unknown) => listener(raw) }
}

function session() {
  const ch = channel()
  const s = new AuthSession({
    baseUrl: 'http://localhost',
    fetch: () => Promise.reject(new Error('ağ yok')),
    coordination: ch.coordination,
    now: () => NOW,
  })
  return { s, ...ch }
}

describe('AuthSession kanal girdisi', () => {
  it('geçerli token iletisi oturumu kurar', () => {
    const { s, inject } = session()
    inject(valid)
    expect(s.snapshot.status).toBe('authenticated')
    expect(s.token).toBe(valid.token)
  })

  it.each([
    ['bozuk', { ...valid, token: 42 }],
    ['yanlış sürüm', { ...valid, v: 0 }],
    ['ekstra alan', { ...valid, scope: 'all' }],
    ['süresi geçmiş', { ...valid, expiresAt: NOW_SEC - 10 }],
  ])('%s ileti sessizce yok sayılır', (_name, raw) => {
    const { s, inject } = session()
    expect(() => inject(raw)).not.toThrow()
    expect(s.snapshot.status).toBe('unknown')
    expect(s.token).toBeNull()
  })

  it('oturum başka hesaptayken farklı hesabın belirteci reddedilir', () => {
    const { s, inject } = session()
    inject(valid)
    inject({ ...valid, token: 'tok-9999999999999999', accountId: 'acc-2', issuedAt: NOW + 1 })
    expect(s.snapshot.accountId).toBe('acc-1')
    expect(s.token).toBe(valid.token)
  })

  it('aynı hesabın daha yeni belirteci kabul, eskisi ret', () => {
    const { s, inject } = session()
    inject(valid)
    inject({ ...valid, token: 'tok-0000000000000002', issuedAt: NOW + 5 })
    inject({ ...valid, token: 'tok-0000000000000003', issuedAt: NOW + 1 })
    expect(s.token).toBe('tok-0000000000000002')
  })

  it('logout yalnız aynı hesap için uygulanır', () => {
    const { s, inject } = session()
    inject(valid)
    inject({ v: 1, type: 'logout', accountId: 'acc-2' })
    expect(s.snapshot.status).toBe('authenticated')
    inject({ v: 1, type: 'logout', accountId: 'acc-1' })
    expect(s.snapshot.status).toBe('anonymous')
    expect(s.token).toBeNull()
  })

  it('yayınlanan iletiler sürümlüdür ve logout hesap kimliği taşır', () => {
    const { s, inject, published } = session()
    inject(valid)
    s.clear()
    expect(published).toEqual([{ v: 1, type: 'logout', accountId: 'acc-1' }])
  })

  it('sync-request yalnız oturum açıkken ve belirteç tazeyken yanıtlanır', () => {
    const { inject, published } = session()
    inject({ v: 1, type: 'sync-request' })
    expect(published).toHaveLength(0)
    inject(valid)
    inject({ v: 1, type: 'sync-request' })
    expect(published).toEqual([valid])
  })
})
