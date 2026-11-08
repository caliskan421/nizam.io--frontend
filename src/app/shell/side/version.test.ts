import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildVersionLabel, versionLabel } from './version'

afterEach(() => vi.unstubAllEnvs())

describe('sürüm etiketi (E-00-02: istemci derleme sürümü)', () => {
  it('biçim', () => {
    expect(versionLabel('2.0')).toBe('v2.0')
    expect(versionLabel('v1.4.2')).toBe('v1.4.2')
    expect(versionLabel('  ')).toBeNull()
    expect(versionLabel('0.0.0')).toBeNull()
    expect(versionLabel('v0.0.0')).toBeNull()
    expect(versionLabel('0')).toBeNull()
    expect(versionLabel('0.0.1')).toBe('v0.0.1')
    expect(versionLabel(undefined)).toBeNull()
    expect(versionLabel(3)).toBeNull()
  })

  it('derleme sürümü değişince etiket değişir; tanımsızsa yok', () => {
    vi.stubEnv('VITE_APP_VERSION', '2.0.0')
    expect(buildVersionLabel()).toBe('v2.0.0')
    vi.stubEnv('VITE_APP_VERSION', '2.1.0')
    expect(buildVersionLabel()).toBe('v2.1.0')
    vi.stubEnv('VITE_APP_VERSION', '')
    expect(buildVersionLabel()).toBeNull()
    vi.stubEnv('VITE_APP_VERSION', '0.0.0')
    expect(buildVersionLabel()).toBeNull()
  })
})
