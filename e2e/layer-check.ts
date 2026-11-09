// CSS katman sırası regresyon denetimi (W61b). Ortak CSS parçası (`@layer components`) giriş
// CSS'inden önce yüklenip katman sırası bildirimi geç kalırsa Tailwind base/preflight bileşen
// stillerini ezer: dolgular 0, iki tema simgesi birden görünür. Sıra public/layers.css ile
// sayfanın ilk stil kaynağında bildirilir; burada hem derlenmiş belgenin sırası hem de
// tarayıcıda hesaplanmış bileşen stilleri sınanır.
import type { Page } from '@playwright/test'

export interface ComponentLayerProbe {
  /** `.rp-themebtn` içindeki görünür tema simgesi sayısı (doğru: 1). */
  themeIconsVisible: number
  /** Kenar menüsü gövdesi (`.side-full`) üst dolgusu, px (doğru: > 0). */
  sidePaddingTop: number
  /** Kart (`.t-card`) üst dolgusu, px (doğru: > 0). */
  cardPaddingTop: number
}

/** Kabuk yüklendikten sonra components katmanındaki öğelerin hesaplanmış stilleri. */
export function componentLayerProbe(page: Page): Promise<ComponentLayerProbe> {
  return page.evaluate(() => {
    const px = (selector: string) => {
      const el = document.querySelector(selector)
      return el ? parseFloat(getComputedStyle(el).paddingTop) : -1
    }
    const icons = Array.from(
      document.querySelectorAll('.rp-themebtn .rp-ic-sun, .rp-themebtn .rp-ic-moon'),
    )
    return {
      themeIconsVisible: icons.filter((el) => getComputedStyle(el).display !== 'none').length,
      sidePaddingTop: px('.side-full'),
      cardPaddingTop: px('.t-card'),
    }
  })
}

/**
 * Derlenmiş belgede `<link rel="stylesheet">` ve modül betiği sırası. Dönen dizinin ilk öğesi
 * `/layers.css` olmalıdır.
 */
export function documentStyleOrder(html: string): string[] {
  const head = html.slice(0, html.indexOf('</head>'))
  return [...head.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>|<script\b[^>]*type="module"[^>]*>/g)]
    .map((m) => m[0])
    .map((tag) => /(?:href|src)="([^"]+)"/.exec(tag)?.[1] ?? tag)
}
