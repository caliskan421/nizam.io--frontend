<script setup lang="ts">
import './zip.css'

import { computed } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'
import { useStanding } from '@/shared/scope/standing'
import { useScopeStore } from '@/shared/scope/store'
import { UiButton, UiIcon, UiModal } from '@/shared/ui'

import { useArchiveFolders } from '../../api/queries'
import { programSource } from '../../model/admin-scope'
import { formatBytes } from '../../model/mime'
import { REPORT_PDF_DEPARTMENT_LIMIT, zipDate, zipPlan } from '../../model/zip-plan'
import { zipText } from './messages'

/**
 * Dönem arşivi ZIP onay penceresi (E-13-10; `Rapor-Pencereler.dc.html` 4b). Arşiv büyük olduğu için
 * önce onay istenir: kicker "program · sezon", "‹N› dosya · ‹boyut› · birkaç dakika sürebilir"
 * (`programArchiveFolders` `totals`), gövdede klasör ağacı önizlemesi (`00-Genel/` dönem raporu,
 * ilk birim klasörü + birim raporu + `EKSIK-DOSYALAR.txt`, kalan klasör özeti; 40'tan fazla birimde
 * `NOT.txt`), "sayfayı kapatmayın" notu ve "kayda geçer (denetim)" (E-13-11). Veri okunana dek
 * "Hazırla ve indir" kapalıdır; sayı/ad uydurulmaz. Esc/✕/Vazgeç `UiModal`'dadır (odak tetikleyiciye
 * döner); `confirm` yayınlanınca çağıran pencereyi kapatıp indirmeyi başlatır.
 */
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()

const store = useScopeStore()
const instance = useInstanceStore()
const { programs } = useStanding()
const folders = useArchiveFolders(
  () => (store.programId === null ? null : programSource(store.programId, null)),
  () => open.value,
)

const program = computed(() => programs.value?.find((p) => p.programId === store.programId) ?? null)
const kicker = computed(() => {
  const current = program.value
  if (current === null) return ''
  return current.year === null
    ? current.name
    : zipText('period.dialog.kicker', { program: current.name, year: current.year })
})
const ready = computed(() => folders.data.value !== undefined)
const totals = computed(() => folders.data.value?.totals ?? null)
const plan = computed(() =>
  zipPlan(
    program.value?.name ?? '',
    zipDate(new Date(), instance.profile?.timezone),
    folders.data.value?.folders ?? [],
  ),
)
const summary = computed(() =>
  totals.value
    ? zipText('period.dialog.summary', {
        files: totals.value.file_count,
        size: formatBytes(totals.value.total_bytes),
      })
    : '',
)
const first = computed(() => plan.value.departments[0] ?? null)
const rest = computed(() => plan.value.departments.slice(1))
const more = computed(() => {
  const list = rest.value
  if (list.length === 0) return null
  const number = (folder: string) => folder.slice(0, folder.indexOf('-'))
  return zipText('period.dialog.more', {
    from: number(list[0]!.folder),
    to: number(list[list.length - 1]!.folder),
    n: list.length,
  })
})

function unitText(files: number): string {
  return files > 0
    ? zipText('period.dialog.unitReport', { n: files })
    : zipText('period.dialog.unitReportEmpty')
}
</script>

<template>
  <UiModal
    v-model:open="open"
    :title="zipText('period.dialog.title')"
    :description="ready ? summary : undefined"
  >
    <div class="zip-dialog" data-testid="period-zip-dialog">
      <p v-if="kicker" class="rp-kicker" data-testid="zip-kicker">{{ kicker }}</p>
      <p v-if="!ready && !folders.isError.value" class="rp-cap" role="status">
        {{ zipText('period.dialog.loading') }}
      </p>
      <p v-else-if="!ready" class="rp-cap zip__note--error" role="alert">
        {{ zipText('period.dialog.error') }}
      </p>
      <template v-else>
        <p class="rp-cap rp-mono" data-testid="zip-root">{{ plan.root }}/</p>
        <ul class="zip-tree" :aria-label="zipText('period.dialog.tree')" data-testid="zip-tree">
          <li data-testid="zip-general">
            <UiIcon name="archive" size="sm" />
            <span class="rp-mono rp-trunc">00-Genel/</span>
            <span class="rp-cap">{{ zipText('period.dialog.general') }}</span>
          </li>
          <template v-if="plan.unitReports">
            <li v-if="first" data-testid="zip-unit">
              <UiIcon name="archive" size="sm" />
              <span class="rp-mono rp-trunc">{{ first.folder }}/</span>
              <span class="rp-cap">{{ unitText(first.files) }}</span>
            </li>
            <li v-if="first" class="zip-tree__nested" data-testid="zip-missing">
              <UiIcon name="file" size="sm" />
              <span class="rp-mono rp-trunc">EKSIK-DOSYALAR.txt</span>
              <span class="rp-cap">{{ zipText('period.dialog.missing') }}</span>
            </li>
          </template>
          <li v-else data-testid="zip-notice">
            <UiIcon name="file" size="sm" />
            <span class="rp-mono rp-trunc">NOT.txt</span>
            <span class="rp-cap">{{
              zipText('period.dialog.notice', { limit: REPORT_PDF_DEPARTMENT_LIMIT })
            }}</span>
          </li>
        </ul>
        <p v-if="more" class="rp-cap" data-testid="zip-more">{{ more }}</p>
      </template>
      <p class="zip-dialog__alert" role="note" data-testid="zip-wait">
        <UiIcon name="chat-info" size="sm" />
        <span>{{ zipText('period.dialog.wait') }}</span>
      </p>
      <p class="rp-cap" data-testid="zip-audit">{{ zipText('period.dialog.audit') }}</p>
    </div>
    <template #footer>
      <UiButton variant="ghost" data-testid="zip-cancel" @click="open = false">
        {{ zipText('period.dialog.cancel') }}
      </UiButton>
      <UiButton
        variant="primary"
        icon="download"
        :disabled="!ready"
        data-testid="zip-confirm"
        @click="emit('confirm')"
      >
        {{ zipText('period.dialog.confirm') }}
      </UiButton>
    </template>
  </UiModal>
</template>
