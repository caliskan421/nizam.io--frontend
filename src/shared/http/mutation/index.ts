export {
  CONFIRMATION_OPERATIONS,
  DEFAULT_TIMEOUT_MS,
  RETRY_WINDOW_MS,
  newAction,
  runAction,
  sameScope,
  type MutationAction,
  type SendContext,
  type SendResult,
} from './engine'
export { generateIdempotencyKey, isValidIdempotencyKey } from './idempotency-key'
export {
  outcomeMessage,
  type ActionContext,
  rateLimitMessage,
  type MutationKind,
  type MutationOutcome,
  type MutationSuccess,
  type OutcomeMessage,
} from './outcome'
export { ownerLife, type OwnerLife } from './owner'
export { runWithFollowUps, type CompositeOutcome, type FollowUpStep } from './partial'
export {
  NOTE_REVISION_GROUPS,
  SUBTASK_REVISION_GROUPS,
  WORK_ITEM_REVISION_GROUPS,
  conflictingFields,
  withExpectedRevisions,
  type RevisionGroup,
} from './revisions'
export {
  useProtectedMutation,
  type ProtectedMutation,
  type ProtectedMutationOptions,
  type SubmitOptions,
} from './use-protected-mutation'
