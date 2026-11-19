import { onMounted, onScopeDispose, ref, watch, type Ref } from 'vue'

import { fullPreviewSize } from '../../model/full-preview-layout'

export function useFullPreviewLayout(
  stage: Ref<HTMLElement | null>,
  chip: Ref<HTMLElement | null>,
  blobUrl: Readonly<Ref<string | null>>,
) {
  const size = ref<ReturnType<typeof fullPreviewSize>>(null)
  const natural = ref({ width: 0, height: 0 })
  const scrolled = ref(false)
  let observer: ResizeObserver | undefined

  function measure(): void {
    const area = stage.value
    if (!area || !natural.value.width) return
    const bounds = getComputedStyle(area)
    const pixels = (value: string) => Number.parseFloat(value) || 0
    const paddingX = pixels(bounds.paddingLeft) + pixels(bounds.paddingRight)
    const paddingY = pixels(bounds.paddingTop) + pixels(bounds.paddingBottom)
    const mobile =
      getComputedStyle(area).getPropertyValue('--archive-preview-mobile').trim() === '1'
    const badge = chip.value
    const chipHeight = badge ? badge.offsetHeight + pixels(getComputedStyle(badge).marginBottom) : 0
    size.value = fullPreviewSize(
      natural.value.width,
      natural.value.height,
      area.clientWidth - paddingX,
      area.clientHeight - paddingY - chipHeight,
      window.innerWidth,
      mobile,
    )
  }

  function decoded(event: Event): void {
    const image = event.currentTarget as HTMLImageElement
    natural.value = { width: image.naturalWidth, height: image.naturalHeight }
    measure()
  }

  watch(blobUrl, () => {
    size.value = null
    natural.value = { width: 0, height: 0 }
    scrolled.value = false
    if (stage.value) stage.value.scrollTop = 0
  })
  onMounted(() => {
    if (stage.value && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(stage.value)
    }
    window.addEventListener('resize', measure)
  })
  onScopeDispose(() => {
    observer?.disconnect()
    window.removeEventListener('resize', measure)
  })

  return { size, natural, scrolled, decoded }
}
