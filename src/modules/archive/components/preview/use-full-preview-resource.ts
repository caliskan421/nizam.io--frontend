import { computed, onMounted, onScopeDispose, ref, shallowRef } from 'vue'

import { toApiError } from '@/shared/errors/api-error'
import { authSession } from '@/shared/http'
import { useScopeStore } from '@/shared/scope/store'

import { fetchFileBlob, fetchPreviewRecord } from '../../api/preview'
import { fetchFileThumbnail } from '../../api/thumbnails'
import { canPreview, isPdf, isPreviewableImage } from '../../model/mime'
import type { ArchiveFile, ArchiveTarget } from '../../model/types'

export const ACCESS_RECHECK_MS = 15_000

type Access = 'checking' | 'allowed' | 'unverified' | 'denied'

export function isPreviewAccessFailure(error: unknown): boolean {
  const status = toApiError(error).status
  return status === 401 || status === 403 || status === 404
}

function safePreviewBytes(bytes: Blob, pdf: boolean): boolean {
  return bytes.size > 0 && (pdf ? bytes.type === 'image/jpeg' : isPreviewableImage(bytes.type))
}

function endWithScopeOrSession(deny: () => void): void {
  const generation = authSession.generation
  const account = authSession.snapshot.accountId
  const offSession = authSession.subscribe((snapshot) => {
    if (authSession.generation !== generation || snapshot.accountId !== account) deny()
  })
  const offScope = useScopeStore().onChange(deny)
  onScopeDispose(() => {
    offSession()
    offScope()
  })
}

function usePreviewImage(deny: () => void) {
  const url = ref<string | null>(null)
  const loading = ref(true)
  let request: AbortController | undefined
  let attempted = false

  function clear(): void {
    request?.abort()
    request = undefined
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = null
    attempted = false
  }

  async function load(file: ArchiveFile, target: ArchiveTarget): Promise<void> {
    if (attempted) return
    attempted = true
    const pdf = isPdf(file.content_type)
    if (!pdf && !canPreview(file)) {
      loading.value = false
      return
    }
    const active = new AbortController()
    request = active
    loading.value = true
    try {
      const bytes = await (pdf ? fetchFileThumbnail : fetchFileBlob)(
        target,
        file.file_id,
        active.signal,
      )
      if (active.signal.aborted) return
      if (safePreviewBytes(bytes, pdf)) url.value = URL.createObjectURL(bytes)
    } catch (error) {
      if (!active.signal.aborted && isPreviewAccessFailure(error)) deny()
    } finally {
      if (!active.signal.aborted) loading.value = false
    }
  }

  return { url, loading, clear, load }
}

export function useFullPreviewResource(initial: ArchiveFile, target: ArchiveTarget) {
  const store = useScopeStore()
  const access = ref<Access>('checking')
  const record = shallowRef(initial)
  const image = usePreviewImage(deny)
  const life = new AbortController()
  let checking = false
  let nextAllowed = 0
  function deny(): void {
    access.value = 'denied'
    life.abort()
    image.clear()
  }

  endWithScopeOrSession(deny)

  async function check(): Promise<void> {
    if (checking || life.signal.aborted || document.hidden || Date.now() < nextAllowed) return
    checking = true
    try {
      const found = await fetchPreviewRecord(target, initial, life.signal)
      if (life.signal.aborted) return
      if (!found) return deny()
      record.value = found
      access.value = 'allowed'
      void image.load(found, target)
    } catch (error) {
      if (life.signal.aborted) return
      if (isPreviewAccessFailure(error)) return deny()
      const retryAfter = toApiError(error).retryAfter
      if (retryAfter !== null) nextAllowed = Date.now() + retryAfter * 1000
      access.value = 'unverified'
      image.clear()
    } finally {
      checking = false
    }
  }

  const recheck = () => {
    void check()
  }
  let timer: ReturnType<typeof setInterval>
  onMounted(() => {
    if (store.programId !== target.programId) return deny()
    recheck()
    timer = setInterval(recheck, ACCESS_RECHECK_MS)
    window.addEventListener('focus', recheck)
    window.addEventListener('online', recheck)
    document.addEventListener('visibilitychange', recheck)
  })
  onScopeDispose(() => {
    life.abort()
    image.clear()
    clearInterval(timer)
    window.removeEventListener('focus', recheck)
    window.removeEventListener('online', recheck)
    document.removeEventListener('visibilitychange', recheck)
  })

  const canShowDetails = computed(() => access.value === 'checking' || access.value === 'allowed')
  return { access, record, image, canShowDetails, signal: life.signal, deny, recheck }
}
