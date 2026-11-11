import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fetchDeletedMeetings, fetchMeeting, fetchMeetingNotes, fetchMeetings } from './fetchers'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

describe('meeting readers', () => {
  it('sends only program scope and preserves filters on every cursor request', async () => {
    const seen: URL[] = []
    server.use(
      http.get('http://localhost/v1/meetings', ({ request }) => {
        expect(request.headers.get('X-Nizamio-Program')).toBe('p')
        expect(request.headers.get('X-Nizamio-Department')).toBeNull()
        seen.push(new URL(request.url))
        return HttpResponse.json({ items: [], next_cursor: '' })
      }),
    )
    await fetchMeetings('p', { department_id: 'd', from: '2026-01-01', to: '2026-01-31' })
    await fetchMeetings('p', {
      department_id: 'd',
      from: '2026-01-01',
      to: '2026-01-31',
      cursor: 'next',
    })
    for (const url of seen) {
      expect(Object.fromEntries(url.searchParams)).toMatchObject({
        department_id: 'd',
        from: '2026-01-01',
        to: '2026-01-31',
        limit: '200',
      })
    }
    expect(seen[1]?.searchParams.get('cursor')).toBe('next')
  })
  it('reads detail, notes and deleted in the program scope', async () => {
    const seen: string[] = []
    server.use(
      http.get('http://localhost/v1/meetings/*', ({ request }) => {
        expect(request.headers.get('X-Nizamio-Program')).toBe('p')
        expect(request.headers.get('X-Nizamio-Department')).toBeNull()
        seen.push(new URL(request.url).pathname)
        return HttpResponse.json({ items: [], next_cursor: '' })
      }),
    )
    await fetchMeeting('p', 'm')
    await fetchMeetingNotes('p', 'm', 'next')
    await fetchDeletedMeetings('p', 'next')
    expect(seen).toEqual(['/v1/meetings/m', '/v1/meetings/m/notes', '/v1/meetings/deleted'])
  })
})
