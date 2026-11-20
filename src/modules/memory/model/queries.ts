import { useInfiniteQuery, useQuery, type QueryFunctionContext } from '@tanstack/vue-query'
import { computed } from 'vue'

import { clientError } from '@/shared/errors/api-error'
import { queryKeys } from '@/shared/http/query-keys'
import { sessionBound } from '@/shared/session/query-session'

import {
  listExperiences,
  listMeetingNotes,
  listWorkNotes,
  readExperience,
  readRelated,
  readSources,
} from '../api/memory'
import { useMemoryScope } from './capabilities'
import type { ExperienceFilter, Source } from './types'

type Scope = ReturnType<typeof useMemoryScope>
type Context = Pick<QueryFunctionContext, 'signal'>
type PageContext = Context & { pageParam: string | undefined }

function prepare<T, C extends Context>(
  scope: Scope,
  key: Record<string, unknown>,
  enabled: boolean,
  read: (program: string, context: C) => Promise<T>,
) {
  const program = scope.program.value
  const audience = scope.audience.value
  function check() {
    if (!program || program !== scope.program.value || audience !== scope.audience.value) {
      throw clientError('client.scope_missing')
    }
    return program
  }
  return {
    enabled: !!program && enabled,
    queryKey: queryKeys.memory.read(scope.store.snapshot, { ...key, audience }),
    retry: false,
    queryFn: sessionBound(async (context: C) => {
      const result = await read(check(), context)
      check()
      return result
    }),
  }
}

function pageQuery<T extends { next_cursor?: string | null }>(
  scope: Scope,
  key: Record<string, unknown>,
  enabled: boolean,
  read: (program: string, context: PageContext) => Promise<T>,
) {
  return {
    ...prepare(scope, key, enabled, read),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: T) => page.next_cursor ?? undefined,
  }
}

function useNotes<T extends { next_cursor?: string | null }>(
  scope: Scope,
  kind: Source['kind'],
  search: () => string,
  enabled: () => boolean,
  read: (program: string, q: string, cursor: string | undefined, signal: AbortSignal) => Promise<T>,
) {
  return useInfiniteQuery(
    computed(() => {
      const q = search()
      return pageQuery(scope, { notes: kind, q }, enabled(), (program, context) =>
        read(program, q, context.pageParam, context.signal),
      )
    }),
  )
}

async function sourceLinks(
  program: string,
  kind: Source['kind'],
  ids: string[],
  signal: AbortSignal,
) {
  const batches = Array.from({ length: Math.ceil(ids.length / 100) }, (_, i) =>
    ids.slice(i * 100, (i + 1) * 100),
  )
  const responses = await Promise.all(
    batches.map((batch) => readSources(program, kind, batch, signal)),
  )
  return Object.assign({}, ...responses.map((response) => response.items)) as Record<string, string>
}

export function useMemoryQueries() {
  const scope = useMemoryScope()
  return {
    scope,
    experiences: (filter: () => ExperienceFilter, enabled: () => boolean) =>
      useInfiniteQuery(
        computed(() => {
          const fields = filter()
          return pageQuery(scope, { list: fields }, enabled(), (program, context) =>
            listExperiences(program, { ...fields, cursor: context.pageParam }, context.signal),
          )
        }),
      ),
    experience: (selected: () => string | null) =>
      useQuery(
        computed(() => {
          const id = selected()
          return prepare(scope, { detail: id }, !!id, (program, context) =>
            readExperience(program, id!, context.signal),
          )
        }),
      ),
    workNotes: (search: () => string, enabled: () => boolean) =>
      useNotes(scope, 'work_note', search, enabled, listWorkNotes),
    meetingNotes: (search: () => string, enabled: () => boolean) =>
      useNotes(scope, 'meeting_note', search, enabled, listMeetingNotes),
    sources: (kind: Source['kind'], selected: () => string[]) =>
      useQuery(
        computed(() => {
          const ids = selected()
          return prepare(scope, { sources: kind, ids }, ids.length > 0, (program, context) =>
            sourceLinks(program, kind, ids, context.signal),
          )
        }),
      ),
    related: (input: () => string, unit: () => string) =>
      useQuery(
        computed(() => {
          const text = input().trim()
          const department = unit()
          return prepare(
            scope,
            { related: text, department },
            text.length >= 4 && !!department,
            (program, context) => readRelated(program, text, department, context.signal),
          )
        }),
      ),
  }
}
