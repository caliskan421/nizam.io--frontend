import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'

import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import {
  agendaItem,
  meetingNote,
  mountPage,
  record,
  resetAll,
  sent,
  server,
  serverDefaults,
  settle,
  taskNote,
  world,
} from './harness'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
beforeEach(() => {
  server.use(...serverDefaults())
  world.dictionary = [{ department_id: 'd1', display_name: 'Mekanik' }]
})
afterEach(() => {
  useConfirm().clear()
  useToast().clear()
  resetAll()
})
afterAll(() => server.close())

const posts = (kind: string) => sent(`/v1/admin/deleted/${kind}/purge-all`, 'POST')

/** Not ve gündem çöpü; `gateCall`. çağrı (`gated` türünün isteği) beklemede, Durdur o sırada basılır. */
async function stopDuring(gateCall: number, gated: string) {
  world.taskNotes = [[taskNote('n1'), taskNote('n2')]]
  world.meetingNotes = [[meetingNote('m1')]]
  world.agendaItems = [[agendaItem('a1')]]
  world.records = [
    [
      record('task_notes', 'n1'),
      record('task_notes', 'n2'),
      record('meeting_notes', 'm1'),
      record('agenda_items', 'a1'),
    ],
  ]
  let release!: () => void
  world.purgeGate = (call) =>
    call === gateCall
      ? new Promise<void>((resolve) => {
          release = resolve
        })
      : Promise.resolve()
  const page = await mountPage({ path: '/silinen-kayitlar?tur=notgundem' })
  await page.wrapper.get('[data-testid="dr-empty-trash"]').trigger('click')
  await settle()
  await page.wrapper.get('[data-testid="dr-purgeall-input"]').setValue('not ve gündem')
  await page.wrapper.get('[data-testid="dr-purgeall-confirm"]').trigger('click')
  await settle()
  const confirm = useConfirm()
  // İlk çağrı beklemedeyse onay çözülmez: beklenmeden başlatılır.
  const accepted = confirm.accept(confirm.current.value!.id)
  await vi.waitFor(() => expect(posts(gated)).toHaveLength(1))
  release()
  await accepted
  await vi.waitFor(() =>
    expect(page.wrapper.find('[data-testid="dr-purgeall-progress"]').exists()).toBe(false),
  )
  await settle()
  return page
}

it('son türün son isteği sürerken durdurulursa tur zaten bitmiştir: ek istek yok, başarı özeti', async () => {
  const page = await stopDuring(3, 'agenda-items')
  expect(posts('task-notes')).toHaveLength(1)
  expect(posts('meeting-notes')).toHaveLength(1)
  expect(posts('agenda-items')).toHaveLength(1)
  expect(page.wrapper.find('[data-testid="dr-batch-summary"]').exists()).toBe(false)
})
