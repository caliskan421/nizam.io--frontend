/**
 * Notlar sekmesinin yazma akışları (E-03-62; K5, ortak-kurallar §7). Yazmalar `../../api`
 * sarmalayıcılarıyla (`useProtectedMutation`); iyimser güncelleme yok — başarıda liste
 * geçersizlemesi beklenir. Her istek GÖREVİN KENDİ kapsamıyla (`targetOf`).
 *
 *  - Ekle: `addWorkItemNote` (IK eylem başına; "sonuç bilinmiyor" → taslak + anahtar korunur,
 *    yerinde "Yeniden gönder" aynı anahtarla — `UiOutcomeNotice`).
 *  - Düzenle: `expected_revision`; 409 `work.edit_conflict` → `shared/ui/conflict` alan seçimi
 *    (tek alan `content`), seçimden sonra sunucunun kaydı yeni taban, YENİ eylem.
 *  - Sil: istemci onayı (`useConfirm`, sunucu onay istemez) → `deleteWorkItemNote`.
 * Diğer sonuçlar ortak bildirim (`notifyOutcome`; metin hata kodundan, i18n).
 */
import { ApiError } from '@/shared/errors/api-error'
import type { MutationOutcome } from '@/shared/http/mutation'
import { resolveDraft, useConflictResolver } from '@/shared/ui/conflict'
import { notifyOutcome, useConfirm, type ConfirmOptions } from '@/shared/ui/confirm'

import { useAddNote, useDeleteNote, useUpdateNote } from '../../api'
import { targetOf } from '../../model/target'
import type { WorkItem, WorkItemNote } from '../../model/types'
import { notesText } from './messages'

type AnyOutcome = MutationOutcome<unknown, unknown, unknown>

/** Yerinde gösterilen "sonuç bilinmiyor" sonucu (yeniden gönderme aynı anahtarla). */
export type UnknownNotice = Extract<AnyOutcome, { kind: 'unknown_outcome' }>

/** Bir gönderimin ekrana etkisi: `done` → taslak/düzenleyici kapanır; `notice` → yerinde bildirim. */
export interface SettleResult {
  done: boolean
  notice: UnknownNotice | null
}

const NOTE_GONE = 'work.note_not_found'

/** Bildirimdeki gönderimin not içeriği (aynı taslağın yeni anahtarla gönderimini kilitlemek için). */
export function noticeContent(notice: UnknownNotice | null): string | null {
  const draft = notice?.draft as { content?: unknown } | undefined
  return typeof draft?.content === 'string' ? draft.content : null
}

/**
 * Yazma sonucunun ortak dalı: başarı → `done`; "sonuç bilinmiyor" → yerinde bildirim; diğerleri
 * → bildirim kuyruğu. Not artık yoksa (404) liste yeniden okunur ve düzenleyici kapanır.
 */
export async function settle(
  outcome: AnyOutcome,
  refetch: () => Promise<unknown>,
): Promise<SettleResult> {
  if (outcome.kind === 'success') return { done: true, notice: null }
  if (outcome.kind === 'unknown_outcome') return { done: false, notice: outcome }
  notifyOutcome(outcome)
  if (outcome.kind === 'failed' && outcome.error.code === NOTE_GONE) {
    await refetch()
    return { done: true, notice: null }
  }
  return { done: false, notice: null }
}

/** Silme onayı (istemci diyaloğu; `deleteWorkItemNote` sunucu onayı istemez — §7). */
const DELETE_CONFIRM = (): ConfirmOptions => ({
  title: notesText('confirmTitle'),
  body: [notesText('confirmBody')],
  confirmLabel: notesText('confirmAccept'),
  cancelLabel: notesText('cancel'),
  tone: 'danger',
})

export function useNoteActions(item: () => WorkItem, refetch: () => Promise<unknown>) {
  const add = useAddNote()
  const update = useUpdateNote()
  const remove = useDeleteNote()
  const conflict = useConflictResolver()
  const { confirm } = useConfirm()

  const ref = () => ({ target: targetOf(item()), workItemId: item().work_item_id })

  /** Yeni not (gönder düğmesi = yeni eylem, yeni IK). */
  async function addNote(content: string): Promise<SettleResult> {
    return settle(await add.submit({ ...ref(), content }), refetch)
  }

  /** 409 sonrası: yalnız gerçek çakışma sorulur; vazgeçte düzenleyici açık kalır (taslak korunur). */
  async function resolveConflict(
    base: WorkItemNote,
    content: string,
    server: WorkItemNote | null,
  ): Promise<SettleResult> {
    if (!server) {
      // Düzenleme sırasında not silinmiş (güncel listede yok): 404 ile aynı sonuç.
      const error = new ApiError({ code: NOTE_GONE, status: 404 })
      return settle({ kind: 'failed', error }, refetch)
    }
    const choices = await conflict.resolve({
      base: { content: base.content },
      draft: { content },
      server: { content: server.content },
      labels: { content: notesText('field') },
    })
    if (!choices) return { done: false, notice: null }
    const changes = resolveDraft({ content }, { content: server.content }, choices)
    if (changes.content === undefined) {
      await refetch()
      return { done: true, notice: null }
    }
    return saveNote(server, changes.content)
  }

  /** Kendi notunu düzenle: taban = düzenleyicinin açıldığı not (`edit_revision`). */
  async function saveNote(reactiveBase: WorkItemNote, content: string): Promise<SettleResult> {
    // Gövde eylemle dondurulur (structuredClone): sorgu verisinin vekili değil, düz kopya.
    const base: WorkItemNote = { ...reactiveBase }
    // Değişiklik yoksa istek yok (çakışmada taslak = yalnız kullanıcının değiştirdiği içerik).
    if (content === base.content) return { done: true, notice: null }
    const outcome = await update.submit({ ...ref(), noteId: base.note_id, base, content })
    if (outcome.kind === 'edit_conflict') return resolveConflict(base, content, outcome.server)
    return settle(outcome, refetch)
  }

  /** Kendi notunu sil: istemci onayı; sonuç bilinmiyorsa liste yeniden okunur. */
  async function deleteNote(note: WorkItemNote): Promise<boolean> {
    if (!(await confirm(DELETE_CONFIRM()))) return false
    const outcome = await remove.submit({ ...ref(), noteId: note.note_id })
    if (outcome.kind === 'success') return true
    notifyOutcome(outcome)
    if (outcome.kind === 'unknown_outcome' || outcome.kind === 'failed') await refetch()
    return false
  }

  return {
    addNote,
    saveNote,
    deleteNote,
    conflict,
    adding: add.isPending,
    saving: update.isPending,
    removing: remove.isPending,
  }
}
