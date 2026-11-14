// @vitest-environment node
// `public/sw.js` testi (KESİN 22: gövdeden bağımsız değil, DAVRANIŞ): service worker `vm` içinde
// sahte `self` ile çalıştırılır. Sözlük ve hedef eşlemesi `model/dictionary` + `model/target` ve
// `trNotifications.rows` ile EŞİTLENİR (kopya sapmasını yakalar; mekanizma.md §3.3).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

import { describe, expect, it, vi } from 'vitest'

import { i18n } from '@/shared/i18n'

import { KNOWN_NOTIFICATION_TYPES, NOTIFICATION_DICTIONARY } from '../model/dictionary'
import { notificationTarget } from '../model/target'

const SOURCE = readFileSync(
  fileURLToPath(new URL('../../../../public/sw.js', import.meta.url)),
  'utf8',
)
/** Açıklamalar çıkarılmış kod (yasaklı çağrı denetimi yorumdaki sözcüğe takılmasın). */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const ORIGIN = 'https://portal.example.test'

type Listener = (event: unknown) => void

interface Harness {
  push(
    payload: unknown,
    raw?: boolean,
  ): Promise<{ title: string; options: Record<string, unknown> }>
  click(data: unknown): Promise<void>
  shown: ReturnType<typeof vi.fn>
  openWindow: ReturnType<typeof vi.fn>
  windows: { url: string; focus: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> }[]
  listeners: Map<string, Listener>
  close: ReturnType<typeof vi.fn>
}

function load(windows: Harness['windows'] = []): Harness {
  const listeners = new Map<string, Listener>()
  const shown = vi.fn(async () => undefined)
  const openWindow = vi.fn(async () => null)
  const close = vi.fn()
  const self = {
    location: { origin: ORIGIN },
    registration: { showNotification: shown },
    clients: { matchAll: vi.fn(async () => windows), openWindow },
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
  }
  vm.runInNewContext(SOURCE, { self, URL, Object })
  const waits: Promise<unknown>[] = []
  const wait = (p: Promise<unknown>) => void waits.push(p)
  return {
    shown,
    openWindow,
    windows,
    listeners,
    close,
    async push(payload, raw = false) {
      const data =
        payload === undefined
          ? null
          : { json: () => (raw ? JSON.parse(String(payload)) : (payload as unknown)) }
      listeners.get('push')!({ data, waitUntil: wait })
      await Promise.all(waits.splice(0))
      const [title, options] = shown.mock.calls.at(-1) as unknown as [
        string,
        Record<string, unknown>,
      ]
      return { title, options }
    },
    async click(data) {
      listeners.get('notificationclick')!({ notification: { close, data }, waitUntil: wait })
      await Promise.all(waits.splice(0))
    },
  }
}

const sentence = (type: string) =>
  i18n.global.t(`notifications.rows.types.${NOTIFICATION_DICTIONARY[type]!.id}.text`)

