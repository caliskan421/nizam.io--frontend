import { shallowRef, type Ref } from 'vue'
import { reachesOwner, type MutationOutcome } from '@/shared/http/mutation'
import { notifyOutcome } from '@/shared/ui/confirm'
import { useCreateMeeting } from '../../api/meeting-writes'
import type { CreateMeetingRequest, MeetingCreated } from '../../model/types'
import { meetingFieldErrors } from './meeting-field-errors'

interface Hooks {
  uncertain: Ref<boolean>
  fieldErrors: Ref<Record<string, string>>
  warn: (side: MeetingCreated['side_effects'], failed: string[]) => void
  saved: (meetingId: string) => void
}

/**
 * Toplantı oluşturma gönderimi ve sonucu (BE-068): her gönderim eylem başına `Idempotency-Key`
 * taşır; belirsiz sonuçta `notice` doldurulur ve "Yeniden gönder" AYNI anahtar + gövdeyle gider.
 * Sonuç çözülene dek yeni gönderim kapalıdır (`uncertain`).
 */
export function useCreateSettle(hooks: Hooks) {
  const create = useCreateMeeting()
  const notice = shallowRef<MutationOutcome<unknown, unknown, unknown> | null>(null)
  function settle(result: MutationOutcome<unknown, MeetingCreated, unknown>) {
    if (!reachesOwner(result)) return
    notice.value = null
    hooks.uncertain.value = result.kind === 'unknown_outcome'
    if (result.kind === 'unknown_outcome') notice.value = result
    else if (result.kind === 'success') {
      hooks.warn(result.data.side_effects, result.data.failed_participants ?? [])
      hooks.saved(result.data.meeting.meeting_id)
    } else {
      const errors = meetingFieldErrors(result)
      hooks.fieldErrors.value = errors
      if (!Object.keys(errors).length) notifyOutcome(result)
    }
  }
  return {
    create,
    notice,
    submit: async (programId: string, body: CreateMeetingRequest) =>
      settle(await create.submit({ programId, body })),
    // Ortak bildirimin sonucu türsüzdür; yeniden gönderilen istek `createMeeting`'dir.
    resolved: (outcome: MutationOutcome<unknown, unknown, unknown>) =>
      settle(outcome as MutationOutcome<unknown, MeetingCreated, unknown>),
  }
}
