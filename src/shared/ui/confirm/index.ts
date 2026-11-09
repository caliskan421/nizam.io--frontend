// Onay diyalogları ve yazma sonucu bildirimleri (K5; ortak-kurallar §7). Kabuk `ConfirmHost`'u
// bir kez yerleştirir; ekranlar `useConfirm()` / `notifyOutcome()` / `UiOutcomeNotice` kullanır.
export { default as ConfirmDialog } from './ConfirmDialog.vue'
export { default as ConfirmHost } from './ConfirmHost.vue'
export { default as UiOutcomeNotice } from './UiOutcomeNotice.vue'
export { confirmText, trConfirm, type ConfirmTextKey } from './messages'
export { notifyOutcome, outcomeText, outcomeToast } from './notify'
export {
  unassignedTasks,
  useConfirm,
  type ConfirmOptions,
  type ConfirmRequest,
  type ConfirmTone,
  type ConfirmWriteOptions,
  type StartWrite,
} from './use-confirm'
