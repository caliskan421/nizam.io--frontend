/**
 * 07 URL durumu ve kapsam değişimi. Dosya ve görev seçimi geçmişe kayıt ekler (geri tuşu
 * önizlemeyi kapatır, paylaşılabilir); etiket/görünüm/arama ve önceki-sonraki gezinmesi `replace`.
 * Kapsam (program/mercek/departman) değişince görev, etiket ve dosya seçimi düşer; K/Ü başka
 * klasörde kalamaz, kendi klasörüne giriş kararı `/arsiv`'e bırakılır (P40).
 */
import { computed, onScopeDispose } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { ARCHIVE_FOLDER_ROUTE, ARCHIVE_ROUTE } from '../../routes'
import { folderQuery, parseFolderQuery, type FolderUrlState } from './url-state'

export type NavMode = 'push' | 'replace'

/** `onScopeChange` `true` dönerse (ör. başka rotaya yönlendirdi) URL sıfırlaması yapılmaz. */
export function useFolderUrl(onScopeChange: () => boolean | void = () => {}) {
  const route = useRoute()
  const router = useRouter()
  const store = useScopeStore()

  const folderId = computed(() => {
    const raw = route.params.klasorId
    return typeof raw === 'string' && raw !== '' ? raw : null
  })
  const state = computed(() => parseFolderQuery(route.query))

  function update(patch: Partial<FolderUrlState>, mode: NavMode = 'replace') {
    const query = folderQuery({ ...state.value, ...patch })
    const location = { name: ARCHIVE_FOLDER_ROUTE.name, params: route.params, query }
    return mode === 'push' ? router.push(location) : router.replace(location)
  }

  function openFolder(id: string) {
    return router.push({ name: ARCHIVE_FOLDER_ROUTE.name, params: { klasorId: id } })
  }

  const stop = store.onChange(() => {
    if (onScopeChange() === true) return
    void update({ task: null, tag: null, file: null }, 'replace')
  })
  onScopeDispose(stop)

  return { folderId, state, update, openFolder, archiveHome: { name: ARCHIVE_ROUTE.name } }
}
