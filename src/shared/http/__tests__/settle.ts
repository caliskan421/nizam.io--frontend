// Koşul/olay tabanlı test beklemeleri (Codex CX-F1-Ö-04). Sabit tur sayısı ya da süre tahmini
// yoktur: bekleme ya sorgu/mutasyon önbelleğinin olayına ya da gözlenen koşula bağlıdır.
//
// `flushPromises` (Vue Test Utils) bir olay döngüsü dönüşüdür (`setImmediate`); süre beklemesi
// değildir. Vue zamanlayıcısını ve bekleyen mikro görevleri boşaltmak için kullanılır.
import type { Query, QueryClient } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'

type Clients = QueryClient | readonly QueryClient[]

const list = (clients: Clients): readonly QueryClient[] =>
  Array.isArray(clients) ? clients : [clients as QueryClient]

/** Testin bilerek beklettiği (yanıtı elle salınan) sorgular; yerleşmeyi engellemez. */
export type HeldQuery = (query: Query) => boolean

function busy(clients: Clients, held?: HeldQuery): boolean {
  return list(clients).some((c) => {
    const holding = held ? c.isFetching({ predicate: held }) : 0
    return c.isFetching() - holding > 0 || c.isMutating() > 0
  })
}

/** Sorgu ya da mutasyon önbelleklerinden herhangi birinin bir sonraki olayı. */
function nextCacheEvent(clients: Clients): Promise<void> {
  return new Promise((resolve) => {
    const offs: Array<() => void> = []
    const done = () => {
      for (const off of offs.splice(0)) off()
      resolve()
    }
    for (const c of list(clients)) {
      offs.push(c.getQueryCache().subscribe(done), c.getMutationCache().subscribe(done))
    }
  })
}

/**
 * Uçuştaki bütün sorgular ve yazmalar bitene, bileşen tepkileri (yeniden okuma dahil) işlenene
 * ve durum bir olay döngüsü dönüşü boyunca boş kalana dek bekler. Meşgulken yalnız önbellek
 * olayı beklenir; `limit` sonsuz yeniden okuma döngüsüne karşı olay sayısı sınırıdır (süre değil).
 * `held`: testin bilerek beklettiği sorgular uçuşta kalabilir (ör. ilk sayfa iskeleti denetimi).
 */
export async function settleQueries(
  clients: Clients,
  { held, limit = 500 }: { held?: HeldQuery; limit?: number } = {},
): Promise<void> {
  // Yanlış düzenek (izlenecek istemci yok) sessizce "yerleşti" sayılmaz.
  if (list(clients).length === 0) throw new Error('settleQueries: izlenecek QueryClient yok')
  for (let events = 0; events < limit; events += 1) {
    await flushPromises()
    if (busy(clients, held)) {
      await nextCacheEvent(clients)
      continue
    }
    // Boş: bileşen tepkisinin (ör. sonuçla tetiklenen yeniden okuma) başlaması için bir dönüş.
    await flushPromises()
    if (!busy(clients, held)) return
  }
  throw new Error('sorgular yerleşmedi')
}

/**
 * `predicate` doğru olana dek bekler; her denemeden önce `subscribe` ile bildirilen olay
 * beklenir (ör. oturum anlık görüntüsü, rota sonrası kancası). Koşul zaten doğruysa hemen döner.
 */
export async function until(
  predicate: () => boolean,
  subscribe: (notify: () => void) => () => void,
): Promise<void> {
  if (predicate()) return
  await new Promise<void>((resolve) => {
    const off = subscribe(() => {
      if (!predicate()) return
      off()
      resolve()
    })
  })
}
