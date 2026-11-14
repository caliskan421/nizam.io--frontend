/**
 * Bağlantı koptu göstergesi (N-10-15, E-10-18 altı; `mekanizma.md` §Gerçek zamanlı): akış durumu
 * `connecting`/`waiting` kopukluk 10 sn'yi AŞARSA başlık altında "Bağlantı yeniden kuruluyor…"
 * (`role="status"`). Sessiz yeniden bağlanma kuralı korunur: açılışta ve kısa kopmalarda gösterge
 * yok; `open` ya da kasıtlı duraklama (`paused`, gizli sekme) / kapanış (`closed`) göstergeyi söndürür.
 * Zamanlayıcı sahip sökülünce temizlenir (KESİN 26).
 */
import { onScopeDispose, ref, watch } from 'vue'

import type { StreamState } from '@/shared/sse'

export const RECONNECT_NOTICE_MS = 10_000

const BROKEN: ReadonlySet<StreamState> = new Set(['connecting', 'waiting'])

export function useConnectionNotice(state: () => StreamState) {
  const visible = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  function stop(): void {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  watch(
    state,
    (now) => {
      if (!BROKEN.has(now)) {
        stop()
        visible.value = false
        return
      }
      // Kopukluk süresi ilk kopuş anından sayılır (connecting ↔ waiting geçişleri sayacı sıfırlamaz).
      if (timer === null && !visible.value) {
        timer = setTimeout(() => {
          timer = null
          visible.value = true
        }, RECONNECT_NOTICE_MS)
      }
    },
    { immediate: true },
  )
  onScopeDispose(stop)
  return { visible }
}
