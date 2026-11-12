import type { useArchiveContext } from '../api/context'

/** `useArchiveContext` dönüşü (sayfalar ve `useArchiveTaskFolders` girdisi). */
export type ArchiveContext = ReturnType<typeof useArchiveContext>
