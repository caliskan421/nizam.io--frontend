import advancedCss from '../../../../design/tables-preview/advanced.css?url&no-inline'
import advancedHtml from '../../../../design/tables-preview/advanced.html?raw'
import baseCss from '../../../../design/tables-preview/base.css?url&no-inline'
import collaborationCss from '../../../../design/tables-preview/collaboration.css?url&no-inline'
import collaborationHtml from '../../../../design/tables-preview/collaboration.html?raw'
import linksHtml from '../../../../design/tables-preview/links.html?raw'
import sharingCss from '../../../../design/tables-preview/sharing.css?url&no-inline'
import sharingHtml from '../../../../design/tables-preview/sharing.html?raw'
import { mount as mountAdvanced } from './advanced-preview.mjs'
import { mount as mountCollaboration } from './collaboration-preview.mjs'
import { mount as mountSharing } from './sharing-preview.mjs'

interface DesignPreview {
  title: string
  html: string
  css: string
  mount?: (root: HTMLElement) => (() => void) | void
}

export const designPreviews = {
  paylasim: {
    title: 'Yönetici görünümü ve paylaşım',
    html: sharingHtml,
    css: sharingCss,
    mount: mountSharing,
  },
  'birlikte-calisma': {
    title: 'Birlikte çalışma',
    html: collaborationHtml,
    css: collaborationCss,
    mount: mountCollaboration,
  },
  baglantilar: { title: 'Tablo bağlantıları', html: linksHtml, css: advancedCss },
  'ileri-akislar': {
    title: 'İleri tablo akışları',
    html: advancedHtml,
    css: advancedCss,
    mount: mountAdvanced,
  },
} as const satisfies Record<string, DesignPreview>

export type DesignPreviewKey = keyof typeof designPreviews
export const DEFAULT_PREVIEW: DesignPreviewKey = 'paylasim'

export function renderDesignPreview(host: HTMLElement, key: DesignPreviewKey) {
  const preview: DesignPreview = designPreviews[key]
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
  const styles = [baseCss, preview.css].map((href) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    return link
  })
  const markup = document.createElement('template')
  // Yalnız derleme girdisindeki statik HTML; kullanıcı veya sunucu içeriği burada kullanılmaz.
  markup.innerHTML = preview.html
  const surface = document.createElement('div')
  surface.className = 'preview-surface'
  surface.dataset.theme = 'dark'
  surface.append(markup.content)
  shadow.replaceChildren(...styles, surface)
  return preview.mount?.(surface)
}
