const DESKTOP_SCROLL_THRESHOLD = 360
const DESKTOP_SCROLL_WIDTH = 560
const MOBILE_SCROLL_FRACTION = 0.6

export function fullPreviewSize(
  naturalWidth: number,
  naturalHeight: number,
  availableWidth: number,
  availableHeight: number,
  viewportWidth: number,
  mobile: boolean,
) {
  if (Math.min(naturalWidth, naturalHeight, availableWidth, availableHeight) <= 0) return null
  const fit = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight)
  const threshold = mobile ? viewportWidth * MOBILE_SCROLL_FRACTION : DESKTOP_SCROLL_THRESHOLD
  const scrollWidth = mobile ? availableWidth : Math.min(DESKTOP_SCROLL_WIDTH, availableWidth)
  const width = Math.floor(
    naturalWidth * fit < threshold ? Math.min(naturalWidth, scrollWidth) : naturalWidth * fit,
  )
  const height = Math.ceil((width * naturalHeight) / naturalWidth)
  return { width, height, scroll: height > availableHeight }
}

export function splitPreviewName(name: string) {
  const dot = name.lastIndexOf('.')
  return dot > 0 && dot < name.length - 1
    ? { stem: name.slice(0, dot), extension: name.slice(dot) }
    : { stem: name, extension: '' }
}
