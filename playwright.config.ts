import { defineConfig, devices } from '@playwright/test'

// Duman e2e: gerçek backend (e2e/backend/up.sh, etiket api-pin.json) + üretim paketi
// `vite preview` (aynı origin; /v1 proxy) + chromium. Paket `pnpm e2e` içinde önceden
// derlenir; iki önizleme sunucusu aynı dist/'i sunar:
//   4173 → backend 18080 (normal oturum ömrü)   — duman ve diğer akışlar
//   4174 → backend 18081 (NIZAMIO_SESSION_TTL=1m) — iki sekme eşzamanlı 401 senaryosu
const port = Number(process.env.NIZAMIO_E2E_WEB_PORT ?? 4173)
const shortPort = Number(process.env.NIZAMIO_E2E_SHORT_WEB_PORT ?? 4174)
const backend = process.env.NIZAMIO_DEV_BACKEND ?? 'http://127.0.0.1:18080'
const shortBackend = process.env.NIZAMIO_E2E_SHORT_BACKEND ?? 'http://127.0.0.1:18081'
const baseURL = `http://127.0.0.1:${port}`
const SHORT_TTL_BASE_URL = `http://127.0.0.1:${shortPort}`

// KURULUM PROVASI: NIZAMIO_PROVA_BASE_URL verilirse yalnız
// e2e/backend/kurulum-provasi.prova.ts, çalışan üretim benzeri pakete (kenar Caddy, https)
// karşı koşar — önizleme sunucusu, global setup ve fixture yoktur. Paketin yerel CA'sı
// tarayıcıya yüklenmez (TLS geçerliliği backend build/deploy/duman.sh'ta --cacert ile).
const provaBaseURL = process.env.NIZAMIO_PROVA_BASE_URL

const prova = defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.prova.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: provaBaseURL,
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})

const e2e = defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `pnpm preview --host 127.0.0.1 --port ${port}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      env: { NIZAMIO_DEV_BACKEND: backend },
      timeout: 60_000,
    },
    {
      command: `pnpm preview --host 127.0.0.1 --port ${shortPort}`,
      url: SHORT_TTL_BASE_URL,
      reuseExistingServer: !process.env.CI,
      env: { NIZAMIO_DEV_BACKEND: shortBackend },
      timeout: 60_000,
    },
  ],
})

export default provaBaseURL ? prova : e2e
