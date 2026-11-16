import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { fetchMeetingCandidates } from './candidates'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const row = (id: string, name: string, participant = false) => ({
  account_id: id,
  full_name: name,
  is_participant: participant,
  teams: [],
})

it('follows cursors through short and empty pages and sorts by name', async () => {
  const cursors: (string | null)[] = []
  server.use(
    http.get('http://localhost/v1/meetings/participant-candidates', ({ request }) => {
      const url = new URL(request.url)
      expect(request.headers.get('X-Nizamio-Program')).toBe('p')
      expect(url.searchParams.get('meeting_id')).toBe('m')
      cursors.push(url.searchParams.get('cursor'))
      const call = cursors.length
      if (call === 1) return HttpResponse.json({ items: [row('b', 'İpek')], next_cursor: 'c1' })
      if (call === 2) return HttpResponse.json({ items: [], next_cursor: 'c2' })
      return HttpResponse.json({ items: [row('a', 'Ada', true)], next_cursor: '' })
    }),
  )
  const result = await fetchMeetingCandidates('p', 'm', new AbortController().signal)
  expect(cursors).toEqual([null, 'c1', 'c2'])
  expect(result.people).toEqual([
    { accountId: 'a', fullName: 'Ada', isParticipant: true },
    { accountId: 'b', fullName: 'İpek', isParticipant: false },
  ])
})

it('omits meeting_id for the draft gate and rejects a repeated cursor', async () => {
  server.use(
    http.get('http://localhost/v1/meetings/participant-candidates', ({ request }) => {
      expect(new URL(request.url).searchParams.has('meeting_id')).toBe(false)
      return HttpResponse.json({ items: [], next_cursor: 'same' })
    }),
  )
  await expect(fetchMeetingCandidates('p', null, new AbortController().signal)).rejects.toThrow(
    'Tekrarlanan aday imleci',
  )
})

it('surfaces the server decision for members and unknown meetings', async () => {
  server.use(
    http.get('http://localhost/v1/meetings/participant-candidates', () =>
      HttpResponse.json(
        { code: 'collaboration.not_authorized', message: 'x', request_id: 'r', fields: [] },
        { status: 403 },
      ),
    ),
  )
  await expect(
    fetchMeetingCandidates('p', null, new AbortController().signal),
  ).rejects.toMatchObject({ code: 'collaboration.not_authorized' })
})
