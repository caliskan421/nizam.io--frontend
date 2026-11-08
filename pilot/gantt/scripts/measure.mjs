// W31 Gantt pilotu ölçüm koşucusu.
// `pnpm build && pnpm measure` → evidence/results.json + ekran görüntüleri.
// Sunucu üretim CSP'sini (deploy/Caddyfile) birebir uygular: her istekte yeni nonce,
// `style-src 'self' 'nonce-…'`, `script-src 'self'` (eval yok). İhlaller sayfada toplanır.
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { extname, join, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'evidence')
const RUNS = Number(process.env.RUNS ?? 5)
const CANDIDATES = (process.env.ONLY ?? 'own,svar,frappe,dhtmlx').split(',')
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

const csp = (n) =>
  `default-src 'self'; script-src 'self'; style-src 'self' 'nonce-${n}'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`

function serve() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    // `?nocsp`: karşılaştırma için CSP'siz görünüm (kütüphanenin amaçlanan çizimi).
    const file = join(DIST, path === '/' ? 'index.html' : path)
    try {
      let body = await readFile(file)
      const type = TYPES[extname(file)] ?? 'application/octet-stream'
      const headers = { 'content-type': type }
      if (type === 'text/html' && !req.url.includes('nocsp')) {
        const nonce = randomUUID()
        body = Buffer.from(body.toString().replace('{{nonce}}', nonce))
        headers['content-security-policy'] = csp(nonce)
      }
      res.writeHead(200, headers).end(body)
    } catch {
      res.writeHead(404).end()
    }
  })
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)))
}

/** Sayfa başına gzip boyutu: giriş + içe aktarılan parçalar + CSS (manifest'ten). */
async function bundleSizes() {
  const manifest = JSON.parse(await readFile(join(DIST, '.vite/manifest.json'), 'utf8'))
  const sizes = {}
  for (const [key, entry] of Object.entries(manifest)) {
    if (!entry.isEntry) continue
    const seen = new Set()
    const files = []
    const walk = (k) => {
      if (seen.has(k)) return
      seen.add(k)
      const e = manifest[k]
      files.push(e.file, ...(e.css ?? []))
      for (const i of e.imports ?? []) walk(i)
    }
    walk(key)
    let js = 0
    let css = 0
    let raw = 0
    for (const f of new Set(files)) {
      const buf = await readFile(join(DIST, f))
      raw += buf.length
      if (f.endsWith('.css')) css += gzipSync(buf).length
      else js += gzipSync(buf).length
    }
    sizes[entry.name ?? key] = { jsGz: js, cssGz: css, totalGz: js + css, raw }
  }
  return sizes
}

