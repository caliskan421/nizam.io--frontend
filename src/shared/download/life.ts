/**
 * İndirme eyleminin yaşamı (CX-F8-E-01): eylem başlarken kapsam (program), oturum nesli ve hesap
 * kaydedilir; kapsam değişimi, oturum/hesap değişimi ya da sahip sökülmesi eylemi İPTAL eder
 * (`AbortController`) ve `isCurrent()` o andan sonra `false` döner. Ortak akış (`flow.ts`) bilet
 * yanıtından sonra tüketimden ve dosya kaydından önce `isCurrent`'i yeniden sorar. Rapor
 * PDF'lerinin `reportGate` yaşamıyla aynı kalıp; `useToast` gibi bildirimler çağıranda kurulumda alınır.
 */
import { getCurrentScope, onScopeDispose } from 'vue'

import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import type { DownloadStartOptions } from './flow'

export interface DownloadLife {
  /** Yeni eylem başlatır (öncekini iptal eder); `flow.start`'a verilecek seçenekleri döner. */
  begin: () => Required<DownloadStartOptions>
  /** Sürmekte olan eylemi iptal eder. */
  cancel: () => void
}

export function useDownloadLife(): DownloadLife {
  const store = useScopeStore()
  let controller: AbortController | null = null

  function cancel(): void {
    controller?.abort()
    controller = null
  }

  let sessionGeneration = authSession.generation
  let sessionAccount = authSession.snapshot.accountId
  const stopScope = store.onChange(cancel)
  const stopSession = authSession.subscribe((snapshot) => {
    if (sessionGeneration !== authSession.generation || sessionAccount !== snapshot.accountId) {
      cancel()
    }
    sessionGeneration = authSession.generation
    sessionAccount = snapshot.accountId
  })
  if (getCurrentScope()) {
    onScopeDispose(() => {
      cancel()
      stopScope()
      stopSession()
    })
  }

  function begin(): Required<DownloadStartOptions> {
    cancel()
    const mine = new AbortController()
    controller = mine
    const generation = authSession.generation
    const account = authSession.snapshot.accountId
    const program = store.programId
    const isCurrent = (): boolean =>
      !mine.signal.aborted &&
      authSession.generation === generation &&
      authSession.snapshot.accountId === account &&
      store.programId === program
    return { signal: mine.signal, isCurrent }
  }

  return { begin, cancel }
}
