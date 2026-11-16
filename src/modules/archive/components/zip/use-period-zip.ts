/**
 * Dönem ZIP'i akışı (E-06-04, E-13-09…11): bilet → tüketim (`usePeriodZipDownload`, S2), durumlar
 * `idle → busy → saved | failed` (+ `truncated`). `useZipDownload` kuralları aynıdır: sürerken ikinci
 * tıklama yok, otomatik tekrar yok, sahip bilet beklerken söküldüyse bilet TÜKETİLMEZ ve söküm
 * sonrası metin/bildirim yok, program/oturum değişince bayat sonuç yeni duruma yazılmaz.
 * İstek HER ZAMAN raporludur (`include_reports=true`): onay penceresinin ağaç satırları bunu söyler.
 */
import { computed, ref, watch } from 'vue'

import { ownerLife } from '@/shared/http/mutation'

import { usePeriodZipDownload } from '../../api/period-zip'
import { zipFailureText } from './zip-status'

export type PeriodZipPhase = 'idle' | 'busy' | 'saved' | 'failed'

export function usePeriodZip(programId: () => string | null) {
  const download = usePeriodZipDownload()
  const life = ownerLife()
  const phase = ref<PeriodZipPhase>('idle')
  const error = ref<string | null>(null)
  const truncated = ref(false)
  let generation = 0

  watch(programId, () => {
    generation += 1
    phase.value = 'idle'
    error.value = null
    truncated.value = false
  })

  async function start(): Promise<void> {
    const program = programId()
    if (program === null || phase.value === 'busy') return
    const mine = ++generation
    phase.value = 'busy'
    error.value = null
    truncated.value = false
    const result = await download.start({
      programId: program,
      includeReports: true,
      fallbackName: 'donem-arsivi.zip',
    })
    if (!life.alive() || mine !== generation) return
    const text = zipFailureText(result, 'period')
    if (result.kind === 'saved') {
      phase.value = 'saved'
      truncated.value = result.truncated === true
    } else phase.value = text !== null ? 'failed' : 'idle'
    error.value = text
  }

  return { phase, error, truncated, busy: computed(() => phase.value === 'busy'), start }
}