/** Paket parçasında CSP/güvenlik açısından riskli kalıpları sayar. */
async function staticScan() {
  const manifest = JSON.parse(await readFile(join(DIST, '.vite/manifest.json'), 'utf8'))
  const out = {}
  for (const e of Object.values(manifest)) {
    if (!e.isEntry) continue
    const src = (await readFile(join(DIST, e.file))).toString()
    const count = (re) => (src.match(re) ?? []).length
    out[e.name] = {
      eval: count(/\beval\(/g),
      newFunction: count(/new Function\(/g),
      innerHTML: count(/innerHTML/g),
      styleAttrInMarkup: count(/style=\\?["']/g),
      setAttributeStyle: count(/setAttribute\(["']style["']/g),
      styleElement: count(/createElement\(["']style["']\)/g),
      insertRule: count(/insertRule/g),
    }
  }
  return out
}

const INIT = () => {
  window.__csp = []
  document.addEventListener('securitypolicyviolation', (e) =>
    window.__csp.push({
      dir: e.violatedDirective,
      blocked: e.blockedURI,
      sample: e.sample?.slice(0, 60),
    }),
  )
  window.__loaf = []
  try {
    new PerformanceObserver((l) => window.__loaf.push(...l.getEntries())).observe({
      type: 'long-animation-frame',
      buffered: true,
    })
  } catch {
    /* desteklenmiyor */
  }
}

async function waitReady(page) {
  await page.waitForFunction(() => window.__pilot?.ready, null, { timeout: 30_000 })
  return page.evaluate(() => ({
    firstRenderMs: window.__pilot.firstRenderMs,
    sinceNavMs: Math.round(performance.now()),
    domNodes: document.getElementsByTagName('*').length,
  }))
}

/** Gerçek tekerlek jesti (CDP) sırasında rAF kare sayımı. */
async function scrollFps(page, cdp, throttle) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
  const box = await page.locator('main.stage').boundingBox()
  const x = box.x + box.width * 0.6
  const y = box.y + box.height * 0.5
  const before = await page.evaluate(() => {
    let s = 0
    for (const el of document.querySelectorAll('*')) s += el.scrollTop + el.scrollLeft
    window.__frames = []
    window.__t0 = performance.now()
    window.__run = true
    const tick = (t) => {
      window.__frames.push(t)
      if (window.__run) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return s
  })
  await cdp.send('Input.synthesizeScrollGesture', {
    x,
    y,
    yDistance: -4000,
    speed: 2000,
    gestureSourceType: 'mouse',
  })
  await cdp.send('Input.synthesizeScrollGesture', {
    x,
    y,
    xDistance: -1500,
    speed: 1500,
    gestureSourceType: 'mouse',
  })
  const r = await page.evaluate((b) => {
    window.__run = false
    const f = window.__frames
    const dur = f[f.length - 1] - f[0]
    let worst = 0
    let long = 0
    for (let i = 1; i < f.length; i++) {
      const d = f[i] - f[i - 1]
      worst = Math.max(worst, d)
      if (d > 50) long++
    }
    let s = 0
    for (const el of document.querySelectorAll('*')) s += el.scrollTop + el.scrollLeft
    const loaf = window.__loaf.filter((e) => e.startTime >= window.__t0)
    const blocking = Math.round(loaf.reduce((a, e) => a + (e.blockingDuration ?? 0), 0))
    return {
      fps: Math.round((f.length / dur) * 1000),
      worstFrameMs: Math.round(worst),
      longFrames: long,
      loafCount: loaf.length,
      loafBlockingMs: blocking,
      gestureMs: Math.round(performance.now() - window.__t0),
      scrolled: s !== b,
    }
  }, before)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  return r
}

/** Tab ile odak gezisi + ok tuşları + Shift+→ (klavyeyle tarih değişimi denemesi). */
async function keyboard(page) {
  await page.locator('header.bar strong').click()
  const describe = () =>
    page.evaluate(() => {
      const a = document.activeElement
      const stage = document.querySelector('main.stage')
      return {
        inGantt: !!stage?.contains(a),
        tag: a?.tagName.toLowerCase(),
        role: a?.getAttribute('role'),
        name: (a?.getAttribute('aria-label') ?? a?.textContent ?? '').trim().slice(0, 90),
      }
    })
  const tabs = []
  let entered = null
  for (let i = 0; i < 25 && !entered; i++) {
    await page.keyboard.press('Tab')
    const d = await describe()
    tabs.push(d)
    if (d.inGantt) entered = { afterTabs: i + 1, ...d }
  }
  if (!entered) return { entered: false, tabs: tabs.slice(-4) }
  // Odak gantt içindeki bir kaba (kaydırıcı) düşüp oklar satır değiştirmiyorsa en çok 2 Tab daha.
  let arrows = []
  let extraTabs = 0
  for (; extraTabs <= 2; extraTabs++) {
    if (extraTabs) await page.keyboard.press('Tab')
    const start = await describe()
    if (!start.inGantt) break
    arrows = [start]
    for (const k of ['ArrowDown', 'ArrowDown', 'ArrowDown']) {
      await page.keyboard.press(k)
      arrows.push(await describe())
    }
    if (new Set(arrows.map((x) => x.name)).size > 1) break
  }
  const logBefore = await page.locator('aside.log').innerText()
  await page.keyboard.press('Shift+ArrowRight')
  await page.waitForTimeout(150)
  const logAfter = await page.locator('aside.log').innerText()
  return {
    entered: true,
    afterTabs: entered.afterTabs,
    extraTabs,
    first: entered,
    arrowsMoveFocus: new Set(arrows.map((x) => x.name)).size > 1,
    arrows,
    keyboardDateChange: logAfter !== logBefore && /bekliyor/.test(logAfter),
  }
}

const BARS = {
  own: '.og-svg g rect.og-bar',
  svar: '.wx-bar.wx-task',
  frappe: '.bar-wrapper .bar',
  dhtmlx: '.gantt_task_line.gantt_bar_task',
}

/** Sağ ucu görünür alanda olan ilk çubuk (sol sütunun ve kenarların dışında). */
async function pickBar(page, sel) {
  const stage = await page.locator('main.stage').boundingBox()
  const bars = page.locator(sel)
  const n = Math.min(await bars.count(), 300)
  for (let i = 0; i < n; i++) {
    const bb = await bars.nth(i).boundingBox()
    if (!bb || bb.width < 24) continue
    const right = bb.x + bb.width
    if (
      right > stage.x + 380 &&
      right < stage.x + stage.width - 150 &&
      bb.y > stage.y + 90 &&
      bb.y + bb.height < stage.y + stage.height - 40
    ) {
      return { bar: bars.nth(i), bb }
    }
  }
  return null
}

/** Bitiş tutamacının ekran konumu (aday başına), yoksa çubuğun sağ kenarı. */
async function endHandle(page, cand, bar, bb) {
  const center = (h) => (h ? { x: h.x + h.width / 2, y: h.y + h.height / 2 } : null)
  let h = null
  if (cand === 'own')
    h = await page
      .locator('.og-handle')
      .nth(1)
      .boundingBox()
      .catch(() => null)
  if (cand === 'dhtmlx')
    h = await bar
      .locator('.task_end_date')
      .boundingBox()
      .catch(() => null)
  if (cand === 'frappe') {
    const id = await bar.evaluate((e) => e.closest('.bar-wrapper')?.getAttribute('data-id'))
    h = await page
      .locator(`.bar-wrapper[data-id="${id}"] .handle.right`)
      .boundingBox()
      .catch(() => null)
  }
  return center(h) ?? { x: bb.x + bb.width - 3, y: bb.y + bb.height / 2 }
}

/** Seçer, bitiş ucunu ~90 px sağa sürükler; pilot olay günlüğündeki yeni satırı döner. */
async function dragTest(page, cand, face) {
  await page.getByRole('button', { name: face, exact: true }).click()
  await page.waitForTimeout(300)
  let picked = await pickBar(page, BARS[cand])
  if (!picked) {
    // Çubuk görünür alanda değilse (ör. Frappe bugüne kaydırır, erken görevler solda kalır)
    // ortadaki bir çubuğu görünür alana getir.
    const n = await page.locator(BARS[cand]).count()
    await page
      .locator(BARS[cand])
      .nth(Math.floor(n / 3))
      .evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' }))
    await page.waitForTimeout(300)
    picked = await pickBar(page, BARS[cand])
  }
  if (!picked) return { ok: false, reason: 'görünür çubuk bulunamadı' }
  const { bar, bb } = picked
  await page.mouse.click(bb.x + bb.width - 12, bb.y + bb.height / 2)
  await page.waitForTimeout(200)
  await page.mouse.move(bb.x + bb.width - 6, bb.y + bb.height / 2)
  await page.waitForTimeout(100)
  const h = await endHandle(page, cand, bar, bb)
  const widthBefore = bb.width
  const before = await page.locator('aside.log').innerText()
  await page.mouse.move(h.x, h.y)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) await page.mouse.move(h.x + i * 9, h.y)
  await page.mouse.up()
  await page.waitForTimeout(400)
  const after = await page.locator('aside.log').innerText()
  const widthAfter = (await bar.boundingBox().catch(() => null))?.width ?? null
  const line = after.split('\n').find((l) => l && !before.includes(l)) ?? ''
  return { ok: line !== '', line: line.slice(0, 140), widthBefore, widthAfter }
}

async function a11y(page) {
  const snap = await page
    .locator('main.stage')
    .ariaSnapshot()
    .catch((e) => `HATA ${e.message}`)
  const roles = {}
  for (const m of snap.matchAll(/^\s*- (\w+)/gm)) roles[m[1]] = (roles[m[1]] ?? 0) + 1
  const attrs = await page.evaluate(() => {
    const st = document.querySelector('main.stage')
    const n = (sel) => st.querySelectorAll(sel).length
    return {
      ariaExpanded: n('[aria-expanded]'),
      ariaLevel: n('[aria-level]'),
      ariaSelected: n('[aria-selected]'),
      ariaLabel: n('[aria-label]'),
      tabbable: n('[tabindex="0"], button:not([tabindex="-1"]), a[href]'),
    }
  })
  return { roles, attrs, head: snap.split('\n').slice(0, 14).join('\n') }
}

async function open(browser, base, cand, { csp = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.addInitScript(INIT)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)))
  await page.goto(`${base}/${cand}.html${csp ? '' : '?nocsp'}`)
  const render = await waitReady(page)
  await page.waitForTimeout(400)
  return { ctx, page, render, errors }
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const server = await serve()
  const base = `http://127.0.0.1:${server.address().port}`
  const browser = await chromium.launch()
  const results = {
    date: new Date().toISOString(),
    runs: RUNS,
    bundle: await bundleSizes(),
    scan: await staticScan(),
    candidates: {},
  }
  for (const cand of CANDIDATES) {
    const r = { renders: [] }
    for (let i = 0; i < RUNS; i++) {
      const { ctx, render } = await open(browser, base, cand)
      r.renders.push(render)
      await ctx.close()
    }
    {
      const { ctx, page, errors } = await open(browser, base, cand)
      r.csp = await page.evaluate(() => window.__csp)
      r.pageErrors = errors
      r.a11y = await a11y(page)
      await page.screenshot({ path: join(OUT, `${cand}-koyu.png`) })
      await page.getByRole('button', { name: /^Tema/ }).click()
      await page.waitForTimeout(300)
      await page.screenshot({ path: join(OUT, `${cand}-acik.png`) })
      await ctx.close()
    }
    {
      const { ctx, page } = await open(browser, base, cand, { csp: false })
      await page.screenshot({ path: join(OUT, `${cand}-cspsiz.png`) })
      await ctx.close()
    }
    {
      const { ctx, page } = await open(browser, base, cand)
      r.keyboard = await keyboard(page)
      await ctx.close()
    }
    for (const face of ['Koordinatör', 'Admin', 'Üye']) {
      const { ctx, page } = await open(browser, base, cand)
      r[`drag_${face}`] = await dragTest(page, cand, face)
      r.cspAfterDrag = await page.evaluate(() => window.__csp.length)
      await ctx.close()
    }
    {
      const { ctx, page } = await open(browser, base, cand)
      const cdp = await ctx.newCDPSession(page)
      r.scroll1x = await scrollFps(page, cdp, 1)
      await ctx.close()
    }
    {
      const { ctx, page } = await open(browser, base, cand)
      const cdp = await ctx.newCDPSession(page)
      r.scroll4x = await scrollFps(page, cdp, 4)
      await ctx.close()
    }
    const fr = r.renders.map((x) => x.firstRenderMs).sort((a, b) => a - b)
    r.firstRenderMedianMs = fr[Math.floor(fr.length / 2)]
    r.sinceNavMedianMs = r.renders.map((x) => x.sinceNavMs).sort((a, b) => a - b)[
      Math.floor(fr.length / 2)
    ]
    results.candidates[cand] = r
    console.log(
      cand,
      JSON.stringify({
        fr: r.firstRenderMedianMs,
        s1: r.scroll1x,
        s4: r.scroll4x,
        csp: r.csp?.length,
        kb: r.keyboard?.entered,
      }),
    )
  }
  await browser.close()
  server.close()
  await writeFile(join(OUT, 'results.json'), JSON.stringify(results, null, 2) + '\n')
}

await main()
