import { defineConfig, devices } from '@playwright/test'

// Duman e2e: gerçek backend (e2e/backend/up.sh, etiket api-pin.json) + üretim paketi
// `vite preview` (aynı origin; /v1 proxy) + chromium. Backend adresi NIZAMIO_DEV_BACKEND.
const port = Number(process.env.NIZAMIO_E2E_WEB_PORT ?? 4173)
const backend = process.env.NIZAMIO_DEV_BACKEND ?? 'http://127.0.0.1:18080'
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
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
  webServer: {
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: { NIZAMIO_DEV_BACKEND: backend },
    timeout: 120_000,
  },
})
