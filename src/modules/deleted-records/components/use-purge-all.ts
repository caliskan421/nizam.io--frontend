/**
 * Çöpü boşalt akışı (E-12-06; BE-115; ADR-0045): başlık düğmesi → tür adı yazılan panel → ortak
 * onay (`confirmWrite`; onayın yakaladığı bağlam KESİN 20) → parçalar hâlinde döngü. `Not ve
 * gündem` üç türü sırayla boşaltır (her tür kendi döngüsü); `Tümü` boşaltılamaz.
 * Döngü durma kuralı: `remaining > 0` VE o çağrıda en az bir kayıt işlendiyse sürer; hiç başarı
 * olmayan çağrıdan sonra durur ve kalanlar `failed` kodlarıyla özette gösterilir. Kullanıcı
 * "Durdur" ile parçalar arasında kesebilir (çağrı başlamışsa bitirilir). Bağlam (kapsam/oturum)
 * değişirse motor sonraki çağrıyı göndermez; 5xx'te işlenenler kalıcıdır, liste yenilenir, kör
 * tekrar yoktur. Sahibi (sayfa) sökülmüş sonuç ekrana ulaşmaz (`reachesOwner`). `useToast`/
 * `useConfirm` kurulumda alınır (KESİN 26a).
 */
import { computed, ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { useConfirm, type ConfirmOptions } from '@/shared/ui/confirm'

import type { BatchSummary } from '../model/batch'
import type { LifecycleKind } from '../model/lifecycle'
import type { DeletedKind } from '../model/kinds'
import { deletedText } from '../model/messages'
import { purgeKindsOf, supportsPurgeAll } from '../model/purge-all'

import { purgeTarget, runPurgeSequence } from './purge-sequence'
import type { PurgeOutcome } from './purge-loop'
import { useLifecycleHub, type LifecycleHub } from './use-lifecycle-hub'

export interface PurgeAllOptions {
  kind: () => DeletedKind
  /** Açık görünümün listesini ve bağlı sorguları yeniden okur. */
  refresh: () => Promise<unknown>
  /** İşlem bitti (özet gösterildi): odak taşınır. */
  finished: () => void
  /** Sayfanın ortak yazma merkezi (verilmezse kurulur). */
  hub?: LifecycleHub
}

export function purgeAllConfirmOptions(view: Exclude<DeletedKind, 'tumu'>): ConfirmOptions {
  return {
    title: deletedText('purgeAll.confirmTitle', { kind: deletedText(`kindNames.${view}`) }),
    body: [deletedText('purgeAll.confirmBody'), deletedText(`purgeAll.scope.${view}`)],
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
  const hub = options.hub ?? useLifecycleHub()
  const state = usePurgeAllState(options.kind)
  const pending = computed(() => state.running.value || hub.pending.value)

  const sequence = (kinds: readonly LifecycleKind[], first: PurgeOutcome) =>
    runPurgeSequence({ hub, scope, state, toast, refresh: options.refresh }, kinds, first)

  async function confirm(): Promise<void> {
    const view = options.kind()
    const kinds = purgeKindsOf(view)
    if (pending.value || kinds === null || view === 'tumu') return
    state.summary.value = null
    state.stop.requested = false
    // İlk parça onayın bağlamıyla (diyalog meşgul) gider; sonrakiler ilerleme panelinde sürer.
    const first = await confirmWrite(purgeAllConfirmOptions(view), (context) =>
      hub.purgeAll[kinds[0]!](purgeTarget(scope.programId, kinds[0]!), { context }),
    )
    // Vazgeç ya da bağlam bayat: istek gitmedi, panel açık kalır.
    if (first === null) return
    state.progress.value = { done: 0, left: null }
    state.running.value = true
    state.panel.value = false
    try {
      await sequence(kinds, first)
    } finally {
      state.running.value = false
    }
    options.finished()
  }

  return { ...state, stop: state.requestStop, pending, confirm }
}
