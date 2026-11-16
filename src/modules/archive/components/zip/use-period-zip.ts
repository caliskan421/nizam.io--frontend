/**
 * Dönem ZIP'i akışı (E-06-04, E-13-09…11): bilet → tüketim (`usePeriodZipDownload`, S2), durumlar
 * `idle → busy → saved | failed` (+ `truncated`). `useZipDownload` kuralları aynıdır: sürerken ikinci
 * tıklama yok, otomatik tekrar yok, sahip bilet beklerken söküldüyse bilet TÜKETİLMEZ ve söküm
 * sonrası metin/bildirim yok, program/oturum değişince bayat sonuç yeni duruma yazılmaz.
 * İstek HER ZAMAN raporludur (`include_reports=true`): onay penceresinin ağaç satırları bunu söyler.
 */
import { computed, ref, watch } from 'vue'

import { cooldownSeconds, useDownloadCooldown, useDownloadLife } from '@/shared/download'
import { ownerLife } from '@/shared/http/mutation'

import { usePeriodZipDownload } from '../../api/period-zip'
import { zipFailureText } from './zip-status'

export type PeriodZipPhase = 'idle' | 'busy' | 'saved' | 'failed'

export function usePeriodZip(programId: () => string | null) {
  const download = usePeriodZipDownload()
  const life = ownerLife()
  const downloadLife = useDownloadLife()
  const phase = ref<PeriodZipPhase>('idle')
  const error = ref<string | null>(null)
  // Süre bitince düğme açılır ve not kalkar; kendiliğinden yeni bilet YOK (CX-F8-Ö-01).
  const cooldown = useDownloadCooldown(() => {
    if (phase.value === 'failed') {
      phase.value = 'idle'
      error.value = null
    }
  })
  const truncated = ref(false)
  let generation = 0

  watch(programId, () => {
    downloadLife.cancel()
    generation += 1
    phase.value = 'idle'
    error.value = null
    truncated.value = false
  })

  async function start(): Promise<void> {
    const program = programId()
    if (program === null || phase.value === 'busy' || cooldown.seconds.value > 0) return
    const mine = ++generation
    phase.value = 'busy'
    error.value = null
    truncated.value = false
    // Program/oturum/hesap değişimi ve söküm eylemi iptal eder; bilet ve gövde yanıtından sonra
    // bağlam yeniden doğrulanır (CX-F8-E-01): eski programın ZIP'i kaydedilmez.
    const result = await download.start(
      { programId: program, includeReports: true, fallbackName: 'donem-arsivi.zip' },
      downloadLife.begin(),
    )
    if (!life.alive() || mine !== generation) return
    const wait = cooldownSeconds(result)
    if (wait !== null) cooldown.start(wait)
    const text = zipFailureText(result, 'period')
    if (result.kind === 'saved') {
      phase.value = 'saved'
      truncated.value = result.truncated === true
    } else phase.value = text !== null ? 'failed' : 'idle'
    error.value = text
  }

  return {
    phase,
    error,
    truncated,
    busy: computed(() => phase.value === 'busy'),
    cooldown: cooldown.seconds,
    start,
  }
}
