<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { DesignStub, UiButton, UiIcon, UiInput } from '@/shared/ui'
import { cssVar } from '@/shared/tokens/css-var'
import type { TokenName } from '@/shared/tokens/tokens.gen'

import { ARCHIVE_TAGS, tagView } from '../../model/tags'
import type { TagLegendEmits, TagLegendProps } from '../index'
import './folders.css'

/**
 * Etiket kartı (E-06-17…21). Etiketler kapalı kümenin Türkçe ad/renk sözlüğüdür (P34; serbest
 * etiket yok). `selected` verilmezse (`undefined`) kart yalnız açıklayıcı bir göstergedir (satırlar
 * düğme değil); verilirse (`null` ya da etiket) satırlar `select` yayan düğmelerdir. "Yeni etiket"
 * formu devre dışı ve ağ isteği atmaz (BE-024).
 */
const props = defineProps<TagLegendProps>()
const emit = defineEmits<TagLegendEmits>()
const { t } = useI18n()

const COLORS: ReadonlyArray<readonly [string, TokenName]> = [
  ['violet', 'violet'],
  ['gold', 'gold'],
  ['green', 'accent-text'],
  ['red', 'danger'],
  ['gray', 'ink-muted'],
]
const selectable = (): boolean => props.selected !== undefined
</script>

<template>
  <section class="t-card archive-tags" :aria-label="t('archive.folders.tags.title')">
    <div class="rp-cardhead archive-card__head">
      <h2 class="rp-cardtitle">{{ t('archive.folders.tags.title') }}</h2>
      <span class="rp-cap">{{ t('archive.folders.tags.caption') }}</span>
    </div>
    <ul class="archive-tags__list" :aria-label="t('archive.folders.tags.list')">
      <li v-for="tag in ARCHIVE_TAGS" :key="tag" :data-tag="tag">
        <component
          :is="selectable() ? 'button' : 'div'"
          class="rp-menuitem archive-tags__item"
          :type="selectable() ? 'button' : undefined"
          :aria-pressed="selectable() ? (selected === tag ? 'true' : 'false') : undefined"
          @click="selectable() && emit('select', tag)"
        >
          <span
            class="rp-dot archive-tags__dot"
            aria-hidden="true"
            :style="{ '--archive-tone': cssVar(tagView(tag).tone) }"
          ></span>
          <span class="rp-trunc">{{ tagView(tag).label }}</span>
          <UiIcon v-if="selectable()" name="chevron-right" size="sm" />
        </component>
      </li>
    </ul>
    <DesignStub id="BE-024" as="div">
      <form class="archive-newtag" novalidate @submit.prevent>
        <label class="rp-kicker" for="archive-newtag-name">{{
          t('archive.folders.newTag.kicker')
        }}</label>
        <UiInput
          id="archive-newtag-name"
          size="sm"
          disabled
          :placeholder="t('archive.folders.newTag.placeholder')"
        />
        <div class="archive-newtag__row">
          <div
            class="archive-newtag__colors"
            role="radiogroup"
            :aria-label="t('archive.folders.newTag.colors')"
          >
            <button
              v-for="[name, token] in COLORS"
              :key="name"
              type="button"
              role="radio"
              aria-checked="false"
              disabled
              class="archive-swatch"
              :aria-label="t(`archive.folders.newTag.${name}`)"
              :data-color="name"
              :style="{ '--archive-tone': cssVar(token) }"
            ></button>
          </div>
          <UiButton variant="primary" size="sm" type="submit" disabled>
            {{ t('archive.folders.newTag.create') }}
          </UiButton>
        </div>
        <p class="rp-cap">{{ t('archive.folders.newTag.hint') }}</p>
      </form>
    </DesignStub>
  </section>
</template>
