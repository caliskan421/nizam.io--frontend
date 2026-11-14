// CX-F6-E-02: `reportGate` yaşamı hesap/oturum nesline bağlıdır (kilit, kuyruk, Retry-After sayacı).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '@/shared/http'

import { createReportGate } from '../model/gate'
import { bindGateToSession } from './cancellation'

const login = (accountId: string, token = `tok-${accountId}`) => ({
  token,
  account_id: accountId,
  expires_at: Math.floor(Date.now() / 1000) + 900,
  force_password_change: false,
})

beforeEach(() => {
  vi.useFakeTimers()
  if (authSession.snapshot.accountId) authSession.clear()
  authSession.establish(login('acc-a'))
})
afterEach(() => {
  vi.useRealTimers()
  authSession.clear()
})

describe('bindGateToSession', () => {
  it("A'da 60 sn sayaç; çıkış + B girişi sonrası B'de sayaç 0", () => {
    const gate = createReportGate()
    bindGateToSession(gate)
    gate.startCooldown(60)
    vi.advanceTimersByTime(5000)
    expect(gate.cooldown.value).toBe(55)
    authSession.clear()
    expect(gate.cooldown.value).toBe(0)
    authSession.establish(login('acc-b'))
    expect(gate.cooldown.value).toBe(0)
    vi.advanceTimersByTime(60_000)
    expect(gate.cooldown.value).toBe(0)
  })

  it('hesap değişimi kilidi, kuyruğu ve sayacı temizler', async () => {
    const gate = createReportGate()
    bindGateToSession(gate)
    const lease = gate.acquire()!
    const waiting = gate.acquireWhenFree()
    const rejected = expect(waiting).rejects.toMatchObject({ name: 'AbortError' })
    gate.startCooldown(30)
    authSession.clear()
    authSession.establish(login('acc-b'))
    await rejected
    expect(lease.signal.aborted).toBe(true)
    expect(gate.busy.value).toBe(false)
    expect(gate.cooldown.value).toBe(0)
    expect(gate.acquire()).not.toBeNull()
  })

  it('aynı hesabın belirteç yenilemesi sayacı ve kilidi KORUR', () => {
    const gate = createReportGate()
    bindGateToSession(gate)
    const lease = gate.acquire()!
    gate.startCooldown(60)
    authSession.establish(login('acc-a', 'tok-refreshed'))
    expect(gate.cooldown.value).toBe(60)
    expect(gate.busy.value).toBe(true)
    expect(lease.signal.aborted).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(gate.cooldown.value).toBe(59)
  })

  it('kapı başına bir kez bağlanır (çift bağlama çift sıfırlama üretmez)', () => {
    const gate = createReportGate()
    const reset = vi.spyOn(gate, 'reset')
    bindGateToSession(gate)
    bindGateToSession(gate)
    authSession.clear()
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