describe('public/sw.js — kapsam (E-14-74)', () => {
  it('yalnız push ve notificationclick dinler; fetch/önbellek/skipWaiting/install yok', () => {
    const { listeners } = load()
    expect([...listeners.keys()].sort()).toEqual(['notificationclick', 'push'])
    expect(CODE).not.toMatch(/skipWaiting|clients\.claim|caches\.|addEventListener\('fetch'/)
  })
})

describe('push olayı (E-14-75): metinsiz yük → sözlükten genel cümle', () => {
  it.each([...KNOWN_NOTIFICATION_TYPES])(
    '%s: gövde model/dictionary + i18n cümlesiyle aynı',
    async (type) => {
      const sw = load()
      const { title, options } = await sw.push({
        type,
        subject_ref: { kind: 'work_item', id: 'w-1' },
        notification_id: 'n-1',
      })
      expect(title).toBe('RoketPortal')
      expect(options.body).toBe(sentence(type))
      expect(options.tag).toBe('n-1')
      expect(options.data).toEqual({ type, subject_ref: { kind: 'work_item', id: 'w-1' } })
    },
  )

  it('sözlüğün sw.js kopyası tam 12 tür, model ile aynı küme', () => {
    const block = /const TYPE_TEXT = \{([\s\S]*?)\n\}/.exec(SOURCE)![1]!
    const types = [...block.matchAll(/'([a-z_.]+)':/g)].map((m) => m[1])
    expect([...types].sort()).toEqual([...KNOWN_NOTIFICATION_TYPES].sort())
  })

  it('bilinmeyen tür, çözülemeyen yük ve yüksüz olay "Yeni bildirim" gösterir', async () => {
    const fallback = i18n.global.t('notifications.rows.types.unknown.text')
    expect(fallback).toBe('Yeni bildirim')
    expect((await load().push({ type: 'x.y.z' })).options.body).toBe(fallback)
    expect((await load().push({ type: 'constructor' })).options.body).toBe(fallback)
    expect((await load().push('{bozuk', true)).options.body).toBe(fallback)
    expect((await load().push(undefined)).options.body).toBe(fallback)
    expect((await load().push([1, 2])).options.body).toBe(fallback)
  })

  it('gövdede aktör/başlık/kod uydurulmaz; tag yalnız notification_id', async () => {
    const { options } = await load().push({ type: 'work.item.created', title: 'Gizli başlık' })
    expect(JSON.stringify(options)).not.toContain('Gizli')
    expect(options.tag).toBeUndefined()
  })
})

describe('notificationclick (E-14-76): hedef eşlemesi model/target ile aynı', () => {
  const cases: [string, string, string][] = [
    ['work_item', 'w-9', '/gorevler?gorev=w-9'],
    ['meeting', 'm-3', '/toplantilar/m-3'],
    ['program_transfer', 't-1', '/'],
    ['membership', 'x', '/'],
    ['whatever', 'x', '/'],
    ['work_item', 'kötü id!', '/'],
  ]

  it.each(cases)(
    '%s/%s → %s; sw.js ve notificationTarget aynı hedefi söyler',
    async (kind, id, path) => {
      const sw = load()
      await sw.click({ type: 't', subject_ref: { kind, id } })
      expect(sw.close).toHaveBeenCalled()
      expect(sw.openWindow).toHaveBeenCalledWith(ORIGIN + path)
      const target = notificationTarget({ subject_ref: { kind, id } })
      const viaModel = !target
        ? '/'
        : target.route === 'work.tasks'
          ? `/gorevler?gorev=${target.query.gorev}`
          : target.route === 'collaboration.meeting'
            ? `/toplantilar/${target.params.meetingId}`
            : '/'
      expect(viaModel).toBe(path)
    },
  )

  it('veri yoksa ana sayfa', async () => {
    const sw = load()
    await sw.click(undefined)
    expect(sw.openWindow).toHaveBeenCalledWith(`${ORIGIN}/`)
  })

  it('açık portal sekmesi varsa odaklanır ve hedefe gider; yeni pencere açılmaz', async () => {
    const tab = { url: `${ORIGIN}/gorevler`, focus: vi.fn(), navigate: vi.fn() }
    tab.focus.mockResolvedValue(tab)
    const sw = load([tab])
    await sw.click({ type: 't', subject_ref: { kind: 'meeting', id: 'm-3' } })
    expect(tab.focus).toHaveBeenCalled()
    expect(tab.navigate).toHaveBeenCalledWith(`${ORIGIN}/toplantilar/m-3`)
    expect(sw.openWindow).not.toHaveBeenCalled()
  })

  it('başka kökenli sekme sayılmaz; navigate edemeyen sekmede yeni pencere açılır', async () => {
    const foreign = { url: 'https://example.org/', focus: vi.fn(), navigate: vi.fn() }
    const sw = load([foreign])
    await sw.click({ type: 't', subject_ref: { kind: 'work_item', id: 'w-1' } })
    expect(foreign.focus).not.toHaveBeenCalled()
    expect(sw.openWindow).toHaveBeenCalledTimes(1)

    const tab = { url: `${ORIGIN}/`, focus: vi.fn(async () => undefined), navigate: vi.fn() }
    tab.navigate.mockRejectedValue(new TypeError('uncontrolled'))
    const sw2 = load([tab])
    await sw2.click({ type: 't', subject_ref: { kind: 'work_item', id: 'w-1' } })
    expect(sw2.openWindow).toHaveBeenCalledWith(`${ORIGIN}/gorevler?gorev=w-1`)
  })

  it('okundu işaretlenmez: service worker hiçbir ağ isteği yapmaz', () => {
    expect(CODE).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|Authorization/)
  })
})
