// W185 (F9; BE-144/145/146/148/156): sunucu süzgeçli sekmeler, grup, satır içi karar, kaldır,
// sessize al ve "Sessize alınan konular" — gerçek router/AppShell/oturum + durumlu sahte sunucu.
import { describe, expect, it } from 'vitest'

import {
  ADMIN,
  addFor,
  bellBadge,
  boot,
  idle,
  notifications,
  openPanel,
  panelRows,
  PEOPLE,
  sent,
  SECOND,
  toasts,
  until,
  userClick,
  WORK,
} from './notifications-support'
import { inRow, installV025Hooks, rowText, tab } from './notifications-v025-support'

installV025Hooks({ coordinator: 'koordinator', member: 'uye' })

describe('sunucu süzgeçli sekmeler ve iki sayaç (BE-144/145)', () => {
  it('Senden bekleyen: awaiting=true, ayrı sayı; Okunmamış: unread_only; zil sayısı grup sayısıdır', async () => {
    const pending = {
      kind: 'review_date_request' as const,
      request_id: 'r1',
      state: 'pending' as const,
      resolution: null,
    }
    addFor(
      'admin',
      'work.date_change.requested',
      WORK('w1'),
      { action: pending, program_id: 'p1', department_id: 'd1' },
      3,
    )
    addFor('admin', 'work.item.created', WORK('w2'), { is_read: true }, 9)
    addFor('admin', 'work.item.created', WORK('w3'), {}, 8)
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '2', `zil = okunmamış grup sayısı (şimdi ${bellBadge()})`)
    await openPanel()
    expect(panelRows()).toHaveLength(3)
    expect(tab('Senden bekleyen')()!.textContent).toContain('1')
    expect(tab('Okunmamış')()!.textContent).toContain('2')
    await userClick(tab('Senden bekleyen'))
    await until(() => panelRows().length === 1, 'awaiting süzgeci')
    expect(sent('GET', '/v1/notifications').at(-1)!.query.get('awaiting')).toBe('true')
    expect(rowText(0)).toContain('Onayla')
    await userClick(tab('Okunmamış'))
    await until(() => panelRows().length === 2, 'unread_only süzgeci')
    expect(sent('GET', '/v1/notifications').at(-1)!.query.get('unread_only')).toBe('true')
    await idle(app.queryClient)
  })

  it('birleşik grup (BE-148): yığın avatar + "ve N kişi"; okundu grubun tamamına tek istek; zil grup sayar', async () => {
    const a = { account_id: 'x1', full_name: 'Ayşe Kaya' }
    const b = { account_id: 'x2', full_name: 'Berk Yıldız' }
    addFor('admin', 'work.item.transitioned', WORK('w1'), {
      actor: a,
      group: { count: 3, actors: [a, b], first_created_at: '2026-11-14T07:00:00Z' },
    })
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet: 3 kayıt tek grup')
    await openPanel()
    expect(rowText(0)).toContain('Ayşe Kaya ve 1 kişi bir görevin durumunu değiştirdi')
    expect(
      panelRows()[0]!.querySelectorAll('[data-testid="notification-stack"] .rp-av'),
    ).toHaveLength(2)
    await userClick(() => panelRows()[0]!.querySelector('.nb-hov button'))
    await until(() => bellBadge() === null, 'grup tek yazmayla okundu')
    expect(sent('POST', '/v1/notifications/n1/read')).toHaveLength(1)
    await idle(app.queryClient)
  })
})

