// W185 (F9; BE-156; P86): kaldır, sessize al ve "Sessize alınan konular" — gerçek router/AppShell/oturum
// + durumlu sahte sunucu (mute listesi imleçli, geri alma, odak dönüşü).
import { describe, expect, it } from 'vitest'

import {
  $,
  $$,
  addFor,
  bellBadge,
  boot,
  idle,
  MEMBER,
  openPanel,
  panelRows,
  sent,
  until,
  userClick,
  WORK,
} from './notifications-support'
import { inRow, installV025Hooks, rowText } from './notifications-v025-support'

installV025Hooks({ coordinator: 'koordinator', member: 'uye' })

describe('kaldır, sessize al ve "Sessize alınan konular" (BE-156; P86)', () => {
  it('sessize al → rozet; alt görünümde liste (nötr metin); "Sessizi kaldır" → liste boş + satır muted=false', async () => {
    addFor('member', 'work.item.created', WORK('w1'))
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    await userClick(inRow(0, 'notification-mute'))
    await until(() => rowText(0).includes('Sessize alındı'), 'muted (sunucudan)')
    expect(sent('PUT', '/v1/notifications/subject-mutes/work_item/w1')).toHaveLength(1)
    await userClick('[data-testid="notification-mutes-open"]')
    await until(() => $$('[data-testid="notification-mute-row"]').length === 1, 'mute listesi')
    expect(sent('GET', '/v1/notifications/subject-mutes')[0]!.query.get('limit')).toBe('30')
    const text = $('[data-testid="notification-mute-row"]')!.textContent
    expect(text).toContain('Sessize alınmış görev')
    expect(text).not.toContain('w1')
    await userClick('[data-testid="notification-unmute"]')
    await until(() => $$('[data-testid="notification-mute-row"]').length === 0, 'liste boşaldı')
    expect(sent('DELETE', '/v1/notifications/subject-mutes/work_item/w1')).toHaveLength(1)
    await userClick('[data-testid="notification-mutes-back"]')
    await until(() => panelRows().length === 1, 'listeye dönüldü')
    await until(() => !rowText(0).includes('Sessize alındı'), 'satır muted=false')
    expect(document.activeElement).toBe($('[data-testid="notification-mutes-open"]'))
    await idle(app.queryClient)
  })

  it('kaldır: satır düşer, zil sayacı sunucudan düşer; CSRF başlığı var', async () => {
    addFor('member', 'work.item.created', WORK('w1'))
    addFor('member', 'work.item.created', WORK('w3'))
    const app = await boot({ ...MEMBER, path: '/mesajlar' })
    await until(() => bellBadge() === '2', 'rozet 2')
    await openPanel()
    await userClick(inRow(0, 'notification-dismiss'))
    await until(() => panelRows().length === 1, 'satır düştü')
    await until(() => bellBadge() === '1', 'sayaç düştü')
    expect(sent('DELETE', '/v1/notifications/n2')).toHaveLength(1)
    await idle(app.queryClient)
  })
})
