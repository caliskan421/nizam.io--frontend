/**
 * 05 iş yükü raporu satır seçimi (13 `mekanizma.md` §5; E-13-59…62). Seçim BELLEKTE bir
 * `Set<hesap kimliği>`dir: URL'e yazılmaz, sayfa/süzgeç/arama değişince korunur, program (kapsam)
 * değişince ve ekran sökülünce (rota değişimi) sıfırlanır. Sayfa kurar (`provideWorkloadSelection`),
 * başlık düğmesi, tablo, satır ve çubuk enjekte eder; sağlayıcı yoksa seçim ve rapor eylemi
 * yoktur; sağlayıcı olsa da `enabled` (`canExportWorkload`, yalnız şirket yöneticisi) false ise
 * kutu ve düğme çizilmez — gizleme güvenlik değildir, sunucu 403 verir.
 *
 * Seçilemeyen satır: seçili programın iş yükünde olmayan hesap (iş yükü üyesi = canlı departman
 * kadrosu + canlı departmana atanmış hesaplar). İstemci bunu satırın program üyelik etiketlerinden
 * çıkarır; program seçili değilse bilgi yoktur ve kutu etkin kalır (422 yolu karşılar).
 */
import {
  computed,
  inject,
  onScopeDispose,
  provide,
  shallowRef,
  type ComputedRef,
  type InjectionKey,
} from 'vue'

import { reportCapabilities } from '@/modules/reports/public'
import { i18n } from '@/shared/i18n'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'

import type { UserRow } from './user-rows'

export interface WorkloadSelection {
  /** Rapor eylemi bu kullanıcıya açık mı (`canExportWorkload`). */
  enabled: ComputedRef<boolean>
  /** Bir program seçili mi (rapor bilet başlığı programı taşır). */
  programReady: ComputedRef<boolean>
  /** Seçili hesap kimlikleri (ekleme sırası). */
  ids: ComputedRef<string[]>
  count: ComputedRef<number>
  isSelected(accountId: string): boolean
  /** Satır seçilebilir mi (program iş yükünde) — bilgi yoksa `true`. */
  canPick(row: Pick<UserRow, 'labels'>): boolean
  toggle(accountId: string): void
  /** Verilen kimlikleri topluca işaretler / kaldırır ("Tümünü seç"). */
  setMany(accountIds: readonly string[], on: boolean): void
  clear(): void
}

export function useWorkloadSelection(): WorkloadSelection {
  const store = useScopeStore()
  const { standing } = useStanding()
  const selected = shallowRef<ReadonlySet<string>>(new Set())

  const enabled = computed(() =>
    reportCapabilities(standing.value, store.programId).canExportWorkload(),
  )
  const ids = computed(() => [...selected.value])

  function replace(next: Set<string>): void {
    selected.value = next
  }
  function clear(): void {
    if (selected.value.size > 0) replace(new Set())
  }

  // Program/kapsam değişince seçim geçersizdir (başka programın iş yükü).
  const unsubscribe = store.onChange(clear)
  onScopeDispose(unsubscribe)

  return {
    enabled,
    programReady: computed(() => store.programId !== null),
    ids,
    count: computed(() => selected.value.size),
    isSelected: (accountId) => selected.value.has(accountId),
    canPick: (row) => store.programId === null || row.labels.length > 0,
    toggle(accountId) {
      const next = new Set(selected.value)
      if (!next.delete(accountId)) next.add(accountId)
      replace(next)
    },
    setMany(accountIds, on) {
      const next = new Set(selected.value)
      for (const id of accountIds) {
        if (on) next.add(id)
        else next.delete(id)
      }
      replace(next)
    },
    clear,
  }
}

export const WORKLOAD_SELECTION: InjectionKey<WorkloadSelection> = Symbol(
  'organization.workload-selection',
)

/** Sayfa: seçimi kurar ve altındaki bileşenlere sağlar. */
export function provideWorkloadSelection(): WorkloadSelection {
  const selection = useWorkloadSelection()
  provide(WORKLOAD_SELECTION, selection)
  return selection
}

/** Başlık/tablo/satır: sayfanın seçimi (sağlayıcı yoksa `null`); görünürlük `enabled`'a bağlıdır. */
export function injectWorkloadSelection(): WorkloadSelection | null {
  return inject(WORKLOAD_SELECTION, null)
}

/** `reports.workload.*` metni (statik TR ağacı `shared/i18n/tr/reports.ts`). */
export function workloadText(
  key:
    'noProgram' | 'selectAll' | 'selectRow' | 'notInWorkload' | 'selected' | 'clear' | 'refreshed',
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(`reports.workload.${key}`, params)
}
