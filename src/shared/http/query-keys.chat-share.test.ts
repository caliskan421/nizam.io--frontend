// Sohbet C (W185b): ilet / arşive kaydet yazmalarının geçersizleme ilişkileri (KESİN 29).
// İletme hedef sohbetlerin liste/ref/ek/sayaç okumalarını yeniler; mesaj penceresine (`chats.messages`)
// dokunmaz (içerik yalnız read/SSE/window uzlaştırmasından gelir). Arşive kaydet görevin dosya
// yüzeylerini de yeniler.
import { QueryClient, type QueryKey } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import {
  INVALIDATED_BY,
  invalidationFilters,
  queryKeys,
  resourcesInvalidatedBy,
} from './query-keys'
import type { OperationId } from './query-keys'

const S = { programId: 'p1', departmentId: null }

function hit(op: OperationId, key: QueryKey, ctx = {}): boolean {
  const client = new QueryClient()
  client.setQueryData(key, 1)
  for (const filter of invalidationFilters(op, S, ctx)) void client.invalidateQueries(filter)
  return client.getQueryState(key)?.isInvalidated === true
}

describe('query-keys — W185b ilet / arşive kaydet', () => {
  it('forwardChatMessage: liste, ref, ek, görev bağı ve sayaçları yeniler; pencereye dokunmaz', () => {
    const res = resourcesInvalidatedBy('forwardChatMessage')
    for (const r of [
      'chats.list',
      'chats.refs',
      'chats.sharedCounts',
      'chats.attachments',
      'chats.taskLinks',
    ] as const) {
      expect(res).toContain(r)
    }
    expect(res).not.toContain('chats.messages')
    expect(res).not.toContain('chats.refSummary')
    expect(INVALIDATED_BY['chats.messages']).toEqual([])
  })

  it('forwardChatMessage: bağlamsız (birden çok hedef) bütün sohbetlerin ref/ek anahtarını vurur', () => {
    expect(hit('forwardChatMessage', queryKeys.chats.refs(S, 'hedef-1', 'file'))).toBe(true)
    expect(hit('forwardChatMessage', queryKeys.chats.attachments(S, 'hedef-2'))).toBe(true)
    expect(hit('forwardChatMessage', queryKeys.chats.list(S, ''))).toBe(true)
    expect(hit('forwardChatMessage', queryKeys.chats.messages(S, 'hedef-1'))).toBe(false)
  })

  it('archiveChatFile: sohbet yüzeyleri + görev arşivi/dosyaları/ayrıntısı; eki (cihaz) yenilemez', () => {
    const res = resourcesInvalidatedBy('archiveChatFile')
    for (const r of [
      'chats.list',
      'chats.refs',
      'chats.sharedCounts',
      'archive',
      'workItems.files',
      'workItems.item',
    ] as const) {
      expect(res).toContain(r)
    }
    expect(res).not.toContain('chats.attachments')
    expect(res).not.toContain('chats.messages')
  })

  it('archiveChatFile: arşiv ve görev dosyası anahtarlarını gerçekten vurur', () => {
    expect(
      hit('archiveChatFile', queryKeys.archive.list(S, 'attachments', {}), { workItemId: 'w1' }),
    ).toBe(true)
    expect(hit('archiveChatFile', queryKeys.workItems.files(S, 'w1'), { workItemId: 'w1' })).toBe(
      true,
    )
    expect(hit('archiveChatFile', queryKeys.workItems.files(S, 'w2'), { workItemId: 'w1' })).toBe(
      false,
    )
  })
})