describe('satır içi karar (BE-146; P88)', () => {
  const dateRequest = {
    kind: 'review_date_request' as const,
    request_id: 'r1',
    state: 'pending' as const,
    resolution: null,
  }
  const approveTask = {
    kind: 'approve_task' as const,
    request_id: null,
    state: 'pending' as const,
    resolution: null,
  }

  it('tarih talebi Onayla: S1 uç; sunucu satırı çözer → "Onaylandı · sen"; Senden bekleyen düşer; Geri al yok', async () => {
    addFor('admin', 'work.date_change.requested', WORK('w1'), {
      action: dateRequest,
      program_id: 'p1',
      department_id: 'd1',
    })
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    expect(tab('Senden bekleyen')()!.textContent).toContain('1')
    await userClick(
      () =>
        [
          ...panelRows()[0]!.querySelectorAll<HTMLElement>(
            '[data-testid="notification-decision"] button',
          ),
        ][0] ?? null,
    )
    await until(() => !!inRow(0, 'notification-resolved')(), 'çözüldü satırı')
    expect(notifications.decisions.calls).toEqual([
      {
        path: '/v1/date-change-requests/r1/review',
        body: { decision: 'approved' },
        program: null,
        department: null,
      },
    ])
    expect(inRow(0, 'notification-resolved')()!.textContent).toBe('Onaylandı · sen')
    expect(rowText(0)).not.toContain('Geri al')
    await until(
      () => !tab('Senden bekleyen')()!.textContent?.includes('1'),
      'bekleyen sayacı düştü',
    )
    await idle(app.queryClient)
  })

  it('başkası karar verdi (409): kanonik hata, satır sunucudan okunur ("Onaylandı · ad" ya da çözüldü); başarı bildirimi yok', async () => {
    addFor('admin', 'work.date_change.requested', WORK('w1'), {
      action: dateRequest,
      program_id: 'p1',
      department_id: 'd1',
    })
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    // Başka biri kararı verdi (sunucu gerçeği): bu satır hâlâ "bekliyor" görünürken tıklanır.
    const stored = notifications.state.rows.get(PEOPLE.admin.account_id)![0]!
    stored.action = {
      ...stored.action!,
      state: 'resolved',
      resolution: {
        outcome: 'rejected',
        decided_by: { account_id: 'baska', full_name: 'Can Er' },
        decided_at: null,
      },
    }
    await userClick(
      () =>
        [
          ...panelRows()[0]!.querySelectorAll<HTMLElement>(
            '[data-testid="notification-decision"] button',
          ),
        ][0] ?? null,
    )
    await until(() => !!inRow(0, 'notification-resolved')(), 'sunucudan okunan sonuç')
    expect(inRow(0, 'notification-resolved')()!.textContent).toBe('Reddedildi · Can Er')
    expect(toasts()).not.toContain('Karar gönderildi')
    expect(toasts().length).toBeGreaterThan(0)
    await idle(app.queryClient)
  })

  it('görev onayı çaprazprogram: başlıklar satırdan (p2/d3), seçili program p1 kalır; iade gerekçesi pencereden', async () => {
    addFor('second', 'work.item.transitioned', WORK('w-p2'), {
      action: approveTask,
      program_id: 'p2',
      department_id: 'd3',
    })
    const app = await boot({ ...SECOND, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    const buttons = () => [
      ...panelRows()[0]!.querySelectorAll<HTMLElement>(
        '[data-testid="notification-decision"] button',
      ),
    ]
    await userClick(() => buttons()[1] ?? null)
    const reason = await until(
      () => document.body.querySelector<HTMLInputElement>('input[name="reason"]'),
      'iade penceresi',
    )
    reason.value = 'Kanıt eksik'
    reason.dispatchEvent(new Event('input', { bubbles: true }))
    await userClick('[data-testid="wf-revert-submit"]')
    await until(() => notifications.decisions.calls.length === 1, 'karar isteği')
    expect(notifications.decisions.calls[0]).toEqual({
      path: '/v1/work-items/w-p2/transitions',
      body: { to: 'iade_edildi', reason: 'Kanıt eksik' },
      program: 'p2',
      department: 'd3',
    })
    expect(app.scope.programId).toBe('p1')
    await until(() => !!inRow(0, 'notification-resolved')(), 'çözüldü')
    expect(inRow(0, 'notification-resolved')()!.textContent).toBe('İade edildi · sen')
    await idle(app.queryClient)
  })

  it('bağlam eksik (department_id yok): düğmeler devre dışı + neden; istek yok', async () => {
    addFor('admin', 'work.item.transitioned', WORK('w1'), {
      action: approveTask,
      program_id: 'p1',
      department_id: null,
    })
    const app = await boot({ ...ADMIN, path: '/mesajlar' })
    await until(() => bellBadge() === '1', 'rozet')
    await openPanel()
    const buttons = [
      ...panelRows()[0]!.querySelectorAll<HTMLButtonElement>(
        '[data-testid="notification-decision"] button',
      ),
    ]
    expect(buttons.every((b) => b.disabled)).toBe(true)
    expect(rowText(0)).toContain('Bu karar buradan verilemiyor')
    expect(notifications.decisions.calls).toHaveLength(0)
    await idle(app.queryClient)
  })
})
