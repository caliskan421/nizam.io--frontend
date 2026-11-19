import { expect, it } from 'vitest'

import { fullPreviewSize, splitPreviewName } from './full-preview-layout'

it('yatay, uzun ve küçük görselleri oranını koruyarak yerleştirir', () => {
  expect(fullPreviewSize(1600, 1200, 1384, 780, 1440, false)).toEqual({
    width: 1040,
    height: 780,
    scroll: false,
  })
  expect(fullPreviewSize(1080, 3240, 1384, 780, 1440, false)).toEqual({
    width: 560,
    height: 1680,
    scroll: true,
  })
  expect(fullPreviewSize(1080, 3240, 358, 550, 390, true)).toEqual({
    width: 358,
    height: 1074,
    scroll: true,
  })
  expect(fullPreviewSize(112, 90, 358, 550, 390, true)).toEqual({
    width: 112,
    height: 90,
    scroll: false,
  })
})

it('uzun dosya adının son uzantısını ayrı tutar', () => {
  expect(splitPreviewName('rapor.v2.uzun.pdf')).toEqual({
    stem: 'rapor.v2.uzun',
    extension: '.pdf',
  })
  expect(splitPreviewName('.gizli')).toEqual({ stem: '.gizli', extension: '' })
})
