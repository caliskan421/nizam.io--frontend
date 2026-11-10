// Görev modülü veri katmanı (W41): okuma composable'ları + korumalı yazma sarmalayıcıları.
// Bileşenler buradan tüketir; modül dışı tüketiciler `../public.ts` üzerinden.
export {
  ASSIGNEE_FILTER_MAX,
  fetchFiles,
  fetchNotes,
  fetchProgramDepartments,
  fetchSubtasks,
  fetchWorkItem,
  fetchWorkItemCounts,
  fetchWorkItemPage,
  normalizeAssignees,
} from './fetchers'
export { programHeaders, retryTransient, scopeHeaders, WORK_ITEM_PAGE_LIMIT } from './http'
export {
  isDeletingWorkItem,
  useAddAssignments,
  useCreateWorkItem,
  useCreateWorkItemWithAssignees,
  useDeleteWorkItem,
  useOwnStatusWorkItem,
  useTransitionWorkItem,
  useUpdateWorkItem,
} from './items'
export {
  attachFileForm,
  useAttachFile,
  useDeleteFile,
  useDownloadTicket,
  useRenameFile,
} from './files'
export { useAddNote, useDeleteNote, useUpdateNote } from './notes'
export {
  useMyProgramDepartments,
  useProgramDepartments,
  useWorkItem,
  useWorkItemFiles,
  useWorkItemCounts,
  useWorkItemList,
  useWorkItemNotes,
  useWorkItemSubtasks,
  useWorkItemTarget,
} from './queries'
export { useCreateSubtask, useDeleteSubtask, useUpdateSubtask } from './subtasks'
