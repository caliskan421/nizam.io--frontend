import { describe, expect, it, vi } from 'vitest'

import { nextTheme, useThemeToggle } from './theme-toggle'

describe('tema düğmesi (E-00-37)', () => {
  it('dark ↔ light', () => {
    expect(nextTheme('dark')).toBe('light')
    expect(nextTheme('light')).toBe('dark')
  })

  it('anlık geçiş: kökteki data-theme hemen değişir, ui.theme yazılır', () => {
    const root = document.createElement('html')
    root.dataset.theme = 'dark'
    const write = vi.fn()
    const { theme, toggle } = useThemeToggle(root, { write })
    expect(theme.value).toBe('dark')
    toggle()
    expect(root.dataset.theme).toBe('light')
    expect(theme.value).toBe('light')
    expect(write).toHaveBeenLastCalledWith('ui.theme', 'light')
    toggle()
    expect(root.dataset.theme).toBe('dark')
    expect(write).toHaveBeenLastCalledWith('ui.theme', 'dark')
  })

  it('kökte tema yoksa koyu varsayılan (sistem tercihi okunmaz)', () => {
    const root = document.createElement('html')
    const { theme } = useThemeToggle(root, { write: vi.fn() })
    expect(theme.value).toBe('dark')
    expect(root.dataset.theme).toBe('dark')
  })
})
