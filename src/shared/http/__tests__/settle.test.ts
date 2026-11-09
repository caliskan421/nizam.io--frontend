import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'
import { ref, watch } from 'vue'

import { settleQueries, until } from './settle'

function gate() {
  let release!: () => void
  const promise = new Promise<void>((resolve) => (release = resolve))
  return { promise, release }
}

describe('settleQueries', () => {
  it('uçuştaki sorgu bitene ve ardından tetiklenen okuma da bitene dek bekler', async () => {
    const client = new QueryClient()
    const first = gate()
    const order: string[] = []
    void client.fetchQuery({
      queryKey: ['a'],
      queryFn: async () => {
        await first.promise
        order.push('a')
        // Sonuçla tetiklenen ikinci okuma (bileşen tepkisi benzeri).
        void client.fetchQuery({ queryKey: ['b'], queryFn: () => (order.push('b'), 2) })
        return 1
      },
    })
    const settled = settleQueries(client).then(() => order.push('settled'))
    expect(client.isFetching()).toBe(1)
    first.release()
    await settled
    expect(order).toEqual(['a', 'b', 'settled'])
    expect(client.isFetching()).toBe(0)
  })

  it('held: testin beklettiği sorgu uçuşta kalabilir', async () => {
    const client = new QueryClient()
    const held = gate()
    void client.fetchQuery({ queryKey: ['held'], queryFn: () => held.promise.then(() => 1) })
    await settleQueries(client, { held: (q) => q.queryKey[0] === 'held' })
    expect(client.isFetching()).toBe(1)
    held.release()
    await settleQueries(client)
    expect(client.isFetching()).toBe(0)
  })

  it('izlenecek istemci yoksa açık hata (yanlış düzenek "yerleşti" sayılmaz)', async () => {
    await expect(settleQueries([])).rejects.toThrow('izlenecek QueryClient yok')
  })

  it('olay sınırı dolarsa açık hata (süre değil, olay sayısı)', async () => {
    await expect(settleQueries(new QueryClient(), { limit: 0 })).rejects.toThrow(
      'sorgular yerleşmedi',
    )
  })
})

describe('until', () => {
  it('koşul zaten doğruysa abone olmadan döner; değilse olayla yeniden denetler', async () => {
    const value = ref(0)
    let subscribed = 0
    const subscribe = (notify: () => void) => {
      subscribed += 1
      return watch(value, notify, { flush: 'sync' })
    }
    await until(() => value.value === 0, subscribe)
    expect(subscribed).toBe(0)
    const done = until(() => value.value === 2, subscribe)
    value.value = 1
    value.value = 2
    await done
    expect(subscribed).toBe(1)
  })
})
