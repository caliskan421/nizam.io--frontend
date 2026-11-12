// Ö-08 / KESİN 26: kapsam ya da oturum değişiminde okuyucular düşer, geç sonuç yeni kapsama/
// oturuma yazılmaz; yazmaların geç sonucu sökülmüş sahibe ulaşmaz (`reachesOwner`).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { effectScope } from 'vue'

import { authSession } from '@/shared/http'
import { isDetached, reachesOwner } from '@/shared/http/mutation'
import { settleQueries } from '@/shared/http/__tests__/settle'

import {
  COORD,
  errorEnvelope,
  fileRecord,
  folder,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
} from '../model/__tests__/harness'
import { useArchiveFolders } from './queries'
import { useAttachArchiveFile, useDeleteArchiveFile, useRenameArchiveFile } from './writes'

const nativeClone = globalThis.structuredClone
function browserLikeClone(value: unknown): unknown {
  if (value instanceof Blob) return value
  if (Array.isArray(value)) return value.map(browserLikeClone)
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, browserLikeClone(v)]))
  }
  return nativeClone(value)
}

beforeAll(() => {
  vi.stubGlobal('structuredClone', browserLikeClone)
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => resetHarness())
afterAll(() => {
  vi.unstubAllGlobals()
  server.close()
})

function gate() {
  let release!: () => void
  let started!: () => void
  const open = new Promise<void>((resolve) => {
    release = resolve
  })
  const hit = new Promise<void>((resolve) => {
    started = resolve
  })
  return { release, started, open, hit }
}

const target = { programId: 'p1', departmentId: 'd1' }
const file = () => new File(['abc'], 'a.pdf', { type: 'application/pdf' })

describe('okuyucular', () => {
  it('kapsam değişince eski kapsamın yanıtı yeni kapsamda görünmez', async () => {
    const g = gate()
    server.use(
      http.get(`${ORIGIN}/v1/records/archive/folders`, async ({ request }) => {
        const department = request.headers.get('X-Nizamio-Department')
        if (department === 'd1') {
          g.started()
          await g.open
          return json({ folders: [folder({ folder_id: 'eski', name: 'Eski' })] })
        }
        return json({ folders: [folder({ folder_id: 'yeni', name: 'Yeni' })] })
      }),
    )
    const h = harness(COORD)
    const { result } = h.run(() =>
      useArchiveFolders(() => ({
        programId: h.store.programId ?? '',
        departmentId: h.store.departmentId ?? '',
      })),
    )
    await g.hit
    h.store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd2' })
    await vi.waitFor(() =>
      expect(result.data.value?.folders.map((f) => f.folder_id)).toEqual(['yeni']),
    )
    g.release()
    await settleQueries(h.queryClient)
    expect(result.data.value?.folders.map((f) => f.folder_id)).toEqual(['yeni'])
    expect(
      sent('GET', '/v1/records/archive/folders').map((r) => r.headers.get('X-Nizamio-Department')),
    ).toEqual(['d1', 'd2'])
  })

  it('oturum değişince geç yanıt önbelleğe yazılmaz', async () => {
    const g = gate()
    server.use(
      http.get(`${ORIGIN}/v1/records/archive/folders`, async () => {
        g.started()
        await g.open
        return json({ folders: [folder()] })
      }),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useArchiveFolders(target))
    await g.hit
    authSession.clear()
    g.release()
    await settleQueries(h.queryClient)
    expect(result.data.value).toBeUndefined()
    expect(result.isError.value).toBe(true)
  })
})

describe('yazmalar: geç sonuç sahibe ulaşmaz', () => {
  it.each(['rename', 'delete', 'attach'] as const)(
    '%s: sahip uçuşta sökülürse sonuç sahipsiz işaretlenir',
    async (kind) => {
      const g = gate()
      server.use(
        http.patch(`${ORIGIN}/v1/files/f1/name`, async () => {
          g.started()
          await g.open
          return json(fileRecord)
        }),
        http.delete(`${ORIGIN}/v1/files/f1`, async () => {
          g.started()
          await g.open
          return new Response(null, { status: 204 })
        }),
        http.post(`${ORIGIN}/v1/work-items/w1/files`, async () => {
          g.started()
          await g.open
          return json(fileRecord, 201)
        }),
      )
      const h = harness(COORD)
      // Sahip = hook'ların kurulduğu etki kapsamı: yalnız o söküldüğünde yazma sahipsiz sayılır.
      // Uygulama/QueryClient ayakta kalır; böylece başarı geçersizlemesi sökümle yarışmaz.
      const { result } = h.run(() => {
        const owner = effectScope()
        const hooks = owner.run(() => ({
          rename: useRenameArchiveFile(),
          remove: useDeleteArchiveFile(),
          attach: useAttachArchiveFile(),
        }))!
        return { ...hooks, owner }
      })
      const ref = { target, workItemId: 'w1', fileId: 'f1' }
      const pending =
        kind === 'rename'
          ? result.rename.submit({ ...ref, displayName: 'x' })
          : kind === 'delete'
            ? result.remove.submit(ref)
            : result.attach.submit({ target, workItemId: 'w1', file: file(), tag: 'plan' })
      await g.hit
      result.owner.stop()
      g.release()
      const outcome = await pending
      expect(outcome.kind).toBe('success')
      expect(isDetached(outcome)).toBe(true)
      expect(reachesOwner(outcome)).toBe(false)
    },
  )

  it('sahibi sökülmüş yazma yeni istek başlatmaz (owner_disposed)', async () => {
    let calls = 0
    server.use(
      http.delete(`${ORIGIN}/v1/files/f1`, () => {
        calls += 1
        return new Response(null, { status: 204 })
      }),
    )
    const h = harness(COORD)
    const { result, app } = h.run(() => useDeleteArchiveFile())
    app.unmount()
    const outcome = await result.submit({ target, workItemId: 'w1', fileId: 'f1' })
    expect(outcome.kind).toBe('owner_disposed')
    expect(reachesOwner(outcome)).toBe(false)
    expect(calls).toBe(0)
  })

  it('belirsiz yüklemeden sonra kapsam değişirse tekrar GÖNDERİLMEZ (scope_changed)', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/files`, () => {
        calls += 1
        return errorEnvelope('platform.internal', 503)
      }),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useAttachArchiveFile())
    const first = await result.submit({ target, workItemId: 'w1', file: file(), tag: 'plan' })
    if (first.kind !== 'unknown_outcome') throw new Error('beklenen: unknown_outcome')
    h.store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd2' })
    const retried = await first.retry!()
    expect(retried.kind).toBe('scope_changed')
    expect(calls).toBe(1)
  })

  it('belirsiz yüklemeden sonra oturum bitince tekrar GÖNDERİLMEZ', async () => {
    let calls = 0
    server.use(
      http.post(`${ORIGIN}/v1/work-items/w1/files`, () => {
        calls += 1
        return errorEnvelope('platform.internal', 503)
      }),
    )
    const h = harness(COORD)
    const { result } = h.run(() => useAttachArchiveFile())
    const first = await result.submit({ target, workItemId: 'w1', file: file(), tag: 'plan' })
    if (first.kind !== 'unknown_outcome') throw new Error('beklenen: unknown_outcome')
    authSession.clear()
    const retried = await first.retry!()
    expect(retried.kind).toBe('failed')
    expect(calls).toBe(1)
  })
})
