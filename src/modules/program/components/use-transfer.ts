/**
 * Dönem aktarımı akışı (önizle → aktar; PROGRAM-K19/K21/K25/K28). Kaynak = seçili program
 * (departmanlar ve görevler o kapsamdan okunur); hedef = başka bir program.
 *
 *  - Önizleme olmadan aktarım YOK: "Aktar" yalnız eldeki önizleme güncel seçime aitse ve
 *    yürütülebilirse açıktır; seçim değişince önizleme bayatlar.
 *  - Aktarım istemci onayıyla başlar (`confirmWrite` → `submit(vars, { context })`); anahtar
 *    eylem başına motorda üretilir, gövde `preview_fingerprint` taşır.
 *  - 409 `program.transfer_preview_stale` → önizleme düşer, "yeniden önizleyin" notu; otomatik
 *    yeniden önizleme / yeniden gönderim YOK.
 *  - Sonuç bilinmiyorsa yerinde "Yeniden gönder" (aynı anahtar + aynı gövde; `UiOutcomeNotice`).
 *  - Seçili program değişince bütün seçim, önizleme ve not sıfırlanır (K2). Sahip sökülünce geç
 *    yanıt bildirim/yeni yazma başlatmaz (`owner_disposed`, `alive()`).
 */
import { computed, ref, shallowRef, watch } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { type ConfirmOptions, notifyOutcome, useConfirm } from '@/shared/ui/confirm'

import { usePreviewTransfer, useTransferWorkItems } from '../api'
import { programText } from '../model/messages'
import { canExecute, isPreviewCurrent } from '../model/transfer'
import type {
  TransferInput,
  TransferPreview,
  TransferResult,
  TransferSelection,
} from '../model/types'
import { useDialogLife } from './dialog-life'

type TransferOutcome = MutationOutcome<TransferInput, TransferResult, unknown>

interface Previewed {
  selection: TransferSelection
  preview: TransferPreview
}

export const STALE_CODE = 'program.transfer_preview_stale'

/** Seçim durumu: hedef, departman, görevler. Program değişince her şey sıfırlanır (K2). */
function useTransferSelection(onReset: () => void) {
  const store = useScopeStore()
  const targetId = ref('')
  const departmentId = ref('')
  const selectedIds = ref<string[]>([])

  watch(
    () => store.snapshot.programId,
    () => {
      targetId.value = ''
      departmentId.value = ''
      selectedIds.value = []
      onReset()
    },
  )
  watch(departmentId, () => {
    selectedIds.value = []
  })

  const selection = computed<TransferSelection | null>(() => {
    const source = store.programId
    if (!source || !targetId.value || !departmentId.value || selectedIds.value.length === 0) {
      return null
    }
    return {
      sourceProgramId: source,
      targetProgramId: targetId.value,
      departmentId: departmentId.value,
      workItemIds: [...selectedIds.value],
    }
  })
  return { targetId, departmentId, selectedIds, selection }
}

function confirmOptions(n: number, target: string): ConfirmOptions {
  return {
    title: programText('transfer.confirmTitle'),
    body: [programText('transfer.confirmBody', { n, target })],
    confirmLabel: programText('transfer.confirm'),
    cancelLabel: programText('danger.cancel'),
    tone: 'primary',
  }
}

function successText(data: TransferResult): string {
  const key = data.replayed ? 'transfer.replayed' : 'transfer.done'
  const n = data.moved_work_item_ids?.length ?? 0
  return programText(key, { n, files: data.moved_file_count })
}

type Life = ReturnType<typeof useDialogLife>

/** Önizleme durumu: eldeki önizleme, bayatlık, eksik erişim bayrağı, bilinmeyen sonuç notu. */
function usePreviewState(life: Life) {
  const previewer = usePreviewTransfer()
  const addMissingAccess = ref(false)
  const previewed = shallowRef<Previewed | null>(null)
  const stale = ref(false)
  const notice = shallowRef<TransferOutcome | null>(null)

  function clear(): void {
    previewed.value = null
    addMissingAccess.value = false
    notice.value = null
  }

  const run = (chosen: TransferSelection | null) =>
    life.once(async () => {
      if (!chosen) return
      clear()
      const outcome = await previewer.submit(chosen)
      if (!life.alive() || outcome.kind === 'owner_disposed') return
      if (outcome.kind !== 'success') return void notifyOutcome(outcome)
      stale.value = false
      previewed.value = { selection: chosen, preview: outcome.data }
    })

  return { addMissingAccess, previewed, stale, notice, clear, run }
}

export function useTransfer(targetName: (programId: string) => string) {
  const toast = useToast()
  const { confirmWrite } = useConfirm()
  const transfer = useTransferWorkItems()
  const life = useDialogLife({ open: () => false, close: () => undefined })
  const pv = usePreviewState(life)
  const sel = useTransferSelection(() => {
    pv.stale.value = false
    pv.clear()
  })
  const current = computed(() =>
    isPreviewCurrent(pv.previewed.value?.selection ?? null, sel.selection.value),
  )
  const executable = computed(() => {
    const done = pv.previewed.value
    return current.value && done !== null && canExecute(done.preview, pv.addMissingAccess.value)
  })

  function settle(outcome: TransferOutcome | null): void {
    if (!outcome || !life.alive() || outcome.kind === 'owner_disposed') return
    pv.notice.value = outcome.kind === 'unknown_outcome' ? outcome : null
    if (outcome.kind === 'success') {
      toast.push({ message: successText(outcome.data) })
      sel.selectedIds.value = []
      return pv.clear()
    }
    if (outcome.kind === 'failed' && outcome.error.code === STALE_CODE) {
      pv.stale.value = true
      return pv.clear()
    }
    if (outcome.kind !== 'unknown_outcome') notifyOutcome(outcome)
  }

  const execute = () =>
    life.once(async () => {
      const done = pv.previewed.value
      if (!done || !executable.value) return
      const vars: TransferInput = {
        ...done.selection,
        previewFingerprint: done.preview.preview_fingerprint,
        addMissingAccess: done.preview.missing_access && pv.addMissingAccess.value,
      }
      const options = confirmOptions(
        done.selection.workItemIds.length,
        targetName(done.selection.targetProgramId),
      )
      settle(await confirmWrite(options, (context) => transfer.submit(vars, { context })))
    })

  return {
    ...sel,
    addMissingAccess: pv.addMissingAccess,
    previewed: pv.previewed,
    stale: pv.stale,
    notice: pv.notice,
    current,
    executable,
    busy: life.busy,
    preview: () => pv.run(sel.selection.value),
    execute,
    resolved: settle,
  }
}
