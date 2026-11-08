import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

import { cssVar } from './css-var'

/** PrimeVue/Tailwind koyu mod seçicisi; tokens.gen.css ile aynı öznitelik. */
export const DARK_MODE_SELECTOR = "[data-theme='dark']"

const v = cssVar

/**
 * Aura `surface` ölçeğinin tasarım token'larına eşlemesi. Aura açık şemada yüzeyi 0'dan,
 * koyu şemada 950'den okur; değerler CSS değişkeni olduğu için iki şema da etkin temanın
 * renklerini verir (tema geçişi yalnız `data-theme` ile).
 */
const surfaceLight = {
  0: v('bg-surface'),
  50: v('bg-base'),
  100: v('bg-raised'),
  200: v('border-subtle'),
  300: v('border-strong'),
  400: v('border-control'),
  500: v('ink-faint'),
  600: v('ink-muted'),
  700: v('ink'),
  800: v('ink'),
  900: v('ink'),
  950: v('ink'),
}
const surfaceDark = {
  0: v('ink'),
  50: v('ink'),
  100: v('ink'),
  200: v('ink-muted'),
  300: v('ink-muted'),
  400: v('ink-faint'),
  500: v('border-control'),
  600: v('border-strong'),
  700: v('border-subtle'),
  800: v('bg-raised'),
  900: v('bg-surface'),
  950: v('bg-base'),
}

const scheme = (surface: typeof surfaceLight) => ({
  surface,
  primary: {
    color: v('accent'),
    contrastColor: v('accent-ink'),
    hoverColor: v('accent-top'),
    activeColor: v('accent'),
  },
  highlight: {
    background: v('bg-overlay'),
    focusBackground: v('bg-overlay'),
    color: v('ink'),
    focusColor: v('ink'),
  },
  mask: { background: v('scrim'), color: v('ink') },
  text: {
    color: v('ink'),
    hoverColor: v('ink'),
    mutedColor: v('ink-muted'),
    hoverMutedColor: v('ink'),
  },
  content: {
    background: v('bg-surface'),
    hoverBackground: v('bg-raised'),
    borderColor: v('border-subtle'),
    color: v('ink'),
    hoverColor: v('ink'),
  },
  formField: {
    background: v('bg-surface'),
    disabledBackground: v('bg-raised'),
    filledBackground: v('bg-raised'),
    filledHoverBackground: v('bg-raised'),
    filledFocusBackground: v('bg-surface'),
    borderColor: v('border-control'),
    hoverBorderColor: v('border-strong'),
    focusBorderColor: v('focus-ring'),
    invalidBorderColor: v('danger'),
    color: v('ink'),
    disabledColor: v('ink-faint'),
    placeholderColor: v('ink-faint'),
    invalidPlaceholderColor: v('danger'),
    floatLabelColor: v('ink-muted'),
    floatLabelFocusColor: v('ink'),
    floatLabelActiveColor: v('ink-muted'),
    floatLabelInvalidColor: v('danger'),
    iconColor: v('ink-faint'),
    shadow: 'none',
  },
  overlay: {
    select: { background: v('bg-surface'), borderColor: v('border-strong'), color: v('ink') },
    popover: { background: v('bg-surface'), borderColor: v('border-strong'), color: v('ink') },
    modal: { background: v('bg-surface'), borderColor: v('border-subtle'), color: v('ink') },
  },
})

/**
 * PrimeVue 4 preset'i: Aura tabanı + tasarım token'ları (K9). PrimeVue yalnız davranış için
 * kullanılır; görünüm `shared/ui` bileşenlerindedir. Bu preset, kullanılan PrimeVue parçasının
 * tasarım dışı renk/köşe göstermemesi için anlamsal katmanı token değişkenlerine bağlar.
 * Burada ham renk ya da ölçü yazılmaz.
 */
export const NizamPreset = definePreset(Aura, {
  semantic: {
    primary: Object.fromEntries(
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((tone) => [tone, v('accent')]),
    ),
    focusRing: {
      width: v('focus-ring-width'),
      style: 'solid',
      color: v('focus-ring'),
      offset: v('focus-ring-offset'),
      shadow: 'none',
    },
    formField: { borderRadius: v('radius-md') },
    content: { borderRadius: v('radius-lg') },
    overlay: {
      select: { borderRadius: v('radius-md'), shadow: v('shadow-sheet') },
      popover: { borderRadius: v('radius-md'), shadow: v('shadow-sheet') },
      modal: { borderRadius: v('radius-xl'), shadow: v('shadow-sheet') },
      navigation: { shadow: v('shadow-sheet') },
    },
    colorScheme: { light: scheme(surfaceLight), dark: scheme(surfaceDark) },
  },
})
