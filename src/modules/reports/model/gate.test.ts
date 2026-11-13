import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createReportGate, reportGate } from './gate'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('reportGate — tek eşzamanlı rapor', () => {
  it('bir kiralama varken ikinci acquire null döner; bırakınca yeniden alınır', () => {
    const gate = createReportGate()
    const first = gate.acquire()
    expect(first).not.toBeNull()
    expect(gate.busy.value).toBe(true)
    expect(gate.acquire()).toBeNull()
    first!.release()
    expect(gate.busy.value).toBe(false)
    expect(gate.acquire()).not.toBeNull()
  })

  it('release tekrarı zararsız; eski kiralama yeni kiralamayı bırakamaz', () => {
    const gate = createReportGate()
    const first = gate.acquire()!
    first.release()
    const second = gate.acquire()!
    first.release()
    first.cancel()
    expect(gate.busy.value).toBe(true)
    expect(second.signal.aborted).toBe(false)
  })

  it('cancel isteğin sinyalini iptal eder ve kilidi bırakır', () => {
    const gate = createReportGate()
    const lease = gate.acquire()!
    lease.cancel()
    expect(lease.signal.aborted).toBe(true)
    expect(gate.busy.value).toBe(false)
  })

  it('release sinyali iptal ETMEZ (normal bitiş)', () => {
    const gate = createReportGate()
    const lease = gate.acquire()!
    lease.release()
    expect(lease.signal.aborted).toBe(false)
  })

  it('okuyucu sıraya girer; boşalınca sırayla alır (aynı anda yalnız biri)', async () => {
    const gate = createReportGate()
    const holder = gate.acquire()!
    const order: string[] = []
    const a = gate.acquireWhenFree().then((lease) => {
      order.push('a')
      return lease
    })
    const b = gate.acquireWhenFree().then((lease) => {
      order.push('b')
      return lease
    })
    await Promise.resolve()
    expect(order).toEqual([])
    holder.release()
    const leaseA = await a
    expect(order).toEqual(['a'])
    expect(gate.busy.value).toBe(true)
    leaseA.release()
    const leaseB = await b
    expect(order).toEqual(['a', 'b'])
    leaseB.release()
    expect(gate.busy.value).toBe(false)
  })

  it('sıradaki okuyucu iptal edilirse sıradan düşer ve reddedilir', async () => {
    const gate = createReportGate()
    const holder = gate.acquire()!
    const controller = new AbortController()
    const waiting = gate.acquireWhenFree(controller.signal)
    const rejected = expect(waiting).rejects.toBeInstanceOf(Error)
    controller.abort()
    await rejected
    holder.release()
    expect(gate.busy.value).toBe(false)
    expect(gate.acquire()).not.toBeNull()
  })

  it('önceden iptal edilmiş sinyal hemen reddedilir', async () => {
    const gate = createReportGate()
    const controller = new AbortController()
    controller.abort()
    await expect(gate.acquireWhenFree(controller.signal)).rejects.toBeInstanceOf(Error)
    expect(gate.busy.value).toBe(false)
  })

  it('reset: tutulanı iptal eder, sırayı reddeder, sayacı sıfırlar', async () => {
    const gate = createReportGate()
    const holder = gate.acquire()!
    const waiting = gate.acquireWhenFree()
    const rejected = expect(waiting).rejects.toBeInstanceOf(Error)
    gate.startCooldown(30)
    gate.reset()
    await rejected
    expect(holder.signal.aborted).toBe(true)
    expect(gate.busy.value).toBe(false)
    expect(gate.cooldown.value).toBe(0)
    holder.release()
    expect(gate.acquire()).not.toBeNull()
  })
})

describe('reportGate — Retry-After geri sayımı (sahte saat)', () => {
  it("saniyede bir azalır, 0'da durur; bitince kilit kendiliğinden bir şey başlatmaz", () => {
    const gate = createReportGate()
    gate.startCooldown(3)
    expect(gate.cooldown.value).toBe(3)
    vi.advanceTimersByTime(1000)
    expect(gate.cooldown.value).toBe(2)
    vi.advanceTimersByTime(2000)
    expect(gate.cooldown.value).toBe(0)
    vi.advanceTimersByTime(5000)
    expect(gate.cooldown.value).toBe(0)
    expect(gate.busy.value).toBe(false)
  })

  it('sıfır/negatif/NaN süre yok sayılır; yeni sayaç eskisini değiştirir', () => {
    const gate = createReportGate()
    gate.startCooldown(0)
    gate.startCooldown(-4)
    gate.startCooldown(Number.NaN)
    expect(gate.cooldown.value).toBe(0)
    gate.startCooldown(10)
    gate.startCooldown(2)
    expect(gate.cooldown.value).toBe(2)
    vi.advanceTimersByTime(2000)
    expect(gate.cooldown.value).toBe(0)
  })

  it('sekme geneli tek örnek dışa açık', () => {
    expect(reportGate.busy.value).toBe(false)
  })
})
