/**
 * Çöpü boşalt akışı (E-12-06; BE-115; ADR-0045): başlık düğmesi → tür adı yazılan panel → ortak
 * onay (`confirmWrite`; onayın yakaladığı bağlam KESİN 20) → ≤50'lik parçalar hâlinde döngü.
 * Döngü durma kuralı: `remaining > 0` VE o çağrıda en az bir kayıt işlendiyse sürer; hiç başarı
 * olmayan çağrıdan sonra durur ve kalanlar `failed` kodlarıyla özette gösterilir. Kullanıcı
 * "Durdur" ile parçalar arasında kesebilir (çağrı başlamışsa bitirilir). Bağlam (kapsam/oturum)
 * değişirse motor sonraki çağrıyı göndermez; 5xx'te işlenenler kalıcıdır, liste yenilenir, kör
 * tekrar yoktur. Sahibi (sayfa) sökülmüş sonuç ekrana ulaşmaz (`reachesOwner`). `useToast`/
 * `useConfirm` kurulumda alınır (KESİN 26a).
 */
import { computed, ref } from 'vue'

import { reachesOwner } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { notifyOutcome, useConfirm, type ConfirmOptions } from '@/shared/ui/confirm'

import { usePurgeAllAccounts, usePurgeAllMeetings, usePurgeAllWorkItems } from '../api/purge-all'
import type { BatchSummary } from '../model/batch'
import type { DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'
import {
  PURGE_ALL_CONFIRM,
  summarizePurgeAll,
  supportsPurgeAll,
  type PurgeAllKind,
} from '../model/purge-all'

import { purgeLoop, type PurgeOutcome } from './purge-loop'

export interface PurgeAllOptions {
  kind: () => DeletedKind
  /** Açık sekmenin listesini ve bağlı sorguları yeniden okur. */
  refresh: () => Promise<unknown>
  /** İşlem bitti (özet gösterildi): odak taşınır. */
  finished: () => void
}

export function purgeAllConfirmOptions(kind: PurgeAllKind): ConfirmOptions {
  return {
    title: deletedText('purgeAll.confirmTitle', { kind: deletedText(`kindNames.${kind}`) }),
    body: [deletedText('purgeAll.confirmBody'), deletedText(`purgeAll.scope.${kind}`)],
    confirmLabel: deletedText('purgeAll.confirm'),
    tone: 'danger',
  }
}

/** Panel/ilerleme/özet durumu ve kullanıcı kesmesi (yazma yok). */
function usePurgeAllState(kind: () => DeletedKind) {
  const panel = ref(false)
  const running = ref(false)
  const progress = ref<{ done: number; left: number | null }>({ done: 0, left: null })
  const summary = ref<BatchSummary | null>(null)
  const stop = { requested: false }
  return {
    panel,
    running,
    progress,
    summary,
    stop,
    open: () => {
      if (supportsPurgeAll(kind())) panel.value = true
    },
    close: () => {
      panel.value = false
    },
    requestStop: () => {
      stop.requested = true
    },
    dismissSummary: () => {
      summary.value = null
    },
  }
}

export function usePurgeAll(options: PurgeAllOptions) {
  const toast = useToast()
  const { confirmWrite } = useConfirm()
  const scope = useScopeStore()
  const writes = {
    gorev: usePurgeAllWorkItems(),
    toplanti: usePurgeAllMeetings(),
    kullanici: usePurgeAllAccounts(),
  }
  const state = usePurgeAllState(options.kind)
  const pending = computed(
    () => state.running.value || Object.values(writes).some((write) => write.isPending.value),
  )

  async function loop(kind: PurgeAllKind, first: PurgeOutcome): Promise<void> {
    const target = { programId: scope.programId ?? '', confirm: PURGE_ALL_CONFIRM[kind] }
    const result = await purgeLoop(writes[kind].submit, target, first, {
      shouldStop: () => state.stop.requested,
      onProgress: (done, left) => {
        state.progress.value = { done, left }
      },
    })
    if (result.stopped) {
      if (!reachesOwner(result.stopped)) return
      notifyOutcome(result.stopped)
      await options.refresh()
    }
    const ended = result.state === 'stopped' ? 'interrupted' : result.state
    const made = summarizePurgeAll(result.run, result.remaining, ended)
    if (made.tone === 'success') toast.push({ message: made.message })
    else state.summary.value = made
  }

  async function confirm(): Promise<void> {
    const kind = options.kind()
    if (pending.value || !supportsPurgeAll(kind)) return
    state.summary.value = null
    state.stop.requested = false
    const target = { programId: scope.programId ?? '', confirm: PURGE_ALL_CONFIRM[kind] }
    // İlk parça onayın bağlamıyla (diyalog meşgul) gider; sonrakiler ilerleme panelinde sürer.
    const first = await confirmWrite(purgeAllConfirmOptions(kind), (context) =>
      writes[kind].submit(target, { context }),
    )
    // Vazgeç ya da bağlam bayat: istek gitmedi, panel açık kalır.
    if (first === null) return
    state.progress.value = { done: 0, left: null }
    state.running.value = true
    state.panel.value = false
    try {
      await loop(kind, first)
    } finally {
      state.running.value = false
    }
    options.finished()
  }

  return { ...state, stop: state.requestStop, pending, confirm }
}
