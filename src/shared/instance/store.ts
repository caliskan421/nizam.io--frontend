import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

import { API_VERSION } from '@/shared/api/operations.gen'
import type { components } from '@/shared/api/schema'
import { clientError, toApiError, type ApiError } from '@/shared/errors/api-error'
import { api, unwrap } from '@/shared/http'

type InstanceProfile = components['schemas']['InstanceProfile']

/** İstemcinin desteklediği API ana sürümü: pinli spec'in `info.version` değeri. */
export const SUPPORTED_API_VERSION: string = API_VERSION

/**
 * Kurulum profili durumu. `update_required`: sunucunun `api_version` değeri desteklenmiyor —
 * sessiz düşüş yok, uygulama açık "güncelleme gerekli" durumuna geçer (CLAUDE.md).
 */
export type InstanceStatus = 'loading' | 'ready' | 'update_required' | 'unavailable'

export const useInstanceStore = defineStore('instance', () => {
  const status = shallowRef<InstanceStatus>('loading')
  const profile = shallowRef<InstanceProfile | null>(null)
  const error = shallowRef<ApiError | null>(null)

  async function load(): Promise<InstanceStatus> {
    status.value = 'loading'
    error.value = null
    try {
      const data = await unwrap(api.GET('/v1/instance/profile'))
      profile.value = data
      if (data.api_version !== SUPPORTED_API_VERSION) {
        error.value = clientError('client.unsupported_api_version')
        status.value = 'update_required'
      } else {
        status.value = 'ready'
      }
    } catch (e) {
      error.value = toApiError(e)
      status.value = 'unavailable'
    }
    return status.value
  }

  return { status, profile, error, load }
})
