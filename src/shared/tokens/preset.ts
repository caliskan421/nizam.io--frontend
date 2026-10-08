import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

import { TOKENS } from './tokens.gen'

/** PrimeVue/Tailwind koyu mod seçicisi; tokens.gen.css ile aynı. */
export const DARK_MODE_SELECTOR = "[data-theme='dark']"

const { primary, surface } = TOKENS.palette

/**
 * PrimeVue 4 preset'i: Aura tabanı + tokens/tokens.json paletleri. Değerler üretilmiş
 * tokens.gen.ts'ten okunur; burada renk değeri yazılmaz.
 */
export const NizamPreset = definePreset(Aura, {
  semantic: {
    primary,
    colorScheme: {
      light: {
        surface,
        primary: {
          color: TOKENS.modes.light.primary,
          contrastColor: TOKENS.modes.light.onPrimary,
          hoverColor: TOKENS.modes.light.primaryHover,
          activeColor: TOKENS.modes.light.primaryHover,
        },
      },
      dark: {
        surface,
        primary: {
          color: TOKENS.modes.dark.primary,
          contrastColor: TOKENS.modes.dark.onPrimary,
          hoverColor: TOKENS.modes.dark.primaryHover,
          activeColor: TOKENS.modes.dark.primaryHover,
        },
      },
    },
  },
})
