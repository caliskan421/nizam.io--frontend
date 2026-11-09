// Derleme sonrası kanıt (W61b): `pnpm e2e` önce `pnpm build` koşar; dist/index.html'de katman
// sırası dosyası tüm diğer stil bağlantılarından ve modül betiğinden önce gelir, sunulan dosya
// main.css ile aynı sırayı taşır.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

import { documentStyleOrder } from './layer-check'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const layerList = (css: string) =>
  /@layer\s+([\w\s,-]+);/.exec(css.replace(/\/\*[\s\S]*?\*\//g, ''))?.[1]?.replace(/\s+/g, '')

test('dist/index.html: /layers.css ilk stil kaynağı, modül betiğinden ve CSS parçalarından önce', () => {
  const order = documentStyleOrder(read('../dist/index.html'))
  expect(order.length).toBeGreaterThan(2)
  expect(order[0]).toBe('/layers.css')
  expect(order.filter((src) => src === '/layers.css')).toHaveLength(1)
})

test('sunulan /layers.css main.css ile aynı katman sırasını taşır', async ({ request }) => {
  const response = await request.get('/layers.css')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('text/css')
  const served = layerList(await response.text())
  expect(served).toBe('theme,base,primevue,components,utilities')
  expect(served).toBe(layerList(read('../src/app/styles/main.css')))
})
