import { ref } from 'vue'
import { reachesOwner } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useAddMeetingNote } from '../../api/note-writes'

const MAX_CHARS = 5000

/**
 * Not ekleme (E-09-41…43): taslak, "sonuç bilinmiyor" taslağı (aynı metin ikinci kez gönderilmez,
 * kullanıcı değiştirince açılır) ve sahip/kapsam/oturum sürümü eskiyse sonucun yok sayılması.
 * `Idempotency-Key` ortak yazma motorundan gelir.
 */
export function useNoteAdd(
  target: () => { programId: string; id: string },
  version: () => number,
  refresh: () => void,
) {
  const add = useAddMeetingNote()
  const draft = ref('')
  const unknownDraft = ref<string | null>(null)
  function resetAdd() {
    draft.value = ''
    unknownDraft.value = null
  }
  async function addNote() {
    if (
      !target().programId ||
      !draft.value.trim() ||
      Array.from(draft.value).length > MAX_CHARS ||
      add.isPending.value ||
      draft.value === unknownDraft.value
    )
      return
    const started = version()
    const content = draft.value
    const result = await add.submit({ ...target(), body: { content } })
    if (!reachesOwner(result) || started !== version()) return
    if (result.kind === 'success') {
      resetAdd()
      refresh()
    } else {
      if (result.kind === 'unknown_outcome') unknownDraft.value = content
      notifyOutcome(result)
    }
  }
  return { add, draft, unknownDraft, addNote, resetAdd }
}
