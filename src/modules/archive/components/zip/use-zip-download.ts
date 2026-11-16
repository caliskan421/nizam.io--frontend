/**
 * ZIP düğmelerinin ortak akışı (E-06-04/34): bilet → tüketim (`useArchiveDownload`), durumlar
 * `idle → busy → saved | failed`. Kural:
 *  - Sürerken ikinci tıklama yok (tek eylem, tek bilet); sonuç gelince düğme yeniden açılır.
 *  - Otomatik tekrar YOK: hata metni görünür, yeni bilet yalnız kullanıcının yeni tıklamasıyla.
 *  - Sahip (düğme) bilet beklerken sökülürse bilet TÜKETİLMEZ; söküm sonrası metin/bildirim yok.
 *  - Hedef/klasör değişirse (`identity`) bayat sonuç yeni hedefe yazılmaz.
 */
import { computed, ref, watch } from 'vue'

import { cooldownSeconds, useDownloadCooldown, useDownloadLife } from '@/shared/download'
import { ownerLife } from '@/shared/http/mutation'

import { useArchiveDownload } from '../../api/downloads'
import type { ArchiveDownloadRequest } from '../../model/types'
import { zipFailureText, type ZipScope } from './zip-status'

export type ZipPhase = 'idle' | 'busy' | 'saved' | 'failed'

export function useZipDownload(scope: ZipScope, identity: () => string) {
  const download = useArchiveDownload()
  const life = ownerLife()
  const downloadLife = useDownloadLife()
  const phase = ref<ZipPhase>('idle')
  const error = ref<string | null>(null)
  // Süre bitince düğme açılır ve not kalkar; kendiliğinden yeni bilet YOK (CX-F8-Ö-01).
  const cooldown = useDownloadCooldown(() => {
    if (phase.value === 'failed') {
      phase.value = 'idle'
      error.value = null
    }
  })
  let generation = 0

  watch(identity, () => {
    downloadLife.cancel()
    generation += 1
    phase.value = 'idle'
    error.value = null
  })

  async function start(request: ArchiveDownloadRequest): Promise<void> {
    if (phase.value === 'busy' || cooldown.seconds.value > 0) return
    const mine = ++generation
    phase.value = 'busy'
    error.value = null
    const result = await download.start(request, downloadLife.begin())
    if (!life.alive() || mine !== generation) return
    const wait = cooldownSeconds(result)
    if (wait !== null) cooldown.start(wait)
    const text = zipFailureText(result, scope)
    if (result.kind === 'saved') phase.value = 'saved'
    else if (text !== null) phase.value = 'failed'
    else phase.value = 'idle'
    error.value = text
  }

  return {
    phase,
    error,
    busy: computed(() => phase.value === 'busy'),
    cooldown: cooldown.seconds,
    start,
  }
}
