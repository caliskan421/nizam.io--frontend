/**
 * Görev ekranı bileşen İSKELETİ (W41; O2b sözleşmesi — K15, CX-F0-Ö-06). Adlar ve prop/emit
 * tipleri burada SABİTTİR; her O2b uygulayıcısı yalnız kendi `.vue` dosyasının gövdesini
 * doldurur, bu dosyaya satır eklemez/değiştirmez. Sözleşme değişikliği koordinatör kararıdır.
 *
 * Ortak kurallar (bütün bileşenler):
 *  - Veri yalnız `../api` composable'larından; anahtarlar `query-keys.ts`'ten (grup kendi
 *    anahtarını yazmaz). Tek göreve ait her istek görevin kendi kapsamıyla (`targetOf(item)`).
 *  - Eylem görünürlüğü yalnız `../model/capabilities.ts` (`workActorFacts` + `can*`); mercek
 *    yetki değildir (P1); yetkisiz eylem gizlenir, BE kaynaklı eksik eylem devre dışı + stub.
 *  - Yazmalar `useProtectedMutation` sarmalayıcılarıyla (`../api`); iyimser güncelleme yok;
 *    sonuç `shared/ui/confirm` (`notifyOutcome`, `UiOutcomeNotice`, `useConfirm`), çakışma
 *    `shared/ui/conflict`.
 *  - `item` prop'u liste satırı (`WorkItem`) ya da ayrıntı (`WorkItemDetail`) olabilir.
 * Kabul ölçütü: `docs/ekranlar/03-gorevler-liste/README.md` kabul tablosu (yalnız `kabul`).
 */
import type { FileRecord, TransitionResult, WorkItem, WorkItemSubtask } from '../model/types'

/** Panel sekmeleri (E-03-45; bellekte, URL'de değil; görev değişince `summary`). */
export type WorkDetailTab = 'summary' | 'subtasks' | 'files' | 'notes'
/** Panel kapanış nedeni: kullanıcı (E-03-43), görev silindi (E-03-56), bulunamadı (404). */
export type WorkDetailCloseReason = 'user' | 'deleted' | 'not_found'

// --- W43 — ayrıntı paneli ------------------------------------------------------------------

/** W43 · E-03-19, E-03-41…51, E-03-53…55, E-03-43 — ayrıntı paneli (üst bilgi, sekme kabı, Özet). */
export interface WorkDetailPanelProps {
  /** Açık görev (URL `gorev`). Hedef kapsam `useWorkItemTarget(workItemId)`. */
  workItemId: string
  /** Açılış sekmesi (E-03-32 → `subtasks`); varsayılan `summary`. */
  initialTab?: WorkDetailTab
}
export interface WorkDetailPanelEmits {
  /** Panel kapandı; çağıran URL `gorev`'i siler. */
  close: [reason: WorkDetailCloseReason]
}

// --- W44 — alt görevler --------------------------------------------------------------------

/** W44 · E-03-21, E-03-30…37 — satır içi alt görev bloğu (panel sekmesiyle AYNI sorgu). */
export interface SubtaskBlockProps {
  item: WorkItem
}
export interface SubtaskBlockEmits {
  /** E-03-32: alt görev başlığı → üst görevin paneli "Alt görevler" sekmesinde. */
  openSubtasks: [workItemId: string]
}

/** W44 · E-03-60 (+ E-03-31…37) — panel "Alt görevler" sekmesi. */
export interface SubtaskTabProps {
  item: WorkItem
}

// --- W45 — yeni görev, durum, silme ---------------------------------------------------------

/** W45 · E-03-06, E-03-57 — yeni görev formu (P3 minimum; K11 vee-validate + zod). */
export interface NewTaskDialogProps {
  /** `v-model:open`. */
  open: boolean
  /** Önseçili koordinatörlük (kapsamdan); `null` = seçilmedi (yönetici seçer). */
  departmentId?: string | null
}
export interface NewTaskDialogEmits {
  'update:open': [value: boolean]
  /** Oluşturulan görev (kısmi başarıda da); çağıran paneli açar (URL `gorev`). */
  created: [item: WorkItem]
}

/** W45 · E-03-44, E-03-58 — durum seçici / geçiş menüsü (yetkisizde salt okunur etiket). */
export interface StatusMenuProps {
  item: WorkItem
}
export interface StatusMenuEmits {
  /** Geçiş başarılı (görev ve liste yeniden okundu). */
  transitioned: [result: TransitionResult]
  /** 422 `work.attachment_required` → "Önce kanıt dosyası yükleyin" + yükleme (E-03-52). */
  requestEvidence: []
}

/** W45 · E-03-56, E-03-64 — görevi sil (istemci onayı → `deleteWorkItem`). */
export interface DeleteTaskActionProps {
  item: WorkItem
}
export interface DeleteTaskActionEmits {
  deleted: [workItemId: string]
}

// --- W46 — dosyalar ------------------------------------------------------------------------

/** W46 · E-03-52, E-03-35 — dosya / kanıt yükleme (etiket seçici, P5; görev durumu değişmez). */
export interface FileUploadDialogProps {
  /** `v-model:open`. */
  open: boolean
  item: WorkItem
  /** Alt göreve bağlı yükleme (`attachFile?subtask_id=`). */
  subtaskId?: string | null
}
export interface FileUploadDialogEmits {
  'update:open': [value: boolean]
  uploaded: [file: FileRecord]
}

/** W46 · E-03-61, E-03-50 — panel "Dosyalar" sekmesi (liste, indirme bileti, ad değiştir, sil). */
export interface FilesTabProps {
  item: WorkItem
}

/** W46 · E-03-35 — alt görev satırındaki kanıt yuvası (dosya adı + yükle). */
export interface SubtaskFileSlotProps {
  item: WorkItem
  subtask: WorkItemSubtask
}

// --- W47 — notlar --------------------------------------------------------------------------

/** W47 · E-03-62 — panel "Notlar" sekmesi (liste, yaz, kendi notunu düzenle/sil). */
export interface NotesTabProps {
  item: WorkItem
}

// --- Bileşenler (gövdeler O2b'de) ------------------------------------------------------------

export { default as WorkDetailPanel } from './detail/WorkDetailPanel.vue'
export { default as SubtaskBlock } from './subtasks/SubtaskBlock.vue'
export { default as SubtaskTab } from './subtasks/SubtaskTab.vue'
export { default as NewTaskDialog } from './forms/NewTaskDialog.vue'
export { default as StatusMenu } from './forms/StatusMenu.vue'
export { default as DeleteTaskAction } from './forms/DeleteTaskAction.vue'
export { default as FileUploadDialog } from './files/FileUploadDialog.vue'
export { default as FilesTab } from './files/FilesTab.vue'
export { default as SubtaskFileSlot } from './files/SubtaskFileSlot.vue'
export { default as NotesTab } from './notes/NotesTab.vue'
