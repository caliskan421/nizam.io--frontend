// "Eski yol yok" (KESİN 35d, W184): canlanan BE-027 ayar yüzü, BE-028, BE-083, BE-084, BE-085
// satırlarının stub'ı ve geçici yolları kodda kalmamıştır (kalan stub'lar: W183/W185b satırları).
import { describe, expect, it } from 'vitest'

import { trChat } from '../messages'
import { CHAT_STUBS } from './stubs'

const sources = import.meta.glob<string>(['../**/*.ts', '../**/*.vue', '!../**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
})
/** Açıklama blokları kod değildir: kaldırılan yolun adı yorumda anılabilir. */
const stripComments = (text: string): string =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
const entries = Object.entries(sources)
  .filter(([path]) => !path.endsWith('/stubs.ts'))
  .map(([path, text]) => [path, stripComments(text)] as const)
const code = (name: string): string => {
  const hit = entries.find(([path]) => path.endsWith(name))
  if (!hit) throw new Error(`kaynak yok: ${name}`)
  return hit[1]
}

describe('W184: canlanan satırların stub ve geçici yolu yok', () => {
  it('CHAT_STUBS: mute, whoRead, roleBadge, sharedCounts, taskCard kalktı; forward (BE-080, W185b) durur', () => {
    const keys = Object.keys(CHAT_STUBS)
    for (const gone of ['mute', 'whoRead', 'roleBadge', 'sharedCounts', 'taskCard']) {
      expect(keys).not.toContain(gone)
    }
    expect(keys).toContain('forward')
  })

  it('kodda BE-027/028/083/084/085 designStub kimliği ya da kaldırılan stub alanı kullanımı yok', () => {
    const offenders = entries.filter(([, text]) =>
      /BE-(027|028|083|084|085)\b|CHAT_STUBS\.(mute|whoRead|roleBadge|sharedCounts|taskCard)/.test(
        text,
      ),
    )
    expect(offenders.map(([path]) => path)).toEqual([])
  })

  it('metin ağacında "grupta kim okuduğu henüz gösterilemiyor"/stub "Sessize al" anahtarı yok', () => {
    expect(JSON.stringify(trChat)).not.toContain('henüz gösterilemiyor')
    expect(Object.keys(trChat.chat.dialogs.info)).not.toContain('mute')
    expect(Object.keys(trChat.chat.thread)).not.toContain('taskConverted')
  })

  it('görev kartı: task_ids üzerinden görev başına getWorkItem yoklaması (fanout) yok', () => {
    for (const file of [
      'thread/MessageRow.vue',
      'thread/MessageTasks.vue',
      'dialogs/TaskFromMessageDialog.vue',
    ]) {
      expect(code(file), file).not.toMatch(/fetchWorkItem|useWorkItem\b|getWorkItem/)
    }
    expect(code('thread/MessageTasks.vue')).toContain('useChatMessageTasks')
    expect(code('thread/MessageRow.vue')).not.toContain('chat-converted')
  })

  it('grup tiki yalnız read_by_all; istemci türetimi (peer_read_seq grup) yok; rozet yalnız sender_role/program_role', () => {
    const meta = code('thread/MessageMeta.vue')
    expect(meta).toContain('read_by_all')
    expect(code('thread/use-thread.ts')).toContain('direct.value ? nav.peerReadSeq.value : null')
    expect(code('thread/MessageRow.vue')).toContain('sender_role')
    expect(code('dialogs/GroupMembersTab.vue')).toContain('program_role')
  })

  it('mute: MessageInfoDialog grup yolu stub değil gerçek listChatMessageReceipts okur', () => {
    expect(code('dialogs/MessageInfoDialog.vue')).toContain('useChatMessageReceipts')
    expect(code('dialogs/GroupInfoDialog.vue')).not.toContain('DesignStub')
  })
})
