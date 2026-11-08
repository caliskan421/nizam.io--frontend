// Alan alan çakışma seçimi (K5; 409 `*.edit_conflict`). W44 (alt görev) ve W47 (not) tüketir.
export { default as ConflictDialog } from './ConflictDialog.vue'
export {
  allChosen,
  conflictRows,
  resolveDraft,
  type ConflictChoice,
  type ConflictChoices,
  type ConflictField,
  type ConflictInput,
} from './conflict'
export { conflictText, trConflict, type ConflictTextKey } from './messages'
export { useConflictResolver } from './use-conflict'
